const { json } = require("express");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });
console.log("Server lang nghe tai: ws://localhost:3000");

let waitingPlayer = null;
wss.on("connection", (ws) => {
  console.log("Co client ket noi");
  if (waitingPlayer) {
    const player1 = waitingPlayer;
    const player2 = ws;

    player1.color = "white";
    player2.color = "black";

    player1.opponent = player2;
    player2.opponent = player1;

    player1.send(JSON.stringify({ type: "start", color: "white" }));
    player2.send(JSON.stringify({ type: "start", color: "black" }));

    waitingPlayer = null;
  } else {
    waitingPlayer = ws;
    ws.send(JSON.stringify({ type: "waiting" }));
  }
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type == "move" && ws.opponent) {
      ws.opponent.send(JSON.stringify(data));
    }
    if(data.type =="defeatedPiece" && ws.opponent){
      ws.opponent.send(JSON.stringify(data));
    }
  });
  ws.on("close", () => {
    if (ws.opponent) {
      ws.opponent.send(
        JSON.stringify({ type: "end", reason: "Doi thu da roi di" })
      );
    }
    if (waitingPlayer == ws) {
      waitingPlayer = null;
    }
  });
});
