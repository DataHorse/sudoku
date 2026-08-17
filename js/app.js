/* Inkwell Sudoku — app controller */

const STORAGE_KEY = "inkwell-sudoku-state-v1";
const STATS_KEY = "inkwell-sudoku-stats-v1";
const SETTINGS_KEY = "inkwell-sudoku-settings-v1";

const defaultSettings = {
  theme: "system", // light | dark | system
  difficulty: "easy",
  highlightMistakes: true,
  highlightPeers: true,
  showTimer: true,
  autoClearNotes: true,
  sound: true,
  haptics: true,
};

const defaultStats = {
  played: 0,
  won: 0,
  streak: 0,
  bestTimes: {}, // difficulty -> seconds
};

let settings = loadJSON(SETTINGS_KEY, defaultSettings);
let stats = loadJSON(STATS_KEY, defaultStats);

let state = null; // current game state, loaded/created below

let selected = null; // {row, col}
let notesMode = false;
let timerInterval = null;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return { ...structuredClone(fallback), ...JSON.parse(raw) };
  } catch (e) {
    return structuredClone(fallback);
  }
}
function saveJSON(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    /* storage unavailable — fail silently, app still works this session */
  }
}

/* ---------------- Game lifecycle ---------------- */

function newGame(difficultyKey) {
  const diff = difficultyKey || settings.difficulty;
  const { puzzle, solution, difficulty, clueCount } = Sudoku.generatePuzzle(diff);
  state = {
    puzzle: Sudoku.cloneGrid(puzzle),
    givens: puzzle.map((row) => row.map((v) => v !== 0)),
    grid: Sudoku.cloneGrid(puzzle),
    solution,
    notes: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())),
    difficulty,
    clueCount,
    mistakes: 0,
    seconds: 0,
    startedAt: Date.now(),
    paused: false,
    finished: false,
    history: [],
  };
  selected = null;
  stats.played++;
  saveJSON(STATS_KEY, stats);
  persist();
  startTimer();
  renderAll();
}

function persist() {
  if (!state) return;
  const serializable = {
    ...state,
    notes: state.notes.map((row) => row.map((s) => Array.from(s))),
  };
  saveJSON(STORAGE_KEY, serializable);
}

function loadGame() {
  const raw = loadJSON(STORAGE_KEY, null);
  if (!raw || !raw.puzzle) return false;
  state = {
    ...raw,
    notes: raw.notes.map((row) => row.map((arr) => new Set(arr))),
  };
  return true;
}

function pushHistory() {
  state.history.push({
    grid: Sudoku.cloneGrid(state.grid),
    notes: state.notes.map((row) => row.map((s) => new Set(s))),
    mistakes: state.mistakes,
  });
  if (state.history.length > 100) state.history.shift();
}

function undo() {
  if (!state || state.history.length === 0) return;
  const prev = state.history.pop();
  state.grid = prev.grid;
  state.notes = prev.notes;
  state.mistakes = prev.mistakes;
  persist();
  renderBoard();
  renderMeta();
}

/* ---------------- Timer ---------------- */

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    if (state && !state.paused && !state.finished) {
      state.seconds++;
      renderMeta();
      if (state.seconds % 5 === 0) persist();
    }
  }, 1000);
}
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---------------- Interactions ---------------- */

function selectCell(row, col) {
  if (!state || state.paused) return;
  selected = { row, col };
  renderBoard();
}

function enterValue(val) {
  if (!state || !selected || state.paused || state.finished) return;
  const { row, col } = selected;
  if (state.givens[row][col]) return;

  pushHistory();

  if (notesMode) {
    const set = state.notes[row][col];
    if (state.grid[row][col] !== 0) return;
    if (set.has(val)) set.delete(val);
    else set.add(val);
  } else {
    if (state.grid[row][col] === val) {
      state.grid[row][col] = 0;
    } else {
      state.grid[row][col] = val;
      if (settings.autoClearNotes) {
        state.notes[row][col].clear();
        clearPeerNotes(row, col, val);
      }
      const correct = state.solution[row][col] === val;
      if (!correct) {
        state.mistakes++;
        buzz();
      } else {
        tick();
      }
    }
  }
  persist();
  renderBoard();
  renderMeta();
  checkWin();
}

function clearPeerNotes(row, col, val) {
  Sudoku.peers(row, col).forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    state.notes[r][c].delete(val);
  });
}

function eraseCell() {
  if (!state || !selected || state.paused) return;
  const { row, col } = selected;
  if (state.givens[row][col]) return;
  pushHistory();
  state.grid[row][col] = 0;
  state.notes[row][col].clear();
  persist();
  renderBoard();
}

