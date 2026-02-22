const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}

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

const bg = document.getElementById("animated-bg");

for (let i = 0; i < 50; i++) {
  const circuit = document.createElement("div");
  circuit.className = "circuit";
  circuit.style.left = Math.random() * window.innerWidth + "px";
  circuit.style.height = 50 + Math.random() * 150 + "px";
  circuit.style.animationDuration = 5 + Math.random() * 10 + "s";
  circuit.style.opacity = Math.random();
  bg.appendChild(circuit);
}

async function sendMessage() {
  const message = inputField.value.trim();
  if (!message) return;

  addMessage(message, "user");
  inputField.value = "";

  addMessage("Thinking...", "bot");

  try {
    const response = await fetch("https://brainrack.onrender.com", {
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
// ================= IMAGE GENERATION PAGE =================

const generateBtn = document.getElementById("generate-image-btn");

if (generateBtn) {
  generateBtn.addEventListener("click", async () => {

    console.log("Image button clicked");

    const imagePrompt = document.getElementById("image-prompt");
    const imageResult = document.getElementById("image-result");

    const prompt = imagePrompt.value.trim();
    if (!prompt) return;

    imageResult.innerHTML = "<p class='loading'>Generating futuristic image... ⚡</p>";

    try {
      const res = await fetch("https://brainrack.onrender.com/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      if (data.imageUrl) {
        imageResult.innerHTML = `
          <img src="${data.imageUrl}" class="generated-image"/>
        `;
      } else {
        imageResult.innerHTML = "Image generation failed ❌";
      }

    } catch (error) {
      console.error(error);
      imageResult.innerHTML = "Server error ❌";
    }

  });
}