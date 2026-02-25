// ===== BRAINRACK AI - MAIN SCRIPT =====

// ===== GLOBAL STATE =====
const BrainrackAI = {
  theme: localStorage.getItem('brainrack-theme') || 'dark',
  voiceSettings: JSON.parse(localStorage.getItem('brainrack-voice') || '{}'),
  profile: JSON.parse(localStorage.getItem('brainrack-profile') || '{"name":"User","email":""}'),
  chatHistory: {},
  isRecording: false,
  recognition: null,
  synthesis: window.speechSynthesis,
  voiceModels: [],
  currentVoice: null,
  voiceSpeed: 1,
  voicePitch: 1,
  voiceVolume: 1,
  lastInputWasVoice: false,
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initVoiceSettings();
  initMenu();
  initModals();
  initSpeechRecognition();
  loadVoiceModels();

  // Page-specific initialization
  const page = document.body.dataset.page;
  if (page === 'chat') initChat();
  if (page === 'image') initImagePage();
  if (page === 'document') initDocumentPage();
  if (page === 'video') initVideoPage();
  if (page === 'business') initBusinessPage();
  if (page === 'startup') initStartupPage();
  if (page === 'weather') initWeatherPage();
  if (page === 'news') initNewsPage();
  if (page === 'contact') initContactPage();
});

// ===== THEME =====
function initTheme() {
  document.documentElement.setAttribute('data-theme', BrainrackAI.theme);
  updateThemeIcon();
}

function toggleTheme() {
  BrainrackAI.theme = BrainrackAI.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', BrainrackAI.theme);
  localStorage.setItem('brainrack-theme', BrainrackAI.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggleMenu');
  if (btn) {
    btn.innerHTML = `<span class="menu-icon">${BrainrackAI.theme === 'dark' ? '☀️' : '🌙'}</span>${BrainrackAI.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}`;
  }
}

// ===== THREE DOT MENU =====
function initMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('threeDotsMenu');
  const overlay = document.getElementById('menuOverlay');

  if (!menuBtn) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    menu.classList.remove('active');
    overlay.classList.remove('active');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== menuBtn) {
      menu.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
}

