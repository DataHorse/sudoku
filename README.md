# Sudoku

A fully functional, installable Sudoku app — five difficulty levels, notes/pencil marks,
hints that teach technique, a Learn section for beginners, and an interactive Tactics
section for solving strategies. Pure HTML/CSS/JS, no build step, no backend.

## 1. Host it on GitHub Pages (free)

1. Create a new repository on GitHub (e.g. `sudoku-kids`) — public repos get free Pages hosting.
2. Upload **all files in this folder**, keeping the same structure:
   ```
   index.html
   manifest.json
   service-worker.js
   css/style.css
   js/sudoku.js
   js/content.js
   js/app.js
   icons/icon-192.png
   icons/icon-512.png
   icons/icon-maskable-192.png
   icons/icon-maskable-512.png
   ```
   Easiest way: on the repo page, click **Add file → Upload files**, drag the whole folder
   contents in, and commit. (Or, if you use git locally: `git init`, `git add .`,
   `git commit -m "Sudoku"`, then push to the GitHub repo.)
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to "Deploy from a branch", branch = `main`,
   folder = `/ (root)`. Save.
5. GitHub gives you a URL like `https://YOUR-USERNAME.github.io/sudoku-kids/`. It takes
   about a minute to go live the first time.

That URL is your app — open it on any device's browser.

## 2. Install it as an app

### iPhone / iPad (Safari)
1. Open your GitHub Pages URL in **Safari** (must be Safari, not Chrome, for this to work on iOS).
2. Tap the **Share** icon (square with an arrow) in the toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. An "Sudoku" icon appears on the home screen and opens full-screen, no browser bar.

### Android (Chrome)
1. Open your GitHub Pages URL in **Chrome**.
2. Tap the **⋮** menu in the top right.
3. Tap **Install app** (or **Add to Home screen**).
4. Confirm. The app installs like a native app, with its own icon and window.

### Desktop (Chrome/Edge)
Click the install icon (⊕) in the address bar, or the ⋮ menu → **Install Sudoku**.

Once installed, the service worker caches everything so it keeps working **offline** —
no connection needed to play after the first load.

## 3. Updating the app later

Any time you push changed files to the repo's `main` branch, GitHub Pages redeploys
automatically within a minute or two. Installed devices will pick up the update the next
time they open the app while online (the service worker refreshes its cache in the
background).

If you change the cached file list, bump `CACHE_NAME` in `service-worker.js` (e.g.
`sudoku-kids-v2`) so old caches are cleared out.

## Project structure

- `js/sudoku.js` — the puzzle engine: generates full solved grids, removes clues while
  proving the result still has a single unique solution, solves puzzles, and powers the
  hint system by finding the simplest applicable technique.
- `js/content.js` — all Learn and Tactics text and worked example grids.
- `js/app.js` — UI state, rendering, localStorage persistence, settings, stats.
- `css/style.css` — the "Sudoku" design system (see `PROMPT.md` for the design brief).
- `PROMPT.md` — the full build brief this app was built from, in case you want to hand it
  to another builder or regenerate/extend it later.

Everything is stored locally on-device (`localStorage`) — there's no server, account, or
sync between devices.