function giveHint() {
  if (!state || state.paused || state.finished) return;
  const move = Sudoku.findGentlestMove(state.grid, state.solution);
  if (!move) return;
  pushHistory();
  state.grid[move.row][move.col] = move.value;
  state.notes[move.row][move.col].clear();
  if (settings.autoClearNotes) clearPeerNotes(move.row, move.col, move.value);
  selected = { row: move.row, col: move.col };
  persist();
  renderBoard();
  renderMeta();
  flashHint(move.row, move.col);
  toast(`Hint: ${move.technique} → ${move.value}`);
  checkWin();
}

function flashHint(row, col) {
  const idx = row * 9 + col;
  const cellEl = document.querySelectorAll("#board .cell")[idx];
  if (cellEl) {
    cellEl.classList.add("hint-glow");
    setTimeout(() => cellEl.classList.remove("hint-glow"), 2300);
  }
}

function checkWin() {
  if (!state) return;
  if (Sudoku.isBoardComplete(state.grid) && Sudoku.isBoardCorrect(state.grid, state.solution)) {
    state.finished = true;
    stopTimer();
    stats.won++;
    stats.streak++;
    const best = stats.bestTimes[state.difficulty];
    if (!best || state.seconds < best) stats.bestTimes[state.difficulty] = state.seconds;
    saveJSON(STATS_KEY, stats);
    persist();
    showWinOverlay();
  }
}

/* ---------------- Rendering ---------------- */

function renderAll() {
  renderBoard();
  renderMeta();
  renderNumpad();
  renderDifficultyChips();
}

function renderMeta() {
  if (!state) return;
  document.getElementById("timerChip").style.display = settings.showTimer ? "flex" : "none";
  document.getElementById("timerVal").textContent = formatTime(state.seconds);
  document.getElementById("mistakeVal").textContent = state.mistakes;
  document.getElementById("difficultyLabel").textContent =
    Sudoku.DIFFICULTIES[state.difficulty]?.label || state.difficulty;
}

function renderBoard() {
  const board = document.getElementById("board");
  if (!state) return;
  board.innerHTML = "";
  const selVal = selected ? state.grid[selected.row][selected.col] : 0;
  const peerSet = selected ? Sudoku.peers(selected.row, selected.col) : new Set();

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (r % 3 === 0) cell.classList.add("row-thick-top");
      const val = state.grid[r][c];
      const given = state.givens[r][c];
      if (given) cell.classList.add("given");

      const isSelected = selected && selected.row === r && selected.col === c;
      const isPeer = settings.highlightPeers && peerSet.has(`${r},${c}`);
      const isSameVal = settings.highlightPeers && selVal !== 0 && val === selVal && !isSelected;
      const isError =
        settings.highlightMistakes && val !== 0 && !given && val !== state.solution[r][c];

      if (isSelected) cell.classList.add("selected");
      else if (isSameVal) cell.classList.add("same-value");
      else if (isPeer) cell.classList.add("peer");
      if (isError) cell.classList.add("error");

      if (val !== 0) {
        cell.textContent = val;
      } else if (state.notes[r][c].size > 0) {
        const notesGrid = document.createElement("div");
        notesGrid.className = "notes-grid";
        for (let n = 1; n <= 9; n++) {
          const span = document.createElement("span");
          span.textContent = state.notes[r][c].has(n) ? n : "";
          notesGrid.appendChild(span);
        }
        cell.appendChild(notesGrid);
      }

      cell.addEventListener("click", () => selectCell(r, c));
      board.appendChild(cell);
    }
  }
}

function renderNumpad() {
  const pad = document.getElementById("numpad");
  pad.innerHTML = "";
  const counts = Array(10).fill(0);
  if (state) {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (state.grid[r][c] !== 0) counts[state.grid[r][c]]++;
  }
  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement("button");
    const remaining = 9 - counts[n];
    btn.innerHTML = `${n}<span class="remaining">${remaining > 0 ? remaining : ""}</span>`;
    if (remaining <= 0) btn.classList.add("exhausted");
    btn.addEventListener("click", () => enterValue(n));
    pad.appendChild(btn);
  }
}

function renderDifficultyChips() {
  const row = document.getElementById("diffRow");
  row.innerHTML = "";
  Object.entries(Sudoku.DIFFICULTIES).forEach(([key, d]) => {
    const chip = document.createElement("button");
    chip.className = "diff-chip" + (settings.difficulty === key ? " active" : "");
    chip.textContent = d.label;
    chip.addEventListener("click", () => {
      settings.difficulty = key;
      saveJSON(SETTINGS_KEY, settings);
      renderDifficultyChips();
    });
    row.appendChild(chip);
  });
}