// ===== MODALS =====
function initModals() {
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('active');
    });
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
  // Close three dot menu
  document.getElementById('threeDotsMenu')?.classList.remove('active');
  document.getElementById('menuOverlay')?.classList.remove('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// ===== SETTINGS =====
function openSettings() {
  openModal('settingsModal');
  loadSettingsValues();
}

function loadSettingsValues() {
  const settings = BrainrackAI.voiceSettings;
  const voiceSelect = document.getElementById('voiceModelSelect');
  const speedRange = document.getElementById('voiceSpeed');
  const pitchRange = document.getElementById('voicePitch');
  const volumeRange = document.getElementById('voiceVolume');

  if (voiceSelect && BrainrackAI.voiceModels.length > 0) {
    voiceSelect.innerHTML = '';
    BrainrackAI.voiceModels.forEach((voice, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${voice.name} (${voice.lang})`;
      if (settings.voiceIndex === i) opt.selected = true;
      voiceSelect.appendChild(opt);
    });
  }

  if (speedRange) {
    speedRange.value = settings.speed || 1;
    document.getElementById('speedValue').textContent = settings.speed || 1;
  }
  if (pitchRange) {
    pitchRange.value = settings.pitch || 1;
    document.getElementById('pitchValue').textContent = settings.pitch || 1;
  }
  if (volumeRange) {
    volumeRange.value = settings.volume || 1;
    document.getElementById('volumeValue').textContent = settings.volume || 1;
  }
}

function saveSettings() {
  const voiceSelect = document.getElementById('voiceModelSelect');
  const speedRange = document.getElementById('voiceSpeed');
  const pitchRange = document.getElementById('voicePitch');
  const volumeRange = document.getElementById('voiceVolume');

  BrainrackAI.voiceSettings = {
    voiceIndex: voiceSelect ? parseInt(voiceSelect.value) : 0,
    speed: speedRange ? parseFloat(speedRange.value) : 1,
    pitch: pitchRange ? parseFloat(pitchRange.value) : 1,
    volume: volumeRange ? parseFloat(volumeRange.value) : 1,
  };

  BrainrackAI.voiceSpeed = BrainrackAI.voiceSettings.speed;
  BrainrackAI.voicePitch = BrainrackAI.voiceSettings.pitch;
  BrainrackAI.voiceVolume = BrainrackAI.voiceSettings.volume;

  if (BrainrackAI.voiceModels.length > 0) {
    BrainrackAI.currentVoice = BrainrackAI.voiceModels[BrainrackAI.voiceSettings.voiceIndex];
  }

  localStorage.setItem('brainrack-voice', JSON.stringify(BrainrackAI.voiceSettings));
  showToast('Settings saved!', 'success');
  closeModal('settingsModal');
}

// ===== PROFILE =====
function openProfile() {
  openModal('profileModal');
  document.getElementById('profileName').value = BrainrackAI.profile.name || '';
  document.getElementById('profileEmail').value = BrainrackAI.profile.email || '';
}

function saveProfile() {
  BrainrackAI.profile.name = document.getElementById('profileName').value;
  BrainrackAI.profile.email = document.getElementById('profileEmail').value;
  localStorage.setItem('brainrack-profile', JSON.stringify(BrainrackAI.profile));
  showToast('Profile saved!', 'success');
  closeModal('profileModal');
}

// ===== VOICE / SPEECH =====
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  BrainrackAI.recognition = new SpeechRecognition();
  BrainrackAI.recognition.continuous = false;
  BrainrackAI.recognition.interimResults = false;

  BrainrackAI.recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const lang = event.results[0][0].confidence > 0 ? detectLanguageFromRecognition(event) : 'en';
    handleVoiceInput(transcript, lang);
  };

  BrainrackAI.recognition.onend = () => {
    BrainrackAI.isRecording = false;
    document.querySelectorAll('.voice-btn').forEach(btn => btn.classList.remove('recording'));
  };

  BrainrackAI.recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    BrainrackAI.isRecording = false;
    document.querySelectorAll('.voice-btn').forEach(btn => btn.classList.remove('recording'));
    if (event.error === 'not-allowed') {
      showToast('Microphone access denied. Please allow microphone access.', 'error');
    }
  };
}

function detectLanguageFromRecognition(event) {
  return BrainrackAI.recognition.lang || 'en-US';
}

function loadVoiceModels() {
  const loadVoices = () => {
    BrainrackAI.voiceModels = BrainrackAI.synthesis.getVoices();
    if (BrainrackAI.voiceSettings.voiceIndex !== undefined && BrainrackAI.voiceModels.length > 0) {
      BrainrackAI.currentVoice = BrainrackAI.voiceModels[BrainrackAI.voiceSettings.voiceIndex];
    }
    BrainrackAI.voiceSpeed = BrainrackAI.voiceSettings.speed || 1;
    BrainrackAI.voicePitch = BrainrackAI.voiceSettings.pitch || 1;
    BrainrackAI.voiceVolume = BrainrackAI.voiceSettings.volume || 1;
  };

  loadVoices();
  if (BrainrackAI.synthesis.onvoiceschanged !== undefined) {
    BrainrackAI.synthesis.onvoiceschanged = loadVoices;
  }
}

function toggleVoiceInput() {
  if (!BrainrackAI.recognition) {
    showToast('Speech recognition not supported in this browser', 'error');
    return;
  }

  if (BrainrackAI.isRecording) {
    BrainrackAI.recognition.stop();
    BrainrackAI.isRecording = false;
    document.querySelectorAll('.voice-btn').forEach(btn => btn.classList.remove('recording'));
  } else {
    // Allow recognition in any language
    BrainrackAI.recognition.lang = '';
    try {
      BrainrackAI.recognition.start();
      BrainrackAI.isRecording = true;
      BrainrackAI.lastInputWasVoice = true;
      document.querySelectorAll('.voice-btn').forEach(btn => btn.classList.add('recording'));
      showToast('Listening... Speak now', 'info');
    } catch (e) {
      console.error('Recognition start error:', e);
    }
  }
}

function handleVoiceInput(transcript, lang) {
  BrainrackAI.lastInputWasVoice = true;
  BrainrackAI.lastVoiceLang = lang;

  const input = document.querySelector('.chat-input') || document.querySelector('.form-textarea');
  if (input) {
    input.value = transcript;
    // Auto-send for chat
    if (document.body.dataset.page === 'chat') {
      sendChatMessage();
    }
  }
}

function speakText(text, lang) {
  if (!BrainrackAI.synthesis) return;

  BrainrackAI.synthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = BrainrackAI.voiceSpeed;
  utterance.pitch = BrainrackAI.voicePitch;
  utterance.volume = BrainrackAI.voiceVolume;

  if (lang) {
    utterance.lang = lang;
    // Try to find a voice matching the language
    const matchingVoice = BrainrackAI.voiceModels.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
  } else if (BrainrackAI.currentVoice) {
    utterance.voice = BrainrackAI.currentVoice;
  }

  BrainrackAI.synthesis.speak(utterance);
}

// ===== CHAT =====
function initChat() {
  const input = document.querySelector('.chat-input');
  const sendBtn = document.querySelector('.send-btn');

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', sendChatMessage);
  }
}

async function sendChatMessage() {
  const input = document.querySelector('.chat-input');
  const messagesContainer = document.querySelector('.chat-messages');
  const text = input.value.trim();

  if (!text) return;

  const wasVoice = BrainrackAI.lastInputWasVoice;
  const voiceLang = BrainrackAI.lastVoiceLang;
  BrainrackAI.lastInputWasVoice = false;

  // Add user message
  addMessage('user', text);
  input.value = '';
  input.style.height = 'auto';

  // Initialize history
  if (!BrainrackAI.chatHistory.messages) {
    BrainrackAI.chatHistory.messages = [
      { role: 'system', content: 'You are Brainrack AI, a helpful, knowledgeable, and friendly AI assistant. Provide clear, concise, and accurate answers. If the user speaks in a specific language, always respond in that same language.' }
    ];
  }

  BrainrackAI.chatHistory.messages.push({ role: 'user', content: text });

  // Add typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message ai';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `
    <div class="message-avatar">🧠</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(typingDiv);
  scrollToBottom();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: BrainrackAI.chatHistory.messages,
        model: 'openai/gpt-3.5-turbo'
      })
    });

    // Remove typing indicator
    document.getElementById('typingIndicator')?.remove();

    // Create AI message element
    const aiMessage = document.createElement('div');
    aiMessage.className = 'message ai';
    aiMessage.innerHTML = `
      <div class="message-avatar">🧠</div>
      <div class="message-content"></div>
    `;
    messagesContainer.appendChild(aiMessage);
    const contentEl = aiMessage.querySelector('.message-content');

    let fullText = '';

    // Read stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              contentEl.innerHTML = formatMarkdown(fullText);
              scrollToBottom();
            }
          } catch (e) {
            // ignore parse errors for partial chunks
          }
        }
      }
    }

    // If no streaming content, try non-streaming
    if (!fullText) {
      const simpleRes = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: BrainrackAI.chatHistory.messages,
          model: 'openai/gpt-3.5-turbo'
        })
      });
      const data = await simpleRes.json();
      fullText = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      contentEl.innerHTML = formatMarkdown(fullText);
    }

    BrainrackAI.chatHistory.messages.push({ role: 'assistant', content: fullText });

    // If input was voice, speak the response
    if (wasVoice) {
      speakText(fullText, voiceLang);
    }

    scrollToBottom();
  } catch (error) {
    document.getElementById('typingIndicator')?.remove();
    addMessage('ai', 'Sorry, an error occurred. Please try again.');
    console.error('Chat error:', error);
  }
}

