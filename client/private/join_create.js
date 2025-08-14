const socket = io("http://localhost:3000");

const createBtn = document.getElementById("create-btn");
const joinBtn = document.getElementById("join-btn");
const createRoomSection = document.getElementById("create-room-section");
const joinRoomSection = document.getElementById("join-room-section");
const createdRoomIdDisplay = document.getElementById("created-room-id");
const startChatBtn = document.getElementById("start-chat-btn");
const joinRoomSubmit = document.getElementById("join-room-submit");
const joinRoomIdInput = document.getElementById("join-room-id");
const errorMsg = document.getElementById("error-msg");

let generatedRoomId = "";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 7) + Math.floor(Math.random() * 1000);
}

createBtn.addEventListener("click", () => {
  generatedRoomId = generateRoomId();
  createdRoomIdDisplay.textContent = generatedRoomId;
  localStorage.setItem("roomId", generatedRoomId);
  createRoomSection.classList.remove("hidden");
  joinRoomSection.classList.add("hidden");
});

joinBtn.addEventListener("click", () => {
  createRoomSection.classList.add("hidden");
  joinRoomSection.classList.remove("hidden");
});

startChatBtn.addEventListener("click", () => {
  socket.emit("createRoom", generatedRoomId);
  window.location.href = `private_chat.html?room=${generatedRoomId}`;
});

joinRoomSubmit.addEventListener("click", () => {
  const roomId = joinRoomIdInput.value.trim();
  if (!roomId) {
    errorMsg.textContent = "Please enter a Room ID";
    return;
  }
  socket.emit("checkRoom", roomId, (exists) => {
    if (exists) {
      localStorage.setItem("roomId", roomId);
      window.location.href = `private_chat.html?room=${roomId}`;
    } else {
      errorMsg.textContent = "Room not found!";
    }
  });
});
