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

// Form field -> sheet column header text. Matching is case-insensitive and
// ignores leading/trailing whitespace. If a header isn't found on a tab,
// a new column is appended automatically so nothing is silently dropped.
var FIELD_TO_HEADER = {
  projectName: 'Task',
  details: 'Description',
  briefDate: 'Date assigned',
  dueDate: 'Due date',
  pic: 'PIC',
  priority: 'Priority',
  requesterName: 'Requester Name',
  requesterEmail: 'Requester Email',
  submittedAt: 'Submitted At'
};

var REQUIRED_FIELDS = [
  'projectName', 'details', 'briefDate', 'dueDate',
  'pic', 'priority', 'requesterName', 'requesterEmail'
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

  var headers = getHeaders(sheet);
  var rowValues = new Array(headers.length).fill('');

  setField(headers, rowValues, FIELD_TO_HEADER.projectName, data.projectName);
  setField(headers, rowValues, FIELD_TO_HEADER.details, data.details);
  setField(headers, rowValues, FIELD_TO_HEADER.briefDate, data.briefDate);
  setField(headers, rowValues, FIELD_TO_HEADER.dueDate, data.dueDate);
  setField(headers, rowValues, FIELD_TO_HEADER.pic, data.pic);
  setField(headers, rowValues, FIELD_TO_HEADER.priority, data.priority);
  setField(headers, rowValues, FIELD_TO_HEADER.requesterName, data.requesterName);
  setField(headers, rowValues, FIELD_TO_HEADER.requesterEmail, data.requesterEmail);
  setField(headers, rowValues, FIELD_TO_HEADER.submittedAt, new Date());

  writeHeaders(sheet, headers);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, rowValues.length).setValues([rowValues]);

  return { tab: tabName };
}

// Reads row 1 of the tab and drops trailing blank cells, so new columns
// get appended right after the last real header instead of leaving gaps.
function getHeaders(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  while (headers.length && !headers[headers.length - 1]) {
    headers.pop();
  }
  return headers;
}

function writeHeaders(sheet, headers) {
  if (headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// Mutates headers/rowValues in place: fills the existing column for
// headerName, or appends a new column (in both arrays) if it isn't found.
function setField(headers, rowValues, headerName, value) {
  var idx = findHeaderIndex(headers, headerName);
  if (idx === -1) {
    headers.push(headerName);
    rowValues.push(value);
  } else {
    rowValues[idx] = value;
  }
}

function findHeaderIndex(headers, name) {
  var target = name.toString().trim().toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] && headers[i].toString().trim().toLowerCase() === target) {
      return i;
    }
  }
  return -1;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
