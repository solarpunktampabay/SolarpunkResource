#!/usr/bin/env python3
"""
Opportunity link checker for the Activities sheet.

Reads the "Activities" sheet, checks every "Website URL" for liveness and for
"closed / expired" language, and writes three annotation columns next to the
existing ones:  Link Status | Last Checked | Check Reason

Rows are NEVER deleted and the original columns are NEVER edited. The website
reads "Link Status" and decides what to hide.

Two sources:
  --source sheet   (default when an xlsx path is not given) the live Google Sheet
                   the website reads. Annotations are written back to the sheet.
                   Needs a service account with Editor access (see below).
  --source xlsx    a local workbook. Output goes to a NEW workbook
                   (default: <input>_checked.xlsx), the input is never touched.
Either way a CSV review report lists every row that is not "Active".

Optional column "Link Override": if a row has anything in it, the row is skipped
(not re-checked, annotation left as is) so a human can pin a listing as good.

Visitor answers: the website's /check-links page sends "still valid" / "expired" answers
to apps-script/link-reports.gs, which updates this sheet (Link Status = Active or
Expired, Check Reason = "Community: ... [url]"). Rows with that marker for their current
URL are skipped here, so people's answers are not overwritten. Edit the URL or clear the
Check Reason cell to have the checker look at the row again.

Google Sheet setup (sheet mode):
    SPREADSHEET_ID                env var or --sheet-id (same ID as VITE_SPREADSHEET_ID)
    GOOGLE_SERVICE_ACCOUNT_JSON   env var holding the service-account JSON, or
                                  --credentials path/to/service-account.json
    Share the spreadsheet with the service account's client_email as Editor.

Usage:
    python check_links.py --source sheet --dry-run              # report only, no writes
    python check_links.py --source sheet                        # annotate the live sheet
    python check_links.py Activities.xlsx
    python check_links.py Activities.xlsx --output checked.xlsx --workers 12
    python check_links.py Activities.xlsx --limit 20            # quick test
    python check_links.py Activities.xlsx --cache cache.pkl.gz  # save raw fetches
    python check_links.py Activities.xlsx --cache cache.pkl.gz --use-cache
        (re-classify from the saved fetches, e.g. after tuning the phrase list)

Status values:
    Active          page loads and shows no closed/expired language, OR the row is
                    "evergreen" (club page, podcast/song, app) and the link is not dead
    Expired         certain: expiredDate already passed, or the Name / URL slug names a
                    past year ("RWE Summer 2024 Internship")
    Likely Expired  page loads but looks closed / filled / outdated / soft-404; a human
                    should confirm
    Invalid         hard failure: HTTP 404/410 or the domain does not exist
    Unknown         blocked, login-gated, JS-only, or temporarily failing: check by hand
    Bad URL         missing or malformed URL in the sheet
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import gzip
import json
import os
import pickle
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests
import urllib3
from bs4 import BeautifulSoup
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --------------------------------------------------------------------------- #
# Configuration (tweak these)
# --------------------------------------------------------------------------- #

SHEET_NAME = "Activities"
URL_HEADER = "Website URL"
NAME_HEADER = "Name"
NEW_COLUMNS = ["Link Status", "Last Checked", "Check Reason"]
OVERRIDE_HEADER = "Link Override"   # optional, human-filled; non-empty => skip this row
REASON_HEADER = "Check Reason"
# The website's /check-links page sends visitor answers to an Apps Script
# (apps-script/link-reports.gs), which writes "Community: ..." into Check Reason and
# sets Link Status to Active (still valid) or Expired. Rows carrying that marker
# for their CURRENT url are settled by people and are not re-checked here.
COMMUNITY_MARKER = "Community:"

WORKERS = 12
CONNECT_TIMEOUT = 8
READ_TIMEOUT = 15
MAX_ATTEMPTS = 3              # 1 try + 2 retries
BACKOFF_SECONDS = 2.0
PER_DOMAIN_INTERVAL = 1.0     # min seconds between requests to the same domain
MAX_BYTES = 400_000           # only read the first ~400 KB of each page
MIN_TEXT_CHARS = 200          # less readable text than this => probably JS-rendered

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Sites that block bots, require login, or render everything with JavaScript.
# A 200 here proves little, so "no problem found" becomes Unknown instead of
# Active. A clear 404/410 or explicit closed wording is still trusted.
HARD_DOMAINS = (
    "indeed.com",
    "linkedin.com",
    "glassdoor.com",
    "joinhandshake.com",
    "ziprecruiter.com",
    "bullsconnect.usf.edu",
    "myworkdayjobs.com",
    "icims.com",
    "facebook.com",
    "instagram.com",
    "x.com",
    "twitter.com",
)

# Specific phrases that indicate a closed/filled/expired posting.
# Matched against lower-cased, whitespace-normalised visible page text.
CLOSED_PHRASES = [
    "no longer accepting",
    "no longer open for application",
    "this job is no longer available",
    "this position is no longer available",
    "this opportunity is no longer available",
    "this posting is no longer available",
    "position has been filled",
    "role has been filled",
    "job has been filled",
    "position is no longer",
    "position is closed",
    "position has closed",
    "job has expired",
    "job is no longer",
    "job is closed",
    "this job has been closed",
    "posting has expired",
    "posting is no longer",
    "listing has expired",
    "this opportunity has expired",
    "this opportunity is closed",
    "this opportunity is no longer",
    "applications are closed",
    "applications are now closed",
    "applications have closed",
    "application is closed",
    "applications closed",
    "application period has ended",
    "application period is closed",
    "application deadline has passed",
    "deadline has passed",
    "registration is closed",
    "registration has closed",
    "registration closed",
    "sign-ups are closed",
    "signups are closed",
    "is now closed",
    "not currently accepting applications",
    "not accepting applications at this time",
    "program has ended",
    "program has concluded",
    "this event has ended",
    "this event has passed",
    "page you requested could not be found",
    "page you are looking for could not be found",
    "page you are looking for does not exist",
    "this page doesn't exist",
    "this page does not exist",
]

# Title / first-heading patterns that mean the server returned a "soft 404".
SOFT_404_PATTERNS = [
    r"\b404\b",
    r"page not found",
    r"not found",
    r"page (does not|doesn't) exist",
    r"no longer exists",
    r"error 40[34]",
]

# Path fragments that mean we were bounced to a login wall.
LOGIN_PATH_HINTS = re.compile(r"(login|log-in|signin|sign-in|sso|/auth\b|authenticate)", re.I)

# Pages that are not time-limited. A shared club, podcast, song or app is "unlikely to
# expire", so when the page cannot be verified (login wall, JavaScript-only, bot-blocked)
# we mark it Active instead of Unknown. A clear 404 / dead domain still counts as Invalid.
# Each entry: (regex on the URL, label shown in the Check Reason column).
EVERGREEN_URL_RULES = [
    (r"^https?://bullsconnect\.usf\.edu/(?!.*(?:/event/|/events\b|rsvp|/event_))", "USF BullsConnect club/organization page"),
    (r"^https?://open\.spotify\.com/", "Spotify show/song/playlist"),
    (r"^https?://(?:podcasts|music)\.apple\.com/", "Apple podcast/music"),
    (r"^https?://(?:www\.)?soundcloud\.com/", "SoundCloud audio"),
    (r"^https?://(?:www\.)?youtube\.com/(?:watch|playlist)|^https?://youtu\.be/", "YouTube video/playlist"),
    (r"^https?://apps\.apple\.com/|^https?://play\.google\.com/store/apps", "App store listing"),
]
# Rows whose Subcategory is one of these are also treated as evergreen.
EVERGREEN_SUBCATEGORIES = {"club", "clubs"}

# Sheet column that humans fill in with a real end date.
EXPIRED_DATE_HEADER_PREFIX = "expireddate"

STATUS_FILLS = {
    "Expired": "E06666",
    "Invalid": "F4B6B6",
    "Likely Expired": "F9CB9C",
    "Unknown": "FFF2A8",
    "Bad URL": "D9D2E9",
}

# --------------------------------------------------------------------------- #
# URL cleaning
# --------------------------------------------------------------------------- #

_URL_IN_TEXT = re.compile(r"https?://[^\s<>\"']+", re.I)
_BARE_DOMAIN = re.compile(r"^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:[/?#]\S*)?$", re.I)


def clean_url(raw, hyperlink_target=None):
    """Return (clean_url or None, note). Note explains why a URL could not be built."""
    text = (str(raw) if raw is not None else "").strip()

    if text:
        m = _URL_IN_TEXT.search(text)
        if m:
            return m.group(0).rstrip(".,;)>\"'"), ""
        first = text.split()[0] if text.split() else ""
        if _BARE_DOMAIN.match(first):
            return "https://" + first.rstrip(".,;)>\"'"), "added https://"

    # Fall back to the real hyperlink attached to the cell, if any.
    if hyperlink_target and re.match(r"https?://", hyperlink_target, re.I):
        return hyperlink_target.strip(), "used cell hyperlink"

    if not text:
        return None, "no URL in sheet"
    return None, f"not a valid URL: {text[:60]!r}"


# --------------------------------------------------------------------------- #
# Fetching
# --------------------------------------------------------------------------- #

_DNS_MARKERS = (
    "getaddrinfo failed",
    "name or service not known",
    "nameresolutionerror",
    "nodename nor servname",
    "temporary failure in name resolution",
    "no address associated with hostname",
)


class DomainThrottle:
    """Reserve spaced-out time slots per domain so we do not hammer one server."""

    def __init__(self, interval):
        self.interval = interval
        self._lock = threading.Lock()
        self._next = {}

    def wait(self, domain):
        with self._lock:
            now = time.monotonic()
            slot = max(now, self._next.get(domain, 0.0))
            self._next[domain] = slot + self.interval
        delay = slot - now
        if delay > 0:
            time.sleep(delay)


_throttle = DomainThrottle(PER_DOMAIN_INTERVAL)


def _domain(url):
    return (urlparse(url).hostname or "").lower().removeprefix("www.")


def _is_hard_domain(url_or_domain):
    d = url_or_domain if "/" not in url_or_domain else _domain(url_or_domain)
    return any(d == h or d.endswith("." + h) for h in HARD_DOMAINS)


def _parse_html(raw_bytes):
    soup = BeautifulSoup(raw_bytes, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    h1_tag = soup.find("h1")
    h1 = h1_tag.get_text(" ", strip=True) if h1_tag else ""
    for tag in soup(["script", "style", "noscript", "template"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text).replace("\u2019", "'").replace("\u2018", "'")
    return title, h1, text


def fetch(url):
    """
    Fetch one URL (with retries). Returns a plain dict, safe to pickle:
      status, final_url, content_type, title, h1, text, error_kind, error, notes
    error_kind is one of: None, "dns", "timeout", "ssl", "conn", "other".
    """
    result = {
        "url": url, "status": None, "final_url": url, "content_type": "",
        "title": "", "h1": "", "text": "", "error_kind": None, "error": "", "notes": [],
    }
    domain = _domain(url)
    verify = True
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Connection": "keep-alive",
    }

    for attempt in range(1, MAX_ATTEMPTS + 1):
        _throttle.wait(domain)
        try:
            resp = requests.get(
                url, headers=headers, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
                allow_redirects=True, stream=True, verify=verify,
            )
            try:
                chunks, size = [], 0
                for chunk in resp.iter_content(chunk_size=16384):
                    chunks.append(chunk)
                    size += len(chunk)
                    if size >= MAX_BYTES:
                        break
                body = b"".join(chunks)
            finally:
                resp.close()

            result.update(
                status=resp.status_code, final_url=resp.url,
                content_type=resp.headers.get("Content-Type", "").lower(),
                error_kind=None, error="",
            )
            if resp.status_code >= 500 and attempt < MAX_ATTEMPTS:
                time.sleep(BACKOFF_SECONDS * attempt)
                continue
            if "html" in result["content_type"] or not result["content_type"]:
                title, h1, text = _parse_html(body)
                result.update(title=title, h1=h1, text=text)
            return result

        except requests.exceptions.SSLError as exc:
            if verify:
                # Many .gov / small-org sites have broken certificates; the page is
                # still "up", so retry once without verification and note it.
                verify = False
                result["notes"].append("SSL certificate problem (ignored)")
                continue
            result.update(error_kind="ssl", error=str(exc)[:200])
        except requests.exceptions.Timeout as exc:
            result.update(error_kind="timeout", error=f"timeout: {str(exc)[:150]}")
        except requests.exceptions.TooManyRedirects as exc:
            result.update(error_kind="other", error=f"too many redirects: {str(exc)[:120]}")
            return result
        except requests.exceptions.ConnectionError as exc:
            msg = str(exc)
            kind = "dns" if any(m in msg.lower() for m in _DNS_MARKERS) else "conn"
            result.update(error_kind=kind, error=msg[:200])
        except requests.exceptions.RequestException as exc:
            result.update(error_kind="other", error=f"{type(exc).__name__}: {str(exc)[:150]}")
            return result

        if attempt < MAX_ATTEMPTS:
            time.sleep(BACKOFF_SECONDS * attempt)

    return result


# --------------------------------------------------------------------------- #
# Classification
# --------------------------------------------------------------------------- #

def _snippet(text, idx, width=70):
    start = max(0, idx - width // 2)
    return text[start: idx + width].strip()


def find_closed_phrase(text):
    low = text.lower()
    for phrase in CLOSED_PHRASES:
        idx = low.find(phrase)
        if idx != -1:
            return phrase, _snippet(text, idx)
    return None, None


def _soft_404(title, h1):
    for field in (title, h1):
        low = field.lower()
        if not low:
            continue
        for pat in SOFT_404_PATTERNS:
            if re.search(pat, low):
                return field[:80]
    return None


_SEASON = r"(?:summer|fall|spring|winter|autumn)"
_YEAR_NOUN = r"(?:intern\w*|fellow\w*|application\w*|cohort|program|reu|grant\w*|scholarship\w*|class)"
_YEAR_ADJACENT = re.compile(
    rf"(?:\b{_SEASON}\s+(20\d{{2}})\b|\b(20\d{{2}})\s+{_SEASON}\b"
    rf"|\b(20\d{{2}})\s+{_YEAR_NOUN}\b|\b{_YEAR_NOUN}\s+(20\d{{2}})\b)",
    re.I,
)
_OPEN_ENDED_YEAR = re.compile(r"\b(or after|and after|and later|or later|onward|and beyond|since)\b", re.I)


_COPYRIGHT = re.compile(r"(?:©|\(c\)|copyright)\s*(?:20\d{2}\s*[-–]\s*)?20\d{2}", re.I)


def _old_year_in_heading(title, h1, today, body_text=""):
    """
    Flag headings like 'Summer 2023 Internship' / '2023 Application'
    (not 'purchased in 2023 or after'). If the top of the page body mentions the
    current year or later (ignoring copyright footers), assume the page is current.
    """
    heading = f"{title} {h1}"
    if _OPEN_ENDED_YEAR.search(heading):
        return None
    years = []
    for m in _YEAR_ADJACENT.finditer(heading):
        years.extend(int(g) for g in m.groups() if g)
    # Any current/future year anywhere in the heading means the page is up to date.
    all_years = [int(y) for y in re.findall(r"\b(20\d{2})\b", heading)]
    if not years or any(y >= today.year for y in all_years):
        return None
    top = _COPYRIGHT.sub(" ", body_text[:6000])
    if any(int(y) >= today.year for y in re.findall(r"\b(20\d{2})\b", top)):
        return None
    return max(years)


# --------------------------------------------------------------------------- #
# Row-level rules (no network needed)
# --------------------------------------------------------------------------- #

def evergreen_label(row):
    """Return why this row is 'unlikely to expire' (club page, podcast, song, app...) or None."""
    if (row.get("subcategory") or "").strip().lower() in EVERGREEN_SUBCATEGORIES:
        return "Subcategory is Clubs"
    url = row.get("url") or ""
    for pattern, label in EVERGREEN_URL_RULES:
        if re.search(pattern, url, re.I):
            return label
    return None


def _parse_expired_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    text = str(value).strip()
    for fmt in ("%m-%d-%Y", "%m/%d/%Y", "%Y-%m-%d", "%m-%d-%y", "%m/%d/%y"):
        try:
            return dt.datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _year_in_slug(url):
    """Season/noun + year in the URL path ('...summer-2024-internships'), ignoring dated blog paths."""
    path = unquote(urlparse(url or "").path)
    text = re.sub(r"[-_/+.]+", " ", path)
    if _OPEN_ENDED_YEAR.search(text):
        return None
    years = []
    for m in _YEAR_ADJACENT.finditer(text):
        years.extend(int(g) for g in m.groups() if g)
    return max(years) if years else None


def static_verdict(row, today):
    """
    Decide from the spreadsheet row alone, without visiting the page.
    Returns (status, reason) or None. Order:
      1. expiredDate column already in the past          -> Expired
      2. evergreen row (club/podcast/song/app)           -> None (handled after fetch)
      3. a past year in the Name ('RWE Summer 2024 ...')  -> Expired
      4. a past season+year in the URL slug              -> Expired
    """
    exp = _parse_expired_date(row.get("expired_raw"))
    if exp and exp < today:
        return "Expired", f"expiredDate {exp:%m-%d-%Y} has already passed"

    if evergreen_label(row):
        return None

    name = row.get("name", "")
    if not _OPEN_ENDED_YEAR.search(name):
        years = [int(y) for y in re.findall(r"\b(20\d{2})\b", name)]
        if years and max(years) < today.year:
            return "Expired", f"Name says {max(years)} and it is now {today.year}: \"{name[:60]}\""

    slug_year = _year_in_slug(row.get("url"))
    if slug_year and slug_year < today.year:
        return "Expired", f"URL is for {slug_year} and it is now {today.year}"
    return None


def _redirected_to_homepage(original, final):
    o, f = urlparse(original), urlparse(final)
    if _domain(original) != _domain(final):
        return False
    o_segments = [s for s in o.path.split("/") if s]
    f_segments = [s for s in f.path.split("/") if s]
    return len(o_segments) >= 2 and not f_segments and not f.query


def classify(res, today=None):
    """Turn a fetch() result into (status, reason)."""
    today = today or dt.date.today()
    url, final = res["url"], res["final_url"]
    note_suffix = f" ({'; '.join(res['notes'])})" if res["notes"] else ""

    # ---- network-level failures ------------------------------------------
    kind = res["error_kind"]
    if res["status"] is None:
        if kind == "dns":
            return "Invalid", "DNS lookup failed: domain does not exist"
        if kind == "timeout":
            return "Unknown", "Timed out after retries"
        if kind == "ssl":
            return "Unknown", f"SSL error: {res['error'][:100]}"
        if kind == "conn":
            return "Unknown", f"Connection failed: {res['error'][:100]}"
        return "Unknown", res["error"] or "Request failed"

    code = res["status"]

    # ---- HTTP errors ------------------------------------------------------
    if code in (404, 410):
        return "Invalid", f"HTTP {code}{note_suffix}"
    if code >= 500:
        return "Unknown", f"HTTP {code} after retries (server error)"
    if code in (401, 403, 429, 999) or code >= 400:
        return "Unknown", f"HTTP {code} (blocked or restricted; check by hand)"

    # ---- 2xx/3xx: look at what came back -----------------------------------
    if _domain(url) == _domain(final) and LOGIN_PATH_HINTS.search(urlparse(final).path) \
            and not LOGIN_PATH_HINTS.search(urlparse(url).path):
        return "Unknown", "Redirected to a login page"

    if res["content_type"] and "html" not in res["content_type"]:
        return "Active", f"HTTP {code}, non-HTML document{note_suffix}"

    phrase, snippet = find_closed_phrase(res["text"])
    if phrase:
        return "Likely Expired", f"phrase: '{phrase}' ... \"{snippet}\""

    soft = _soft_404(res["title"], res["h1"])
    if soft:
        return "Likely Expired", f"soft 404: heading says \"{soft}\""

    old_year = _old_year_in_heading(res["title"], res["h1"], today, res["text"])
    if old_year:
        return "Likely Expired", (
            f"needs human check: page heading says {old_year}: \"{(res['h1'] or res['title'])[:70]}\""
        )

    if _redirected_to_homepage(url, final):
        return "Likely Expired", f"redirected to site homepage ({final[:80]})"

    if _is_hard_domain(url) or _is_hard_domain(final):
        return "Unknown", f"HTTP {code}, but this site blocks bots/needs JS or login; check by hand"

    if len(res["text"]) < MIN_TEXT_CHARS:
        return "Unknown", f"HTTP {code}, page has almost no readable text (JS-rendered?)"

    return "Active", f"HTTP {code}, no closed language found{note_suffix}"


# --------------------------------------------------------------------------- #
# Excel I/O
# --------------------------------------------------------------------------- #

def load_rows(wb, sheet_name):
    """Return (ws, header_map, rows). rows = list of dicts with row index, name, raw url, url, note."""
    ws = wb[sheet_name] if sheet_name in wb.sheetnames else wb.active
    headers = {}
    for cell in ws[1]:
        if cell.value is not None and str(cell.value).strip():
            headers[str(cell.value).strip()] = cell.column
    if URL_HEADER not in headers:
        sys.exit(f"Could not find a '{URL_HEADER}' column in sheet '{ws.title}'. Found: {list(headers)}")
    url_col = headers[URL_HEADER]
    name_col = headers.get(NAME_HEADER, 1)
    subcat_col = headers.get("Subcategory")
    expired_col = next(
        (c for h, c in headers.items() if h.lower().startswith(EXPIRED_DATE_HEADER_PREFIX)), None
    )
    override_col = headers.get(OVERRIDE_HEADER)
    reason_col = headers.get(REASON_HEADER)

    rows = []
    for r in range(2, ws.max_row + 1):
        name = ws.cell(r, name_col).value
        url_cell = ws.cell(r, url_col)
        if not (name and str(name).strip()) and not (url_cell.value and str(url_cell.value).strip()):
            continue
        link = url_cell.hyperlink.target if url_cell.hyperlink else None
        url, note = clean_url(url_cell.value, link)
        rows.append({
            "row": r, "name": str(name or "").strip(),
            "raw": "" if url_cell.value is None else str(url_cell.value).strip(),
            "url": url, "note": note,
            "subcategory": str(ws.cell(r, subcat_col).value or "") if subcat_col else "",
            "expired_raw": ws.cell(r, expired_col).value if expired_col else None,
            "override": str(ws.cell(r, override_col).value or "").strip() if override_col else "",
            "prev_reason": str(ws.cell(r, reason_col).value or "") if reason_col else "",
        })
    return ws, headers, rows


def _cell(values, r, c):
    """1-based cell lookup in a ragged list-of-lists (the Sheets API trims empty cells)."""
    if c is None or r > len(values) or c > len(values[r - 1]):
        return ""
    return values[r - 1][c - 1]


def load_rows_from_sheet(ws):
    """Same shape as load_rows(), but from a gspread worksheet. Returns (headers, rows)."""
    values = ws.get_all_values()
    if not values:
        sys.exit(f"Worksheet '{ws.title}' is empty.")
    headers = {}
    for c, h in enumerate(values[0], start=1):
        if str(h).strip():
            headers[str(h).strip()] = c
    if URL_HEADER not in headers:
        sys.exit(f"Could not find a '{URL_HEADER}' column in sheet '{ws.title}'. Found: {list(headers)}")
    url_col = headers[URL_HEADER]
    name_col = headers.get(NAME_HEADER, 1)
    subcat_col = headers.get("Subcategory")
    expired_col = next(
        (c for h, c in headers.items() if h.lower().startswith(EXPIRED_DATE_HEADER_PREFIX)), None
    )
    override_col = headers.get(OVERRIDE_HEADER)
    reason_col = headers.get(REASON_HEADER)

    rows = []
    for r in range(2, len(values) + 1):
        name = str(_cell(values, r, name_col)).strip()
        raw = str(_cell(values, r, url_col)).strip()
        if not name and not raw:
            continue
        url, note = clean_url(raw)
        rows.append({
            "row": r, "name": name, "raw": raw, "url": url, "note": note,
            "subcategory": str(_cell(values, r, subcat_col)),
            "expired_raw": _cell(values, r, expired_col) or None,
            "override": str(_cell(values, r, override_col)).strip(),
            "prev_reason": str(_cell(values, r, reason_col)),
        })
    return headers, rows


def settled_by_community(row):
    """
    True when visitors already answered for this row's CURRENT url. The Apps Script
    writes 'Community: ... [<url>]' into Check Reason; if someone later edits the URL
    in the sheet the marker no longer matches and the row is checked again.
    """
    reason = row.get("prev_reason") or ""
    if not reason.startswith(COMMUNITY_MARKER):
        return False
    return any(u and u in reason for u in (row.get("raw"), row.get("url")))


def open_worksheet(sheet_id, credentials_path, sheet_name):
    """Open the Google worksheet with a service account (JSON from a file or env var)."""
    try:
        import gspread
    except ImportError:
        sys.exit("Sheet mode needs gspread: pip install gspread")

    if credentials_path:
        gc = gspread.service_account(filename=credentials_path)
    else:
        raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
        if not raw:
            sys.exit("No credentials: set GOOGLE_SERVICE_ACCOUNT_JSON or pass --credentials FILE.")
        try:
            gc = gspread.service_account_from_dict(json.loads(raw))
        except json.JSONDecodeError:
            sys.exit("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.")
    sh = gc.open_by_key(sheet_id)
    try:
        return sh.worksheet(sheet_name)
    except gspread.WorksheetNotFound:
        print(f"Worksheet '{sheet_name}' not found; using the first worksheet.")
        return sh.sheet1


def _rgb(hex_color):
    return {
        "red": int(hex_color[0:2], 16) / 255,
        "green": int(hex_color[2:4], 16) / 255,
        "blue": int(hex_color[4:6], 16) / 255,
    }


def write_sheet_annotations(ws, headers, results, dry_run=False):
    """
    Write Link Status / Last Checked / Check Reason into the live sheet.
    Columns are found by header name (created at the far right if missing), so this is
    safe to run every month. Only these three columns are touched: no other cell is
    edited and no row is deleted.
    """
    from gspread.utils import rowcol_to_a1

    cols, next_col, created = {}, max(headers.values()) + 1, []
    for title in NEW_COLUMNS:
        if title in headers:
            cols[title] = headers[title]
        else:
            cols[title] = next_col
            created.append(title)
            next_col += 1
    if created:
        print(f"Creating new columns: {', '.join(created)}")
    if dry_run:
        print("Dry run: sheet NOT modified.")
        return

    needed_cols = max(cols.values())
    if ws.col_count < needed_cols:
        ws.add_cols(needed_cols - ws.col_count)

    data, formats = [], []
    if created:
        for title in created:
            data.append({"range": rowcol_to_a1(1, cols[title]), "values": [[title]]})
            formats.append({"range": rowcol_to_a1(1, cols[title]),
                            "format": {"textFormat": {"bold": True}}})
    for item in results:
        r = item["row"]
        for title, key in zip(NEW_COLUMNS, ("status", "checked", "reason")):
            data.append({"range": rowcol_to_a1(r, cols[title]), "values": [[item[key]]]})
        # Colour the status cell (white for Active so stale colours from old runs clear).
        formats.append({
            "range": rowcol_to_a1(r, cols["Link Status"]),
            "format": {"backgroundColor": _rgb(STATUS_FILLS.get(item["status"], "FFFFFF"))},
        })

    for i in range(0, len(data), 500):
        ws.batch_update(data[i:i + 500], value_input_option="RAW")
    for i in range(0, len(formats), 500):
        ws.batch_format(formats[i:i + 500])
    print(f"Updated {len(results)} rows in the Google Sheet.")


def write_report(results, report_path):
    report = [i for i in results if i["status"] != "Active"]
    order = {"Expired": 0, "Invalid": 1, "Likely Expired": 2, "Unknown": 3, "Bad URL": 4}
    report.sort(key=lambda i: (order.get(i["status"], 9), i["row"]))
    with open(report_path, "w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.writer(fh)
        writer.writerow(["Sheet Row", "Name", "Link Status", "Check Reason", "URL"])
        for i in report:
            writer.writerow([i["row"], i["name"], i["status"], i["reason"], i["url"] or i["raw"]])
    return len(report)


def write_outputs(wb, ws, headers, results, output_path, report_path, dry_run=False):
    first_new = max(headers.values()) + 1
    for offset, title in enumerate(NEW_COLUMNS):
        col = first_new + offset
        if ws.cell(1, col).value not in (None, ""):
            sys.exit(f"Column {col} is not empty in the header row; refusing to overwrite it.")
        cell = ws.cell(1, col, title)
        cell.font = Font(bold=True)
        ws.column_dimensions[cell.column_letter].width = (16, 20, 70)[offset]

    for item in results:
        r = item["row"]
        for offset, key in enumerate(("status", "checked", "reason")):
            ws.cell(r, first_new + offset, item[key])
        fill_hex = STATUS_FILLS.get(item["status"])
        if fill_hex:
            fill = PatternFill("solid", start_color=fill_hex, end_color=fill_hex)
            ws.cell(r, first_new).fill = fill

    if dry_run:
        print("Dry run: workbook NOT saved.")
    else:
        wb.save(output_path)
    return write_report(results, report_path)


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", nargs="?", help="path to Activities.xlsx (xlsx mode)")
    ap.add_argument("--source", choices=("sheet", "xlsx"),
                    help="where to read/write: the live Google Sheet or a local xlsx "
                         "(default: xlsx if a path is given, otherwise sheet)")
    ap.add_argument("--sheet-id", help="Google spreadsheet ID (default: $SPREADSHEET_ID)")
    ap.add_argument("--credentials", help="service-account JSON file (default: $GOOGLE_SERVICE_ACCOUNT_JSON)")
    ap.add_argument("--dry-run", action="store_true",
                    help="check links and write the CSV report only; do not modify the sheet/workbook")
    ap.add_argument("--output", help="xlsx mode: output workbook (default: <input>_checked.xlsx)")
    ap.add_argument("--report", help="CSV review report (default: link_check_report.csv)")
    ap.add_argument("--sheet", default=SHEET_NAME, help="worksheet/tab name (default: Activities)")
    ap.add_argument("--workers", type=int, default=WORKERS)
    ap.add_argument("--limit", type=int, help="only check the first N rows (for testing)")
    ap.add_argument("--cache", help="gzip-pickle file for raw fetch results")
    ap.add_argument("--use-cache", action="store_true", help="reuse --cache instead of fetching")
    args = ap.parse_args()

    source = args.source or ("xlsx" if args.input else "sheet")
    wb = out_path = None

    if source == "xlsx":
        if not args.input:
            sys.exit("xlsx mode needs the path to the workbook.")
        in_path = Path(args.input)
        if not in_path.exists():
            sys.exit(f"Input file not found: {in_path}")
        out_path = Path(args.output) if args.output else in_path.with_name(in_path.stem + "_checked.xlsx")
        if out_path.resolve() == in_path.resolve():
            sys.exit("Refusing to overwrite the input file; choose a different --output.")
        report_path = Path(args.report) if args.report else out_path.with_name("link_check_report.csv")
        wb = load_workbook(in_path)
        ws, headers, rows = load_rows(wb, args.sheet)
    else:
        sheet_id = args.sheet_id or os.environ.get("SPREADSHEET_ID") or os.environ.get("VITE_SPREADSHEET_ID")
        if not sheet_id:
            sys.exit("Sheet mode needs the spreadsheet ID: set SPREADSHEET_ID or pass --sheet-id.")
        report_path = Path(args.report) if args.report else Path("link_check_report.csv")
        ws = open_worksheet(sheet_id, args.credentials, args.sheet)
        headers, rows = load_rows_from_sheet(ws)

    if args.limit:
        rows = rows[: args.limit]
    print(f"Loaded {len(rows)} rows from sheet '{ws.title}'.")

    # Rows a human pinned with a value in "Link Override" are left exactly as they are.
    pinned = [r for r in rows if r.get("override")]
    if pinned:
        rows = [r for r in rows if not r.get("override")]
        print(f"Skipping {len(pinned)} rows with a '{OVERRIDE_HEADER}' value.")

    # Rows visitors already answered on the website's /check-links page (valid or
    # expired) keep that answer; they are not fetched or re-annotated.
    settled = [r for r in rows if settled_by_community(r)]
    if settled:
        rows = [r for r in rows if not settled_by_community(r)]
        print(f"Skipping {len(settled)} rows already settled by visitor answers.")

    today = dt.date.today()

    # Rows we can judge from the spreadsheet alone (past expiredDate, old year in the name...)
    # do not need a network visit.
    verdicts = {r["row"]: static_verdict(r, today) for r in rows}
    unique_urls = sorted({r["url"] for r in rows if r["url"] and not verdicts[r["row"]]})
    print(f"{sum(1 for v in verdicts.values() if v)} rows decided from the sheet alone "
          f"(past expiredDate / old year in name or URL).")
    print(f"{len(unique_urls)} unique URLs to check.")

    # ---- fetch (or load cache) --------------------------------------------
    fetched = {}
    if args.use_cache and args.cache and Path(args.cache).exists():
        with gzip.open(args.cache, "rb") as fh:
            fetched = pickle.load(fh)
        print(f"Loaded {len(fetched)} cached fetch results from {args.cache}.")
    todo = [u for u in unique_urls if u not in fetched]

    if todo:
        done = 0
        started = time.time()
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(fetch, u): u for u in todo}
            for fut in as_completed(futures):
                u = futures[fut]
                try:
                    fetched[u] = fut.result()
                except Exception as exc:  # never let one URL kill the run
                    fetched[u] = {
                        "url": u, "status": None, "final_url": u, "content_type": "",
                        "title": "", "h1": "", "text": "", "error_kind": "other",
                        "error": f"{type(exc).__name__}: {exc}"[:200], "notes": [],
                    }
                done += 1
                if done % 10 == 0 or done == len(todo):
                    print(f"  checked {done}/{len(todo)}  ({time.time() - started:.0f}s)", flush=True)
        if args.cache:
            with gzip.open(args.cache, "wb") as fh:
                pickle.dump(fetched, fh)
            print(f"Saved raw fetch results to {args.cache}.")

    # ---- classify -----------------------------------------------------------
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    results, counts = [], {}
    for r in rows:
        if verdicts[r["row"]]:
            status, reason = verdicts[r["row"]]
        elif r["url"] is None:
            status, reason = "Bad URL", r["note"]
        else:
            status, reason = classify(fetched[r["url"]], today)
            if r["note"]:
                reason = f"{reason} [{r['note']}]"
            label = evergreen_label(r)
            if label and status != "Invalid":
                # Clubs, podcasts, songs and apps rarely expire; only a dead link counts against them.
                status = "Active"
                reason = f"Evergreen ({label}), unlikely to expire. Page check: {reason}"
        counts[status] = counts.get(status, 0) + 1
        results.append({**r, "status": status, "reason": reason, "checked": now})

    # Write the CSV report first so it exists even if the sheet update fails.
    flagged = write_report(results, report_path)
    if source == "xlsx":
        write_outputs(wb, ws, headers, results, out_path, report_path, dry_run=args.dry_run)
    else:
        write_sheet_annotations(ws, headers, results, dry_run=args.dry_run)

    print("\nSummary")
    print("-------")
    for status in ("Active", "Expired", "Invalid", "Likely Expired", "Unknown", "Bad URL"):
        print(f"  {status:<15} {counts.get(status, 0)}")
    if source == "xlsx" and not args.dry_run:
        print(f"\nWrote {out_path}")
    print(f"Wrote {report_path}  ({flagged} rows need a look)")


if __name__ == "__main__":
    main()
