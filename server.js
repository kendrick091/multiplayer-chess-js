const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("createRoom", (roomId) => {
    socket.join(roomId);
    rooms[roomId] = { players: 1 };
    socket.emit("playerColor", "white");
  });

  socket.on("joinRoom", (roomId) => {
    if (rooms[roomId] && rooms[roomId].players === 1) {
      socket.join(roomId);
      rooms[roomId].players++;
      socket.emit("playerColor", "black");
      io.to(roomId).emit("startGame");
    }
  });

  socket.on("move", ({ roomId, move }) => {
    socket.to(roomId).emit("move", move);
  });

});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});