const socket = io();
let username = "";

const usernameContainer = document.getElementById("username-container");
const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const userCount = document.getElementById("user-count");

// Show username input on load
window.onload = () => {
  usernameContainer.style.display = "block";
  chatContainer.style.display = "none";

  // Enter key to join chat
  document.getElementById("username-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      enterChat();
    }
  });

  // Enter key to send message
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
};

function enterChat() {
  const input = document.getElementById("username-input").value.trim();
  if (input) {
    username = input;
    usernameContainer.style.display = "none";
    chatContainer.style.display = "block";
    socket.emit("new user", username);
  } else {
    alert("Please enter a name!");
  }
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("chat message", { user: username, text: message });
    messageInput.value = "";
  }
}

socket.on("chat message", ({ user, text }) => {
  const msg = document.createElement("div");
  msg.classList.add("message");

  if (user === username) {
    msg.classList.add("my-message");
    msg.innerHTML = `<div class="bubble right"><strong>You:</strong> ${text}</div>`;
  } else {
    msg.classList.add("other-message");
    msg.innerHTML = `<div class="bubble left"><strong>${user}:</strong> ${text}</div>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on("system message", (msg) => {
  const sys = document.createElement("div");
  sys.classList.add("system");
  sys.textContent = msg;
  chatBox.appendChild(sys);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on("user count", (count) => {
  userCount.textContent = `🟢 ${count} user${count !== 1 ? "s" : ""} online`;
});
