// ============== GLOBAL STATE ==============
const AppState = {
  theme: localStorage.getItem('brainrack-theme') || 'dark',
  voiceSettings: JSON.parse(localStorage.getItem('brainrack-voice') || '{}'),
  profile: JSON.parse(localStorage.getItem('brainrack-profile') || '{}'),
  menuOpen: false,
  settingsOpen: false,
  profileOpen: false,
  chatHistory: [],
  isRecording: false,
  recognition: null,
  currentLanguage: 'en-US',
  weatherNotify: false,
  newsNotify: false,
  pushSubscription: null
};

// Default voice settings
if (!AppState.voiceSettings.model) {
  AppState.voiceSettings = {
    model: 0,
    speed: 1,
    pitch: 1,
    volume: 1
  };
}

if (!AppState.profile.name) {
  AppState.profile = {
    name: 'User',
    email: ''
  };
}

// ============== INITIALIZATION ==============
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(AppState.theme);
  initNavbar();
  initMenu();
  initPageSpecific();
});

// ============== THEME ==============
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  AppState.theme = theme;
  localStorage.setItem('brainrack-theme', theme);
}

function toggleTheme() {
  const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

// ============== NAVBAR ==============
function initNavbar() {
  // Create navbar if not exists
  if (!document.querySelector('.navbar')) return;
}

function goHome() {
  window.location.href = '/';
}

// ============== THREE DOT MENU ==============
function initMenu() {
  const overlay = document.querySelector('.menu-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      closeAllModals();
    }
  });
}

function toggleMenu() {
  const menu = document.querySelector('.three-dot-menu');
  const overlay = document.querySelector('.menu-overlay');
  if (!menu) return;

  AppState.menuOpen = !AppState.menuOpen;
  menu.classList.toggle('active', AppState.menuOpen);
  overlay.classList.toggle('active', AppState.menuOpen);
}

function closeMenu() {
  const menu = document.querySelector('.three-dot-menu');
  const overlay = document.querySelector('.menu-overlay');
  if (menu) menu.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  AppState.menuOpen = false;
}

function navigateTo(page) {
  closeMenu();
  window.location.href = page;
}

// ============== MODALS ==============
function openSettings() {
  closeMenu();
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.classList.add('active');
    loadVoiceSettings();
  }
}

function openProfile() {
  closeMenu();
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.add('active');
    loadProfile();
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// ============== VOICE SETTINGS ==============
function loadVoiceSettings() {
  const speedSlider = document.getElementById('voiceSpeed');
  const pitchSlider = document.getElementById('voicePitch');
  const volumeSlider = document.getElementById('voiceVolume');
  const modelSelect = document.getElementById('voiceModel');

  if (speedSlider) speedSlider.value = AppState.voiceSettings.speed;
  if (pitchSlider) pitchSlider.value = AppState.voiceSettings.pitch;
  if (volumeSlider) volumeSlider.value = AppState.voiceSettings.volume;
  if (modelSelect) modelSelect.value = AppState.voiceSettings.model;

  updateRangeDisplays();
}

function updateVoiceSetting(setting, value) {
  AppState.voiceSettings[setting] = parseFloat(value);
  localStorage.setItem('brainrack-voice', JSON.stringify(AppState.voiceSettings));
  updateRangeDisplays();
}

function updateRangeDisplays() {
  const speedVal = document.getElementById('speedValue');
  const pitchVal = document.getElementById('pitchValue');
  const volumeVal = document.getElementById('volumeValue');

  if (speedVal) speedVal.textContent = AppState.voiceSettings.speed + 'x';
  if (pitchVal) pitchVal.textContent = AppState.voiceSettings.pitch;
  if (volumeVal) volumeVal.textContent = Math.round(AppState.voiceSettings.volume * 100) + '%';
}

// ============== PROFILE ==============
function loadProfile() {
  const nameInput = document.getElementById('profileName');
  const emailInput = document.getElementById('profileEmail');
  if (nameInput) nameInput.value = AppState.profile.name;
  if (emailInput) emailInput.value = AppState.profile.email;
}

function saveProfile() {
  const nameInput = document.getElementById('profileName');
  const emailInput = document.getElementById('profileEmail');
  if (nameInput) AppState.profile.name = nameInput.value;
  if (emailInput) AppState.profile.email = emailInput.value;
  localStorage.setItem('brainrack-profile', JSON.stringify(AppState.profile));
  showToast('Profile saved successfully!', 'success');
  closeModal('profileModal');
}

// ============== TOAST NOTIFICATIONS ==============
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  };

  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============== SPEECH RECOGNITION ==============
