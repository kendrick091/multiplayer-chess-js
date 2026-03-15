const socket = io(`https://multiplayer-chess-js.onrender.com`);

let roomId = Math.random().toString(36).substring(2,8);
document.getElementById("roomInput").value = roomId;
let playerColor = "";

// receive move from opponent
socket.on("move", (move) => {

  const capturedPiece = board[move.toRow][move.toCol];

if (capturedPiece !== "") {

  if (capturedPiece === capturedPiece.toUpperCase()) {
    capturedWhite.push(capturedPiece);
  } else {
    capturedBlack.push(capturedPiece);
  }

  renderCapturedPieces();
}

  const piece = board[move.fromRow][move.fromCol];

  board[move.toRow][move.toCol] = piece;
  board[move.fromRow][move.fromCol] = "";

  handlePromotion(move.toRow, move.toCol);

  lastMove = {
    fromRow: move.fromRow,
    fromCol: move.fromCol,
    toRow: move.toRow,
    toCol: move.toCol
  };

  switchTurn();
  renderBoard();
  checkGameStatus();
});

function createRoom(){
  disableGameButtons();
  roomId = document.getElementById("roomInput").value;
  socket.emit("createRoom", roomId);
}

function joinRoom(){
  disableGameButtons();
  roomId = document.getElementById("roomInput").value;
  socket.emit("joinRoom", roomId);
}

socket.on("playerColor", (color)=>{
  playerColor = color;
});

socket.on("startGame", () => {
  document.getElementById("status").textContent = "Game Started!";
});

// ===================================
// Chess logic and UI code
let playVsComputer = false;
let computerColor = "black";

function startComputerGame() {
  disableGameButtons();
  playVsComputer = true;
  playerColor = "white";
  computerColor = "black";
  document.getElementById("status").textContent = "Playing vs Computer";
}

const board = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"]
];

const boardElement = document.getElementById("board");

const pieces = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙"
};

let selected = null; // store selected piece position
let color = "white"; // track current turn
let lastMove = null;
let possibleMoves = [];
// for captured pieces
let capturedWhite = [];
let capturedBlack = [];

// ===================================
// Board rendering and click handling

function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {

      const square = document.createElement("div");
      square.classList.add("square");

      const isLight = (row + col) % 2 === 0;
      square.classList.add(isLight ? "light" : "dark");

      if (lastMove) {
  if (
    (row === lastMove.fromRow && col === lastMove.fromCol) ||
    (row === lastMove.toRow && col === lastMove.toCol)
  ) {
    square.style.backgroundColor = "#f6f669"; // yellow highlight
  }
}

      square.dataset.row = row;
      square.dataset.col = col;

      // Highlight possible moves
for (const move of possibleMoves) {
  if (move.row === row && move.col === col) {
    square.style.backgroundColor = "#90ee90"; // light green
  }
}

      const whiteInCheck = isKingInCheck("white");
        const blackInCheck = isKingInCheck("black");

        if (whiteInCheck && board[row][col] === "K") {
  square.style.backgroundColor = "red";
}

if (blackInCheck && board[row][col] === "k") {
  square.style.backgroundColor = "red";
}

      const piece = board[row][col];
      if (piece !== "") {
        square.textContent = pieces[piece];
      }

      square.addEventListener("click", handleClick);
      boardElement.appendChild(square);
    }
  }
}

//Handle click events for selecting and moving pieces
let currentTurn = "white";

function handleClick(e) {
  // 🔒 Prevent moving when it's not your turn
  if (playerColor && playerColor !== currentTurn) {
    return;
  }

  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);

  if (!selected) {
  const piece = board[row][col];
  if (piece === "") return;

  if (!isCorrectTurn(piece)) return;

  const isWhitePiece = piece === piece.toUpperCase();
const isBlackPiece = piece === piece.toLowerCase();

if (playerColor === "white" && !isWhitePiece) return;
if (playerColor === "black" && !isBlackPiece) return;

  selected = { row, col };

  // 🔥 show possible moves
  possibleMoves = getLegalMoves(row, col);

  renderBoard();
  return;
}

  const piece = board[selected.row][selected.col];

  //move logic
  if (
  isValidMove(piece, selected.row, selected.col, row, col) &&
  !moveLeavesKingInCheck(selected.row, selected.col, row, col)
) {
  const capturedPiece = board[row][col];

if (capturedPiece !== "") {

  if (capturedPiece === capturedPiece.toUpperCase()) {
    capturedWhite.push(capturedPiece);
  } else {
    capturedBlack.push(capturedPiece);
  }

  renderCapturedPieces();
}

  board[row][col] = piece;
  board[selected.row][selected.col] = "";

  // 🔥 ADD THIS (send move to opponent)
  socket.emit("move", {
    roomId: roomId,
    move: {
      fromRow: selected.row,
      fromCol: selected.col,
      toRow: row,
      toCol: col
    }
  });

  // 🔥 ADD THIS
handlePromotion(row, col);

  // Store last move
  lastMove = {
    fromRow: selected.row,
    fromCol: selected.col,
    toRow: row,
    toCol: col
  };

  switchTurn();
  if (playVsComputer && currentTurn === computerColor) {
  setTimeout(makeComputerMove, 500);
}
  checkGameStatus();
}
  selected = null;
  possibleMoves = [];
  renderBoard();
}

