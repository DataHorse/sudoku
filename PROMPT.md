# Build Prompt: "Inkwell Sudoku" — a full-featured, installable Sudoku PWA

Use this prompt as the spec if you ever want to regenerate, extend, or hand this project to
another builder (human or AI).

## Goal
Build a fully functional, beautiful Sudoku puzzle app that runs entirely client-side (HTML/CSS/JS,
no backend), is hosted as a static site on GitHub Pages, and can be **installed as an app** on
Android phones, iPhones, and iPads via "Add to Home Screen" (PWA — installable, offline-capable,
full-screen, no browser chrome).

The app must serve **both beginners and experts**: a new player should be able to learn the rules
and solving techniques inside the app; an experienced player should get fast, distraction-free
play with adjustable difficulty up to very hard puzzles.

## Core gameplay requirements
- Real Sudoku engine: generates a full valid solved grid, then removes clues while guaranteeing
  a **unique solution** (verified by a solution-counting solver, not just random removal).
- 5 difficulty levels (Gentle / Easy / Tricky / Hard / Diabolical) mapped to clue-count bands.
- 9x9 board with 3x3 box grouping, tap/click to select, number pad to enter digits.
- Pencil marks / notes mode (small candidate numbers in a cell), auto-notes helper.
- Mistake detection (highlight conflicts), configurable "hard mode" (no mistakes shown).
- Undo/redo, erase, hint (solves one cell using the gentlest technique available — not just
  a random reveal), highlight same numbers / row / column / box / peers of selected cell.
- Timer, mistake counter, pause/resume, keyboard support (desktop), haptic feedback (mobile).
- Win celebration state with time, mistakes, and difficulty summary.
- Local persistence: current game state, stats (games played/won, best time per difficulty,
  streak), and settings all saved in localStorage so nothing is lost on refresh or app close.

## Learn section (beginner-friendly)
- Plain-language rules of Sudoku with a visual mini-grid.
- Step-by-step "how to play this app" walkthrough (selecting cells, entering numbers, notes,
  hints).
- Written for someone who has never played before.

## Tactics section (technique training, beginner → expert)
Interactive, visual lessons — not just text — each with a worked mini-grid example and a plain
explanation:
1. Naked Single
2. Hidden Single
3. Naked Pair
4. Pointing Pair / Box-Line Reduction
5. X-Wing (intro, for advancing players)
Each lesson highlights the relevant cells/candidates directly on a small board so the pattern is
visible, not just described.

## Settings
- Difficulty selector.
- Theme: Light / Dark / Match System.
- Toggle: highlight mistakes, highlight peers/same numbers, show timer, auto-clear notes,
  sound effects, haptics.
- Reset stats / reset all data.

## Design direction
A "puzzle atelier" aesthetic — feels like a beautifully made paper puzzle book turned into a
crisp modern app, not a generic template:
- Palette: ink navy, warm parchment, brass/gold accent, pine teal (correct/success), soft
  clay-red (mistakes) — named hex tokens, not defaults.
- Type: a characterful serif for headings, a clean grounded sans for UI/body text, and — as the
  signature detail — an actual **handwritten-style font for pencil-mark notes**, so notes look
  like real pencil marks next to bold confident "ink" for placed numbers.
- Bottom tab navigation (Play / Learn / Tactics / Stats / Settings) — native app feel on mobile.
- Thick brass box borders / thin ink grid lines on the board itself, the signature visual element.
- Full responsiveness: iPhone SE up to iPad Pro landscape; safe-area padding for notches/home
  indicators; visible keyboard focus states; respects prefers-reduced-motion.

## Technical / hosting requirements
- Static site: `index.html`, `css/`, `js/`, `icons/`, `manifest.json`, `service-worker.js`.
- Web App Manifest with proper icons, `display: standalone`, theme colors — installable on
  Android (Chrome "Install app") and iOS/iPadOS (Safari "Add to Home Screen").
- Service worker caches all static assets for offline play once installed.
- No build step, no dependencies beyond optional Google Fonts — must run by opening the repo's
  GitHub Pages URL, nothing to compile.
- Include a README with exact steps to enable GitHub Pages and install on each device type.