function addMessage(type, text) {
  const messagesContainer = document.querySelector('.chat-messages');
  if (!messagesContainer) return;

  const msg = document.createElement('div');
  msg.className = `message ${type}`;

  const avatar = type === 'ai' ? '🧠' : '👤';
  msg.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">${type === 'ai' ? formatMarkdown(text) : escapeHTML(text)}</div>
  `;
  messagesContainer.appendChild(msg);
  scrollToBottom();
}

function scrollToBottom() {
  const container = document.querySelector('.chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function formatMarkdown(text) {
  // Basic markdown to HTML
  let html = escapeHTML(text);

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');

  // Lists
  html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';

  return html;
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== IMAGE PAGE =====
function initImagePage() {
  const generateBtn = document.getElementById('generateImageBtn');
  const enhanceBtn = document.getElementById('enhanceImageBtn');

  if (generateBtn) {
    generateBtn.addEventListener('click', generateImage);
  }
  if (enhanceBtn) {
    enhanceBtn.addEventListener('click', enhanceImage);
  }

  // File upload
  const uploadArea = document.getElementById('imageUploadArea');
  const fileInput = document.getElementById('imageFileInput');

  if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--accent-blue)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--border-color)';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--border-color)';
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        showFileName('imageUploadArea', e.dataTransfer.files[0].name);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        showFileName('imageUploadArea', fileInput.files[0].name);
      }
    });
  }
}

async function generateImage() {
  const prompt = document.getElementById('imagePrompt').value.trim();
  const style = document.getElementById('imageStyle')?.value || 'realistic';
  const resultDiv = document.getElementById('imageResult');

  if (!prompt) {
    showToast('Please enter a description for the image', 'error');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Check if there's an image URL in the response
    const imageUrlMatch = content.match(/https?:\/\/[^\s"')]+\.(png|jpg|jpeg|gif|webp)/i);

    if (resultDiv) {
      if (imageUrlMatch) {
        resultDiv.innerHTML = `
          <div class="result-card">
            <h3>🎨 Generated Image</h3>
            <div class="image-result">
              <img src="${imageUrlMatch[0]}" alt="Generated Image" />
            </div>
            <div class="result-content" style="margin-top: 16px;">${formatMarkdown(content)}</div>
          </div>
        `;
      } else {
        resultDiv.innerHTML = `
          <div class="result-card">
            <h3>🎨 Image Generation Result</h3>
            <div class="result-content">${formatMarkdown(content)}</div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Image generation error:', error);
    showToast('Failed to generate image. Please try again.', 'error');
  }

  showLoading(false);
}

