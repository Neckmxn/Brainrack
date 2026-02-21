const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", sendMessage);

inputField.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function addMessage(text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);
  messageDiv.innerText = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = inputField.value.trim();
  if (!message) return;

  addMessage(message, "user");
  inputField.value = "";

  addMessage("Thinking...", "bot");

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    chatBox.lastChild.remove();

    if (Array.isArray(data)) {
      addMessage(data[0]?.generated_text || "No response", "bot");
    } else if (data.error) {
      addMessage("Error: " + data.error, "bot");
    } else {
      addMessage("No response from AI.", "bot");
    }

  } catch (error) {
    chatBox.lastChild.remove();
    addMessage("Server error. Check backend.", "bot");
  }
}