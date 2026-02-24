/* ===============================
   GLOBAL ELEMENTS
================================ */

const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const generateBtn = document.getElementById("generate-image-btn");
const docForm = document.getElementById("docForm");


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

  const thinkingDiv = document.createElement("div");
  thinkingDiv.classList.add("message", "bot");
  thinkingDiv.innerHTML = `
  <div class="typing">
    <span>.</span><span>.</span><span>.</span>
  </div>
`;
  chatBox.appendChild(thinkingDiv);

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    thinkingDiv.remove();

    if (!response.ok) {
      addMessage("Error: " + (data.error || "Something went wrong"), "bot");
      return;
    }

    addMessage(data.reply || "No response from AI.", "bot");

  } catch (error) {
    console.error("CHAT ERROR:", error);
    thinkingDiv.remove();
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
   IMAGE GENERATION (FIXED)
================================ */

if (generateBtn) {
  generateBtn.addEventListener("click", async () => {

    const imagePrompt = document.getElementById("image-prompt");
    const imageResult = document.getElementById("image-result");

    if (!imagePrompt || !imageResult) return;

    const prompt = imagePrompt.value.trim();
    if (!prompt) return;

    imageResult.innerHTML = '<div class="spinner"></div>';

    try {

      const res = await fetch("/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        const errorData = await res.json();
        imageResult.innerHTML =
          "<p style='color:red;'>Error: " +
          (errorData.error || "Image generation failed ❌") +
          "</p>";
        return;
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      imageResult.innerHTML = `
        <img src="${imageUrl}" class="generated-image"/>
      `;

    } catch (error) {
      console.error("IMAGE ERROR:", error);
      imageResult.innerHTML = "Server error ❌";
    }
  });
}


/* ===============================
   DOCUMENT SOLVER (PDF + DOCX)
================================ */

if (docForm) {
  docForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const docResult = document.getElementById("docResult");
    const formData = new FormData(docForm);

    if (docResult) {
      docResult.innerHTML = '<div class="spinner"></div>';
    }

    try {
      const response = await fetch("/solve-document", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        docResult.innerHTML =
          "<p style='color:red;'>Error: " +
          (data.error || "Document analysis failed ❌") +
          "</p>";
        return;
      }

      docResult.innerText =
        data.solution || "No solution generated.";

    } catch (error) {
      console.error("DOCUMENT ERROR:", error);
      docResult.innerHTML = "Server error ❌";
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

  menu.style.display =
    menu.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", function (event) {
  const menu = document.getElementById("dropdownMenu");
  const icon = document.querySelector(".menu-icon");

  if (!menu || !icon) return;

  if (!icon.contains(event.target) &&
      !menu.contains(event.target)) {
    menu.style.display = "none";

function toggleTheme() {
  document.body.classList.toggle("light-mode");
}
  }
});