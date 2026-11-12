/**
 * Receives "is this link still valid?" answers from the website's /check-links page
 * and appends them to a "Link Reports" tab in the same Google Sheet.
 *
 * SETUP (one time, ~3 minutes)
 * 1. Open the Google Sheet that holds the "Activities" tab.
 * 2. Extensions > Apps Script. Delete the sample code and paste this whole file.
 * 3. Click Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Click Deploy, approve the permissions, and copy the "Web app URL".
 * 4. Paste the Web app URL into REPORT_URL in src/services/linkReports.js.
 * 5. After you change this script later, use Deploy > Manage deployments > Edit >
 *    New version, so the same URL keeps working.
 *
 * Each answer becomes one row:
 *   Timestamp | Sheet Row | Name | URL | Verdict | Checker Note
 * Verdict is "valid" or "expired". A listing may get several rows (one per visitor);
 * review them and update the Activities sheet (for example set Link Status, or fill
 * "Link Override" to pin a listing as good).
 */

var SHEET_NAME = 'Link Reports';
var HEADERS = ['Timestamp', 'Sheet Row', 'Name', 'URL', 'Verdict', 'Checker Note'];
var VERDICTS = ['valid', 'expired'];
var MAX_LEN = 500;

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    var verdict = String(body.verdict || '').toLowerCase();
    if (VERDICTS.indexOf(verdict) === -1) {
      return respond({ ok: false, error: 'Invalid verdict' });
    }
    var url = clip(body.url);
    if (!url) {
      return respond({ ok: false, error: 'Missing url' });
    }

    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    sheet.appendRow([
      new Date(),
      Number(body.sheetRow) || '',
      clip(body.name),
      url,
      verdict,
      clip(body.checkerNote),
    ]);
    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// Opening the web-app URL in a browser just confirms that it is deployed.
function doGet() {
  return respond({ ok: true, message: 'Link report endpoint is running.' });
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Trim to a sane length and stop spreadsheet formula injection (=, +, -, @ at the start).
function clip(value) {
  var s = String(value == null ? '' : value).slice(0, MAX_LEN);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
