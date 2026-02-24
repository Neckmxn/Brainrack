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

window.addEventListener("load", () => {
  loadVoices();
  setupMenu();
  loadTheme();
  registerServiceWorker();
});

/* ========= LOAD VOICES ========= */

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

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display =
      menu.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) {
      menu.style.display = "none";
    }
  });
}

/* ========= THEME ========= */

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

/* ========= TEXT TO SPEECH ========= */

function speak(text) {
  if (!speakMode) return;

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.voice = voices[voiceSettings.voiceIndex] || null;
  utterance.rate = Number(voiceSettings.rate);
  utterance.pitch = Number(voiceSettings.pitch);
  utterance.volume = Number(voiceSettings.volume);

  speechSynthesis.speak(utterance);
}

/* ========= UPDATE VOICE SETTINGS ========= */

function updateVoiceSettings() {
  voiceSettings.voiceIndex =
    Number(document.getElementById("voiceSelect")?.value || 0);

  voiceSettings.rate =
    Number(document.getElementById("rateRange")?.value || 1);

  voiceSettings.pitch =
    Number(document.getElementById("pitchRange")?.value || 1);

  voiceSettings.volume =
    Number(document.getElementById("volumeRange")?.value || 1);
}

/* ========= VOICE INPUT ========= */

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = SpeechRecognition
  ? new SpeechRecognition()
  : null;

if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = navigator.language || "en-US";

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById("userInput").value = text;
  };

  recognition.onerror = (err) => {
    console.error("Speech recognition error:", err);
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

  try {
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

  } catch (error) {
    console.error(error);
  }
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
  const prompt =
    document.getElementById("imagePrompt").value;

  try {
    const res = await fetch("/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    document.getElementById("imageResult").src =
      data.image;

  } catch (error) {
    console.error(error);
  }
}

/* ========= WEATHER (AUTO LOCATION) ========= */

async function loadWeatherAuto() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const res = await fetch(
        `/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
      );

      const data = await res.json();

      document.getElementById("weatherTemp").innerText =
        data.main.temp + "°C";

      document.getElementById("weatherDesc").innerText =
        data.weather[0].description;

    } catch (err) {
      console.error(err);
    }
  });
}

/* ========= WEATHER NOTIFICATION ========= */

function enableWeatherNotification() {
  Notification.requestPermission();
}

function notifyWeather(text) {
  if (Notification.permission === "granted") {
    new Notification("Brainrack Weather", {
      body: text
    });
  }
}

/* ========= NEWS ========= */

async function loadNews() {
  try {
    const res = await fetch("/news");
    const data = await res.json();

    const container =
      document.getElementById("newsContainer");

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

  } catch (error) {
    console.error(error);
  }
}

/* ========= SERVICE WORKER ========= */

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() =>
        console.log("Service Worker Registered")
      )
      .catch((err) =>
        console.error("SW Error:", err)
      );
  }
}