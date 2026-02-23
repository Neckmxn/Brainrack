/* ===============================
   GLOBAL ELEMENTS
================================ */

const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const generateBtn = document.getElementById("generate-image-btn");


/* ===============================
   CHAT FUNCTIONS
================================ */

function addMessage(text, className) {
  if (!chatBox) return;

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);
  messageDiv.innerText = text;

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  if (!inputField) return;

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

    console.log("CHAT RESPONSE:", data);

    // Remove "Thinking..."
    if (chatBox.lastChild) {
      chatBox.lastChild.remove();
    }

    if (!response.ok) {
      addMessage("Error: " + (data.error || "Something went wrong"), "bot");
      return;
    }

    if (data.reply) {
      addMessage(data.reply, "bot");
    } else {
      addMessage("No response from AI.", "bot");
    }

  } catch (error) {
    console.error("CHAT ERROR:", error);

    if (chatBox.lastChild) {
      chatBox.lastChild.remove();
    }

    addMessage("Server error. Check backend.", "bot");
  }
}

/* Attach chat listeners */
if (sendBtn && inputField) {
  sendBtn.addEventListener("click", sendMessage);

  inputField.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}


/* ===============================
   IMAGE GENERATION
================================ */

if (generateBtn) {
  generateBtn.addEventListener("click", async () => {

    const imagePrompt = document.getElementById("image-prompt");
    const imageResult = document.getElementById("image-result");

    if (!imagePrompt || !imageResult) return;

    const prompt = imagePrompt.value.trim();
    if (!prompt) return;

    imageResult.innerHTML = "<p class='loading'>Generating image... ⚡</p>";

    try {
const res = await fetch("/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt })
});

const blob = await res.blob();
const imageUrl = URL.createObjectURL(blob);

imageResult.innerHTML = `<img src="${imageUrl}" class="generated-image"/>`;

      if (!res.ok) {
        imageResult.innerHTML =
          "<p style='color:red;'>Error: " +
          (data.error || "Image generation failed ❌") +
          "</p>";
        return;
      }

      if (data.image) {
        imageResult.innerHTML = `
          <img src="${data.image}" class="generated-image"/>
        `;
      } else {
        imageResult.innerHTML = "Image generation failed ❌";
      }

    } catch (error) {
      console.error("IMAGE ERROR:", error);
      imageResult.innerHTML = "Server error ❌";
    }
  });
}


/* ===============================
   ANIMATED BACKGROUND
================================ */

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


/* ===============================
   THREE DOT MENU
================================ */

function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  if (!menu) return;

  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", function (event) {
  const menu = document.getElementById("dropdownMenu");
  const icon = document.querySelector(".menu-icon");

  if (!menu || !icon) return;

  if (!icon.contains(event.target) && !menu.contains(event.target)) {
    menu.style.display = "none";
  }
});