//Turn Helper
function isCorrectTurn(piece) {
  if (currentTurn === "white") {
    return piece === piece.toUpperCase();
  } else {
    return piece === piece.toLowerCase();
  }
}

function switchTurn() {
  currentTurn = currentTurn === "white" ? "black" : "white";
  console.log("Turn:", currentTurn);
}

//King code helper
function findKing(color) {
  const king = color === "white" ? "K" : "k";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) {
        return { row: r, col: c };
      }
    }
  }
}

function isKingInCheck(color) {
  const kingPos = findKing(color);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c];
      if (piece === "") continue;

      // Skip same color
      if (color === "white" && piece === piece.toUpperCase()) continue;
      if (color === "black" && piece === piece.toLowerCase()) continue;

      if (isValidMove(piece, r, c, kingPos.row, kingPos.col)) {
        return true;
      }
    }
  }

  return false;
}
// movementValidation
function isValidMove(piece, fromRow, fromCol, toRow, toCol) {

  if (fromRow === toRow && fromCol === toCol) return false;

  const target = board[toRow][toCol];

  // Prevent capturing own piece
  if (target !== "" && isSameColor(piece, target)) return false;

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;

  switch (piece.toLowerCase()) {

    case "p":
      return validatePawn(piece, fromRow, fromCol, toRow, toCol);

    case "r":
      return validateRook(fromRow, fromCol, toRow, toCol);

    case "n":
      return (
        (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
        (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)
      );

    case "b":
      return validateBishop(fromRow, fromCol, toRow, toCol);

    case "q":
      return (
        validateRook(fromRow, fromCol, toRow, toCol) ||
        validateBishop(fromRow, fromCol, toRow, toCol)
      );

    case "k":
      return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;

    default:
      return false;
  }
}

// pawn logic
function validatePawn(piece, fromRow, fromCol, toRow, toCol) {
  const direction = piece === "P" ? -1 : 1;
  const startRow = piece === "P" ? 6 : 1;

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;

  // Move forward 1
  if (colDiff === 0 && rowDiff === direction && board[toRow][toCol] === "")
    return true;

  // Move forward 2 from start
  if (
    colDiff === 0 &&
    fromRow === startRow &&
    rowDiff === 2 * direction &&
    board[toRow][toCol] === ""
  )
    return true;

  // Capture diagonal
  if (
    Math.abs(colDiff) === 1 &&
    rowDiff === direction &&
    board[toRow][toCol] !== ""
  )
    return true;

  return false;
}

//Rock logic
function validateRook(fromRow, fromCol, toRow, toCol) {

  if (fromRow !== toRow && fromCol !== toCol) return false;

  const stepRow = Math.sign(toRow - fromRow);
  const stepCol = Math.sign(toCol - fromCol);

  let r = fromRow + stepRow;
  let c = fromCol + stepCol;

  while (r !== toRow || c !== toCol) {
    if (board[r][c] !== "") return false;
    r += stepRow;
    c += stepCol;
  }

  return true;
}

//Bishop logic
function validateBishop(fromRow, fromCol, toRow, toCol) {

  if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol))
    return false;

  const stepRow = Math.sign(toRow - fromRow);
  const stepCol = Math.sign(toCol - fromCol);

  let r = fromRow + stepRow;
  let c = fromCol + stepCol;

  while (r !== toRow && c !== toCol) {
    if (board[r][c] !== "") return false;
    r += stepRow;
    c += stepCol;
  }

  return true;
}

// Get all legal moves for a piece (used for check detection and move highlighting)
function getLegalMoves(row, col) {

  const piece = board[row][col];
  const moves = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      if (
        isValidMove(piece, row, col, r, c) &&
        !moveLeavesKingInCheck(row, col, r, c)
      ) {
        moves.push({ row: r, col: c });
      }

    }
  }

  return moves;
}

// Check if pieces are the same color
function isSameColor(p1, p2) {
  return (
    (p1 === p1.toUpperCase() && p2 === p2.toUpperCase()) ||
    (p1 === p1.toLowerCase() && p2 === p2.toLowerCase())
  );
}