async function enhanceImage() {
  const fileInput = document.getElementById('imageFileInput');
  const enhanceType = document.getElementById('enhanceType')?.value || 'enhance';
  const resultDiv = document.getElementById('enhanceResult');

  if (!fileInput.files.length) {
    showToast('Please upload an image first', 'error');
    return;
  }

  showLoading(true);

  try {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('enhanceType', enhanceType);

    const response = await fetch('/api/enhance-image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No analysis available.';

    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="result-card">
          <h3>✨ Enhancement Analysis</h3>
          <div class="result-content">${formatMarkdown(content)}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Enhancement error:', error);
    showToast('Failed to analyze image. Please try again.', 'error');
  }

  showLoading(false);
}

// ===== DOCUMENT PAGE =====
function initDocumentPage() {
  const analyzeBtn = document.getElementById('analyzeDocBtn');
  const uploadArea = document.getElementById('docUploadArea');
  const fileInput = document.getElementById('docFileInput');

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', analyzeDocument);
  }

  if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--accent-blue)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--border-color)';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--border-color)';
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        showFileName('docUploadArea', e.dataTransfer.files[0].name);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        showFileName('docUploadArea', fileInput.files[0].name);
      }
    });
  }

  // Task buttons
  document.querySelectorAll('.task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.task-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const task = btn.dataset.task;
      const questionInput = document.getElementById('docQuestion');
      if (questionInput) {
        const taskPrompts = {
          'summarize': 'Provide a comprehensive summary of this document.',
          'analyze': 'Provide a detailed analysis of this document including key themes, arguments, and insights.',
          'question': '',
          'keypoints': 'Extract all key points and important information from this document.',
          'solve': 'Solve and answer all questions/problems found in this document step by step.'
        };
        questionInput.value = taskPrompts[task] || '';
        if (task === 'question') questionInput.focus();
      }
    });
  });
}

