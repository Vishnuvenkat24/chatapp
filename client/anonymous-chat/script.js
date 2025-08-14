const socket = io();

const msgInput = document.getElementById("msg");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("sendBtn");
const cancelBtn = document.getElementById("cancel");
const typingStatus = document.getElementById("typing");

sendBtn.onclick = () => {
  const text = msgInput.value;
  if (text.trim()) {
    appendMessage("You", text);
    socket.emit("anonymous message", text);
    msgInput.value = "";
  }
};

msgInput.addEventListener("input", () => {
  socket.emit("typing");
});

cancelBtn.onclick = () => {
  socket.emit("cancel search");
  alert("Search cancelled");
};

function appendMessage(sender, text, time = new Date().toLocaleTimeString()) {
  chatBox.innerHTML += `<div class="message"><b>${sender}</b> (${time}): ${text}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

socket.emit("join anonymous");

socket.on("searching", () => {
  document.getElementById("searching").style.display = "block";
});

socket.on("partner found", () => {
  document.getElementById("searching").style.display = "none";
  document.getElementById("chat-container").style.display = "block";
});

socket.on("partner disconnected", () => {
  appendMessage("System", "Your partner has disconnected.");
});

socket.on("anonymous message", ({ text, time }) => {
  appendMessage("Stranger", text, time);
});

socket.on("typing", () => {
  typingStatus.innerText = "Stranger is typing...";
  setTimeout(() => typingStatus.innerText = "", 2000);
});
