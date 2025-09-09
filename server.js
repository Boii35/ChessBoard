// Tao API /register va /login
const express = require("express");
// Luu thong tin vao MongoDB
const mongoose = require("mongoose");
// Bam mat khau, bao mat
const bcrypt = require("bcrypt");
// Tao token xac thuc sau khi dang nhap
const jwt = require("jsonwebtoken");
// Tao WebSocket server de xu ly di chuyen theo thoi gian thuc
const WebSocket = require("ws");

const http = require("http");
const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
const PORT = 4000;
const JWT_SECRET = "your_jwt_secret_key";
console.log("Server lang nghe tai: ws://localhost:4000");
const path = require("path");

// Ket noi den MongoDB
mongoose
  .connect("mongodb://localhost:27017/chessboard_game")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// server hieu du lieu json duoc gui tu client
app.use(express.json());

const cors = require("cors");
app.use(cors());

const UserSchema = new mongoose.Schema({
  username: { type: String, require: true, unique: true },
  password: { type: String, require: true },
});
const User = mongoose.model("User", UserSchema);

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: { type: [String], required: true },
  status: { type: String, default: "waiting" },
  createdAt: { type: Date, default: Date.now },
});
const Room = mongoose.model("Room", roomSchema);

const matchSchema = new mongoose.Schema({
  players: { type: [String], required: true },
  winner: { type: String, required: true },
  loser: { type: String, require: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: Date.now },
  durationInSeconds: { type: Number, required: true },
  reasonForEnd: { type: String, default: "checkmate" },
});
const Match = mongoose.model("Match", matchSchema);
//
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  // jwt.verify  ->  Ham tu thu vien jsonwebtoken dung de kiem tra token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Vui long nhap ten nguoi dung va mat khau " });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Ten nguoi dung da ton tai" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "Dang ky thanh cong" });
  } catch (error) {
    res.status(500).json({ message: "Loi server", error });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Vui long nhap ten nguoi dung hoac mat khau " });
    }
    const foundUser = await User.findOne({ username });
    if (!foundUser) {
      return res
        .status(400)
        .json({ message: "Ten nguoi dung hoac mat khau khong dung" });
    }
    const samePassword = await bcrypt.compare(password, foundUser.password);
    if (!samePassword) {
      return res
        .status(400)
        .json({ message: "Ten nguoi dung hoac mat khau sai" });
    }
    const token = jwt.sign({ username: foundUser.username }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token, message: "Dang nhap thanh cong" });
  } catch (error) {
    res.status(500).json({ message: "Loi server", error });
  }
});

app.post("/create-room", authenticateToken, async (req, res) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom = new Room({ roomId, players: [req.user.username] });
    await newRoom.save();
    res.status(201).json({ message: "Phong da duoc tao", roomId });
  } catch (error) {
    console.error("Create room error:", error);
    req.status(500).json({ message: "Loi server khi tao phong" });
  }
});

app.post("/join-room", authenticateToken, async (req, res) => {
  const { roomId } = req.body;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Phong khong ton tai" });
    if (room.players.length >= 2)
      return res.status(400).json({ message: "Phong da day" });
    if (room.players.includes(req.user.username))
      return res.status(400).json({ message: "Ban da tham gia phong nay" });

    room.players.push(req.user.username);
    room.status = "playing";
    await room.save();
    res.status(200).json({ message: "Tham gia phong thanh cong", roomId });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ message: "Loi server" });
  }
});

app.get("/match-history", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const matches = await Match.find({ players: username }).sort({
      endTime: -1,
    });
    res.status(200).json(matches);
  } catch (error) {
    console.log("Get match history error:", error);
    res.status(500).json({ message: "Loi server khi lay lich su dau" });
  }
});

app.get("/room-status", authenticateToken, async (req, res) => {
  const { roomId } = req.query;
  const room = await Room.findOne({ roomId });
  if (!room) {
    return res.json({ status: "not found" });
  }
  res.json({ status: room.status });
});

// let waitingPlayer = null;
const waitingRoom = {};