/* ---------------- Win overlay ---------------- */

function showWinOverlay() {
  document.getElementById("winTime").textContent = formatTime(state.seconds);
  document.getElementById("winMistakes").textContent = state.mistakes;
  document.getElementById("winDiff").textContent =
    Sudoku.DIFFICULTIES[state.difficulty]?.label || state.difficulty;
  document.getElementById("winOverlay").classList.add("active");
  buzzSuccess();
}
function closeWinOverlay() {
  document.getElementById("winOverlay").classList.remove("active");
}

/* ---------------- Feedback ---------------- */

let audioCtx = null;
function beep(freq, dur) {
  if (!settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
function tick() { beep(720, 0.08); }
function buzz() {
  beep(160, 0.18);
  if (settings.haptics && navigator.vibrate) navigator.vibrate(80);
}
function buzzSuccess() {
  beep(523, 0.12);
  setTimeout(() => beep(659, 0.12), 120);
  setTimeout(() => beep(784, 0.2), 240);
  if (settings.haptics && navigator.vibrate) navigator.vibrate([40, 40, 80]);
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------------- Theme ---------------- */

function applyTheme() {
  let mode = settings.theme;
  if (mode === "system") {
    mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", mode);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#1b2430" : "#f6efe0");
}

/* ---------------- Tabs ---------------- */

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${name}`).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  if (name === "stats") renderStats();
}

/* ---------------- Stats view ---------------- */

function renderStats() {
  document.getElementById("statPlayed").textContent = stats.played;
  document.getElementById("statWon").textContent = stats.won;
  document.getElementById("statStreak").textContent = stats.streak;
  const winPct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  document.getElementById("statWinPct").textContent = `${winPct}%`;

  const list = document.getElementById("bestTimesList");
  list.innerHTML = "";
  Object.entries(Sudoku.DIFFICULTIES).forEach(([key, d]) => {
    const row = document.createElement("div");
    const time = stats.bestTimes[key];
    row.innerHTML = `<span>${d.label}</span><span>${time ? formatTime(time) : "—"}</span>`;
    list.appendChild(row);
  });
}

/* ---------------- Settings view ---------------- */

function renderSettings() {
  document.getElementById("toggleMistakes").checked = settings.highlightMistakes;
  document.getElementById("togglePeers").checked = settings.highlightPeers;
  document.getElementById("toggleTimer").checked = settings.showTimer;
  document.getElementById("toggleAutoClear").checked = settings.autoClearNotes;
  document.getElementById("toggleSound").checked = settings.sound;
  document.getElementById("toggleHaptics").checked = settings.haptics;
  document.querySelectorAll("#themeSeg button").forEach((b) =>
    b.classList.toggle("active", b.dataset.theme === settings.theme)
  );
}

function wireSettings() {
  const bind = (id, key) => {
    document.getElementById(id).addEventListener("change", (e) => {
      settings[key] = e.target.checked;
      saveJSON(SETTINGS_KEY, settings);
      renderMeta();
      renderBoard();
    });
  };
  bind("toggleMistakes", "highlightMistakes");
  bind("togglePeers", "highlightPeers");
  bind("toggleTimer", "showTimer");
  bind("toggleAutoClear", "autoClearNotes");
  bind("toggleSound", "sound");
  bind("toggleHaptics", "haptics");

  document.querySelectorAll("#themeSeg button").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.theme = btn.dataset.theme;
      saveJSON(SETTINGS_KEY, settings);
      applyTheme();
      renderSettings();
    });
  });

  document.getElementById("resetStatsBtn").addEventListener("click", () => {
    if (confirm("Reset all stats and best times? This can't be undone.")) {
      stats = structuredClone(defaultStats);
      saveJSON(STATS_KEY, stats);
      renderStats();
      toast("Stats reset");
    }
  });
  document.getElementById("resetAllBtn").addEventListener("click", () => {
    if (confirm("Erase all saved data, including your current puzzle? This can't be undone.")) {
      localStorage.clear();
      location.reload();
    }
  });
}

/* ---------------- Tactics rendering ---------------- */

function renderTactics() {
  const wrap = document.getElementById("tacticsList");
  wrap.innerHTML = "";
  Content.TACTICS.forEach((t) => {
    const card = document.createElement("div");
    card.className = "card tactic-card";

    const head = document.createElement("div");
    head.className = "tactic-head";
    head.innerHTML = `<h3>${t.name}</h3><span class="level-badge">${t.level}</span>`;
    card.appendChild(head);
    const summary = document.createElement("p");
    summary.textContent = t.summary;
    card.appendChild(summary);

    const body = document.createElement("div");
    body.className = "tactic-body";

    const board = buildMiniBoard(t);
    body.appendChild(board);

    const textWrap = document.createElement("div");
    textWrap.className = "tactic-text";
    const explain = document.createElement("p");
    explain.textContent = t.explain;
    textWrap.appendChild(explain);
    if (t.calloutValue) {
      const callout = document.createElement("span");
      callout.className = "callout";
      callout.textContent = `→ answer: ${t.calloutValue}`;
      textWrap.appendChild(callout);
    }
    body.appendChild(textWrap);

    card.appendChild(body);
    wrap.appendChild(card);
  });
}

function buildMiniBoard(tactic) {
  const board = document.createElement("div");
  board.className = "mini-board";
  const hlSet = new Set((tactic.highlight || []).map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "mini-cell";
      if (hlSet.has(`${r},${c}`)) cell.classList.add("hl");
      const val = tactic.grid[r][c];
      const noteVals = tactic.note && tactic.note[`${r},${c}`];
      if (val) {
        cell.textContent = val;
      } else if (noteVals) {
        const ng = document.createElement("div");
        ng.className = "mini-notes";
        noteVals.forEach((n) => {
          const s = document.createElement("span");
          s.textContent = n;
          ng.appendChild(s);
        });
        cell.appendChild(ng);
      }
      board.appendChild(cell);
    }
  }
  return board;
}

/* ---------------- Learn rendering ---------------- */

function renderLearn() {
  const wrap = document.getElementById("learnList");
  wrap.innerHTML = "";
  Content.LEARN_STEPS.forEach((step, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3><span class="step-num">${i + 1}</span>${step.title}</h3><p>${step.body}</p>`;
    wrap.appendChild(card);
  });
}

