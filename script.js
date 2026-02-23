const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

if (sendBtn && inputField && chatBox) {

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

}

const bg = document.getElementById("animated-bg");

if (bg) {
  for (let i = 0; i < 50; i++) {
    const circuit = document.createElement("div");
    circuit.className = "circuit";
    circuit.style.left = Math.random() * window.innerWidth + "px";
    circuit.style.height = 50 + Math.random() * 150 + "px";
    circuit.style.animationDuration = 5 + Math.random() * 10 + "s";
    circuit.style.opacity = Math.random();
    bg.appendChild(circuit);
  }
}

async function sendMessage() {
  const message = inputField.value.trim();
  if (!message) return;

  addMessage(message, "user");
  inputField.value = "";

  addMessage("Thinking...", "bot");

  try {
    const response = await fetch("https://brainrack.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    chatBox.lastChild.remove();

    if (data.reply) {
       addMessage(data.reply, "bot");
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

    imageResult.innerHTML = "<p class='loading'>Generating the image...⚡</p>";

    try {
      const res = await fetch("https://brainrack.onrender.com/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      if (data.image) {
         imageResult.innerHTML = `
            <img src="${data.image}" class="generated-image"/>
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

// Three Dot Toggle
function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}
document.addEventListener("click", function (event) {
  const menu = document.getElementById("dropdownMenu");
  const icon = document.querySelector(".menu-icon");

  if (!icon.contains(event.target) && !menu.contains(event.target)) {
    menu.style.display = "none";
  }
});