/* ==============================
   BRAINRACK AI - GLOBAL SCRIPT
============================== */

/* ========= GLOBAL STATE ========= */

let speakMode = false;

let voiceSettings = {
  voiceIndex: 0,
  rate: 1,
  pitch: 1,
  volume: 1
};

let voices = [];

/* ========= INIT ========= */

window.onload = () => {
  loadVoices();
  setupMenu();
  loadTheme();
};

/* ========= LOAD AVAILABLE VOICES ========= */

function loadVoices() {
  voices = speechSynthesis.getVoices();
  if (!voices.length) {
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
    };
  }
}

/* ========= THREE DOT MENU ========= */

function setupMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");

  if (!menuBtn || !menu) return;

  menuBtn.onclick = (e) => {
    e.stopPropagation();
    menu.style.display =
      menu.style.display === "block" ? "none" : "block";
  };

  document.onclick = (e) => {
    if (!menu.contains(e.target)) {
      menu.style.display = "none";
    }
  };
}

/* ========= THEME TOGGLE ========= */

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
}

function loadTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "light") {
    document.body.classList.add("light");
  }
}

/* ========= TYPING EFFECT ========= */

function typeEffect(element, text) {
  let i = 0;
  element.innerHTML = "";
  const interval = setInterval(() => {
    element.innerHTML += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 15);
}

/* ========= SPEECH (TEXT TO VOICE) ========= */

function speak(text) {
  if (!speakMode) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices[voiceSettings.voiceIndex];
  utterance.rate = voiceSettings.rate;
  utterance.pitch = voiceSettings.pitch;
  utterance.volume = voiceSettings.volume;

  speechSynthesis.speak(utterance);
}

/* ========= UPDATE VOICE SETTINGS ========= */

function updateVoiceSettings() {
  voiceSettings.voiceIndex =
    document.getElementById("voiceSelect").value;
  voiceSettings.rate =
    document.getElementById("rateRange").value;
  voiceSettings.pitch =
    document.getElementById("pitchRange").value;
  voiceSettings.volume =
    document.getElementById("volumeRange").value;
}

/* ========= VOICE INPUT ========= */

const recognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition
    ? new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)()
    : null;

if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "auto";

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById("userInput").value = text;
  };
}

function startVoiceInput() {
  speakMode = true;
  if (recognition) recognition.start();
}

/* ========= AI CHAT ========= */

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");

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

  const aiMsg = document.createElement("div");
  aiMsg.className = "ai";
  chatBox.appendChild(aiMsg);

  typeEffect(aiMsg, data.reply);

  speak(data.reply);

  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ========= ADD MESSAGE ========= */

function addMessage(text, sender) {
  const chatBox = document.getElementById("chatBox");
  const msg = document.createElement("div");
  msg.className = sender;
  msg.innerText = text;
  chatBox.appendChild(msg);
}

/* ========= IMAGE GENERATOR ========= */

async function generateImage() {
  const prompt = document.getElementById("imagePrompt").value;

  const res = await fetch("/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  document.getElementById("imageResult").src = data.image;
}

/* ========= WEATHER ========= */

async function loadWeather(city) {
  const res = await fetch(`/weather/${city}`);
  const data = await res.json();

  document.getElementById("weatherTemp").innerText =
    data.main.temp + "°C";
  document.getElementById("weatherDesc").innerText =
    data.weather[0].description;
}

function enableWeatherNotification() {
  Notification.requestPermission();
}

function notifyWeather(text) {
  if (Notification.permission === "granted") {
    new Notification("Weather Update", { body: text });
  }
}

/* ========= NEWS ========= */

async function loadNews(category) {
  const res = await fetch(`/news/${category}`);
  const data = await res.json();

  const container = document.getElementById("newsContainer");
  container.innerHTML = "";

  data.articles.slice(0, 5).forEach((article) => {
    const div = document.createElement("div");
    div.className = "news-card";
    div.innerHTML = `
      <h3>${article.title}</h3>
      <p>${article.description || ""}</p>
    `;
    container.appendChild(div);
  });
}

function notifyNews(title) {
  if (Notification.permission === "granted") {
    new Notification("News Alert", { body: title });
  }
}