async function analyzeDocument() {
  const fileInput = document.getElementById('docFileInput');
  const question = document.getElementById('docQuestion').value.trim();
  const resultDiv = document.getElementById('docResult');

  if (!fileInput.files.length) {
    showToast('Please upload a document first', 'error');
    return;
  }

  if (!question) {
    showToast('Please enter a question or select a task', 'error');
    return;
  }

  showLoading(true);

  try {
    const formData = new FormData();
    formData.append('document', fileInput.files[0]);
    formData.append('question', question);

    const response = await fetch('/api/analyze-document', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No analysis available.';

    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="result-card">
          <h3>📄 Document Analysis</h3>
          <div class="result-content">${formatMarkdown(content)}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Document analysis error:', error);
    showToast('Failed to analyze document. Please try again.', 'error');
  }

  showLoading(false);
}

// ===== VIDEO PAGE =====
function initVideoPage() {
  const generateBtn = document.getElementById('generateVideoBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateVideo);
  }
}

async function generateVideo() {
  const prompt = document.getElementById('videoPrompt').value.trim();
  const duration = document.getElementById('videoDuration')?.value || '60 seconds';
  const style = document.getElementById('videoStyle')?.value || 'cinematic';
  const resultDiv = document.getElementById('videoResult');

  if (!prompt) {
    showToast('Please describe your video concept', 'error');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration, style })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No content generated.';

    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="result-card">
          <h3>🎬 Video Storyboard</h3>
          <div class="result-content">${formatMarkdown(content)}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Video generation error:', error);
    showToast('Failed to generate video content. Please try again.', 'error');
  }

  showLoading(false);
}

// ===== BUSINESS PAGE =====
function initBusinessPage() {
  const solveBtn = document.getElementById('solveBusinessBtn');
  if (solveBtn) {
    solveBtn.addEventListener('click', solveBusinessProblem);
  }
}

async function solveBusinessProblem() {
  const problem = document.getElementById('businessProblem').value.trim();
  const industry = document.getElementById('businessIndustry')?.value || '';
  const context = document.getElementById('businessContext')?.value || '';
  const resultDiv = document.getElementById('businessResult');

  if (!problem) {
    showToast('Please describe your business problem', 'error');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch('/api/business-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem, industry, context })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No solution generated.';

    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="result-card">
          <h3>💼 Business Solution</h3>
          <div class="result-content">${formatMarkdown(content)}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Business solve error:', error);
    showToast('Failed to solve business problem. Please try again.', 'error');
  }

  showLoading(false);
}

// ===== STARTUP PAGE =====
function initStartupPage() {
  const generateBtn = document.getElementById('generateStartupBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateStartupIdeas);
  }
}

async function generateStartupIdeas() {
  const interests = document.getElementById('startupInterests').value.trim();
  const budget = document.getElementById('startupBudget')?.value || '';
  const skills = document.getElementById('startupSkills')?.value || '';
  const market = document.getElementById('startupMarket')?.value || '';
  const resultDiv = document.getElementById('startupResult');

  if (!interests) {
    showToast('Please enter your interests', 'error');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch('/api/startup-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests, budget, skills, market })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No ideas generated.';

    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="result-card">
          <h3>🚀 Startup Ideas</h3>
          <div class="result-content">${formatMarkdown(content)}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Startup ideas error:', error);
    showToast('Failed to generate ideas. Please try again.', 'error');
  }

  showLoading(false);
}

// ===== WEATHER PAGE =====
function initWeatherPage() {
  getLocationWeather();

  const searchBtn = document.getElementById('weatherSearchBtn');
  const searchInput = document.getElementById('weatherSearch');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) fetchWeatherByCity(query);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) fetchWeatherByCity(query);
      }
    });
  }

  // Notification button
  const notifyBtn = document.getElementById('weatherNotifyBtn');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', toggleWeatherNotifications);
  }
}

