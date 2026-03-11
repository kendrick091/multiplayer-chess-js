const pieceValues = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

const MAX_DEPTH = 3; // depth 3 ≈ medium-hard (~8/10)

function makeComputerMove() {

  let bestMove = null;
  let bestScore = -Infinity;

  const moves = getAllMoves("black");

  for (const move of moves) {

    const captured = makeMove(move);

    const score = minimax(MAX_DEPTH - 1, false, -Infinity, Infinity);

    undoMove(move, captured);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (!bestMove) return;

  makeMove(bestMove);

  handlePromotion(bestMove.toRow, bestMove.toCol);

  lastMove = bestMove;

  switchTurn();
  renderBoard();
  checkGameStatus();
}

// Minimax with alpha-beta pruning
function minimax(depth, isMaximizing, alpha, beta) {

  if (depth === 0) {
    return evaluateBoard();
  }

  const moves = getAllMoves(isMaximizing ? "black" : "white");

  if (isMaximizing) {

    let maxEval = -Infinity;

    for (const move of moves) {

      const captured = makeMove(move);

      const eval = minimax(depth - 1, false, alpha, beta);

      undoMove(move, captured);

      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);

      if (beta <= alpha) break;
    }

    return maxEval;

  } else {

    let minEval = Infinity;

    for (const move of moves) {

      const captured = makeMove(move);

      const eval = minimax(depth - 1, true, alpha, beta);

      undoMove(move, captured);

      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);

      if (beta <= alpha) break;
    }

    return minEval;
  }
}

function evaluateBoard() {

  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c];
      if (!piece) continue;

      const value = pieceValues[piece.toLowerCase()];

      if (piece === piece.toUpperCase()) {
        score -= value;
      } else {
        score += value;
      }
    }
  }

  return score;
}

// Generates all legal moves for the given color in the format {fromRow, fromCol, toRow, toCol}
function getAllMoves(color) {

  let moves = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c];
      if (!piece) continue;

      const isWhite = piece === piece.toUpperCase();
      const isBlack = piece === piece.toLowerCase();

      if (color === "white" && !isWhite) continue;
      if (color === "black" && !isBlack) continue;

      const legalMoves = getLegalMoves(r, c);

      legalMoves.forEach(m => {
        moves.push({
          fromRow: r,
          fromCol: c,
          toRow: m.row,
          toCol: m.col
        });
      });
    }
  }

  return moves;
}

// Executes the move on the board and returns any captured piece (or "" if none)
function makeMove(move) {

  const captured = board[move.toRow][move.toCol];

  board[move.toRow][move.toCol] = board[move.fromRow][move.fromCol];
  board[move.fromRow][move.fromCol] = "";

  return captured;
}

function undoMove(move, captured) {

  board[move.fromRow][move.fromCol] = board[move.toRow][move.toCol];
  board[move.toRow][move.toCol] = captured;
}