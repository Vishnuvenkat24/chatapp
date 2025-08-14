const socket = io("http://localhost:3000");
const username = localStorage.getItem("chatUsername");

if (!username) {
  window.location.href = "name.html";
}

document.getElementById("welcome-text").textContent = `You are chatting as ${username}`;

// Join chat
socket.emit("join", username);

// Update user list
socket.on("userList", (users) => {
  const userList = document.getElementById("users");
  userList.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    userList.appendChild(li);
  });
  document.getElementById("user-count").textContent = users.length;
});

// Display system messages
socket.on("systemMessage", (msg) => {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("system-message");
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

// Display chat messages
socket.on("message", (data) => {
  displayMessage(data.username, data.message, data.username === username);
});

function displayMessage(user, message, isUser) {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("message", isUser ? "user" : "other");
  div.innerHTML = `<strong>${user}:</strong> ${message}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Send message
document.getElementById("message-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("message", { username, message });
    messageInput.value = "";
  }
});
