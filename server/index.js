import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

const users = new Map();

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("new user", (username) => {
    users.set(socket.id, username);
    io.emit("system message", `${username} joined the chat.`);
    io.emit("user count", users.size);
  });

  socket.on("chat message", ({ user, text }) => {
    io.emit("chat message", { user, text });
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id) || "Someone";
    users.delete(socket.id);
    io.emit("system message", `${username} left the chat.`);
    io.emit("user count", users.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