function initSpeechRecognition(callback) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Speech recognition not supported in this browser', 'error');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const lang = event.results[0][0].lang || recognition.lang;
    AppState.currentLanguage = recognition.lang;
    callback(transcript, true);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    AppState.isRecording = false;
    updateVoiceButton();
    if (event.error !== 'no-speech') {
      showToast('Voice input error: ' + event.error, 'error');
    }
  };

  recognition.onend = () => {
    AppState.isRecording = false;
    updateVoiceButton();
  };

  return recognition;
}

function toggleVoiceInput(callback) {
  if (AppState.isRecording) {
    if (AppState.recognition) {
      AppState.recognition.stop();
    }
    AppState.isRecording = false;
    updateVoiceButton();
    return;
  }

  if (!AppState.recognition) {
    AppState.recognition = initSpeechRecognition(callback);
  }

  if (AppState.recognition) {
    // Auto-detect language or use default
    AppState.recognition.lang = '';
    try {
      AppState.recognition.start();
      AppState.isRecording = true;
      updateVoiceButton();
      showToast('Listening... Speak now', 'info');
    } catch (e) {
      console.error('Start recognition error:', e);
    }
  }
}

function updateVoiceButton() {
  const voiceBtn = document.querySelector('.voice-btn');
  if (voiceBtn) {
    voiceBtn.classList.toggle('recording', AppState.isRecording);
    voiceBtn.innerHTML = AppState.isRecording ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-microphone"></i>';
  }
}

// ============== TEXT TO SPEECH ==============
function speakText(text, lang) {
  if (!window.speechSynthesis) {
    showToast('Text-to-speech not supported', 'error');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = AppState.voiceSettings.speed || 1;
  utterance.pitch = AppState.voiceSettings.pitch || 1;
  utterance.volume = AppState.voiceSettings.volume || 1;

  if (lang) utterance.lang = lang;

  // Apply voice model
  const voices = window.speechSynthesis.getVoices();
  const modelIndex = parseInt(AppState.voiceSettings.model) || 0;
  if (voices.length > modelIndex) {
    utterance.voice = voices[modelIndex];
  }

  window.speechSynthesis.speak(utterance);
}

// Load voices
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    populateVoiceModels();
  };
}

function populateVoiceModels() {
  const select = document.getElementById('voiceModel');
  if (!select) return;

  const voices = window.speechSynthesis.getVoices();
  select.innerHTML = '';

  voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    select.appendChild(option);
  });

  select.value = AppState.voiceSettings.model || 0;
}

// ============== TYPING ANIMATION ==============
function typeText(element, text, speed = 15) {
  return new Promise((resolve) => {
    let i = 0;
    element.innerHTML = '';

    function type() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;

        // Auto-scroll
        const container = element.closest('.chat-container') || element.closest('.result-area');
        if (container) container.scrollTop = container.scrollHeight;

        setTimeout(type, speed);
      } else {
        // Parse markdown after complete
        element.innerHTML = parseMarkdown(text);
        resolve();
      }
    }

    type();
  });
}

// ============== MARKDOWN PARSER ==============
function parseMarkdown(text) {
  if (!text) return '';

  let html = text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Lists
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap loose li items
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  // Clean up double ul tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  return `<p>${html}</p>`;
}

// ============== STREAMING CHAT ==============
async function streamChat(messages, onChunk, onDone, model) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            if (onDone) onDone(fullText);
            return fullText;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullText += parsed.content;
              if (onChunk) onChunk(parsed.content, fullText);
            }
          } catch (e) { }
        }
      }
    }

    if (onDone) onDone(fullText);
    return fullText;
  } catch (error) {
    console.error('Stream error:', error);
    showToast('Failed to get AI response', 'error');
    if (onDone) onDone('');
    return '';
  }
}

