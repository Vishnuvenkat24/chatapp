// server.js
const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let onlineUsers = 0;

app.use(express.static(path.join(__dirname, "../client")));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("new user", (username) => {
    socket.username = username;
    onlineUsers++;
    io.emit("system message", `${username} joined the chat`);
    io.emit("user count", onlineUsers);
  });

  socket.on("chat message", ({ user, text }) => {
    io.emit("chat message", { user, text });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      onlineUsers--;
      io.emit("system message", `${socket.username} left the chat`);
      io.emit("user count", onlineUsers);
    }
    console.log("A user disconnected");
  });
});

c
