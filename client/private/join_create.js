const socket = io("/private");

// Show create/join sections
document.getElementById("create-btn").onclick = () => {
  document.getElementById("create-room-section").classList.remove("hidden");
  document.getElementById("join-room-section").classList.add("hidden");
};
document.getElementById("join-btn").onclick = () => {
  document.getElementById("join-room-section").classList.remove("hidden");
  document.getElementById("create-room-section").classList.add("hidden");
};

// Create Room
document.getElementById("start-chat-btn").onclick = () => {
  const username = prompt("Enter your name:");
  const roomCode = document.getElementById("created-room-id").textContent;
  if (username && roomCode) {
    localStorage.setItem("username", username);
    localStorage.setItem("roomCode", roomCode);
    window.location.href = "private_chat.html";
  }
};

// Join Room
document.getElementById("join-room-submit").onclick = () => {
  const username = prompt("Enter your name:");
  const roomCode = document.getElementById("join-room-id").value.trim();
  if (!roomCode) {
    document.getElementById("error-msg").textContent = "Please enter a Room ID.";
    return;
  }
  if (username) {
    localStorage.setItem("username", username);
    localStorage.setItem("roomCode", roomCode);
    window.location.href = "private_chat.html";
  }
};

// Example: When creating a room, generate a random code and display it
document.getElementById("create-btn").onclick = () => {
  document.getElementById("create-room-section").classList.remove("hidden");
  document.getElementById("join-room-section").classList.add("hidden");
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById("created-room-id").textContent = code;
};