function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
        fetchForecast(pos.coords.latitude, pos.coords.longitude);
        fetchAirQuality(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        fetchWeatherByCity('New York');
      }
    );
  } else {
    fetchWeatherByCity('New York');
  }
}

async function fetchWeather(lat, lon) {
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    displayWeather(data);
  } catch (error) {
    console.error('Weather fetch error:', error);
  }
}

async function fetchWeatherByCity(city) {
  try {
    const res = await fetch(`/api/weather?q=${encodeURIComponent(city)}`);
    const data = await res.json();
    if (data.cod === 200) {
      displayWeather(data);
      fetchForecast(data.coord.lat, data.coord.lon);
      fetchAirQuality(data.coord.lat, data.coord.lon);
    } else {
      showToast('City not found', 'error');
    }
  } catch (error) {
    console.error('Weather fetch error:', error);
  }
}

function displayWeather(data) {
  const container = document.getElementById('weatherCurrent');
  if (!container) return;

  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <div class="weather-current">
      <p class="location">📍 ${data.name}, ${data.sys.country}</p>
      <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon" style="width: 100px; height: 100px;">
      <div class="temp">${Math.round(data.main.temp)}°C</div>
      <p class="condition">${data.weather[0].description}</p>
      <p style="color: var(--text-muted); font-size: 14px;">Feels like ${Math.round(data.main.feels_like)}°C</p>
      <div class="weather-details">
        <div class="weather-detail-item">
          <div class="detail-label">Humidity</div>
          <div class="detail-value">${data.main.humidity}%</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">Wind</div>
          <div class="detail-value">${data.wind.speed} m/s</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">Pressure</div>
          <div class="detail-value">${data.main.pressure} hPa</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">Visibility</div>
          <div class="detail-value">${(data.visibility / 1000).toFixed(1)} km</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">Sunrise</div>
          <div class="detail-value">${sunrise}</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">Sunset</div>
          <div class="detail-value">${sunset}</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">Clouds</div>
          <div class="detail-value">${data.clouds.all}%</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">Wind Dir</div>
          <div class="detail-value">${data.wind.deg}°</div>
        </div>
      </div>
    </div>
  `;
}

async function fetchForecast(lat, lon) {
  try {
    const res = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    displayForecast(data);
  } catch (error) {
    console.error('Forecast fetch error:', error);
  }
}

function displayForecast(data) {
  const container = document.getElementById('weatherForecast');
  if (!container || !data.list) return;

  const hourlyHTML = data.list.slice(0, 8).map(item => {
    const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
    return `
      <div class="forecast-item">
        <div class="forecast-time">${time}</div>
        <img src="${iconUrl}" alt="" style="width: 40px; height: 40px;">
        <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
      </div>
    `;
  }).join('');

  // Daily forecast
  const dailyMap = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    if (!dailyMap[date]) {
      dailyMap[date] = { temps: [], icons: [], item };
    }
    dailyMap[date].temps.push(item.main.temp);
    dailyMap[date].icons.push(item.weather[0].icon);
  });

  const dailyHTML = Object.entries(dailyMap).slice(0, 5).map(([date, info]) => {
    const avgTemp = Math.round(info.temps.reduce((a, b) => a + b) / info.temps.length);
    const maxTemp = Math.round(Math.max(...info.temps));
    const minTemp = Math.round(Math.min(...info.temps));
    const icon = info.icons[Math.floor(info.icons.length / 2)];
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    return `
      <div class="forecast-item">
        <div class="forecast-time">${date}</div>
        <img src="${iconUrl}" alt="" style="width: 40px; height: 40px;">
        <div class="forecast-temp">${maxTemp}° / ${minTemp}°</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="forecast-section">
      <h3>⏱ Hourly Forecast</h3>
      <div class="forecast-list">${hourlyHTML}</div>
    </div>
    <div class="forecast-section">
      <h3>📅 5-Day Forecast</h3>
      <div class="forecast-list">${dailyHTML}</div>
    </div>
  `;
}

async function fetchAirQuality(lat, lon) {
  try {
    const res = await fetch(`/api/weather/air?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    displayAirQuality(data);
  } catch (error) {
    console.error('Air quality fetch error:', error);
  }
}

