const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let activeUsers = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (username) => {
    activeUsers[socket.id] = username;
    io.emit("userList", Object.values(activeUsers));
    io.emit("systemMessage", `${username} joined the chat`);
  });

  socket.on("message", (data) => {
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    const username = activeUsers[socket.id];
    delete activeUsers[socket.id];
    io.emit("userList", Object.values(activeUsers));
    if (username) {
      io.emit("systemMessage", `${username} left the chat`);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
