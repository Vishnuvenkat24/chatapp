const youName = localStorage.getItem("anonName");
if (!youName) window.location.href = "anon-name.html";

document.getElementById("you-name").textContent = youName;

const statusEl = document.getElementById("status");
const btnConnect = document.getElementById("btn-connect");
const btnNext = document.getElementById("btn-next");
const btnLeave = document.getElementById("btn-leave");
const messages = document.getElementById("messages");
const typingBar = document.getElementById("typing");
const form = document.getElementById("form");
const input = document.getElementById("input");
const emojiPanel = document.getElementById("emoji-panel");

const socket = io(); // same-origin (served by express)

// UI helpers
function addSystem(msg) {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
function addMsgMine(text) {
  const div = document.createElement("div");
  div.className = "msg me";
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
function addMsgTheirs(text) {
  const div = document.createElement("div");
  div.className = "msg them";
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
function setStatus(s) { statusEl.textContent = s; }

let paired = false;
let typingTimeout;

// connect/find partner
btnConnect.addEventListener("click", () => {
  resetChat();
  setStatus("Searching for a stranger…");
  btnConnect.disabled = true;
  btnNext.disabled = true;
  btnLeave.disabled = false;
  socket.emit("join_anon", { name: youName });
});

// next (skip)
btnNext.addEventListener("click", () => {
  setStatus("Searching for a new stranger…");
  btnNext.disabled = true;
  socket.emit("next");
  addSystem("You skipped the conversation.");
});

// leave
btnLeave.addEventListener("click", () => {
  socket.emit("leave");
  addSystem("You left the chat.");
  setStatus("Not connected");
  paired = false;
  btnConnect.disabled = false;
  btnNext.disabled = true;
  btnLeave.disabled = true;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !paired) return;
  socket.emit("msg", { text });
  addMsgMine(text);
  input.value = "";
  socket.emit("typing", false);
});

input.addEventListener("input", () => {
  if (!paired) return;
  socket.emit("typing", true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("typing", false), 900);
});

emojiPanel.addEventListener("click", (e) => {
  if (e.target.tagName === "SPAN") {
    input.value += e.target.textContent;
    input.focus();
  }
});

// Socket events
socket.on("queue_status", ({ inQueue }) => {
  if (inQueue) setStatus("Searching for a stranger…");
});

socket.on("paired", () => {
  paired = true;
  btnConnect.disabled = true;
  btnNext.disabled = false;
  btnLeave.disabled = false;
  setStatus("Connected to Stranger");
  addSystem("You’re now connected to a Stranger. Say hi! 👋");
});

socket.on("partner_left", ({ reason }) => {
  paired = false;
  setStatus("Partner left (" + reason + ")");
  addSystem("Stranger left the chat.");
  btnConnect.disabled = false;
  btnNext.disabled = true;
  btnLeave.disabled = true;
});

socket.on("msg", ({ text }) => {
  addMsgTheirs(text);
});

socket.on("partner_typing", (isTyping) => {
  typingBar.classList.toggle("hidden", !isTyping);
});

// helpers
function resetChat() {
  messages.innerHTML = "";
  typingBar.classList.add("hidden");
}
