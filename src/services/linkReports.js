// Visitor feedback on listings whose link the checker couldn't verify ("Unknown").
//
// Answers are POSTed to a Google Apps Script web app that appends them to a
// "Link Reports" tab in the same spreadsheet. See apps-script/link-reports.gs for the
// script. If you ever redeploy it as a brand-new deployment, update REPORT_URL below.
//
// Each visitor's own answers are also remembered in localStorage so the page can show
// what they've already reviewed.

export const VERDICT_VALID = 'valid';
export const VERDICT_EXPIRED = 'expired';

// Google Apps Script web app that records answers in the "Link Reports" tab.
const REPORT_URL =
  'https://script.google.com/macros/s/AKfycbxmh9kVeZ7bsYyxrEykrWLS55H_L7RDpL3wS45T0PVr_kqy-Dc_BvXaBtkfTqA-wk_8nw/exec';

const STORAGE_KEY = 'pc-link-reports-v1';

// True when a reporting endpoint is set (otherwise answers would stay in this browser).
export const isReportingConfigured = () => Boolean(REPORT_URL);

// Stable key for one listing: sheet row + URL, so an edited URL needs a fresh answer.
export const reportKey = (activity) => `${activity.sheetRow || activity.id}|${activity.websiteUrl}`;

export const loadMyAnswers = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

export const saveMyAnswer = (activity, verdict) => {
  const answers = loadMyAnswers();
  answers[reportKey(activity)] = { verdict, at: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Storage full or blocked (private mode): the answer was still sent, just not remembered.
  }
  return answers;
};

// Sends one answer. Resolves { recorded: true } when it was sent to the sheet, or
// { recorded: false } when no endpoint is configured. Rejects if the request fails.
export const submitLinkReport = async (activity, verdict) => {
  if (!isReportingConfigured()) {
    console.warn(
      'No report URL is set: this answer was saved in this browser only, not sent to the sheet.'
    );
    return { recorded: false };
  }

  const payload = {
    sheetRow: activity.sheetRow || null,
    name: activity.name,
    url: activity.websiteUrl,
    checkerNote: activity.linkReason || '',
    verdict,
  };

  // Apps Script web apps don't answer CORS preflights, so send a "simple" request
  // (text/plain, no-cors). The response is opaque; a network failure still throws.
  await fetch(REPORT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return { recorded: true };
};
