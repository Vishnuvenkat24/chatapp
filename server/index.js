const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ================== Serve static pages ==================
app.use("/public", express.static(path.join(__dirname, "../client/public_chat")));
app.use("/anon", express.static(path.join(__dirname, "../client/anonymous_chat")));
app.use("/private", express.static(path.join(__dirname, "../client/private_chat")));

// ================== Socket.IO Logic ==================

// ===== Public Chat =====
let activeUsers = {};

io.of("/public").on("connection", (socket) => {
  console.log("Public chat user connected");

  socket.on("join", (username) => {
    activeUsers[socket.id] = username;
    io.of("/public").emit("userList", Object.values(activeUsers));
    io.of("/public").emit("systemMessage", `${username} joined the chat`);
  });

  socket.on("message", (data) => {
    io.of("/public").emit("message", data);
  });

  socket.on("disconnect", () => {
    const username = activeUsers[socket.id];
    delete activeUsers[socket.id];
    io.of("/public").emit("userList", Object.values(activeUsers));
    if (username) {
      io.of("/public").emit("systemMessage", `${username} left the chat`);
    }
  });
});

// ===== Anonymous Chat =====
const waitingQueue = [];
const partnerOf = new Map();

function tryMatchAnon() {
  while (waitingQueue.length >= 2) {
    const a = waitingQueue.shift();
    const b = waitingQueue.shift();
    if (!io.of("/anon").sockets.get(a) || !io.of("/anon").sockets.get(b)) continue;

    partnerOf.set(a, b);
    partnerOf.set(b, a);

    io.of("/anon").to(a).emit("paired", { partnerLabel: "Stranger" });
    io.of("/anon").to(b).emit("paired", { partnerLabel: "Stranger" });
  }
}

function removeFromQueueAnon(id) {
  const idx = waitingQueue.indexOf(id);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function breakPairAnon(id, reason = "disconnected") {
  const partner = partnerOf.get(id);
  if (partner) {
    partnerOf.delete(partner);
    partnerOf.delete(id);
    io.of("/anon").to(partner).emit("partner_left", { reason });
  }
}

io.of("/anon").on("connection", (socket) => {
  socket.on("join_anon", ({ name }) => {
    removeFromQueueAnon(socket.id);
    waitingQueue.push(socket.id);
    io.of("/anon").to(socket.id).emit("queue_status", { inQueue: true });
    tryMatchAnon();
  });

  socket.on("msg", ({ text }) => {
    const partner = partnerOf.get(socket.id);
    if (partner && typeof text === "string" && text.trim()) {
      io.of("/anon").to(partner).emit("msg", { from: "Stranger", text });
    }
  });

  socket.on("typing", (isTyping) => {
    const partner = partnerOf.get(socket.id);
    if (partner) io.of("/anon").to(partner).emit("partner_typing", !!isTyping);
  });

  socket.on("next", () => {
    breakPairAnon(socket.id, "skipped");
    removeFromQueueAnon(socket.id);
    waitingQueue.push(socket.id);
    io.of("/anon").to(socket.id).emit("queue_status", { inQueue: true });
    tryMatchAnon();
  });

  socket.on("leave", () => {
    breakPairAnon(socket.id, "left");
    removeFromQueueAnon(socket.id);
    io.of("/anon").to(socket.id).emit("left_ack");
  });

  socket.on("disconnect", () => {
    breakPairAnon(socket.id, "disconnected");
    removeFromQueueAnon(socket.id);
  });
});

// ===== Private Chat (Join/Create) =====
const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

io.of("/private").on("connection", (socket) => {
  socket.on("createRoom", (username) => {
    const code = generateRoomCode();
    rooms[code] = [socket.id];
    socket.join(code);
    socket.emit("roomCreated", code);
    socket.username = username;
  });

  socket.on("joinRoom", ({ username, code }) => {
    if (rooms[code]) {
      rooms[code].push(socket.id);
      socket.join(code);
      socket.username = username;
      io.of("/private").to(code).emit("systemMessage", `${username} joined room ${code}`);
    } else {
      socket.emit("errorMessage", "Room not found!");
    }
  });

  socket.on("privateMessage", ({ code, message }) => {
    io.of("/private").to(code).emit("privateMessage", { username: socket.username, message });
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      if (rooms[code].includes(socket.id)) {
        rooms[code] = rooms[code].filter(id => id !== socket.id);
        io.of("/private").to(code).emit("systemMessage", `${socket.username || 'A user'} left the room`);
        if (rooms[code].length === 0) delete rooms[code];
      }
    }
  });
});

// ================== Start Server ==================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
