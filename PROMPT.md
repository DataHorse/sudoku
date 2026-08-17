# Build Prompt: "Sudoku" — a full-featured, installable, kid-friendly Sudoku PWA

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
A bright, playful "friendly puzzle box" aesthetic aimed at kids and beginners, not a muted
grown-up template:
- Palette: sunshine cream background, candy-bright purple/pink/orange/yellow accents, a
  cheerful rainbow color assigned to each digit 1–9 (used on the number pad and entered
  numbers) so kids connect numbers with colors — named hex tokens, not defaults.
- Type: a bouncy rounded display font for headings/numbers/buttons, a friendly rounded sans
  for body text, and — as the signature detail — an actual **handwritten-style font for
  pencil-mark notes**, so notes look like a kid's real pencil marks.
- Bottom tab navigation (Play / Learn / Tactics / Stats / Settings) with playful emoji icons —
  native app feel on mobile.
- Chunky rounded board border, bold rounded buttons with a "pressable" drop-shadow that
  flattens on tap, and a confetti celebration on solving a puzzle.
- Full responsiveness: iPhone SE up to iPad Pro landscape; safe-area padding for notches/home
  indicators; visible keyboard focus states; respects prefers-reduced-motion.
- Footer copyright line: "© Copyright Data Horse" on the Settings screen.

## Technical / hosting requirements
- Static site: `index.html`, `css/`, `js/`, `icons/`, `manifest.json`, `service-worker.js`.
- Web App Manifest with proper icons, `display: standalone`, theme colors — installable on
  Android (Chrome "Install app") and iOS/iPadOS (Safari "Add to Home Screen").
- Service worker caches all static assets for offline play once installed.
- No build step, no dependencies beyond optional Google Fonts — must run by opening the repo's
  GitHub Pages URL, nothing to compile.
- Include a README with exact steps to enable GitHub Pages and install on each device type.
