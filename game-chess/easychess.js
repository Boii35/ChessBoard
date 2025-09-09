// Client
let token = localStorage.getItem("token") || null;
let roomId = localStorage.getItem("roomId") || null;
let myColor = null;
let socket = null;
window.onload = function () {
  document.getElementById("registerBtn").onclick = register;
  document.getElementById("loginBtn").onclick = login;
  document.getElementById("createRoomBtn").onclick = createRoom;
  document.getElementById("joinRoomBtn").onclick = joinRoom;
  document.getElementById("showHistoryBtn").onclick = showHistory;

  // if (token) {
  //   showView("roomContainer");
  // } else {
  //   showView("loginContainer");
  // }
};

//Ham an/hien view giao dien
function showView(view) {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("roomContainer").style.display = "none";
  document.getElementById("chessContainer").style.display = "none";

  const viewToShow = document.getElementById(view);
  if (viewToShow) {
    if (view === "chessContainer") {
      viewToShow.style.display = "block";
    } else {
      viewToShow.style.display = "block";
    }
  }
}

//Ham xu ly dang ky hien thi cho nguoi dung
function register() {
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;
  const message = document.getElementById("regMessage");
  fetch("http://localhost:4000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      message.textContent = data.message;
      if (data.message === "Dang ky thanh cong") {
        message.style.color = "green";
        setTimeout(() => {
          document.getElementById("registerForm").style.display = "none";
          document.getElementById("loginForm").style.display = "block";
        }, 1000);
      } else {
        message.style.color = "red";
      }
    })
    .catch((error) => {
      console.log("Register Error:", error);
      message.textContent = "Server error";
      message.style.color = "red";
    });
}

//Ham xu ly dang nhap hien thi cho nguoi dung
function login() {
  const username = document.getElementById("logUsername").value;
  const password = document.getElementById("logPassword").value;
  const message = document.getElementById("logMessage");

  fetch("http://localhost:4000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      message.textContent = data.message;
      if (data.token && data.message === "Dang nhap thanh cong") {
        token = data.token;
        localStorage.setItem("token", token);
        message.style.color = "green";

        showView("roomContainer");
      } else {
        message.style.color = "red";
      }
    })
    .catch((error) => {
      console.log("Server Error:", error);
      message.textContent = "Server Error";
      message.style.color = "red";
    });
}

const roomArea = document.getElementById("roomArea");

//Ham xu ly tao phong
function createRoom() {
  fetch("http://localhost:4000/create-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.roomId && data.message === "Phong da duoc tao") {
        roomArea.innerHTML = `<p>Room created successfully! Your room ID: ${data.roomId}</p>`;
        waitForOpponent(data.roomId);
      } else {
        roomArea.innerHTML = `<p>Error: ${data.message}</p>`;
      }
    });
}

//Ham xu ly tham gia phong
function joinRoom() {
  roomArea.innerHTML = `
  <input type="text" id="joinRoomId" placeholder = "Nhap ma phong"/>
  <button id="confirmRoom">Vao phong</button>
  <div id="joinMessage"></div>
  `;
  const message = document.getElementById("joinMessage");
  const confirmRoom = document.getElementById("confirmRoom");
  confirmRoom.onclick = async () => {
    const needCheckRoomId = document.getElementById("joinRoomId").value.trim();

    fetch("http://localhost:4000/join-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId: needCheckRoomId }),
    })
      .then((response) => response.json())
      .then((data) => {
        message.textContent = data.message;
        if (data.roomId && data.message === "Tham gia phong thanh cong") {
          message.style.color = "green";
          waitForOpponent(data.roomId);
        } else {
          message.style.color = "red";
        }
      });
  };
}
// Ham xu ly du lieu bat dau choi game thong qua WebSocket
function waitForOpponent(newRoomId) {
  roomId = newRoomId;
  localStorage.setItem("roomId", roomId);

  socket = new WebSocket("ws://localhost:4000");

  socket.onopen = () => {
    console.log("Websocket connected from room view");
    socket.send(JSON.stringify({ type: "auth", token, roomId }));
  };
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "waiting") {
      roomArea.innerHTML = `<p>Room ID: ${roomId}</p>
      <p>Dang cho nguoi choi khac tham gia...</p>`;
    }
    if (msg.type === "start") {
      myColor = msg.color;
      roomArea.innerHTML = `<p>Da tim thay nguoi choi</p><p>Dang chuyen sang giao dien ban co...</p>`;
      setTimeout(() => {
        showView("chessContainer");
        initGame();
      }, 2000);
    }
  };
  socket.onerror = (error) => {
    console.log("WebSocket error:", error);
    roomArea.innerHTML = `<p style = "color:red">Loi ket noi WebSocket.</p>`;
  };
}

