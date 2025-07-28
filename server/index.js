const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let onlineUsers = 0;

// ✅ Serve static files from the client folder
app.use(express.static(path.join(__dirname, "../client")));

// ✅ Serve index.html for any unmatched routes (for single-page app or basic HTML)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

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

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
