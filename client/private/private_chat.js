const username = localStorage.getItem("username");
const roomCode = localStorage.getItem("roomCode");
const socket = io("/private");

if (!username || !roomCode) {
  window.location.href = "join_create.html";
}

document.getElementById("room-id-display").textContent = `Room: ${roomCode}`;

// Join room
socket.emit("joinRoom", { username, code: roomCode });

// Update user list
socket.on("userList", (users) => {
  document.getElementById("user-count").textContent = users.length;
  const userList = document.getElementById("users");
  userList.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    userList.appendChild(li);
  });
});

// System messages (join/leave)
socket.on("systemMessage", (msg) => addMessage("system-message", msg));

// Private messages
socket.on("privateMessage", (data) => {
  const isUser = data.username === username;
  addMessage(isUser ? "user" : "other", `<strong>${data.username}:</strong> ${data.message}`);
});

// Send message
document.getElementById("message-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("privateMessage", { code: roomCode, username, message });
    messageInput.value = "";
  }
});

// Emoji click handler
document.querySelectorAll("#emoji-panel span").forEach(emoji => {
  emoji.addEventListener("click", () => {
    const input = document.getElementById("message-input");
    input.value += emoji.textContent;
    input.focus();
  });
});

function addMessage(cssClass, content) {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("message", cssClass);
  div.innerHTML = content;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
