const chessBoard = document.getElementById("chessboard"); //lay phan tu tu id chessBoard
let selectedPiece = null; //ban dau ko quan co nao duoc chon
let validMoves = []; //Mang luu giu nhung nuoc di hop le cua cac quan
let piecesBlack = ["♜", "♞", "♝", "♛", "♚", "♟"];
let piecesWhite = ["♖", "♘", "♗", "♕", "♔", "♙"];
let currentTurn = "white";
let defeatedWhitePiece = [];
let defeatedBlackPiece = [];
const board = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"], // Hàng 1 (đen)
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"], // Hàng 2 (đen)
  ["", "", "", "", "", "", "", ""], // Hàng 3
  ["", "", "", "", "", "", "", ""], // Hàng 4
  ["", "", "", "", "", "", "", ""], // Hàng 5
  ["", "", "", "", "", "", "", ""], // Hàng 6
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"], // Hàng 7 (trắng)
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"], // Hàng 8 (trắng)
];

// Ham ve ban co
function displayBoard() {
  // Xoa ban co
  chessBoard.innerHTML = "";
  // Ve ban co
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const square = document.createElement("div");
      square.classList.add("square");
      if ((x + y) % 2 == 0) {
        square.classList.add("white");
      } else {
        square.classList.add("black");
      }

      let piece = document.createElement("div");
      piece.innerText = board[x][y];
      piece.classList.add("piece");
      piece.setAttribute("draggable", true);

      // Luu du lieu x y vao dataset
      square.dataset.x = x;
      square.dataset.y = y;
      // O duoc chon phat sang
      // Bonus -- selectedPiece de hieu quan co nao dang duoc chon, tiep theo.x .y kiem tra xem vi tri quan co do
      // co trung voi vi tri tren o co hay khong
      if (selectedPiece && selectedPiece.x == x && selectedPiece.y == y) {
        square.classList.add("selectedSquare");
      }
      // some kiem tra xem mang co thoa dieu kien ( [x] = x, [y] = y) hay khong
      if (validMoves.some((move) => move[0] == x && move[1] == y)) {
        // Hien thi mau khi huong di chuyen hop le
        square.classList.add("highlight");
        if (board[x][y] != "") {
          square.classList.add("highlightPiece");
        }
      }
      // Hien thi luot ben nao ro rang hon
      if (
        (board[x][y] != "" &&
          pieceWhite(board[x][y]) &&
          currentTurn == "white") ||
        (pieceBlack(board[x][y]) && currentTurn == "black")
      ) {
        square.classList.add("current-Turn");
      }
      // Khi click vao o se thuc hien ham pressSquare
      square.addEventListener("click", pressSquare);
      square.appendChild(piece);

      dragAndDropPiece();
      // Hien thi square tren ban co chessBoard
      chessBoard.appendChild(square);
    }
  }
}
// Goi ham thuc hien
displayBoard();

// Ham kiem tra mau quan
function pieceWhite(piece) {
  return piecesWhite.includes(piece);
}
function pieceBlack(piece) {
  return piecesBlack.includes(piece);
}

