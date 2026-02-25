const chatBox = document.getElementById("chatBox");

// ===== CHAT =====
async function sendMessage() {
  const input = document.getElementById("inputText");

  if (!input.value.trim()) return;

  // USER MESSAGE
  const userBubble = document.createElement("div");
  userBubble.className = "bubble user";
  userBubble.innerText = input.value;
  chatBox.appendChild(userBubble);

  input.value = "";

  // AI BUBBLE
  const aiBubble = document.createElement("div");
  aiBubble.className = "bubble ai";
  chatBox.appendChild(aiBubble);

  // Thinking animation
  aiBubble.innerHTML = `
    <div class="typing-dots">
      <span>.</span><span>.</span><span>.</span>
    </div>
  `;

  chatBox.scrollTop = chatBox.scrollHeight;

  setTimeout(() => {
    const aiResponse =
      "⚡ BrainRack is processing your request with advanced neural intelligence systems.";

    typeText(aiBubble, aiResponse);
  }, 1200);
}

function typeText(element, text) {
  element.innerHTML = "";
  element.classList.add("typing-text");

  let i = 0;

  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      chatBox.scrollTop = chatBox.scrollHeight;
      setTimeout(typing, 25);
    } else {
      element.classList.remove("typing-text");
    }
  }

  typing();
}

// ===== IMAGE =====
async function generateImage() {
  const prompt = document.getElementById("image-prompt").value;
  if (!prompt) return;

  const resultDiv = document.getElementById("image-result");
  resultDiv.innerHTML = "Generating...";

  try {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    const imageUrl = data.data[0].url; // ✅ Use backend response

    resultDiv.innerHTML = `
      <img src="${imageUrl}" style="max-width:100%; border-radius:15px;" />
      <br/>
      <a href="${imageUrl}" download target="_blank">
        <button style="margin-top:10px;">Download Image</button>
      </a>
    `;
  } catch (err) {
    resultDiv.innerHTML = "Image generation failed.";
  }
}