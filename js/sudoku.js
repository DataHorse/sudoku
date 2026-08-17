/* Inkwell Sudoku — core engine
   Pure functions: generate solved grids, generate unique-solution puzzles,
   solve, count solutions, find "gentlest" next move for hints. */

const Sudoku = (() => {
  const SIZE = 9;
  const BOX = 3;

  function emptyGrid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function cloneGrid(g) {
    return g.map((row) => row.slice());
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function isValid(grid, row, col, val) {
    for (let i = 0; i < SIZE; i++) {
      if (grid[row][i] === val || grid[i][col] === val) return false;
    }
    const br = row - (row % BOX);
    const bc = col - (col % BOX);
    for (let r = br; r < br + BOX; r++) {
      for (let c = bc; c < bc + BOX; c++) {
        if (grid[r][c] === val) return false;
      }
    }
    return true;
  }

  function findEmpty(grid) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  // Fills an empty grid completely at random (used to seed a new puzzle).
  function generateSolvedGrid() {
    const grid = emptyGrid();
    fillGrid(grid);
    return grid;
  }

  function fillGrid(grid) {
    const spot = findEmpty(grid);
    if (!spot) return true;
    const [r, c] = spot;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const n of nums) {
      if (isValid(grid, r, c, n)) {
        grid[r][c] = n;
        if (fillGrid(grid)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  // Counts solutions up to `limit` (stops early once reached) — used to verify uniqueness.
  function countSolutions(grid, limit = 2) {
    let count = 0;
    const g = cloneGrid(grid);

    function backtrack() {
      if (count >= limit) return;
      const spot = findEmpty(g);
      if (!spot) {
        count++;
        return;
      }
      const [r, c] = spot;
      for (let n = 1; n <= 9; n++) {
        if (count >= limit) return;
        if (isValid(g, r, c, n)) {
          g[r][c] = n;
          backtrack();
          g[r][c] = 0;
        }
      }
    }
    backtrack();
    return count;
  }

  function solve(grid) {
    const g = cloneGrid(grid);
    function backtrack() {
      const spot = findEmpty(g);
      if (!spot) return true;
      const [r, c] = spot;
      for (let n = 1; n <= 9; n++) {
        if (isValid(g, r, c, n)) {
          g[r][c] = n;
          if (backtrack()) return true;
          g[r][c] = 0;
        }
      }
      return false;
    }
    if (backtrack()) return g;
    return null;
  }

  const DIFFICULTIES = {
    gentle: { label: "Gentle", clues: [46, 50] },
    easy: { label: "Easy", clues: [40, 45] },
    tricky: { label: "Tricky", clues: [32, 36] },
    hard: { label: "Hard", clues: [28, 31] },
    diabolical: { label: "Diabolical", clues: [22, 26] },
  };

  // Removes clues from a solved grid one at a time (random order), keeping the
  // removal only if the puzzle still has exactly one solution, until the target
  // clue count is reached or no more safe removals exist.
  function generatePuzzle(difficultyKey) {
    const diff = DIFFICULTIES[difficultyKey] || DIFFICULTIES.tricky;
    const targetClues =
      diff.clues[0] + Math.floor(Math.random() * (diff.clues[1] - diff.clues[0] + 1));

    const solved = generateSolvedGrid();
    const puzzle = cloneGrid(solved);

    const cells = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) cells.push([r, c]);
    shuffle(cells);

    let clueCount = 81;
    for (const [r, c] of cells) {
      if (clueCount <= targetClues) break;
      const backup = puzzle[r][c];
      if (backup === 0) continue;
      puzzle[r][c] = 0;
      // Uniqueness check (bounded backtracking is fast enough at this depth).
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[r][c] = backup; // revert, keep this clue
      } else {
        clueCount--;
      }
    }

    return {
      puzzle,
      solution: solved,
      difficulty: difficultyKey,
      clueCount,
    };
  }

  function getCandidates(grid, row, col) {
    if (grid[row][col] !== 0) return [];
    const cands = [];
    for (let n = 1; n <= 9; n++) {
      if (isValid(grid, row, col, n)) cands.push(n);
    }
    return cands;
  }

  function boxIndex(row, col) {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }

  function peers(row, col) {
    const result = new Set();
    for (let i = 0; i < SIZE; i++) {
      result.add(`${row},${i}`);
      result.add(`${i},${col}`);
    }
    const br = row - (row % BOX);
    const bc = col - (col % BOX);
    for (let r = br; r < br + BOX; r++) {
      for (let c = bc; c < bc + BOX; c++) result.add(`${r},${c}`);
    }
    result.delete(`${row},${col}`);
    return result;
  }

  // Finds the "gentlest" next move for the hint system: prefer a naked single
  // (only one candidate) or hidden single (only cell in a unit that can hold a
  // value) over a blind reveal, so hints teach technique rather than just answer.
  function findGentlestMove(grid, solution) {
    // 1. Naked single
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== 0) continue;
        const cands = getCandidates(grid, r, c);
        if (cands.length === 1) {
          return { row: r, col: c, value: cands[0], technique: "Naked Single" };
        }
      }
    }
    // 2. Hidden single (row, col, or box)
    const units = [];
    for (let r = 0; r < SIZE; r++) units.push(Array.from({ length: 9 }, (_, c) => [r, c]));
    for (let c = 0; c < SIZE; c++) units.push(Array.from({ length: 9 }, (_, r) => [r, c]));
    for (let b = 0; b < SIZE; b++) {
      const br = Math.floor(b / 3) * 3;
      const bc = (b % 3) * 3;
      const cellsInBox = [];
      for (let r = br; r < br + 3; r++)
        for (let c = bc; c < bc + 3; c++) cellsInBox.push([r, c]);
      units.push(cellsInBox);
    }
    for (const unit of units) {
      for (let n = 1; n <= 9; n++) {
        const spots = unit.filter(([r, c]) => grid[r][c] === 0 && isValid(grid, r, c, n));
        if (spots.length === 1) {
          const [r, c] = spots[0];
          return { row: r, col: c, value: n, technique: "Hidden Single" };
        }
      }
    }
    // 3. Fall back: reveal correct value from the known solution
    const spot = findEmpty(grid);
    if (!spot) return null;
    const [r, c] = spot;
    return { row: r, col: c, value: solution[r][c], technique: "Reveal" };
  }

  function isBoardComplete(grid) {
    return findEmpty(grid) === null;
  }

  function isBoardCorrect(grid, solution) {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) if (grid[r][c] !== solution[r][c]) return false;
    return true;
  }

  return {
    SIZE,
    DIFFICULTIES,
    emptyGrid,
    cloneGrid,
    isValid,
    generateSolvedGrid,
    generatePuzzle,
    solve,
    countSolutions,
    getCandidates,
    boxIndex,
    peers,
    findGentlestMove,
    isBoardComplete,
    isBoardCorrect,
  };
})();
