const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const historyList = document.getElementById("historyList");

let currentChat = [];

/* ================= MESSAGE ================= */

function addMessage(text, sender) {

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.innerText = text;

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  currentChat.push({ sender, text });
}

/* ================= SEND MESSAGE ================= */

async function sendMessage() {

  const message = inputField.value.trim();
  if (!message) return;

  addMessage(message, "user");
  inputField.value = "";

  const thinking = document.createElement("div");
  thinking.classList.add("message", "bot");
  thinking.innerText = "Thinking...";
  chatBox.appendChild(thinking);

  try {

    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    thinking.remove();

    addMessage(data.reply || "No response", "bot");

  } catch (error) {
    thinking.remove();
    addMessage("Server error", "bot");
  }
}

/* ================= NEW CHAT ================= */

function newChat() {
  if (currentChat.length > 0) {
    saveChat();
  }

  chatBox.innerHTML = "";
  currentChat = [];
}

/* ================= SAVE CHAT ================= */

function saveChat() {

  const chats = JSON.parse(localStorage.getItem("brainrack_chats")) || [];
  chats.push(currentChat);
  localStorage.setItem("brainrack_chats", JSON.stringify(chats));

  loadHistory();
}

/* ================= LOAD HISTORY ================= */

function loadHistory() {

  const chats = JSON.parse(localStorage.getItem("brainrack_chats")) || [];
  historyList.innerHTML = "";

  chats.forEach((chat, index) => {

    const item = document.createElement("div");
    item.classList.add("history-item");
    item.innerText = chat[0]?.text.slice(0, 30) || "Chat";

    item.onclick = () => loadChat(index);

    historyList.appendChild(item);
  });
}

function loadChat(index) {

  const chats = JSON.parse(localStorage.getItem("brainrack_chats")) || [];
  currentChat = chats[index];

  chatBox.innerHTML = "";

  currentChat.forEach(msg => {
    addMessage(msg.text, msg.sender);
  });
}

/* ================= LISTENERS ================= */

sendBtn.addEventListener("click", sendMessage);

inputField.addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});

/* ================= INIT ================= */

loadHistory();