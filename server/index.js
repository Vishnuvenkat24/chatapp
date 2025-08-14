// server.js
const http = require("http");
const express = require("express");
const app = express();
const path = require("path");


const server = http.createServer(app); // ✅ THIS creates the actual server

const io = require("socket.io")(server); // ✅ attach Socket.IO to the server

// Serve public and anonymous chats separately
app.use("/public-chat", express.static(path.join(__dirname, "../client/public-chat")));
app.use("/anonymous-chat", express.static(path.join(__dirname, "../client/anonymous-chat")));

// Serve index.html and style.css
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});
// Public Chat page
app.get("/public-chat", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public-chat/index.html"));
});

// Anonymous Chat page
app.get("/anonymous-chat", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/anonymous-chat/index.html"));
});

// Room Chat page
app.get("/room-chat", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/room-chat/index.html"));
});



let onlineUsers = 0;
let anonymousQueue = [];
let anonymousPairs = new Map();
let publicChatHistory = [];
const roomChats = {}; // { roomCode: [{ user, text, time }] }
const roomUsers = {}; // { roomCode: Set(socket.id) }

io.on("connection", (socket) => {
  console.log("🔌 User connected");

  // Public chat logic
  socket.on("join public", (username) => {
    socket.username = username;
    onlineUsers++;
    io.emit("system message", `${username} joined`);
    io.emit("user count", onlineUsers);
    socket.emit("chat history", publicChatHistory);
  });

  socket.on("public message", (msg) => {
    const message = {
      user: socket.username,
      text: msg,
      time: new Date().toLocaleTimeString()
    };
    publicChatHistory.push(message);
    if (publicChatHistory.length > 100) publicChatHistory.shift();
    io.emit("public message", message);
  });

  // Anonymous chat pairing logic
  socket.on("join anonymous", () => {
    if (anonymousQueue.length > 0) {
      const partnerId = anonymousQueue.shift();
      anonymousPairs.set(socket.id, partnerId);
      anonymousPairs.set(partnerId, socket.id);

      socket.emit("partner found");
      io.to(partnerId).emit("partner found");
    } else {
      anonymousQueue.push(socket.id);
      socket.emit("searching");
    }
  });

  socket.on("anonymous message", (msg) => {
    const partnerId = anonymousPairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("anonymous message", {
        text: msg,
        time: new Date().toLocaleTimeString()
      });
    }
  });

  socket.on("typing", () => {
    const partnerId = anonymousPairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("typing");
    }
  });

  socket.on("cancel search", () => {
    anonymousQueue = anonymousQueue.filter(id => id !== socket.id);
    socket.emit("search cancelled");
  });

  // Room-based chat logic
  socket.on("join room", ({ roomCode, username }) => {
    socket.join(roomCode);
    socket.username = username;
    if (!roomChats[roomCode]) roomChats[roomCode] = [];
    if (!roomUsers[roomCode]) roomUsers[roomCode] = new Set();
    roomUsers[roomCode].add(socket.id);
    socket.emit("room history", roomChats[roomCode]);
    io.to(roomCode).emit("room system", `${username} joined room ${roomCode}`);
  });

  socket.on("room message", ({ roomCode, text }) => {
    const message = {
      user: socket.username,
      text,
      time: new Date().toLocaleTimeString()
    };
    roomChats[roomCode].push(message);
    if (roomChats[roomCode].length > 100) roomChats[roomCode].shift();
    io.to(roomCode).emit("room message", message);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      onlineUsers--;
      io.emit("system message", `${socket.username} left`);
      io.emit("user count", onlineUsers);
    }

    if (anonymousPairs.has(socket.id)) {
      const partnerId = anonymousPairs.get(socket.id);
      anonymousPairs.delete(socket.id);
      anonymousPairs.delete(partnerId);
      io.to(partnerId).emit("partner disconnected");
    } else {
      anonymousQueue = anonymousQueue.filter(id => id !== socket.id);
    }

    for (const roomCode in roomUsers) {
      roomUsers[roomCode].delete(socket.id);
    }

    console.log("❌ User disconnected");
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