function initGame() {
  displayBoard();
  alert("Ban choi quan " + (myColor === "white" ? "trang" : "den"));

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "move") {
      const { fromX, fromY, toX, toY, piece } = data;
      board[fromX][fromY] = "";
      board[toX][toY] = piece;
      currentTurn = myColor;
      displayBoard();
      defeatedpieces();
      highlightAndMessage();
    }
    if (data.type === "defeatedPiece") {
      if (data.color === "white") {
        defeatedWhitePiece.push(data.piece);
      } else {
        defeatedBlackPiece.push(data.piece);
      }
      defeatedpieces();
    }
    if (data.type === "end") {
      alert("Doi thu da roi di. Ban la nguoi thang!");
      showView("roomContainer");
    }
  };
}

function showHistory() {
  const historyArea = document.getElementById("historyArea");

  fetch("http://localhost:4000/match-history", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((matches) => {
      if (matches.length === 0) {
        historyArea.innerHTML = "<p>Khong co lich su dau nao.</p>";
        return;
      }
      const myUsername = JSON.parse(atob(token.split(".")[1])).username;
      let html = "<ul>";
      matches.forEach((match) => {
        const opponent = match.players.find((p) => p !== myUsername);
        const result = match.winner === myUsername ? "Thắng" : "Thua";
        const durationMinutes = Math.floor(match.durationInSeconds / 60);
        const durationSeconds = match.durationInSeconds % 60;
        const matchDate = new Date(match.endTime).toLocaleString("vi-VN");

        html += `
      <li>
        <strong>Đối thủ:</strong> ${opponent} <br>
        <strong>Kết quả:</strong> ${result} <br>
        <strong>Thời gian:</strong> ${durationMinutes} phút ${durationSeconds} giây <br>
        <strong>Ngày giờ:</strong> ${matchDate} <br>
        <strong>Lý do kết thúc:</strong> ${
          match.reasonForEnd || "Không rõ"
        } <br>
      </li>`;
      });
      html += "</ul>";
      historyArea.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error fetching history:", error);
      historyArea.innerHTML = "<p>Loi khi lay lich su dau.</p>";
    });
}

// if (!token || !roomId) {
//   console.log("Token not found, redirecting to login");
//   window.location.replace("http://localhost:4000/interface/user.html");
// }
// let socket = new WebSocket("ws://localhost:4000");
// window.gameSocket = socket;

// socket.onopen = () => {
//   console.log("Websocket opend");
//   socket.send(JSON.stringify({ type: "auth", token, roomId }));
//   console.log("Auth sent with token:", token);
// };

// socket.addEventListener("message", (event) => {
//   const data = JSON.parse(event.data);
//   if (data.type == "start") {
//     myColor = data.color;
//     alert("Ban choi quan " + (myColor == "white" ? "trang" : "den"));
//     socket.send(JSON.stringify({ type: "done", token, roomId }));
//   }
//   if (data.type == "play") {
//     displayBoard();
//   }

//   if (data.type == "move") {
//     const { fromX, fromY, toX, toY, piece } = data;

//     board[toX][toY] = piece;
//     board[fromX][fromY] = "";
//     currentTurn = myColor;
//     displayBoard();
//     defeatedpieces();
//     highlightAndMessage();
//   }

//   if (data.type == "defeatedPiece") {
//     if (data.color == "white") {
//       defeatedWhitePiece.push(data.piece);
//     } else {
//       defeatedBlackPiece.push(data.piece);
//     }
//     defeatedpieces();
//   }

//   if (data.type == "end") {
//     alert("Doi thu da roi di");
//   }
// });

// --------

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
  if (myColor != currentTurn) {
    return;
  }
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
      let pieceEaten = "";
      //Kiem tra quan nao bi an thi day vao mang
      if (board[x][y] != "") {
        pieceEaten = board[x][y];
        if (pieceWhite(board[x][y])) {
          defeatedWhitePiece.push(board[x][y]); // Trang bi an va day vao mang trang
        }
        if (pieceBlack(board[x][y])) {
          defeatedBlackPiece.push(board[x][y]); // Den bi an va day vao mang den
        }
      }
      const fromX = selectedPiece.x;
      const fromY = selectedPiece.y;
      // Di chuyen quan co toi vi tri moi
      board[x][y] = selectedPiece.piece;
      // Xoa quan co o vi tri cu
      board[fromX][fromY] = "";
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

      if (socket.readyState == WebSocket.OPEN && myColor) {
        socket.send(
          JSON.stringify({
            type: "move",
            fromX,
            fromY,
            toX: x,
            toY: y,
            piece: board[x][y],
          })
        );
      }
      if (pieceEaten != "") {
        let defeatedPieceColor = "";
        if (pieceWhite(pieceEaten)) {
          defeatedPieceColor = "white";
        } else if (pieceBlack(pieceEaten)) {
          defeatedPieceColor = "black";
        }
        socket.send(
          JSON.stringify({
            type: "defeatedPiece",
            piece: pieceEaten,
            color: defeatedPieceColor,
          })
        );
      }
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
      checkmate();
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
      const kingPosition = findKing(currentTurn);
      if (!kingPosition) return;

      const king = board[kingPosition.x][kingPosition.y];

      // Luu vi tri x y va quan co cho bien selectedPiece
      selectedPiece = { x, y, piece: board[x][y] };
      // Goi ham getValidMoves, sau do gan gia tri cua quan co (vi tri, loai quan) sau go gan cho mang validMoves
      let trueMoves = getValidMoves(
        selectedPiece.x,
        selectedPiece.y,
        selectedPiece.piece
      );

      validMoves = trueMoves.filter(([toX, toY]) => {
        return safeKingMoves(
          selectedPiece.x,
          selectedPiece.y,
          toX,
          toY,
          currentTurn
        );
      });

      displayBoard();
      highlightAndMessage();
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
function getValidMoves(x, y, piece, forAttack = false) {
  const moves = [];
  // Quân xe
  if (piece == "♜" || piece == "♖") {
    for (let i = x + 1; i < 8; i++) {
      if (board[i][y] != "") {
        //Quan den va quan trang --- Quan trang va quan den
        if (
          (pieceBlack(piece) && pieceWhite(board[i][y])) ||
          (pieceWhite(piece) && pieceBlack(board[i][y])) ||
          (forAttack && whichPieceKing(piece))
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
          (pieceWhite(piece) && pieceBlack(board[i][y])) ||
          (forAttack && whichPieceKing(piece))
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
          (pieceBlack(piece) && pieceWhite(board[x][i])) ||
          (forAttack && whichPieceKing(piece))
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
          (pieceBlack(piece) && pieceWhite(board[x][i])) ||
          (forAttack && whichPieceKing(piece))
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
            (pieceWhite(piece) && pieceBlack(board[x + i][y + i])) ||
            (forAttack && whichPieceKing(piece))
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
            (pieceWhite(piece) && pieceBlack(board[x + i][y - i])) ||
            (forAttack && whichPieceKing(piece))
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
            (pieceWhite(piece) && pieceBlack(board[x - i][y + i])) ||
            (forAttack && whichPieceKing(piece))
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
            (pieceBlack(piece) && pieceWhite(board[x - i][y - i])) ||
            (forAttack && whichPieceKing(piece))
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
    moves.push(...getValidMoves(x, y, "♜", forAttack));
    moves.push(...getValidMoves(x, y, "♝", forAttack));
  } else if (piece == "♕") {
    moves.push(...getValidMoves(x, y, "♖", forAttack));
    moves.push(...getValidMoves(x, y, "♗", forAttack));
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
      const hx = x + kx;
      const hy = y + ky;
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
        (myColor == "white" &&
          pieceWhite(piece.innerText) &&
          currentTurn === "white") ||
        (myColor == "black" &&
          pieceBlack(piece.innerText) &&
          currentTurn === "black")
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
          const kingMoves = getValidMoves(
            selectedPiece.x,
            selectedPiece.y,
            selectedPiece.piece
          );
          // validMoves = safeKingMoves(validMoves, pieceAttack);
          validMoves = kingMoves.filter(([kx, ky]) => {
            return safeKingMoves(
              selectedPiece.x,
              selectedPiece.y,
              kx,
              ky,
              currentTurn
            );
          });
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
              (myColor == "white" &&
                pieceWhite(selectedPiece.piece) &&
                pieceBlack(targetPiece)) ||
              (myColor == "black" &&
                pieceBlack(selectedPiece.piece) &&
                pieceWhite(targetPiece))
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
      if (myColor != currentTurn) {
        return;
      }
      const x = parseInt(square.dataset.x);
      const y = parseInt(square.dataset.y);

      if (
        selectedPiece &&
        validMoves.some((move) => move[0] == x && move[1] == y)
      ) {
        let pieceEaten = "";
        // An quan va day quan vao mang chua quan bi an
        if (board[x][y] !== "") {
          let pieceEaten = board[x][y];
          if (pieceWhite(board[x][y])) {
            defeatedWhitePiece.push(board[x][y]);
          } else if (pieceBlack(board[x][y])) {
            defeatedBlackPiece.push(board[x][y]);
          }
        }
        const fromX = selectedPiece.x;
        const fromY = selectedPiece.y;
        board[x][y] = selectedPiece.piece;
        board[fromX][fromY] = "";

        // Phong cap cho tot khi den cuoi hang cua doi dich
        if (selectedPiece.piece == "♟" && x == 7) {
          board[x][y] = choosePiece("black");
        } else if (selectedPiece.piece == "♙" && x == 0) {
          board[x][y] = choosePiece("white");
        }

        selectedPiece = null;

        validMoves = [];

        if (socket.readyState == WebSocket.OPEN && myColor) {
          socket.send(
            JSON.stringify({
              type: "move",
              fromX,
              fromY,
              toX: x,
              toY: y,
              piece: board[x][y],
            })
          );
        }

        if (pieceEaten != "") {
          let defeatedPieceColor = "";
          if (pieceWhite(pieceEaten)) {
            defeatedPieceColor = "white";
          } else if (pieceBlack(pieceEaten)) {
            defeatedPieceColor = "black";
          }
          socket.send(
            JSON.stringify({
              type: "defeatedPiece",
              piece: pieceEaten,
              color: defeatedPieceColor,
            })
          );
        }

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
        if (piece == "♙" || piece == "♟") {
          pawnAttack(i, j, x, y, piece, pieceIsWhite, attackSquare);
        } else {
          pieceAttack(i, j, x, y, piece, pieceIsWhite, attackSquare, pieceKing);
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
function whichPieceKing(piece) {
  return pieceWhite(piece) ? "♚" : "♔";
}

// Ham tim vua
function findKing(currentTurn) {
  const kingPosition = currentTurn == "white" ? "♔" : "♚";
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board[i][j] == kingPosition) {
        return { x: i, y: j };
      }
    }
  }

  return null;
}

// Ham lay nuoc o quan dich tan cong vua
function lineAttackKing(i, j, x, y) {
  const lineAttack = [];
  const dx = Math.sign(x - i);
  const dy = Math.sign(y - j);
  if (Math.abs(x - i) === Math.abs(y - j) || i === x || j === y) {
    let px = i;
    let py = j;
    while (px != x || py != y) {
      lineAttack.push([px, py]);
      px += dx;
      py += dy;
    }
  }
  return lineAttack;
}
// Ham tot tan cong
function pawnAttack(i, j, x, y, piece, pieceIsWhite, attackSquare) {
  if (piece == "♙") {
    if (i > 0 && j > 0) attackSquare.add(`${i - 1}-${j - 1}`);
    if (i > 0 && j < 7) attackSquare.add(`${i - 1}-${j + 1}`);
  }
  if (piece == "♟") {
    if (i < 7 && j > 0) attackSquare.add(`${i + 1}-${j - 1}`);
    if (i < 7 && j < 7) attackSquare.add(`${i + 1}-${j + 1}`);
  }
}

// Ham cac quan con lai tan cong
function pieceAttack(i, j, x, y, piece, pieceIsWhite, attackSquare, pieceKing) {
  const movesAttack = getValidMoves(i, j, piece, true);
  const isAttackingKing = movesAttack.some(([mx, my]) => mx == x && my == y);

  if (isAttackingKing) {
    attackSquare.add(`${x}-${y}`);
    attackSquare.add(`${i}-${j}`);
    // Chỉ thêm các ô trên đường tấn công, không thêm ô của vua
    if (piece != "♞" || piece != "♘") {
      const lineAttackToKing = lineAttackKing(i, j, x, y);
      for (let line of lineAttackToKing) {
        attackSquare.add(`${line[0]}-${line[1]}`);
      }
      // Thêm ô của quân tấn công
    }
  } else {
    // Thêm các ô mà quân cờ có thể di chuyển đến
    for (let move of movesAttack) {
      attackSquare.add(`${move[0]}-${move[1]}`);
    }
  }
}

// Ham gioi han pham vi trong ban co`
function insideBoard(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function checkmate() {
  const kingPosition = findKing(currentTurn);
  if (!kingPosition) return;
  const king = board[kingPosition.x][kingPosition.y];
  // Quan tan cong
  const pieceAttack = pieceAttackKing(kingPosition.x, kingPosition.y, king);

  const isKingInCheck = pieceAttack.includes(
    `${kingPosition.x}-${kingPosition.y}`
  );
  if (!isKingInCheck) return;

  const kingMoves = getValidMoves(kingPosition.x, kingPosition.y, king);

  const safeKing = kingMoves.filter(([kx, ky]) => {
    return safeKingMoves(kingPosition.x, kingPosition.y, kx, ky, currentTurn);
  });

  const attackPieces = findAttackPieces(kingPosition.x, kingPosition.y, king);

  const teammateHelpKing = teammate(
    kingPosition.x,
    kingPosition.y,
    king,
    attackPieces
  );

  if (safeKing.length == 0 && !teammateHelpKing) {
    // setTimeout(() => {
    //   alert(`Chiếu bí! ${currentTurn == "white" ? "Đen" : "Trắng"} thắng`);
    // }, 100);
    setTimeout(() => {
      const winnerColor = currentTurn == "white" ? "Black" : "White";
      alert(`Chiếu bí! ${winnerColor == "white" ? "Đen" : "Trắng"} thắng`);
      if (myColor === winnerColor) {
        socket.send(
          JSON.stringify({
            type: "game_over",
            reason: "checkmate",
          })
        );
      }
    }, 1000);
  }
}

// Ham xu ly nuoc di an toan cho vua
function safeKingMoves(fromX, fromY, toX, toY, currentTurn) {
  const pieceBefore = board[fromX][fromY];
  const pieceAfter = board[toX][toY];

  board[toX][toY] = pieceBefore;
  board[fromX][fromY] = "";

  let kingX, kingY;
  if (
    (currentTurn == "white" && pieceBefore == "♔") ||
    (currentTurn == "black" && pieceBefore == "♚")
  ) {
    kingX = toX;
    kingY = toY;
  } else {
    const kingPosition = findKing(currentTurn);
    if (!kingPosition) {
      board[fromX][fromY] = pieceBefore;
      board[toX][toY] = pieceAfter;
      return false;
    }
    kingX = kingPosition.x;
    kingY = kingPosition.y;
  }

  const squareAttackKing = pieceAttackKing(kingX, kingY, board[kingX][kingY]);
  const isKingInCheck = squareAttackKing.includes(`${kingX}-${kingY}`);

  board[fromX][fromY] = pieceBefore;
  board[toX][toY] = pieceAfter;

  return !isKingInCheck;
}

//Ham tim cac quan tan cong

function findAttackPieces(kingX, kingY, pieceKing) {
  const attackPieces = [];
  const pieceIsWhite = pieceWhite(pieceKing);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && (pieceIsWhite ? pieceBlack(piece) : pieceWhite(piece))) {
        const movesAttack = getValidMoves(i, j, board[i][j], true);
        const pieceAttackKing = movesAttack.some(
          ([mx, my]) => mx == kingX && my == kingY
        );
        if (pieceAttackKing) {
          attackPieces.push({ x: i, y: j, piece });
        }
      }
    }
  }
  return attackPieces;
}

//Ham tim quan giup vua thoat chieu
function teammate(kingX, kingY, pieceKing, attackPieces) {
  const pieceIsWhite = pieceWhite(pieceKing);

  if (attackPieces.length > 1) return false;

  if (attackPieces.length == 0) return true;

  const attacker = attackPieces[0];
  const attackSquares = new Set();
  attackSquares.add(`${attacker.x}-${attacker.y}`);

  if (attacker.piece != "♞" && attacker.piece != "♘") {
    const lineAttack = lineAttackKing(attacker.x, attacker.y, kingX, kingY);
    for (let [x, y] of lineAttack) {
      attackSquares.add(`${x}-${y}`);
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && (pieceIsWhite ? pieceWhite(piece) : pieceBlack(piece))) {
        const movesTeammate = getValidMoves(i, j, piece);
        for (let [mx, my] of movesTeammate) {
          const pieceBefore = board[i][j];
          const pieceAfter = board[mx][my];

          board[mx][my] = pieceBefore;
          board[i][j] = "";

          let newKingX = kingX;
          let newKingY = kingY;
          if (piece == pieceKing) {
            newKingX = mx;
            newKingY = my;
          }
          const isKingInCheck = pieceAttackKing(
            kingX,
            kingY,
            pieceKing
          ).includes(`${kingX}-${kingY}`);

          board[i][j] = pieceBefore;
          board[mx][my] = pieceAfter;

          if (
            !isKingInCheck &&
            (attackSquares.has(`${mx}-${my}`) || piece == pieceKing)
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