function displayAirQuality(data) {
  const container = document.getElementById('airQuality');
  if (!container || !data.list) return;

  const aqi = data.list[0].main.aqi;
  const components = data.list[0].components;
  const aqiLabels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const aqiColors = ['', '#43e97b', '#ffd700', '#ff8c00', '#f5576c', '#8b0000'];

  container.innerHTML = `
    <div class="forecast-section">
      <h3>🌬 Air Quality</h3>
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 36px; font-weight: 800; color: ${aqiColors[aqi]}">${aqiLabels[aqi]}</div>
        <div style="font-size: 14px; color: var(--text-muted);">AQI Index: ${aqi}/5</div>
        <div class="aqi-meter" style="margin-top: 12px;">
          <div class="aqi-indicator" style="left: ${(aqi / 5) * 100}%"></div>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-detail-item">
          <div class="detail-label">PM2.5</div>
          <div class="detail-value">${components.pm2_5.toFixed(1)}</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">PM10</div>
          <div class="detail-value">${components.pm10.toFixed(1)}</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">O₃</div>
          <div class="detail-value">${components.o3.toFixed(1)}</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">NO₂</div>
          <div class="detail-value">${components.no2.toFixed(1)}</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">SO₂</div>
          <div class="detail-value">${components.so2.toFixed(1)}</div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-label">CO</div>
          <div class="detail-value">${components.co.toFixed(0)}</div>
        </div>
      </div>
    </div>
  `;
}

async function toggleWeatherNotifications() {
  const btn = document.getElementById('weatherNotifyBtn');
  if (!btn) return;

  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
    btn.textContent = '🔔 Notify about real-time-weather';
    showToast('Weather notifications disabled', 'info');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      btn.classList.add('active');
      btn.textContent = '🔕 Stop weather notifications';
      showToast('Weather notifications enabled!', 'success');

      // Try to subscribe to push
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const keyRes = await fetch('/api/vapid-public-key');
          const keyData = await keyRes.json();
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyData.key)
          });
          await fetch('/api/subscribe/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
          });
        } catch (e) {
          console.log('Push subscription failed, using fallback');
        }
      }

      // Fallback: periodic notifications using Notification API
      setInterval(async () => {
        if (Notification.permission === 'granted' && btn.classList.contains('active')) {
          try {
            const res = await fetch('/api/weather?q=auto:ip');
            // Use a simple notification
            new Notification('🌤 Brainrack Weather', {
              body: 'Click to check latest weather updates!',
              icon: '/favicon.ico'
            });
          } catch (e) { }
        }
      }, 1800000); // 30 minutes
    } else {
      showToast('Notification permission denied', 'error');
    }
  } catch (error) {
    console.error('Notification setup error:', error);
  }
}

// ===== NEWS PAGE =====
function initNewsPage() {
  loadNews('general');

  document.querySelectorAll('.news-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.dataset.category;
      if (category === 'search') {
        document.getElementById('newsSearchBar').style.display = 'flex';
      } else {
        document.getElementById('newsSearchBar').style.display = 'none';
        loadNews(category);
      }
    });
  });

  const newsSearchBtn = document.getElementById('newsSearchBtn');
  const newsSearchInput = document.getElementById('newsSearchInput');

  if (newsSearchBtn) {
    newsSearchBtn.addEventListener('click', () => {
      const q = newsSearchInput.value.trim();
      if (q) searchNews(q);
    });
  }

  if (newsSearchInput) {
    newsSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = newsSearchInput.value.trim();
        if (q) searchNews(q);
      }
    });
  }

  // News notification
  const notifyBtn = document.getElementById('newsNotifyBtn');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', toggleNewsNotifications);
  }
}