/* ---------------- Wiring ---------------- */

function wireGameControls() {
  document.getElementById("newGameBtn").addEventListener("click", () => newGame(settings.difficulty));
  document.getElementById("newGameBtnPlay").addEventListener("click", () => newGame(settings.difficulty));
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("eraseBtn").addEventListener("click", eraseCell);
  document.getElementById("hintBtn").addEventListener("click", giveHint);
  document.getElementById("notesBtn").addEventListener("click", () => {
    notesMode = !notesMode;
    document.getElementById("notesBtn").classList.toggle("active", notesMode);
  });
  document.getElementById("pauseBtn").addEventListener("click", () => {
    if (!state) return;
    state.paused = !state.paused;
    document.getElementById("pauseOverlay").classList.toggle("active", state.paused);
    persist();
  });
  document.getElementById("resumeBtn").addEventListener("click", () => {
    state.paused = false;
    document.getElementById("pauseOverlay").classList.remove("active");
  });
  document.getElementById("winPlayAgainBtn").addEventListener("click", () => {
    closeWinOverlay();
    newGame(settings.difficulty);
  });
  document.getElementById("winCloseBtn").addEventListener("click", closeWinOverlay);

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.tab));
  });

  document.addEventListener("keydown", (e) => {
    if (!selected) return;
    if (e.key >= "1" && e.key <= "9") enterValue(parseInt(e.key, 10));
    else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") eraseCell();
    else if (e.key === "ArrowUp") moveSelection(-1, 0);
    else if (e.key === "ArrowDown") moveSelection(1, 0);
    else if (e.key === "ArrowLeft") moveSelection(0, -1);
    else if (e.key === "ArrowRight") moveSelection(0, 1);
  });
}

function moveSelection(dr, dc) {
  if (!selected) {
    selected = { row: 0, col: 0 };
  } else {
    selected = {
      row: Math.min(8, Math.max(0, selected.row + dr)),
      col: Math.min(8, Math.max(0, selected.col + dc)),
    };
  }
  renderBoard();
}

/* ---------------- Init ---------------- */

function init() {
  applyTheme();
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (settings.theme === "system") applyTheme();
    });

  wireGameControls();
  wireSettings();
  renderSettings();
  renderLearn();
  renderTactics();

  const hadSave = loadGame();
  if (!hadSave) {
    newGame(settings.difficulty);
  } else {
    renderAll();
    startTimer();
    if (state.paused) document.getElementById("pauseOverlay").classList.add("active");
  }

  showView("play");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
