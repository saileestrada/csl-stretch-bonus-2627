# Google Sheets Webhook Setup

This lets the survey write each submission directly into a Google Sheet.

## 1. Create the sheet
1. Create a new Google Sheet, name it something like `CSL Stretch Bonus Responses`.
2. In row 1, add headers: `Timestamp | Name | ID | Level | BV | Bonus`
   (the script below will also add these automatically if the sheet is empty, but doing it yourself avoids ordering issues).

## 2. Add the script
1. In the Sheet, go to **Extensions > Apps Script**.
2. Delete any starter code and paste this:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'ID', 'Level', 'BV', 'Bonus']);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.name || '',
    data.id || '',
    data.level || '',
    data.bv || '',
    data.bonus || ''
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Deploy > New deployment**.
4. Under "Select type," choose **Web app**.
5. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, authorize when prompted, and copy the **Web app URL** it gives you.

## 3. Wire it into the app
Open `src/config.js` in the project and replace the placeholder:

```javascript
export const SUBMIT_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';
```

with the URL from step 2.6. Commit and push, GitHub Actions will rebuild automatically.

## Notes
- The app calls the webhook with `mode: 'no-cors'`, so the browser won't show the server's response, and the app treats "no network error" as success. If you want to verify it's working, submit a test response and check the Sheet directly.
- Every time you redeploy the Apps Script (not just edit it), you get a new URL unless you choose "Manage deployments > Edit > New version" on the same deployment. Prefer versioning the existing deployment over creating new ones, so the URL in `config.js` doesn't go stale.
