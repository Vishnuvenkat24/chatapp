const socket = io();
let username = "";

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userCountDisplay = document.getElementById("user-count");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value && username) {
    socket.emit("chat message", { user: username, text: input.value });
    input.value = "";
  }
});

function submitUsername() {
  const nameInput = document.getElementById("username-input");
  username = nameInput.value.trim();
  if (username) {
    socket.emit("new user", username);
    document.getElementById("username-modal").style.display = "none";
  }
}

// Display messages
socket.on("chat message", (msg) => {
  const item = document.createElement("li");
  item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// System messages (like "Vishnu joined")
socket.on("system message", (msg) => {
  const item = document.createElement("li");
  item.style.color = "gray";
  item.textContent = msg;
  messages.appendChild(item);
});

// User count
socket.on("user count", (count) => {
  userCountDisplay.textContent = `Users online: ${count}`;
});