// ============== PUSH NOTIFICATIONS ==============
async function subscribePush(type) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast('Push notifications not supported', 'error');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showToast('Notification permission denied', 'error');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');

    // Get VAPID key
    const keyRes = await fetch('/api/vapid-public-key');
    const { key } = await keyRes.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });

    // Send subscription to server
    await fetch(`/api/subscribe/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    AppState.pushSubscription = subscription;
    showToast(`Subscribed to ${type} notifications!`, 'success');
    return true;
  } catch (error) {
    console.error('Push subscription error:', error);
    showToast('Failed to subscribe to notifications', 'error');
    return false;
  }
}

async function unsubscribePush(type) {
  if (AppState.pushSubscription) {
    try {
      await fetch(`/api/unsubscribe/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: AppState.pushSubscription.endpoint })
      });
      await AppState.pushSubscription.unsubscribe();
      AppState.pushSubscription = null;
      showToast(`Unsubscribed from ${type} notifications`, 'info');
    } catch (e) {
      console.error('Unsubscribe error:', e);
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============== PAGE SPECIFIC INITIALIZATION ==============
function initPageSpecific() {
  const page = document.body.dataset.page;

  switch (page) {
    case 'chat':
      initChatPage();
      break;
    case 'image':
      initImagePage();
      break;
    case 'document':
      initDocumentPage();
      break;
    case 'video':
      initVideoPage();
      break;
    case 'business':
      initBusinessPage();
      break;
    case 'startup':
      initStartupPage();
      break;
    case 'weather':
      initWeatherPage();
      break;
    case 'news':
      initNewsPage();
      break;
    case 'dashboard':
      initDashboard();
      break;
  }

  // Populate voice models after a short delay
  setTimeout(populateVoiceModels, 500);
}

// ============== CHAT PAGE ==============
function initChatPage() {
  const textarea = document.getElementById('chatInput');
  if (!textarea) return;

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Auto-resize textarea
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });
}

async function sendChatMessage(voiceInput = false) {
  const input = document.getElementById('chatInput');
  const container = document.getElementById('chatContainer');
  if (!input || !container) return;

  const text = input.value.trim();
  if (!text) return;

  // Add user message
  addMessage(container, text, 'user');
  input.value = '';
  input.style.height = 'auto';

  // Add AI typing indicator
  const aiMsgDiv = addMessage(container, '', 'ai', true);
  const contentDiv = aiMsgDiv.querySelector('.message-content');

  // Build messages history
  AppState.chatHistory.push({ role: 'user', content: text });

  const messages = [
    {
      role: 'system',
      content: 'You are Brainrack AI, a helpful, intelligent assistant. Be concise, clear, and informative. Use markdown formatting when helpful. If the user speaks in a specific language, always respond in that same language.'
    },
    ...AppState.chatHistory.slice(-20) // Last 20 messages for context
  ];

  // Stream response
  let fullResponse = '';
  await streamChat(messages, (chunk, full) => {
    fullResponse = full;
    contentDiv.innerHTML = parseMarkdown(full);
    container.scrollTop = container.scrollHeight;
  }, (finalText) => {
    AppState.chatHistory.push({ role: 'assistant', content: finalText });

    // Speak if voice input was used
    if (voiceInput && finalText) {
      speakText(finalText, AppState.currentLanguage);
    }
  });
}

function addMessage(container, text, type, isTyping = false) {
  // Remove empty state
  const emptyState = container.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const div = document.createElement('div');
  div.className = `message ${type}`;

  const avatar = type === 'ai' ? '🧠' : '👤';

  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      ${isTyping ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : parseMarkdown(text)}
    </div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function handleChatVoice() {
  toggleVoiceInput((transcript, isVoice) => {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = transcript;
      sendChatMessage(isVoice);
    }
  });
}

// ============== IMAGE PAGE ==============
function initImagePage() {
  // Initialize
}

