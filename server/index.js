const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ================== Serve static pages ==================

app.use(express.static(path.join(__dirname, "../client")));

// ================== Socket.IO Logic ==================

// ===== Public Chat =====
// ===== Public Chat =====
let activeUsers = {};

io.of("/public").on("connection", (socket) => {
  console.log("Public chat user connected");

  socket.on("join", (username) => {
    activeUsers[socket.id] = username;
    io.of("/public").emit("userList", Object.values(activeUsers));
    io.of("/public").emit("systemMessage", `${username} joined the chat`);
    console.log(`[JOIN] ${username}`);
  });

  socket.on("message", (data) => {
    console.log(`[MESSAGE] ${data.username}: ${data.message}`);
    io.of("/public").emit("message", data);
  });

  socket.on("typing", (isTyping) => {
    const username = activeUsers[socket.id];
    socket.broadcast.emit("typing", { username, isTyping });
  });

  socket.on("disconnect", () => {
    const username = activeUsers[socket.id];
    delete activeUsers[socket.id];
    io.of("/public").emit("userList", Object.values(activeUsers));
    if (username) {
      io.of("/public").emit("systemMessage", `${username} left the chat`);
      console.log(`[LEAVE] ${username}`);
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

// --- Private Chat Namespace ---
const activeRooms = {}; // { roomCode: { socketId: username } }

io.of("/private").on("connection", (socket) => {
  socket.on("joinRoom", ({ username, code }) => {
    socket.join(code);

    if (!activeRooms[code]) activeRooms[code] = {};
    activeRooms[code][socket.id] = username;

    io.of("/private").to(code).emit("userList", Object.values(activeRooms[code]));
    io.of("/private").to(code).emit("systemMessage", `${username} joined room ${code}`);
  });

  socket.on("disconnect", () => {
    for (const code in activeRooms) {
      if (activeRooms[code][socket.id]) {
        const username = activeRooms[code][socket.id];
        delete activeRooms[code][socket.id];
        io.of("/private").to(code).emit("userList", Object.values(activeRooms[code]));
        io.of("/private").to(code).emit("systemMessage", `${username} left room ${code}`);
        if (Object.keys(activeRooms[code]).length === 0) delete activeRooms[code];
        break;
      }
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ================== Start Server ==================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});







