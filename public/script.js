const chatBox = document.getElementById("chat-box");

// ========== CHAT ==========
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");

  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  addMessage(data.reply, "bot");
}

function addMessage(text, type) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");

  div.classList.add("message", type);
  div.innerText = text;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}


// ========== IMAGE ==========
async function generateImage() {
  const promptInput = document.getElementById("imagePrompt");
  const resultDiv = document.getElementById("imageResult");

  if (!promptInput) return;

  const prompt = promptInput.value.trim();
  if (!prompt) return;

  resultDiv.innerHTML = "Generating...";

  const res = await fetch("/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  if (data.image) {
    resultDiv.innerHTML = `<img src="${data.image}" />`;
  } else {
    resultDiv.innerHTML = "Failed to generate image.";
  }
}

  resultDiv.innerHTML = `
  <img src="${imageUrl}" />
  <br/>
  <a href="${imageUrl}" download target="_blank">
    <button style="margin-top:10px;">Download Image</button>
  </a>
`;
}