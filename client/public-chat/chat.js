const username = localStorage.getItem("username");
const socket = io("/public");

if (!username) window.location.href = "name.html";

document.getElementById("welcome-text").textContent = `You are chatting as ${username}`;
socket.emit("join", username);

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

socket.on("systemMessage", (msg) => addMessage("system-message", msg));
socket.on("message", (data) => {
  const isUser = data.username === username;
  addMessage(isUser ? "user" : "other", `<strong>${data.username}:</strong> ${data.message}`);
});

document.getElementById("message-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("message", { username, message });
    messageInput.value = "";
  }
});

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

io.of("/public").on("connection", (socket) => {
  socket.on("join", (username) => {
    activeUsers[socket.id] = username;
    io.of("/public").emit("userList", Object.values(activeUsers));
    io.of("/public").emit("systemMessage", `${username} joined the chat`);
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
