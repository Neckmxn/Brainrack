async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");

  const userText = input.value;
  chatBox.innerHTML += `<p><b>You:</b> ${userText}</p>`;

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText })
  });

  const data = await res.json();
  chatBox.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
  input.value = "";
}

async function generateImage() {
  const prompt = document.getElementById("imagePrompt").value;
  const result = document.getElementById("imageResult");

  result.innerHTML = "Generating...";

  const res = await fetch("/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  result.innerHTML = `<img src="${data.image}" width="400">`;
}