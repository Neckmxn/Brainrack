async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();
  if (!userText) return;

  chatBox.innerHTML += `<p><b>You:</b> ${userText}</p>`;
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText })
    });

    const data = await res.json();
    chatBox.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    chatBox.innerHTML += `<p><b>AI:</b> Error generating response</p>`;
  }
}
async function generateImage() {
  const prompt = document.getElementById("imagePrompt").value.trim();
  const resultDiv = document.getElementById("imageResult");
  if (!prompt) return;

  resultDiv.innerHTML = "Generating image...";
  
  try {
    const res = await fetch("/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    if (data.imageUrl) {
      resultDiv.innerHTML = `<img src="${data.imageUrl}" alt="Generated Image">`;
    } else {
      resultDiv.innerHTML = "Failed to generate image.";
    }
  } catch (err) {
    resultDiv.innerHTML = "Error generating image.";
  }
}