function moveLeavesKingInCheck(fromRow, fromCol, toRow, toCol) {

  const temp = board[toRow][toCol];
  const piece = board[fromRow][fromCol];

  // simulate move
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = "";

  const color = piece === piece.toUpperCase() ? "white" : "black";

  const inCheck = isKingInCheck(color);

  // undo move
  board[fromRow][fromCol] = piece;
  board[toRow][toCol] = temp;

  return inCheck;
}

// Promote pawn to another piece
//================================================
function handlePromotion(row, col) {
  const piece = board[row][col];

  // White pawn reached top
  if (piece === "P" && row === 0) {
    promotePawn(row, col, "white");
  }

  // Black pawn reached bottom
  if (piece === "p" && row === 7) {
    promotePawn(row, col, "black");
  }
}

//================
// Helper code to promote pawn
function promotePawn(row, col, color) {

  let choice = prompt("Promote to: q, r, b, n");

  if (!choice) return;

  choice = choice.toLowerCase();

  const valid = ["q", "r", "b", "n"];
  if (!valid.includes(choice)) {
    alert("Invalid choice. Promoting to Queen.");
    choice = "q";
  }

  // Make uppercase for white
  board[row][col] =
    color === "white"
      ? choice.toUpperCase()
      : choice.toLowerCase();
}

// Check if current player has any legal moves to avoid stalemate
function hasAnyLegalMoves(color) {

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {

      const piece = board[fromRow][fromCol];
      if (piece === "") continue;

      // Skip opponent pieces
      if (color === "white" && piece !== piece.toUpperCase()) continue;
      if (color === "black" && piece !== piece.toLowerCase()) continue;

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {

          if (
            isValidMove(piece, fromRow, fromCol, toRow, toCol) &&
            !moveLeavesKingInCheck(fromRow, fromCol, toRow, toCol)
          ) {
            return true; // Found at least one legal move
          }

        }
      }
    }
  }

  return false; // No legal moves
}

// Detect checkmate or stalemate after each move
//===============================
function checkGameStatus() {

  const whiteInCheck = isKingInCheck("white");
  const blackInCheck = isKingInCheck("black");

  const whiteHasMoves = hasAnyLegalMoves("white");
  const blackHasMoves = hasAnyLegalMoves("black");

  const status = document.getElementById("status");

  // White checkmate
  if (whiteInCheck && !whiteHasMoves) {
    showWinner("Black");
    return;
  }

  // Black checkmate
  if (blackInCheck && !blackHasMoves) {
    showWinner("White");
    return;
  }

  // Stalemate
  if (!whiteInCheck && !whiteHasMoves) {
    showDraw();
    return;
  }

  if (!blackInCheck && !blackHasMoves) {
    showDraw();
    return;
  }

  // Normal status
  if (whiteInCheck) {
    status.textContent = "White is in CHECK!";
  } else if (blackInCheck) {
    status.textContent = "Black is in CHECK!";
  } else {
    status.textContent = currentTurn.toUpperCase() + " to move";
  }
}

//==============
//Disable board after game ends
function disableBoard() {
  const squares = document.querySelectorAll(".square");
  squares.forEach(square => {
    square.removeEventListener("click", handleClick);
  });
}


// Show winner message
function showWinner(winnerColor) {

  const status = document.getElementById("status");
  status.textContent = "CHECKMATE! " + winnerColor + " Wins! ♟️🏆";

  disableBoard();

  document.getElementById("restartBtn").style.display = "inline-block";
}

// Show draw message
function showDraw() {
  const status = document.getElementById("status");
  status.textContent = "STALEMATE! It's a Draw 🤝";

  disableBoard();
  document.getElementById("restartBtn").style.display = "inline-block";
}

document.getElementById("restartBtn").addEventListener("click", () => {
  location.reload();
});

function disableGameButtons() {
  const buttons = document.querySelectorAll(".game-btn");
  buttons.forEach(btn => btn.disabled = true);
}

// ===============================
// for knowing captured pieces
function renderCapturedPieces(){

  const whiteBox = document.getElementById("capturedWhite");
  const blackBox = document.getElementById("capturedBlack");

  whiteBox.innerHTML = "";
  blackBox.innerHTML = "";

  capturedWhite.forEach(p=>{
    const span = document.createElement("span");
    span.textContent = pieces[p];
    whiteBox.appendChild(span);
  });

  capturedBlack.forEach(p=>{
    const span = document.createElement("span");
    span.textContent = pieces[p];
    blackBox.appendChild(span);
  });

}

renderBoard();