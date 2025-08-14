const socket = io();

// Get room ID from URL
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
const username = sessionStorage.getItem("private_username") || "Guest";

if (!roomId) {
  alert("No room ID found! Please create or join a room first.");
  window.location.href = "/private";
}

// Display room ID
document.getElementById("room-id-display").textContent = `Room ID: ${roomId}`;

// DOM Elements
const userCountEl = document.getElementById("user-count");
const usersList = document.getElementById("users");
const messagesEl = document.getElementById("messages");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const emojiPanel = document.getElementById("emoji-panel");

// Join room
socket.emit("joinRoom", { username, roomId });

// Update user list
socket.on("userList", (users) => {
  userCountEl.textContent = users.length;
  usersList.innerHTML = users.map(user => `<li>${user}</li>`).join("");
});

// Receive message
socket.on("message", ({ username: sender, text }) => {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  msgDiv.classList.add(sender === username ? "user" : "other");
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  messagesEl.appendChild(msgDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

// System message
socket.on("systemMessage", (text) => {
  const sysDiv = document.createElement("div");
  sysDiv.classList.add("system-message");
  sysDiv.textContent = text;
  messagesEl.appendChild(sysDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    socket.emit("chatMessage", { roomId, text });
    input.value = "";
  }
});

// Emoji click
emojiPanel.addEventListener("click", (e) => {
  if (e.target.tagName === "SPAN") {
    input.value += e.target.textContent;
    input.focus();
  }
});