async function loadNews(category) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner-lg" style="width:48px;height:48px;border:3px solid var(--border-color);border-top-color:var(--accent-blue);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto;"></div><p style="margin-top:16px;">Loading news...</p></div>';

  try {
    const res = await fetch(`/api/news?category=${category}`);
    const data = await res.json();

    if (data.articles && data.articles.length > 0) {
      grid.innerHTML = data.articles.filter(a => a.title !== '[Removed]').map(article => `
        <a href="${article.url}" target="_blank" class="news-card">
          <img src="${article.urlToImage || 'https://via.placeholder.com/400x200/1a1f5e/4facfe?text=News'}" 
               alt="" class="news-card-image" onerror="this.src='https://via.placeholder.com/400x200/1a1f5e/4facfe?text=News'">
          <div class="news-card-body">
            <div class="news-card-source">${article.source?.name || 'Unknown'}</div>
            <h3 class="news-card-title">${escapeHTML(article.title)}</h3>
            <p class="news-card-desc">${escapeHTML(article.description || '')}</p>
            <div class="news-card-date">${new Date(article.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </a>
      `).join('');
    } else {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📰</div><h3>No news found</h3><p>Try another category</p></div>';
    }
  } catch (error) {
    console.error('News load error:', error);
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Failed to load news</h3><p>Please try again later</p></div>';
  }
}

async function searchNews(query) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner-lg" style="width:48px;height:48px;border:3px solid var(--border-color);border-top-color:var(--accent-blue);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto;"></div><p style="margin-top:16px;">Searching...</p></div>';

  try {
    const res = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.articles && data.articles.length > 0) {
      grid.innerHTML = data.articles.filter(a => a.title !== '[Removed]').map(article => `
        <a href="${article.url}" target="_blank" class="news-card">
          <img src="${article.urlToImage || 'https://via.placeholder.com/400x200/1a1f5e/4facfe?text=News'}" 
               alt="" class="news-card-image" onerror="this.src='https://via.placeholder.com/400x200/1a1f5e/4facfe?text=News'">
          <div class="news-card-body">
            <div class="news-card-source">${article.source?.name || 'Unknown'}</div>
            <h3 class="news-card-title">${escapeHTML(article.title)}</h3>
            <p class="news-card-desc">${escapeHTML(article.description || '')}</p>
            <div class="news-card-date">${new Date(article.publishedAt).toLocaleDateString()}</div>
          </div>
        </a>
      `).join('');
    } else {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No results</h3><p>Try different search terms</p></div>';
    }
  } catch (error) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Search failed</h3></div>';
  }
}

async function toggleNewsNotifications() {
  const btn = document.getElementById('newsNotifyBtn');
  if (!btn) return;

  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
    btn.textContent = '🔔 Notify about real-time-news';
    showToast('News notifications disabled', 'info');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      btn.classList.add('active');
      btn.textContent = '🔕 Stop news notifications';
      showToast('News notifications enabled!', 'success');

      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const keyRes = await fetch('/api/vapid-public-key');
          const keyData = await keyRes.json();
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyData.key)
          });
          await fetch('/api/subscribe/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
          });
        } catch (e) {
          console.log('Push subscription failed, using fallback');
        }
      }

      setInterval(() => {
        if (Notification.permission === 'granted' && btn.classList.contains('active')) {
          new Notification('📰 Brainrack News', {
            body: 'New headlines available! Click to read.',
            icon: '/favicon.ico'
          });
        }
      }, 3600000);
    } else {
      showToast('Notification permission denied', 'error');
    }
  } catch (error) {
    console.error('Notification setup error:', error);
  }
}

// ===== CONTACT PAGE =====
function initContactPage() {
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value;
      const email = document.getElementById('contactEmail').value;
      const subject = document.getElementById('contactSubject').value;
      const message = document.getElementById('contactMessage').value;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          form.reset();
        }
      } catch (error) {
        showToast('Failed to send message. Please try again.', 'error');
      }
    });
  }
}

// ===== UTILITY FUNCTIONS =====
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.toggle('active', show);
  }
}

function showFileName(areaId, name) {
  const area = document.getElementById(areaId);
  if (area) {
    let fileNameEl = area.querySelector('.file-name');
    if (!fileNameEl) {
      fileNameEl = document.createElement('p');
      fileNameEl.className = 'file-name';
      area.appendChild(fileNameEl);
    }
    fileNameEl.textContent = `📎 ${name}`;
  }
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}