// Ham xu ly khi nhan vao o -- truyen tham so event
function pressSquare(event) {
  const square = event.currentTarget;
  // Vi tri cua o co, cho minh biet la o co nao dang duoc chon
  const x = parseInt(square.dataset.x);
  const y = parseInt(square.dataset.y);
  // Click lai vao quan do se remove highlight
  if (selectedPiece && selectedPiece.x === x && selectedPiece.y === y) {
    selectedPiece = null;
    validMoves = [];
    removeHighlight();
    displayBoard();
    return;
  }
  // Khi nhap vao quan
  if (selectedPiece) {
    // Kiem tra o muon di co nam trong mang chua nuoc di hop le cua quan do khong
    if (validMoves.some((move) => move[0] == x && move[1] == y)) {
      //Kiem tra quan nao bi an thi day vao mang
      if (board[x][y] != "") {
        if (selectedPiece.piece && pieceWhite(board[x][y])) {
          defeatedWhitePiece.push(board[x][y]); // Trang bi an va day vao mang trang
        }
        if (selectedPiece.piece && pieceBlack(board[x][y])) {
          defeatedBlackPiece.push(board[x][y]); // Den bi an va day vao mang den
        }
      }
      // Di chuyen quan co toi vi tri moi
      board[x][y] = selectedPiece.piece;
      // Xoa quan co o vi tri cu
      board[selectedPiece.x][selectedPiece.y] = "";
      // Neu tot xuong hang cuoi cung cua doi phuong thi thuc hien ham phong cap
      if (selectedPiece.piece == "♟" && x == 7) {
        board[x][y] = choosePiece("black");
      } else if (selectedPiece.piece == "♙" && x == 0) {
        board[x][y] = choosePiece("white");
      }
      // Tra lai chua chon quan nao
      selectedPiece = null;
      // Xoa nuoc di hop le cua quan do trong mang
      validMoves = [];
      //Doi luot luan phien
      if (currentTurn == "white") {
        currentTurn = "black";
      } else {
        currentTurn = "white";
      }
      // Cap nhat lai ban co
      displayBoard();
      //
      highlightAndMessage();
      // Cap nhat quan bi an
      defeatedpieces();
      return;
    }
  }
  // Neu ban co co quan
  // Kiem tra ban co co quan hay khong
  if (board[x][y] !== "") {
    // Kiem tra mau quan theo luot choi
    if (
      (pieceWhite(board[x][y]) && currentTurn == "white") ||
      (pieceBlack(board[x][y]) && currentTurn == "black")
    ) {
      // Luu vi tri x y va quan co cho bien selectedPiece
      selectedPiece = { x, y, piece: board[x][y] };
      // Goi ham getValidMoves, sau do gan gia tri cua quan co (vi tri, loai quan) sau go gan cho mang validMoves
      validMoves = getValidMoves(
        selectedPiece.x,
        selectedPiece.y,
        selectedPiece.piece
      );
      if (selectedPiece.piece == "♔" || selectedPiece.piece == "♚") {
        const pieceAttack = pieceAttackKing(
          selectedPiece.x,
          selectedPiece.y,
          selectedPiece.piece
        );
        validMoves = safeKing(validMoves, pieceAttack);
      }
    }
  } else {
    // De huy chon quan do di chuyen, click vao o trong de huy
    // Tra ve chua chon quan nao
    selectedPiece = null;
    // Xoa cac nuoc di hop le cua mang
    validMoves = [];
  }
  displayBoard();
}
// Ham xu ly di chuyen quan
function getValidMoves(x, y, piece) {
  const moves = [];
  // Quân xe
  if (piece == "♜" || piece == "♖") {
    for (let i = x + 1; i < 8; i++) {
      if (board[i][y] != "") {
        //Quan den va quan trang --- Quan trang va quan den
        if (
          (pieceBlack(piece) && pieceWhite(board[i][y])) ||
          (pieceWhite(piece) && pieceBlack(board[i][y]))
        ) {
          moves.push([i, y]);
        }
        break;
      } else {
        moves.push([i, y]);
      }
    }
    for (let i = x - 1; i >= 0; i--) {
      if (board[i][y] != "") {
        if (
          (pieceBlack(piece) && pieceWhite(board[i][y])) ||
          (pieceWhite(piece) && pieceBlack(board[i][y]))
        ) {
          moves.push([i, y]);
        }
        break;
      } else {
        moves.push([i, y]);
      }
    }
    for (let i = y + 1; i < 8; i++) {
      if (board[x][i] != "") {
        if (
          (pieceWhite(piece) && pieceBlack(board[x][i])) ||
          (pieceBlack(piece) && pieceWhite(board[x][i]))
        ) {
          moves.push([x, i]);
        }
        break;
      } else {
        moves.push([x, i]);
      }
    }
    for (let i = y - 1; i >= 0; i--) {
      if (board[x][i] != "") {
        if (
          (pieceWhite(piece) && pieceBlack(board[x][i])) ||
          (pieceBlack(piece) && pieceWhite(board[x][i]))
        ) {
          moves.push([x, i]);
        }
        break;
      } else {
        moves.push([x, i]);
      }
    }
  }
  // Quân mã
  else if (piece == "♞" || piece == "♘") {
    const horse = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, -2],
      [-1, -2],
      [1, 2],
      [-1, 2],
    ];
    for (const [hx, hy] of horse) {
      const nx = x + hx,
        ny = y + hy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        if (board[nx][ny] == "") {
          moves.push([nx, ny]);
        } else {
          if (
            (pieceBlack(piece) && pieceWhite(board[nx][ny])) ||
            (pieceWhite(piece) && pieceBlack(board[nx][ny]))
          ) {
            moves.push([nx, ny]);
          }
        }
      }
    }
  }

  // Quan tuong
  else if (piece == "♝" || piece == "♗") {
    for (let i = 1; i < 8; i++) {
      if (x + i < 8 && y + i < 8) {
        if (board[x + i][y + i] != "") {
          if (
            (pieceBlack(piece) && pieceWhite(board[x + i][y + i])) ||
            (pieceWhite(piece) && pieceBlack(board[x + i][y + i]))
          ) {
            moves.push([x + i, y + i]);
          }
          break;
        } else {
          moves.push([x + i, y + i]);
        }
      }
    }
    for (let i = 1; i < 8; i++) {
      if (x + i < 8 && y - i >= 0) {
        if (board[x + i][y - i] != "") {
          if (
            (pieceBlack(piece) && pieceWhite(board[x + i][y - i])) ||
            (pieceWhite(piece) && pieceBlack(board[x + i][y - i]))
          ) {
            moves.push([x + i, y - i]);
          }
          break;
        } else {
          moves.push([x + i, y - i]);
        }
      }
    }
    for (let i = 1; i < 8; i++) {
      if (x - i >= 0 && y + i < 8) {
        if (board[x - i][y + i] != "") {
          if (
            (pieceBlack(piece) && pieceWhite(board[x - i][y + i])) ||
            (pieceWhite(piece) && pieceBlack(board[x - i][y + i]))
          ) {
            moves.push([x - i, y + i]);
          }
          break;
        } else {
          moves.push([x - i, y + i]);
        }
      }
    }
    for (let i = 1; i < 8; i++) {
      if (x - i >= 0 && y - i >= 0) {
        if (board[x - i][y - i] != "") {
          if (
            (pieceWhite(piece) && pieceBlack(board[x - i][y - i])) ||
            (pieceBlack(piece) && pieceWhite(board[x - i][y - i]))
          ) {
            moves.push([x - i, y - i]);
          }
          break;
        } else {
          moves.push([x - i, y - i]);
        }
      }
    }
  }
  // Quan hau
  else if (piece == "♛") {
    moves.push(...getValidMoves(x, y, "♜"));
    moves.push(...getValidMoves(x, y, "♝"));
  } else if (piece == "♕") {
    moves.push(...getValidMoves(x, y, "♖"));
    moves.push(...getValidMoves(x, y, "♗"));
  }
  // Quan vua
  else if (piece == "♚" || piece == "♔") {
    const king = [
      [1, 0],
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 1],
      [-1, -1],
      [-1, 1],
    ];
    for (const [kx, ky] of king) {
      const hx = x + kx,
        hy = y + ky;
      if (hx >= 0 && hx < 8 && hy >= 0 && hy < 8) {
        if (board[hx][hy] == "") {
          moves.push([hx, hy]);
        } else {
          if (
            (pieceWhite(piece) && pieceBlack(board[hx][hy])) ||
            (pieceBlack(piece) && pieceWhite(board[hx][hy]))
          ) {
            moves.push([hx, hy]);
          }
        }
      }
    }
  }
  // Quan tot den
  else if (piece == "♟") {
    if (x + 1 < 8) {
      if (board[x + 1][y + 1] != "") {
        if (pieceBlack(piece) && pieceWhite(board[x + 1][y + 1])) {
          moves.push([x + 1, y + 1]);
        }
      }
      if (board[x + 1][y - 1] != "") {
        if (pieceBlack(piece) && pieceWhite(board[x + 1][y - 1])) {
          moves.push([x + 1, y - 1]);
        }
      }
      if (board[x + 1][y] != "") {
        if (pieceBlack(piece) && pieceWhite(board[x + 1][y])) {
        }
      } else {
        moves.push([x + 1, y]);
        if (x == 1 && board[x + 2][y] == "") {
          moves.push([x + 2, y]);
        }
      }
    }
  }
  // Quan tot trang
  else if (piece == "♙") {
    if (x - 1 >= 0) {
      if (board[x - 1][y - 1] != "") {
        if (pieceWhite(piece) && pieceBlack(board[x - 1][y - 1])) {
          moves.push([x - 1, y - 1]);
        }
      }
      if (board[x - 1][y + 1] != "") {
        if (pieceWhite(piece) && pieceBlack(board[x - 1][y + 1])) {
          moves.push([x - 1, y + 1]);
        }
      }
      if (board[x - 1][y] != "") {
        if (pieceWhite(piece) && pieceBlack(board[x - 1][y])) {
        }
      } else {
        moves.push([x - 1, y]);
        if (x == 6 && board[x - 2][y] == "") {
          moves.push([x - 2, y]);
        }
      }
    }
  }
  return moves;
}
//Ham xu ly phong cap cho tot khi tot den hang cuoi cung cua doi phuong
function choosePiece(color) {
  const choose = prompt("Nhap (x:xe, m:ma, h:hau, t:tuong) de phong cap");
  switch (choose) {
    case "h":
      return color == "black" ? "♛" : "♕";
    case "x":
      return color == "black" ? "♜" : "♖";
    case "m":
      return color == "black" ? "♞" : "♘";
    case "t":
      return color == "black" ? "♝" : "♗";
    default:
      return color == "black" ? "♛" : "♕";
  }
}
//Ham hien thi quan
function defeatedpieces() {
  // Thay the noi dung cua id do thanh noi dung sau dau "="
  document.getElementById("defeatedWhitePiece").innerText =
    "Trắng bị ăn: " + defeatedWhitePiece.join(" ");
  document.getElementById("defeatedBlackPiece").innerText =
    "Đen bị ăn: " + defeatedBlackPiece.join(" ");
}