async function generateImage() {
  const prompt = document.getElementById('imagePrompt')?.value.trim();
  const style = document.getElementById('imageStyle')?.value;
  const resultArea = document.getElementById('imageResult');
  const btn = document.getElementById('generateBtn');

  if (!prompt) {
    showToast('Please enter a prompt', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Generating...';
  resultArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style })
    });

    const data = await response.json();

    if (data.image) {
      resultArea.innerHTML = `
        <img src="${data.image}" alt="${data.description}" style="max-width:100%;border-radius:12px;">
        <p style="margin-top:12px;color:var(--text-secondary);text-align:center;">${prompt}</p>
      `;
    } else {
      resultArea.innerHTML = parseMarkdown(data.description || data.message || 'Unable to generate image.');
    }
  } catch (error) {
    resultArea.innerHTML = '<p style="color:#e74c3c;">Failed to generate image. Please try again.</p>';
    showToast('Image generation failed', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-magic"></i> Generate Image';
}

async function enhanceImage() {
  const fileInput = document.getElementById('enhanceFile');
  const enhancement = document.getElementById('enhanceType')?.value;
  const resultArea = document.getElementById('enhanceResult');
  const btn = document.getElementById('enhanceBtn');

  if (!fileInput?.files[0]) {
    showToast('Please upload an image', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Analyzing...';
  resultArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);
  formData.append('enhancement', enhancement);

  try {
    const response = await fetch('/api/enhance-image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    resultArea.innerHTML = `
      <img src="${data.originalImage}" alt="Original" style="max-width:100%;border-radius:12px;margin-bottom:16px;">
      <h3 style="color:var(--accent-light);margin-bottom:8px;">Enhancement Analysis</h3>
      ${parseMarkdown(data.suggestions)}
    `;
  } catch (error) {
    resultArea.innerHTML = '<p style="color:#e74c3c;">Failed to analyze image.</p>';
    showToast('Image enhancement failed', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Enhance Image';
}

function updateFileName(inputId, displayId) {
  const input = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (input?.files[0] && display) {
    display.textContent = input.files[0].name;
  }
}

// ============== DOCUMENT PAGE ==============
function initDocumentPage() {
  // Initialize
}

async function analyzeDocument(action) {
  const fileInput = document.getElementById('docFile');
  const question = document.getElementById('docQuestion')?.value.trim();
  const resultArea = document.getElementById('docResult');

  if (!fileInput?.files[0] && !question) {
    showToast('Please upload a document or enter a question', 'error');
    return;
  }

  // Disable all action buttons
  document.querySelectorAll('.doc-action-btn').forEach(b => b.disabled = true);
  resultArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const formData = new FormData();
  if (fileInput?.files[0]) formData.append('document', fileInput.files[0]);
  formData.append('action', action);
  if (question) formData.append('question', question);

  try {
    const response = await fetch('/api/analyze-document', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    resultArea.innerHTML = parseMarkdown(data.result || 'No result generated.');
  } catch (error) {
    resultArea.innerHTML = '<p style="color:#e74c3c;">Failed to analyze document.</p>';
    showToast('Document analysis failed', 'error');
  }

  document.querySelectorAll('.doc-action-btn').forEach(b => b.disabled = false);
}

// ============== VIDEO PAGE ==============
function initVideoPage() {
  // Initialize
}

async function generateVideo() {
  const prompt = document.getElementById('videoPrompt')?.value.trim();
  const duration = document.getElementById('videoDuration')?.value;
  const style = document.getElementById('videoStyle')?.value;
  const resultArea = document.getElementById('videoResult');
  const btn = document.getElementById('videoBtn');

  if (!prompt) {
    showToast('Please enter a video concept', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Creating Storyboard...';
  resultArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration, style })
    });

    const data = await response.json();
    resultArea.innerHTML = parseMarkdown(data.storyboard || 'Failed to generate storyboard.');
  } catch (error) {
    resultArea.innerHTML = '<p style="color:#e74c3c;">Failed to generate video concept.</p>';
    showToast('Video generation failed', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-film"></i> Generate Video Concept';
}

// ============== BUSINESS PAGE ==============
function initBusinessPage() {
  // Initialize
}

async function solveBusiness() {
  const problem = document.getElementById('bizProblem')?.value.trim();
  const industry = document.getElementById('bizIndustry')?.value;
  const context = document.getElementById('bizContext')?.value.trim();
  const resultArea = document.getElementById('bizResult');
  const btn = document.getElementById('bizBtn');

  if (!problem) {
    showToast('Please describe the business problem', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Analyzing...';
  resultArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch('/api/business-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem, industry, context })
    });

    const data = await response.json();
    resultArea.innerHTML = parseMarkdown(data.solution || 'Unable to generate solution.');
  } catch (error) {
    resultArea.innerHTML = '<p style="color:#e74c3c;">Failed to solve problem.</p>';
    showToast('Business solution failed', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-lightbulb"></i> Solve Problem';
}

// ============== STARTUP PAGE ==============
function initStartupPage() {
  // Initialize
}

async function generateStartupIdeas() {
  const interests = document.getElementById('startupInterests')?.value.trim();
  const budget = document.getElementById('startupBudget')?.value;
  const skills = document.getElementById('startupSkills')?.value.trim();
  const market = document.getElementById('startupMarket')?.value.trim();
  const resultArea = document.getElementById('startupResult');
  const btn = document.getElementById('startupBtn');

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Generating Ideas...';
  resultArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch('/api/startup-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests, budget, skills, market })
    });

    const data = await response.json();
    resultArea.innerHTML = parseMarkdown(data.ideas || 'Unable to generate ideas.');
  } catch (error) {
    resultArea.innerHTML = '<p style="color:#e74c3c;">Failed to generate ideas.</p>';
    showToast('Startup ideas generation failed', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-rocket"></i> Generate Ideas';
}

// ============== WEATHER PAGE ==============
function initWeatherPage() {
  detectLocation();
}

function detectLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
        fetchForecast(position.coords.latitude, position.coords.longitude);
        fetchAirQuality(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Default to New York
        fetchWeather(null, null, 'New York');
        fetchForecast(null, null, 'New York');
      }
    );
  } else {
    fetchWeather(null, null, 'New York');
    fetchForecast(null, null, 'New York');
  }
}

async function searchWeather() {
  const query = document.getElementById('weatherSearch')?.value.trim();
  if (!query) return;

  fetchWeather(null, null, query);
  fetchForecast(null, null, query);
}

async function fetchWeather(lat, lon, q) {
  const container = document.getElementById('weatherMain');
  if (!container) return;

  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    let url = '/api/weather?';
    if (lat && lon) url += `lat=${lat}&lon=${lon}`;
    else if (q) url += `q=${encodeURIComponent(q)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      container.innerHTML = `<p style="color:#e74c3c;">City not found. Please try again.</p>`;
      return;
    }

    const weatherEmojis = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Smoke': '🌫️'
    };

    const mainWeather = data.weather[0].main;
    const emoji = weatherEmojis[mainWeather] || '🌤️';

    container.innerHTML = `
      <div class="weather-icon">${emoji}</div>
      <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
      <div class="weather-desc">${data.weather[0].description}</div>
      <div class="weather-location">📍 ${data.name}, ${data.sys.country}</div>
      <div class="weather-details">
        <div class="weather-detail-card">
          <div class="label">Feels Like</div>
          <div class="value">${Math.round(data.main.feels_like)}°C</div>
        </div>
        <div class="weather-detail-card">
          <div class="label">Humidity</div>
          <div class="value">${data.main.humidity}%</div>
        </div>
        <div class="weather-detail-card">
          <div class="label">Wind</div>
          <div class="value">${data.wind.speed} m/s</div>
        </div>
        <div class="weather-detail-card">
          <div class="label">Pressure</div>
          <div class="value">${data.main.pressure} hPa</div>
        </div>
        <div class="weather-detail-card">
          <div class="label">Visibility</div>
          <div class="value">${(data.visibility / 1000).toFixed(1)} km</div>
        </div>
        <div class="weather-detail-card">
          <div class="label">Min/Max</div>
          <div class="value">${Math.round(data.main.temp_min)}° / ${Math.round(data.main.temp_max)}°</div>
        </div>
        <div class="weather-detail-card">
          <div class="label">Sunrise</div>
          <div class="value">${new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        <div class="weather-detail-card">
          <div class="label">Sunset</div>
          <div class="value">${new Date(data.sys.sunset * 1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      </div>
    `;

    // Fetch air quality if we have coords
    if (data.coord) {
      fetchAirQuality(data.coord.lat, data.coord.lon);
    }
  } catch (error) {
    container.innerHTML = '<p style="color:#e74c3c;">Failed to fetch weather data.</p>';
  }
}

async function fetchForecast(lat, lon, q) {
  const container = document.getElementById('forecastContainer');
  if (!container) return;

  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    let url = '/api/weather/forecast?';
    if (lat && lon) url += `lat=${lat}&lon=${lon}`;
    else if (q) url += `q=${encodeURIComponent(q)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.list) {
      container.innerHTML = '<p style="color:var(--text-muted);">Forecast unavailable.</p>';
      return;
    }

    const forecastHTML = data.list.slice(0, 8).map(item => {
      const date = new Date(item.dt * 1000);
      return `
        <div class="forecast-card">
          <div class="time">${date.toLocaleDateString([], {weekday:'short'})} ${date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
          <div class="temp">${Math.round(item.main.temp)}°C</div>
          <div class="desc">${item.weather[0].description}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="forecast-grid">${forecastHTML}</div>`;
  } catch (error) {
    container.innerHTML = '<p style="color:#e74c3c;">Failed to fetch forecast.</p>';
  }
}

async function fetchAirQuality(lat, lon) {
  const container = document.getElementById('airQuality');
  if (!container || !lat || !lon) return;

  try {
    const response = await fetch(`/api/weather/air?lat=${lat}&lon=${lon}`);
    const data = await response.json();

    if (data.list && data.list[0]) {
      const aqi = data.list[0].main.aqi;
      const aqiLabels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
      const aqiColors = ['', '#27ae60', '#f39c12', '#e67e22', '#e74c3c', '#8e44ad'];

      container.innerHTML = `
        <div class="weather-detail-card" style="border-left:4px solid ${aqiColors[aqi]}">
          <div class="label">Air Quality Index</div>
          <div class="value" style="color:${aqiColors[aqi]}">${aqiLabels[aqi]}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">
            PM2.5: ${data.list[0].components.pm2_5} · PM10: ${data.list[0].components.pm10}
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Air quality error:', error);
  }
}

async function toggleWeatherNotify() {
  const btn = document.getElementById('weatherNotifyBtn');
  if (!btn) return;

  if (AppState.weatherNotify) {
    await unsubscribePush('weather');
    AppState.weatherNotify = false;
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fas fa-bell"></i> Notify about real-time weather';
  } else {
    const success = await subscribePush('weather');
    if (success) {
      AppState.weatherNotify = true;
      btn.classList.add('active');
      btn.innerHTML = '<i class="fas fa-bell-slash"></i> Stop weather notifications';
    }
  }
}

// ============== NEWS PAGE ==============
let currentNewsCategory = 'general';

function initNewsPage() {
  loadNews('general');
}

function switchNewsTab(category, element) {
  currentNewsCategory = category;
  document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
  if (element) element.classList.add('active');
  loadNews(category);
}

async function searchNews() {
  const query = document.getElementById('newsSearch')?.value.trim();
  if (!query) return;
  loadNews(null, query);
}

async function loadNews(category, query) {
  const container = document.getElementById('newsContainer');
  if (!container) return;

  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    let url = '/api/news?';
    if (query) url += `q=${encodeURIComponent(query)}`;
    else url += `category=${category || 'general'}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><h3>No news found</h3><p>Try a different category or search term</p></div>';
      return;
    }

    const newsHTML = data.articles.filter(a => a.title && a.title !== '[Removed]').map(article => {
      const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '';
      const imgSrc = article.urlToImage || '';

      return `
        <div class="news-card" onclick="window.open('${article.url}', '_blank')">
          ${imgSrc ? `<img class="news-card-img" src="${imgSrc}" alt="" onerror="this.style.display='none'">` : '<div class="news-card-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">📰</div>'}
          <div class="news-card-body">
            <h3>${article.title}</h3>
            <p>${article.description || ''}</p>
            <div class="news-card-meta">
              <span>${article.source?.name || 'Unknown'}</span>
              <span>${date}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="news-grid">${newsHTML}</div>`;
  } catch (error) {
    container.innerHTML = '<p style="color:#e74c3c;">Failed to fetch news.</p>';
    showToast('Failed to load news', 'error');
  }
}

async function toggleNewsNotify() {
  const btn = document.getElementById('newsNotifyBtn');
  if (!btn) return;

  if (AppState.newsNotify) {
    await unsubscribePush('news');
    AppState.newsNotify = false;
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fas fa-bell"></i> Notify about real-time news';
  } else {
    const success = await subscribePush('news');
    if (success) {
      AppState.newsNotify = true;
      btn.classList.add('active');
      btn.innerHTML = '<i class="fas fa-bell-slash"></i> Stop news notifications';
    }
  }
}

// ============== DASHBOARD ==============
function initDashboard() {
  // Animate feature cards on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease';
    observer.observe(card);
  });
}

// ============== CONTACT FORM ==============
async function sendContactForm(e) {
  e.preventDefault();

  const name = document.getElementById('contactName')?.value.trim();
  const email = document.getElementById('contactEmail')?.value.trim();
  const message = document.getElementById('contactMessage')?.value.trim();

  if (!name || !email || !message) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  showToast('Message sent successfully! We\'ll get back to you soon.', 'success');

  document.getElementById('contactName').value = '';
  document.getElementById('contactEmail').value = '';
  document.getElementById('contactMessage').value = '';
}

// Handle enter key in weather/news search
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (e.target.id === 'weatherSearch') searchWeather();
    if (e.target.id === 'newsSearch') searchNews();
  }
});