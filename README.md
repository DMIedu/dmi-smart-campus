# DMI Smart Campus — Frontend

Phase 1: Login + Reception Dashboard + QR Scanner

Pre-wired to: `https://script.google.com/macros/s/AKfycbxqdum1O0Vdjrh2GH0ocb1DzKfzeMmIlMkbK9N_u5L2PMPNE7cOLMhhd3EmH17eluvdoQ/exec`

---

## Files

- `index.html` — Landing page (role selector)
- `login.html` — Login (Reception/Teacher/Student switchable)
- `reception-dashboard.html` — Main dashboard with live stats
- `scanner.html` — QR scanner (uses phone/laptop camera)
- `404.html` — Not found page
- `css/styles.css` — Design system
- `js/api.js` — Shared API client

---

## Deploy to GitHub Pages (5 minutes)

### Step 1: Create a GitHub repository

1. Go to https://github.com/new
2. Repository name: `dmi-smart-campus` (or whatever you prefer)
3. Set to **Public**
4. Click **Create repository**

### Step 2: Upload files

**Easiest method — drag and drop:**

1. On the empty repo page, click **uploading an existing file**
2. Drag the entire `frontend` folder contents into the upload area
3. Commit message: `Initial frontend`
4. Click **Commit changes**

### Step 3: Enable GitHub Pages

1. In the repo, go to **Settings** (top right)
2. Click **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Branch: **main**, folder: **/ (root)**
5. Click **Save**

Wait 1–2 minutes. You'll get a URL like:
```
https://YOUR_USERNAME.github.io/dmi-smart-campus/
```

### Step 4: Open and test

1. Visit your GitHub Pages URL
2. Click **Reception / Admin**
3. Login with: `admin` / `admin123`
4. You should see the dashboard load with live data from your Apps Script backend ✨

---

## Test on phone

On your phone, open the same GitHub Pages URL. Login as reception, click **Scan QR** — your phone camera will activate. Hold any QR code in front of it.

---

## Troubleshooting

**"Network error" on login**  
→ Your Apps Script web app isn't accessible. Re-check the URL in `js/api.js`.

**Login works but dashboard shows blank stats**  
→ Backend is alive but no data yet. Add a student via the API to see numbers move.

**Camera doesn't open on scanner page**  
→ Most browsers require HTTPS for camera access. GitHub Pages is HTTPS by default ✓. On localhost, use Chrome which allows camera on `localhost`.

**QR scan returns "Invalid QR code"**  
→ The QR's content must be a `QRCodeID` from your Students/Teachers sheet (e.g. `QR-l4x7m9-a1b2c`). Use the **Manual Entry** field to test with a known QR ID first.

---

## Coming next

- Teacher dashboard
- Student dashboard
- Student registration form
- Group class creation
- Digital class book (the matrix view)
- Reports page

Send me the GitHub Pages URL when it's live and I'll continue building.