// Ham xu ly keo tha quan
function dragAndDropPiece() {
  const pieces = document.querySelectorAll(".piece");
  const squares = document.querySelectorAll(".square");

  pieces.forEach((piece) => {
    // Bat dau keo
    piece.addEventListener("dragstart", (e) => {
      // Khi doi quan khac se khong con hien highlight cu cua quan truoc
      removeHighlight();
      // parentElement la the cha, tuc la the div.square
      const divSquare = piece.parentElement;
      const x = parseInt(divSquare.dataset.x);
      const y = parseInt(divSquare.dataset.y);

      // Dung luot thi moi duoc keo
      if (
        (pieceWhite(piece.innerText) && currentTurn === "white") ||
        (pieceBlack(piece.innerText) && currentTurn === "black")
      ) {
        selectedPiece = { x, y, piece: piece.innerText };
        validMoves = getValidMoves(
          selectedPiece.x,
          selectedPiece.y,
          selectedPiece.piece
        );

        // Kiem tra quan co va vi tri quan co co trung voi vi tri cua o vuong khong
        if (selectedPiece && selectedPiece.x == x && selectedPiece.y == y) {
          //Them highlight cho o chua quan duoc chon
          const currentSquare = document.querySelector(
            `.square[data-x="${x}"][data-y="${y}"]`
          );
          currentSquare.classList.add("selectedSquare");
        }
        if (selectedPiece.piece == "♚" || selectedPiece.piece == "♔") {
          const pieceAttack = pieceAttackKing(
            selectedPiece.x,
            selectedPiece.y,
            selectedPiece.piece
          );
          validMoves = safeKing(validMoves, pieceAttack);
        }

        // Highlight mau o
        validMoves.forEach(([mx, my]) => {
          // bien targetSquare luu giu vi tri o nuoc di hop ly cua quan
          const targetSquare = document.querySelector(
            `.square[data-x="${mx}"][data-y="${my}"]`
          );

          if (targetSquare) {
            const targetPiece = board[mx][my];
            if (
              (pieceWhite(selectedPiece.piece) && pieceBlack(targetPiece)) ||
              (pieceBlack(selectedPiece.piece) && pieceWhite(targetPiece))
            ) {
              targetSquare.classList.add("highlightPiece");
            } else {
              targetSquare.classList.add("highlight");
            }
          }
        });
        // preventDefault() trong ngu canh nay de chan hanh vi cua trinh duyet -- khong duoc keo di chua toi luot
      } else {
        e.preventDefault();
      }
    });
  });
  squares.forEach((square) => {
    // O vuong cho phep nhan quan co dang duoc keo tha
    square.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    // Xu ly su kien khi drop vao dragover
    square.addEventListener("drop", (e) => {
      const x = parseInt(square.dataset.x);
      const y = parseInt(square.dataset.y);

      if (
        selectedPiece &&
        validMoves.some((move) => move[0] == x && move[1] == y)
      ) {
        // An quan va day quan vao mang chua quan bi an
        if (board[x][y] !== "") {
          if (pieceWhite(board[x][y])) {
            defeatedWhitePiece.push(board[x][y]);
          } else if (pieceBlack(board[x][y])) {
            defeatedBlackPiece.push(board[x][y]);
          }
        }

        board[x][y] = selectedPiece.piece;
        board[selectedPiece.x][selectedPiece.y] = "";

        // Phong cap cho tot khi den cuoi hang cua doi dich
        if (selectedPiece.piece == "♟" && x == 7) {
          board[x][y] = choosePiece("black");
        } else if (selectedPiece.piece == "♙" && x == 0) {
          board[x][y] = choosePiece("white");
        }

        selectedPiece = null;
        validMoves = [];

        if (currentTurn == "white") {
          currentTurn = "black";
        } else {
          currentTurn = "white";
        }

        displayBoard();
        highlightAndMessage();
        defeatedpieces();
      }
    });
  });
}
// Ham xoa highlight sau khi da keo quan
function removeHighlight() {
  const squares = document.querySelectorAll(".square");
  squares.forEach((square) => {
    square.classList.remove("highlight");
    square.classList.remove("highlightPiece");
    square.classList.remove("selectedSquare");
  });
}

