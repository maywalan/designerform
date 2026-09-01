# Designer Request Form

An internal landing page for submitting design requests. Every submission is
appended as a new row directly onto the assigned designer's tab in the
[team spreadsheet](https://docs.google.com/spreadsheets/d/1fwQatvoBGrSqFz_rguGA0TyDS3bw81Kw428wA7ALuPE/edit?gid=0#gid=0).

- `index.html`, `style.css`, `script.js`, `config.js` — the static form (host anywhere, e.g. GitHub Pages).
- `apps-script/Code.gs`, `apps-script/appsscript.json` — the backend that writes into the sheet.

## Field mapping

| Form field       | Sheet column    |
|-------------------|-----------------|
| Brief date (defaults to today, editable) | A — Date assigned |
| Due date            | B — Due date        |
| Priority (High/Medium/Low) | D — Priority |
| Project name       | E — Task            |
| Details             | F — Description     |
| PIC (designer)      | G — PIC             |
| Requested by (name)  | J — Requested by |

Columns not listed above (C, H, I, ...) are left untouched. The mapping is by
fixed column letter (`FIELD_TO_COLUMN` in `Code.gs`) — if the sheet's layout
changes, update the column numbers there (1 = A, 2 = B, etc.).

## 1. Set up the backend (Google Apps Script)

1. Open the [spreadsheet](https://docs.google.com/spreadsheets/d/1fwQatvoBGrSqFz_rguGA0TyDS3bw81Kw428wA7ALuPE/edit?gid=0#gid=0).
2. Go to **Extensions > Apps Script**.
3. Delete the default `Code.gs` contents and paste in this repo's `apps-script/Code.gs`.
4. Open **Project Settings** (gear icon) and, if you use the manifest file,
   enable "Show appsscript.json manifest file" then paste in `apps-script/appsscript.json`.
5. In `Code.gs`, check `DESIGNER_TABS` at the top — the value on the right of
   each line must exactly match the real tab name in the spreadsheet. Fix any
   that differ from the dropdown labels used on the form.
6. Click **Deploy > New deployment**.
   - Select type: **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone** (still safe — the URL itself is the only
     credential, and it only ever writes rows, never reads or exposes data).
   - Click **Deploy** and authorize the script when prompted.
7. Copy the **Web app URL** (ends in `/exec`).

## 2. Connect the frontend

1. Open `config.js` and replace `PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE` with
   the Web app URL from step 1.7.

## 3. Host the landing page

Any static host works. Easiest with this repo: enable **GitHub Pages**
(Settings > Pages > Deploy from branch, root of `main`), then share the
resulting URL internally.

## 4. Test it

1. Open the hosted page, fill out the form with a test designer, and submit.
2. Check that a new row appeared on that designer's tab in the spreadsheet.
3. Re-deploy the Apps Script (**Deploy > Manage deployments > edit > New
   version**) any time you change `Code.gs` — editing the script alone does
   not update a live deployment.

## Notes

- The form validates that the due date isn't before the brief date.
- If you rename a designer, add a new one, or change the PIC list, update
  both the `<select>` options in `index.html` and `DESIGNER_TABS` in `Code.gs`.
- `appsscript.json` sets the script's time zone to `Asia/Bangkok` — change it
  if the team is elsewhere.
