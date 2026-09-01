/**
 * Designer Request Form backend.
 * Deploy this bound to the target spreadsheet: Extensions > Apps Script,
 * paste this file's content in, then Deploy > New deployment > Web app.
 */

// Map the PIC dropdown value (as sent by the form) to the exact tab name
// in the spreadsheet. If a designer's tab is named differently than the
// dropdown label, change the value on the right to match the real tab name.
var DESIGNER_TABS = {
  'Matach (May)': 'Matach (May)',
  'Kittipat (Aun)': 'Kittipat (Aun)',
  'Apapan (Fuang)': 'Apapan (Fuang)',
  'Video Team (Dear, Gong)': 'Video Team (Dear, Gong)',
  'Rinlada (Sense)': 'Rinlada (Sense)'
};

// Form field -> fixed column on each designer's tab (1 = A, 2 = B, ...).
// Columns not listed here (e.g. C, H, I) are left untouched. The PIC
// dropdown only routes the row to the right tab (via DESIGNER_TABS) and
// is not written to a column itself; "Requested by" fills the PIC column.
var FIELD_TO_COLUMN = {
  briefDate: 1,     // A - Date assigned
  dueDate: 2,       // B - Due date
  priority: 4,      // D - Priority
  projectName: 5,   // E - Task
  details: 6,       // F - Description
  requesterName: 7  // G - PIC
};

// Priority dropdown value -> exact text written to the sheet, matching the
// labels the sheet's color/conditional-formatting rules key off of.
var PRIORITY_LABELS = {
  High: 'High (1-2 day)',
  Medium: 'Medium (3-4 day)',
  Low: 'Low (5 day+)'
};

var REQUIRED_FIELDS = [
  'projectName', 'details', 'briefDate', 'dueDate',
  'pic', 'priority', 'requesterName'
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Missing request body.');
    }
    var data = JSON.parse(e.postData.contents);
    var result = handleSubmission(data);
    return jsonResponse({ ok: true, tab: result.tab });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Designer request form API is running.' });
}

function handleSubmission(data) {
  REQUIRED_FIELDS.forEach(function (key) {
    if (!data[key]) {
      throw new Error('Missing field: ' + key);
    }
  });

  var tabName = DESIGNER_TABS[data.pic];
  if (!tabName) {
    throw new Error('Unknown designer: ' + data.pic);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sheet) {
    throw new Error('Sheet tab not found: "' + tabName + '". Check DESIGNER_TABS in Code.gs.');
  }

  var priorityLabel = PRIORITY_LABELS[data.priority] || data.priority;

  var row = getNextRow(sheet);
  sheet.getRange(row, FIELD_TO_COLUMN.briefDate).setValue(data.briefDate);
  sheet.getRange(row, FIELD_TO_COLUMN.dueDate).setValue(data.dueDate);
  sheet.getRange(row, FIELD_TO_COLUMN.priority).setValue(priorityLabel);
  sheet.getRange(row, FIELD_TO_COLUMN.projectName).setValue(data.projectName);
  sheet.getRange(row, FIELD_TO_COLUMN.details).setValue(data.details);
  sheet.getRange(row, FIELD_TO_COLUMN.requesterName).setValue(data.requesterName);

  return { tab: tabName };
}

// Appends right after the last row that actually has data in one of the
// columns the form writes to, ignoring unrelated columns (C, H, I, ...)
// that may hold data further down and would otherwise push new rows way
// past the real last task.
function getNextRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return 2;

  var cols = Object.keys(FIELD_TO_COLUMN).map(function (key) {
    return FIELD_TO_COLUMN[key];
  });
  var minCol = Math.min.apply(null, cols);
  var maxCol = Math.max.apply(null, cols);
  var values = sheet.getRange(1, minCol, lastRow, maxCol - minCol + 1).getValues();

  for (var r = values.length - 1; r >= 0; r--) {
    for (var i = 0; i < cols.length; i++) {
      var cellValue = values[r][cols[i] - minCol];
      if (cellValue !== '' && cellValue !== null) {
        return r + 2; // r is 0-indexed from row 1, so sheet row is r+1; next row is r+2
      }
    }
  }
  return 2; // header only, no data yet in the tracked columns
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