//Ham xu ly nuoc di an toan cho vua, vua bi chieu se tu dong xoa nuoc di nam tren huong tan cong cua quan dich
// has chi duoc su dung ben khi co Set
function safeKing(validMoves, pieceAttack) {
  // **filter duyet tung phan tu trong mang, giu lai [x,y] neu callback tra ve true, false se xoa di
  const attackedSquares = new Set(pieceAttack);
  // Loc nuoc di hop le cua vua, neu vua va quan dich co cung nuoc di thi loai nuoc di do
  const safeMoves = validMoves.filter(([x, y]) => {
    return !attackedSquares.has(`${x}-${y}`);
  });
  return safeMoves;
}
//Ham tra ve mang chua danh sach nuoc di hop le cua quan tan cong
function pieceAttackKing(x, y, pieceKing) {
  //Mang luu vi tri va quan tan cong
  // **Set tuong tu nhu Array nhung khong co tinh trung lap
  const attackSquare = new Set();
  const pieceIsWhite = pieceWhite(pieceKing);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];

      if (piece && (pieceIsWhite ? pieceBlack(piece) : pieceWhite(piece))) {
        const moves = getValidMoves(i, j, piece);
        // Vua khong nam tren duong chieu -- vua se ko di vao duong tan cong cua quan dich
        for (let move of moves) {
          attackSquare.add(`${move[0]}-${move[1]}`);
        }
        // ♙   ♟
        if (piece == "♙") {
          const pxLeftTop = i - 1;
          const pyLeftTop = j - 1;

          if (
            pxLeftTop >= 0 &&
            pxLeftTop < 8 &&
            pyLeftTop >= 0 &&
            pyLeftTop < 8
          ) {
            attackSquare.add(`${pxLeftTop}-${pyLeftTop}`);
          }
          const pxRightTop = i - 1;
          const pyRightTop = j + 1;
          if (
            pxRightTop >= 0 &&
            pxRightTop < 8 &&
            pyRightTop >= 0 &&
            pyRightTop < 8
          ) {
            attackSquare.add(`${pxRightTop}-${pyRightTop}`);
          }
          if (board[i - 1][j] == "" && i - 1 >= 0) {
            attackSquare.delete(`${i - 1}-${j}`);
          }
        }

        if (piece == "♟") {
          const pxLeftBottom = i + 1;
          const pyLeftBottom = j - 1;

          if (
            pxLeftBottom >= 0 &&
            pxLeftBottom < 8 &&
            pyLeftBottom >= 0 &&
            pyLeftBottom < 8
          ) {
            attackSquare.add(`${pxLeftBottom}-${pyLeftBottom}`);
          }
          const pxRightBottom = i + 1;
          const pyRightBottom = j + 1;
          if (
            pxRightBottom >= 0 &&
            pxRightBottom < 8 &&
            pyRightBottom >= 0 &&
            pyRightBottom < 8
          ) {
            attackSquare.add(`${pxRightBottom}-${pyRightBottom}`);
          }
          if (board[i + 1][j] == "" && i + 1 < 8) {
            attackSquare.delete(`${i + 1}-${j}`);
          }
        }
        // Vua nam tren duong chieu
        if (moves.some(([mi, mj]) => mi == x && mj == y)) {
          const dx = Math.sign(x - i);
          const dy = Math.sign(y - j);
          let kx = x + dx;
          let ky = y + dy;
          if (kx >= 0 && kx < 8 && ky >= 0 && ky < 8 && board[kx][ky] == "") {
            attackSquare.add(`${kx}-${ky}`);
          }
        }
      }
    }
  }
  // Dung Array.from de tra ve dang Array vi getValidMoves dang xu ly la Array
  return Array.from(attackSquare);
}
// Ham highlight va hien thi thong bao khi vua bi chieu
function highlightAndMessage() {
  // Ham remove highlight va thong bao
  const allSquares = document.querySelectorAll(".square");
  allSquares.forEach((square) =>
    square.classList.remove("highlightKingInCheck")
  );
  const messageCancel = document.querySelectorAll(".check-message");
  messageCancel.forEach((mS) => {
    mS.textContent = "";
    mS.style.visibility = "hidden";
  });

  // Highlight va hien thi thong bao chieu
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const king = board[i][j];
      // const kingPosition = [i, j];
      if (
        (king == "♚" && currentTurn == "black") ||
        (king == "♔" && currentTurn == "white")
      ) {
        const attackSquares = pieceAttackKing(i, j, king);
        if (attackSquares.includes(`${i}-${j}`)) {
          const square = document.querySelector(
            `.square[data-x="${i}"][data-y="${j}"]`
          );
          square.classList.add("highlightKingInCheck");
          if (pieceBlack(king)) {
            const messageBlack = document.querySelector(
              ".check-message.blackKing"
            );
            messageBlack.textContent = "Vua đen bị chiếu";
            messageBlack.style.visibility = "visible";
          } else {
            const messageWhite = document.querySelector(
              ".check-message.whiteKing"
            );
            messageWhite.textContent = "Vua trắng bị chiếu";
            messageWhite.style.visibility = "visible";
          }
        }
      }
    }
  }
}

// Them tinh nang chieu bi va neu co 2 quan chieu tren cung duong thi ngan ko cho vua an quan do

