/* Inkwell Sudoku — Learn & Tactics content.
   Each tactic example is a partially-filled 9x9 grid (0 = empty) plus a list
   of candidate notes for relevant cells, and highlight instructions used to
   render a small read-only teaching board. */

const Content = (() => {
  const LEARN_STEPS = [
    {
      title: "The goal",
      body:
        "Fill the 9×9 grid so every row, every column, and every 3×3 box contains " +
        "the digits 1 through 9 exactly once. No repeats, anywhere in the same row, " +
        "column, or box.",
    },
    {
      title: "Starting clues",
      body:
        "Some cells are already filled in — those are your clues and can't be changed. " +
        "Everything else starts empty. There's always exactly one correct way to finish " +
        "the puzzle.",
    },
    {
      title: "Selecting & entering numbers",
      body:
        "Tap an empty cell to select it, then tap a number on the number pad below the " +
        "board (or type it on a keyboard). Tap the same number again, or the eraser, to " +
        "clear a cell.",
    },
    {
      title: "Pencil marks (notes)",
      body:
        "Not sure yet which number belongs in a cell? Turn on Notes mode and tap numbers " +
        "to jot small candidate numbers in the corner of the cell, just like pencilling " +
        "possibilities in a paper puzzle book. Turn Notes off to go back to entering final answers.",
    },
    {
      title: "Mistakes & hints",
      body:
        "If a number conflicts with another in its row, column, or box, it's highlighted " +
        "so you can fix it. Stuck? Use a hint — it solves just one cell using the simplest " +
        "technique that applies, so you can learn from it instead of losing the puzzle.",
    },
    {
      title: "Difficulty",
      body:
        "Difficulty is set by how many starting clues you get and how much deduction the " +
        "puzzle demands. Start with Gentle or Easy, and work up to Diabolical once the " +
        "techniques in the Tactics tab feel natural.",
    },
  ];

  // helper to build a grid quickly from row strings, '.' = empty
  function g(rows) {
    return rows.map((row) => row.split("").map((ch) => (ch === "." ? 0 : parseInt(ch, 10))));
  }

  const TACTICS = [
    {
      id: "naked-single",
      name: "Naked Single",
      level: "Beginner",
      summary:
        "A cell that has only one possible candidate left, once every number already " +
        "in its row, column, and box is ruled out.",
      explain:
        "Look at the highlighted cell. Every other number 1–9 already appears in its row, " +
        "column, or box — except one. That one number is the only thing that can legally " +
        "go there, so it must be the answer.",
      grid: g([
        "53..7....",
        "6..195...",
        ".98....6.",
        "8...6...3",
        "4..8.3..1",
        "7...2...6",
        ".6....28.",
        "...419..5",
        "....8..79",
      ]),
      highlight: [[0, 2]],
      note: { "0,2": [1, 4] },
      calloutValue: 4,
    },
    {
      id: "hidden-single",
      name: "Hidden Single",
      level: "Beginner",
      summary:
        "A number that can only legally go in one cell within a row, column, or box — " +
        "even though that cell has other candidates too.",
      explain:
        "Scan the highlighted box for where a 7 could go. Several cells look 'open,' but " +
        "once you check the rows and columns crossing this box, only the highlighted cell " +
        "can actually hold a 7 — every other cell in the box is blocked by a 7 elsewhere " +
        "in its row or column. The 7 is 'hidden' among other candidates until you check.",
      grid: g([
        "....1..4.",
        ".6.......",
        "..8......",
        "....7....",
        "1........",
        "........2",
        "......5..",
        ".......8.",
        "4..2....."
      ]),
      highlight: [[1, 1]],
      note: { "1,1": [3, 6, 7, 9] },
      calloutValue: 7,
    },
    {
      id: "naked-pair",
      name: "Naked Pair",
      level: "Intermediate",
      summary:
        "Two cells in the same unit that both have only the same two candidates — those " +
        "two numbers must occupy those two cells, so they can be removed everywhere else in the unit.",
      explain:
        "The two highlighted cells in this row can only be 2 or 8 — nothing else fits " +
        "either one. Since 2 and 8 must go in those two cells (in some order), neither " +
        "number can appear anywhere else in the row. You can safely erase 2 and 8 from " +
        "every other cell's notes in that row.",
      grid: g([
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]),
      highlight: [[3, 2], [3, 6]],
      note: { "3,2": [2, 8], "3,6": [2, 8], "3,0": [2, 4, 8], "3,4": [2, 6, 8] },
      calloutValue: null,
    },
    {
      id: "pointing-pair",
      name: "Pointing Pair / Box-Line Reduction",
      level: "Intermediate",
      summary:
        "When a candidate inside a box only appears in cells that share one row or column, " +
        "it can be eliminated from the rest of that row or column outside the box.",
      explain:
        "In the highlighted box, the number 5 is only possible in two cells — and both sit " +
        "in the same row. That means the 5 for this box must land somewhere in that row, so " +
        "no other cell in the same row (outside the box) can be a 5. You can eliminate 5 as " +
        "a candidate from the rest of that row.",
      grid: g([
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]),
      highlight: [[4, 1], [4, 2]],
      note: { "4,1": [5, 6], "4,2": [5, 9] },
      calloutValue: 5,
    },
    {
      id: "x-wing",
      name: "X-Wing",
      level: "Advanced",
      summary:
        "When a candidate appears in exactly two cells in each of two rows, and those cells " +
        "share the same two columns, the candidate can be eliminated from the rest of those columns.",
      explain:
        "Follow the four highlighted cells: candidate 9 appears in exactly the same two " +
        "columns in both of these rows, forming a rectangle. Wherever the 9 ends up in the " +
        "top row, it forces the 9 in the bottom row into the opposite column, and vice versa. " +
        "Either way, 9 must occupy this rectangle's corners — so 9 can be eliminated from " +
        "every other cell in those two columns.",
      grid: g([
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]),
      highlight: [[1, 2], [1, 7], [6, 2], [6, 7]],
      note: { "1,2": [9], "1,7": [9], "6,2": [9], "6,7": [9] },
      calloutValue: 9,
    },
  ];

  return { LEARN_STEPS, TACTICS };
})();
