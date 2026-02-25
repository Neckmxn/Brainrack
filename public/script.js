app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const chatBox = document.getElementById("chat-box");

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  // Create empty bot message container
  const botMessageDiv = document.createElement("div");
  botMessageDiv.classList.add("message", "bot");
  chatBox.appendChild(botMessageDiv);

  chatBox.scrollTop = chatBox.scrollHeight;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let done = false;
  let fullText = "";

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;

    const chunk = decoder.decode(value || new Uint8Array());
    fullText += chunk;

    botMessageDiv.textContent = fullText;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== IMAGE =====
async function generateImage() {
  const prompt = document.getElementById("image-prompt").value;
  if (!prompt) return;

  const resultDiv = document.getElementById("image-result");
  resultDiv.innerHTML = "Generating...";

  const res = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  const imageUrl = data.data[0].url;

  resultDiv.innerHTML = `<img src="${imageUrl}" />`;
}