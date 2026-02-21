async function sendMessage() {
  const input = document.getElementById("input").value;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-base",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: input })
    }
  );

  const data = await response.json();
  document.getElementById("output").innerText = 
      data[0]?.generated_text || "No response";
}