wss.on("connection", (ws) => {
  console.log("Co client ket noi");
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "auth" && data.token && data.roomId) {
      jwt.verify(data.token, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log("Invalid token:", err);
          ws.close(1008, "Invalid token");
          return;
        }
        ws.user = decoded;
        ws.roomId = data.roomId;
        // if (waitingPlayer && waitingPlayer.user) {
        //   console.log("Pairing players");
        //   const player1 = waitingPlayer;
        //   const player2 = ws;
        //   player1.color = "white";
        //   player2.color = "black";
        //   player1.opponent = player2;
        //   player2.opponent = player1;
        //   player1.send(JSON.stringify({ type: "start", color: "white" }));
        //   player2.send(JSON.stringify({ type: "start", color: "black" }));
        //   waitingPlayer = null;
        // } else {
        //   waitingPlayer = ws;
        //   ws.send(JSON.stringify({ type: "waiting" }));
        // }

        if (!waitingRoom[ws.roomId]) {
          // waitingRoom[ws.roomId] = [];
          waitingRoom[ws.roomId] = {
            players: [],
            startTime: null,
          };
        }

        // if (!waitingRoom[ws.roomId].includes(ws)) {
        //   waitingRoom[ws.roomId].push(ws);
        // }

        if (
          !waitingRoom[ws.roomId].players.find(
            (p) => p.user.username === ws.user.username
          )
        ) {
          waitingRoom[ws.roomId].players.push(ws);
        }
        if (waitingRoom[ws.roomId].players.length === 2) {
          waitingRoom[ws.roomId].startTime = new Date();
          console.log(
            `Starting started in room ${ws.roomId} at ${
              waitingRoom[ws.roomId].startTime
            }`
          );
          waitingRoom[ws.roomId].players.forEach((client, index) => {
            client.send(
              JSON.stringify({
                type: "start",
                color: index === 0 ? "white" : "black",
              })
            );
          });
        } else {
          ws.send(JSON.stringify({ type: "waiting" }));
        }
      });
    }
    if (data.type === "done" && ws.roomId && waitingRoom[ws.roomId]) {
      ws.send(JSON.stringify({ type: "play" }));
    }
    if (data.type === "move" && ws.roomId && waitingRoom[ws.roomId]) {
      waitingRoom[ws.roomId].players.forEach((client) => {
        if (client !== ws) {
          client.send(JSON.stringify(data));
        }
      });
    }
    if (data.type === "defeatedPiece" && ws.roomId && waitingRoom[ws.roomId]) {
      waitingRoom[ws.roomId].players.forEach((client) => {
        if (client !== ws) {
          client.send(JSON.stringify(data));
        }
      });
    }
    if (data.type === "game_over" && ws.roomId && waitingRoom[ws.roomId]) {
      const room = waitingRoom[ws.roomId];
      if (!room.startTime) return;

      const endTime = new Date();
      const durationInSeconds = Math.round(
        (endTime - waitingRoom[ws.roomId].startTime) / 1000
      );
      const winnerClient = room.players.find(
        (p) => p.user.username === ws.user.username
      );
      const loserClient = room.players.find(
        (p) => p.user.username !== ws.user.username
      );
      if (winnerClient && loserClient) {
        const newMatch = new Match({
          players: [winnerClient.user.username, loserClient.user.username],
          winner: winnerClient.user.username,
          loser: loserClient.user.username,
          startTime: room.startTime,
          endTime: endTime,
          durationInSeconds: durationInSeconds,
          reasonForEnd: data.reason || "checkmate",
        });
        newMatch
          .save()
          .then(() => console.log(`Match history saved for room: ${ws.roomId}`))
          .catch((err) => console.error("Error saving with match", err));
      }
    }
  });
  ws.on("close", () => {
    // if (ws.opponent) {
    //   ws.opponent.send(
    //     JSON.stringify({ type: "end", reason: "Doi thu da roi di" })
    //   );
    // }
    // if (waitingPlayer === ws) {
    //   waitingPlayer = null;
    // }

    // waitingRoom[ws.roomId].forEach((client) => {
    //   if (client !== ws) {
    //     client.send(
    //       JSON.stringify({ type: "end", reason: "Doi thu da roi di" })
    //     );
    //   }
    // });
    if (ws.roomId && waitingRoom[ws.roomId]) {
      const room = waitingRoom[ws.roomId];

      if (room.players.length === 2 && room.startTime) {
        const remainingPlayer = room.players.find((client) => client !== ws);
        if (remainingPlayer) {
          remainingPlayer.send(
            JSON.stringify({ type: "end", reason: "Doi thu da roi di" })
          );
          const endTime = new Date();
          const durationInSeconds = Math.round(
            (endTime - room.startTime) / 1000
          );
          const loserPlayer = ws.user ? ws.user.username : "Unknown";

          const newMatch = new Match({
            players: [remainingPlayer.user.username, loserPlayer],
            winner: remainingPlayer.user.username,
            loser: loserPlayer,
            startTime: room.startTime,
            endTime: endTime,
            durationInSeconds: durationInSeconds,
            reasonForEnd: "disconnect",
          });

          newMatch
            .save()
            .then(() =>
              console.log(
                "Match history (disconnect) saved for room:",
                ws.roomId
              )
            )
            .catch((err) =>
              console.error("Error saving match on disconnect:", err)
            );
        }
      }
      // waitingRoom[ws.roomId] = waitingRoom[ws.roomId].filter(
      //   (client) => client !== ws
      // );
      // if (waitingRoom[ws.roomId].length === 0) {
      //   delete waitingRoom[ws.roomId];
      // }

      if (room.players) {
        room.players = room.players.filter((client) => client !== ws);
        if (room.players.length === 0) {
          delete waitingRoom[ws.roomId];
          console.log(`Room ${ws.roomId} has no players left, deleting room.`);
        }
      }
    }
  });
});

// app.use(
//   "/interface",
//   express.static(path.join(__dirname, "interface"), {
//     setHeaders: (res) => {
//       res.set("Access-Control-Allow-Origin", "*");
//       console.log("Serving file from /interface:", res.req.url);
//     },
//   })
// );
app.use(
  "/game-chess",
  express.static(path.join(__dirname, "game-chess"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      console.log("Serving file from /game-chess:", res.req.url);
    },
  })
);
// app.use(
//   "/room",
//   express.static(path.join(__dirname, "room"), {
//     setHeaders: (res) => {
//       res.set("Access-Control-Allow-Origin", "*");
//       console.log("Serving file from /room:", res.req.url);
//     },
//   })
// );
// console.log("Serving /interface from", path.join(__dirname, "interface"));
console.log("Serving /game-chess from", path.join(__dirname, "game-chess"));

server.listen(PORT, () => {
  console.log(
    `Server dang lang nghe tai http://localhost:${PORT} va ws://localhost:${PORT}`
  );
});
