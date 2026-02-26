// ===== GLOBAL VARIABLES =====
const API_BASE_URL = 'http://localhost:3000/api';
let currentLanguage = 'en-US';
let isVoiceInput = false;
let recognition = null;
let synthesis = window.speechSynthesis;

// Voice settings
let voiceSettings = {
    model: 0,
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    autoSpeak: false
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeCommon();
    loadVoiceSettings();
    loadTheme();
    loadUserProfile();
    initializeSpeechRecognition();
});

// ===== COMMON FUNCTIONALITY =====
function initializeCommon() {
    // Menu toggle
    const menuIcon = document.getElementById('menuIcon');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (menuIcon && dropdownMenu) {
        menuIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownMenu.contains(e.target) && !menuIcon.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            settingsModal.classList.add('active');
            dropdownMenu.classList.remove('active');
        });

        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
        }

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
    }

    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeProfile = document.getElementById('closeProfile');

    if (profileBtn && profileModal) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            profileModal.classList.add('active');
            dropdownMenu.classList.remove('active');
        });

        if (closeProfile) {
            closeProfile.addEventListener('click', () => {
                profileModal.classList.remove('active');
            });
        }

        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.classList.remove('active');
            }
        });
    }

    // Save profile
    const saveProfile = document.getElementById('saveProfile');
    if (saveProfile) {
        saveProfile.addEventListener('click', handleSaveProfile);
    }

    // Voice settings event listeners
    initializeVoiceSettings();
}

// ===== THEME MANAGEMENT =====
function toggleTheme() {
    const body = document.body;
    const themeText = document.getElementById('themeText');
    const themeIcon = document.querySelector('#themeToggle i');

    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        themeText.textContent = 'Dark Mode';
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        themeText.textContent = 'Light Mode';
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    const themeText = document.getElementById('themeText');
    const themeIcon = document.querySelector('#themeToggle i');

    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (themeText) themeText.textContent = 'Light Mode';
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

// ===== VOICE SETTINGS =====
function initializeVoiceSettings() {
    const voiceSpeed = document.getElementById('voiceSpeed');
    const voicePitch = document.getElementById('voicePitch');
    const voiceVolume = document.getElementById('voiceVolume');
    const voiceModel = document.getElementById('voiceModel');
    const autoSpeak = document.getElementById('autoSpeak');

    if (voiceSpeed) {
        voiceSpeed.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = value.toFixed(1);
            voiceSettings.speed = value;
            saveVoiceSettings();
        });
    }

    if (voicePitch) {
        voicePitch.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('pitchValue').textContent = value.toFixed(1);
            voiceSettings.pitch = value;
            saveVoiceSettings();
        });
    }

    if (voiceVolume) {
        voiceVolume.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('volumeValue').textContent = value;
            voiceSettings.volume = value / 100;
            saveVoiceSettings();
        });
    }

    if (voiceModel) {
        voiceModel.addEventListener('change', (e) => {
            voiceSettings.model = parseInt(e.target.value);
            saveVoiceSettings();
        });
    }

    if (autoSpeak) {
        autoSpeak.addEventListener('change', (e) => {
            voiceSettings.autoSpeak = e.target.checked;
            saveVoiceSettings();
        });
    }
}

function saveVoiceSettings() {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
}

function loadVoiceSettings() {
    const saved = localStorage.getItem('voiceSettings');
    if (saved) {
        voiceSettings = JSON.parse(saved);
        
        // Update UI
        const voiceSpeed = document.getElementById('voiceSpeed');
        const voicePitch = document.getElementById('voicePitch');
        const voiceVolume = document.getElementById('voiceVolume');
        const voiceModel = document.getElementById('voiceModel');
        const autoSpeak = document.getElementById('autoSpeak');

        if (voiceSpeed) {
            voiceSpeed.value = voiceSettings.speed;
            document.getElementById('speedValue').textContent = voiceSettings.speed.toFixed(1);
        }
        if (voicePitch) {
            voicePitch.value = voiceSettings.pitch;
            document.getElementById('pitchValue').textContent = voiceSettings.pitch.toFixed(1);
        }
        if (voiceVolume) {
            voiceVolume.value = voiceSettings.volume * 100;
            document.getElementById('volumeValue').textContent = Math.round(voiceSettings.volume * 100);
        }
        if (voiceModel) voiceModel.value = voiceSettings.model;
        if (autoSpeak) autoSpeak.checked = voiceSettings.autoSpeak;
    }
}

// ===== USER PROFILE =====
function loadUserProfile() {
    const userName = localStorage.getItem('userName') || 'Guest User';
    const userEmail = localStorage.getItem('userEmail') || 'guest@brainrackai.com';

    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const displayName = document.getElementById('displayName');
    const emailAddress = document.getElementById('emailAddress');

    if (userNameEl) userNameEl.textContent = userName;
    if (userEmailEl) userEmailEl.textContent = userEmail;
    if (displayName) displayName.value = userName;
    if (emailAddress) emailAddress.value = userEmail;
}

function handleSaveProfile() {
    const displayName = document.getElementById('displayName').value;
    const emailAddress = document.getElementById('emailAddress').value;

    if (displayName) localStorage.setItem('userName', displayName);
    if (emailAddress) localStorage.setItem('userEmail', emailAddress);

    loadUserProfile();
    
    const profileModal = document.getElementById('profileModal');
    profileModal.classList.remove('active');

    showNotification('Profile saved successfully!', 'success');
}

// ===== SPEECH RECOGNITION =====
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            handleVoiceInput(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isVoiceInput = false;
            updateVoiceButton(false);
        };

        recognition.onend = () => {
            isVoiceInput = false;
            updateVoiceButton(false);
        };
    }
}

function startVoiceRecognition() {
    if (recognition) {
        isVoiceInput = true;
        updateVoiceButton(true);
        recognition.start();
    } else {
        showNotification('Speech recognition not supported in your browser', 'error');
    }
}

function updateVoiceButton(recording) {
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        if (recording) {
            voiceBtn.classList.add('recording');
        } else {
            voiceBtn.classList.remove('recording');
        }
    }
}

function handleVoiceInput(text) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = text;
        sendChatMessage(true); // true indicates voice input
    }
}

// ===== TEXT TO SPEECH =====
function speak(text, forceSpeak = false) {
    if (!forceSpeak && !voiceSettings.autoSpeak && !isVoiceInput) {
        return;
    }

    if (synthesis.speaking) {
        synthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSettings.speed;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    utterance.lang = currentLanguage;

    // Select voice based on model
    const voices = synthesis.getVoices();
    if (voices.length > 0 && voiceSettings.model < voices.length) {
        utterance.voice = voices[voiceSettings.model];
    }

    synthesis.speak(utterance);
}

// ===== CHAT FUNCTIONALITY =====
function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const voiceBtn = document.getElementById('voiceBtn');

    if (sendBtn) {
        sendBtn.addEventListener('click', () => sendChatMessage(false));
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage(false);
            }
        });
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceRecognition);
    }
}

async function sendChatMessage(wasVoiceInput) {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();

    if (!message) return;

    // Detect language from input
    detectLanguage(message);

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    // Show typing indicator
    const typingDiv = addTypingIndicator();

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, language: currentLanguage })
        });

        const data = await response.json();
        
        // Remove typing indicator
        typingDiv.remove();

        if (data.success) {
            // Add bot message with typing animation
            addMessageWithTyping(data.response, 'bot');
            
            // Speak if it was voice input or autoSpeak is enabled
            if (wasVoiceInput || voiceSettings.autoSpeak) {
                speak(data.response, wasVoiceInput);
            }
        } else {
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        console.error('Chat error:', error);
        typingDiv.remove();
        addMessage('Sorry, I could not connect to the server.', 'bot');
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'message-icon';
    iconDiv.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;

    messageDiv.appendChild(iconDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
}

function addMessageWithTyping(text, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'message-icon';
    iconDiv.innerHTML = '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const p = document.createElement('p');
    contentDiv.appendChild(p);

    messageDiv.appendChild(iconDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Typing animation
    let i = 0;
    const speed = 30;
    const typeWriter = () => {
        if (i < text.length) {
            p.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };
    typeWriter();
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'message-icon';
    iconDiv.innerHTML = '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    messageDiv.appendChild(iconDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

function detectLanguage(text) {
    // Simple language detection based on character sets
    if (/[\u0600-\u06FF]/.test(text)) {
        currentLanguage = 'ar-SA'; // Arabic
    } else if (/[\u4E00-\u9FFF]/.test(text)) {
        currentLanguage = 'zh-CN'; // Chinese
    } else if (/[\u0400-\u04FF]/.test(text)) {
        currentLanguage = 'ru-RU'; // Russian
    } else if (/[\u0900-\u097F]/.test(text)) {
        currentLanguage = 'hi-IN'; // Hindi
    } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
        currentLanguage = 'ja-JP'; // Japanese
    } else if (/[\uAC00-\uD7AF]/.test(text)) {
        currentLanguage = 'ko-KR'; // Korean
    } else {
        currentLanguage = 'en-US'; // Default to English
    }

    if (recognition) {
        recognition.lang = currentLanguage;
    }
}

// ===== IMAGE AI FUNCTIONALITY =====
function initializeImageAI() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Generate image
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateImage);
    }

    // Enhance image
    const enhanceUploadArea = document.getElementById('enhanceUploadArea');
    const enhanceImageInput = document.getElementById('enhanceImageInput');
    const enhanceBtn = document.getElementById('enhanceBtn');

    if (enhanceUploadArea) {
        enhanceUploadArea.addEventListener('click', () => enhanceImageInput.click());
    }

    if (enhanceImageInput) {
        enhanceImageInput.addEventListener('change', handleImageUpload);
    }

    if (enhanceBtn) {
        enhanceBtn.addEventListener('click', enhanceImage);
    }

    // Download buttons
    const downloadGenerated = document.getElementById('downloadGenerated');
    const downloadEnhanced = document.getElementById('downloadEnhanced');

    if (downloadGenerated) {
        downloadGenerated.addEventListener('click', () => downloadImage('generatedImage'));
    }

    if (downloadEnhanced) {
        downloadEnhanced.addEventListener('click', () => downloadImage('enhancedImage'));
    }
}

function switchTab(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    const size = document.getElementById('imageSize').value;
    const style = document.getElementById('imageStyle').value;

    if (!prompt) {
        showNotification('Please enter a description', 'error');
        return;
    }

    const loadingEl = document.getElementById('generateLoading');
    const resultContainer = document.getElementById('generatedImageContainer');

    loadingEl.style.display = 'block';
    resultContainer.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/image/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, size, style })
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            document.getElementById('generatedImage').src = data.imageUrl;
            resultContainer.style.display = 'block';
            showNotification('Image generated successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to generate image', 'error');
        }
    } catch (error) {
        console.error('Image generation error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to generate image', 'error');
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('uploadedImage').src = event.target.result;
        document.getElementById('uploadedPreview').style.display = 'block';
        document.getElementById('enhanceBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

async function enhanceImage() {
    const imageInput = document.getElementById('enhanceImageInput');
    const prompt = document.getElementById('enhancePrompt').value.trim();

    if (!imageInput.files[0]) {
        showNotification('Please upload an image', 'error');
        return;
    }

    const loadingEl = document.getElementById('enhanceLoading');
    const resultContainer = document.getElementById('enhancedImageContainer');

    loadingEl.style.display = 'block';
    resultContainer.style.display = 'none';

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    formData.append('prompt', prompt);

    try {
        const response = await fetch(`${API_BASE_URL}/image/enhance`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            document.getElementById('enhancedImage').src = data.imageUrl;
            resultContainer.style.display = 'block';
            showNotification('Image enhanced successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to enhance image', 'error');
        }
    } catch (error) {
        console.error('Image enhancement error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to enhance image', 'error');
    }
}

function downloadImage(imageId) {
    const img = document.getElementById(imageId);
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `brainrack-${Date.now()}.png`;
    link.click();
}

// ===== DOCUMENT AI FUNCTIONALITY =====
function initializeDocumentAI() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // File upload handlers
    setupFileUpload('analyze');
    setupFileUpload('question');
    setupFileUpload('summarize');

    // Action buttons
    const analyzeBtn = document.getElementById('analyzeBtn');
    const questionBtn = document.getElementById('questionBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');

    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeDocument);
    if (questionBtn) questionBtn.addEventListener('click', answerQuestion);
    if (summarizeBtn) summarizeBtn.addEventListener('click', summarizeDocument);
}

function setupFileUpload(prefix) {
    const uploadArea = document.getElementById(`${prefix}UploadArea`);
    const fileInput = document.getElementById(`${prefix}FileInput`);
    const fileInfo = document.getElementById(`${prefix}FileInfo`);
    const fileName = document.getElementById(`${prefix}FileName`);
    const removeBtn = document.getElementById(`remove${prefix.charAt(0).toUpperCase() + prefix.slice(1)}File`);
    const actionBtn = document.getElementById(`${prefix}Btn`);

    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;
                fileInfo.style.display = 'flex';
                uploadArea.style.display = 'none';
                if (actionBtn) actionBtn.disabled = false;
            }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            fileInput.value = '';
            fileInfo.style.display = 'none';
            uploadArea.style.display = 'flex';
            if (actionBtn) actionBtn.disabled = true;
        });
    }
}

async function analyzeDocument() {
    const fileInput = document.getElementById('analyzeFileInput');
    if (!fileInput.files[0]) return;

    const loadingEl = document.getElementById('analyzeLoading');
    const outputEl = document.getElementById('analysisOutput');

    loadingEl.style.display = 'block';
    outputEl.innerHTML = '';

    const formData = new FormData();
    formData.append('document', fileInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/document/analyze`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            outputEl.innerHTML = `<p>${escapeHtml(data.analysis)}</p>`;
            showNotification('Document analyzed successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to analyze document', 'error');
        }
    } catch (error) {
        console.error('Document analysis error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to analyze document', 'error');
    }
}

async function answerQuestion() {
    const fileInput = document.getElementById('questionFileInput');
    const question = document.getElementById('documentQuestion').value.trim();

    if (!fileInput.files[0] || !question) {
        showNotification('Please upload a document and enter a question', 'error');
        return;
    }

    const loadingEl = document.getElementById('questionLoading');
    const outputEl = document.getElementById('answerOutput');

    loadingEl.style.display = 'block';
    outputEl.innerHTML = '';

    const formData = new FormData();
    formData.append('document', fileInput.files[0]);
    formData.append('question', question);

    try {
        const response = await fetch(`${API_BASE_URL}/document/question`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            outputEl.innerHTML = `<p><strong>Question:</strong> ${escapeHtml(question)}</p><p><strong>Answer:</strong> ${escapeHtml(data.answer)}</p>`;
            showNotification('Answer found!', 'success');
        } else {
            showNotification(data.error || 'Failed to answer question', 'error');
        }
    } catch (error) {
        console.error('Question answering error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to answer question', 'error');
    }
}

async function summarizeDocument() {
    const fileInput = document.getElementById('summarizeFileInput');
    const length = document.getElementById('summaryLength').value;

    if (!fileInput.files[0]) {
        showNotification('Please upload a document', 'error');
        return;
    }

    const loadingEl = document.getElementById('summarizeLoading');
    const outputEl = document.getElementById('summaryOutput');

    loadingEl.style.display = 'block';
    outputEl.innerHTML = '';

    const formData = new FormData();
    formData.append('document', fileInput.files[0]);
    formData.append('length', length);

    try {
        const response = await fetch(`${API_BASE_URL}/document/summarize`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            outputEl.innerHTML = `<p>${escapeHtml(data.summary)}</p>`;
            showNotification('Document summarized successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to summarize document', 'error');
        }
    } catch (error) {
        console.error('Document summarization error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to summarize document', 'error');
    }
}

// ===== VIDEO AI FUNCTIONALITY =====
function initializeVideoAI() {
    const generateVideoBtn = document.getElementById('generateVideoBtn');
    const downloadVideo = document.getElementById('downloadVideo');

    if (generateVideoBtn) {
        generateVideoBtn.addEventListener('click', generateVideo);
    }

    if (downloadVideo) {
        downloadVideo.addEventListener('click', handleDownloadVideo);
    }
}

async function generateVideo() {
    const prompt = document.getElementById('videoPrompt').value.trim();
    const duration = document.getElementById('videoDuration').value;
    const style = document.getElementById('videoStyle').value;
    const quality = document.getElementById('videoQuality').value;

    if (!prompt) {
        showNotification('Please enter a video description', 'error');
        return;
    }

    const loadingEl = document.getElementById('videoLoading');
    const previewContainer = document.getElementById('videoPreviewContainer');

    loadingEl.style.display = 'block';
    previewContainer.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/video/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, duration, style, quality })
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            document.getElementById('generatedVideo').src = data.videoUrl;
            previewContainer.style.display = 'block';
            showNotification('Video generated successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to generate video', 'error');
        }
    } catch (error) {
        console.error('Video generation error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to generate video', 'error');
    }
}

function handleDownloadVideo() {
    const video = document.getElementById('generatedVideo');
    const link = document.createElement('a');
    link.href = video.src;
    link.download = `brainrack-video-${Date.now()}.mp4`;
    link.click();
}

// ===== BUSINESS AI FUNCTIONALITY =====
function initializeBusinessAI() {
    const solveBtn = document.getElementById('solveBtn');
    if (solveBtn) {
        solveBtn.addEventListener('click', solveBusinessProblem);
    }
}

async function solveBusinessProblem() {
    const businessType = document.getElementById('businessType').value.trim();
    const problem = document.getElementById('businessProblem').value.trim();
    const category = document.getElementById('problemCategory').value;
    const includeExamples = document.getElementById('includeExamples').checked;
    const includeSteps = document.getElementById('includeSteps').checked;

    if (!problem) {
        showNotification('Please describe your business problem', 'error');
        return;
    }

    const loadingEl = document.getElementById('businessLoading');
    const outputEl = document.getElementById('solutionOutput');

    loadingEl.style.display = 'block';
    outputEl.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/business/solve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                businessType, 
                problem, 
                category, 
                includeExamples, 
                includeSteps 
            })
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            outputEl.innerHTML = `<p>${escapeHtml(data.solution).replace(/\n/g, '<br>')}</p>`;
            showNotification('Solution generated!', 'success');
        } else {
            showNotification(data.error || 'Failed to generate solution', 'error');
        }
    } catch (error) {
        console.error('Business solution error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to generate solution', 'error');
    }
}

// ===== STARTUP AI FUNCTIONALITY =====
function initializeStartupAI() {
    const generateIdeasBtn = document.getElementById('generateIdeasBtn');
    if (generateIdeasBtn) {
        generateIdeasBtn.addEventListener('click', generateStartupIdeas);
    }
}

async function generateStartupIdeas() {
    const interests = document.getElementById('interests').value.trim();
    const targetMarket = document.getElementById('targetMarket').value.trim();
    const budget = document.getElementById('budget').value;
    const timeframe = document.getElementById('timeframe').value;
    const additionalInfo = document.getElementById('additionalInfo').value.trim();
    const includeTrends = document.getElementById('includeTrends').checked;
    const includeCompetitors = document.getElementById('includeCompetitors').checked;
    const includeMonetization = document.getElementById('includeMonetization').checked;

    if (!interests) {
        showNotification('Please enter your interests/skills', 'error');
        return;
    }

    const loadingEl = document.getElementById('startupLoading');
    const outputEl = document.getElementById('ideasOutput');

    loadingEl.style.display = 'block';
    outputEl.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/startup/ideas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                interests, 
                targetMarket, 
                budget, 
                timeframe, 
                additionalInfo,
                includeTrends,
                includeCompetitors,
                includeMonetization
            })
        });

        const data = await response.json();
        loadingEl.style.display = 'none';

        if (data.success) {
            outputEl.innerHTML = `<p>${escapeHtml(data.ideas).replace(/\n/g, '<br>')}</p>`;
            showNotification('Startup ideas generated!', 'success');
        } else {
            showNotification(data.error || 'Failed to generate ideas', 'error');
        }
    } catch (error) {
        console.error('Startup ideas error:', error);
        loadingEl.style.display = 'none';
        showNotification('Failed to generate ideas', 'error');
    }
}

// ===== NEWS FUNCTIONALITY =====
function initializeNews() {
    loadNews('general');

    // Category buttons
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            loadNews(category);
        });
    });

    // Refresh button
    const refreshBtn = document.getElementById('refreshNewsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const activeCategory = document.querySelector('.category-btn.active');
            const category = activeCategory ? activeCategory.getAttribute('data-category') : 'general';
            loadNews(category);
        });
    }

    // Notification button
    const notifyBtn = document.getElementById('newsNotifyBtn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', toggleNewsNotifications);
    }

    // Check if notifications are enabled
    if (localStorage.getItem('newsNotifications') === 'enabled') {
        const notifyBtn = document.getElementById('newsNotifyBtn');
        if (notifyBtn) notifyBtn.classList.add('active');
        startNewsNotifications();
    }
}

async function loadNews(category) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading news...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/news/${category}`);
        const data = await response.json();

        if (data.success && data.articles) {
            displayNews(data.articles);
        } else {
            newsGrid.innerHTML = '<p>Failed to load news</p>';
        }
    } catch (error) {
        console.error('News loading error:', error);
        newsGrid.innerHTML = '<p>Failed to load news</p>';
    }
}

function displayNews(articles) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = '';

    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.onclick = () => window.open(article.url, '_blank');

        card.innerHTML = `
            ${article.urlToImage ? `<img src="${article.urlToImage}" alt="${article.title}" class="news-image">` : ''}
            <div class="news-content">
                <div class="news-source">${article.source.name}</div>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || ''}</p>
                <div class="news-meta">
                    <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;

        newsGrid.appendChild(card);
    });
}

function toggleNewsNotifications() {
    const notifyBtn = document.getElementById('newsNotifyBtn');
    
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                enableNewsNotifications();
            }
        });
    } else {
        if (notifyBtn.classList.contains('active')) {
            disableNewsNotifications();
        } else {
            enableNewsNotifications();
        }
    }
}

function enableNewsNotifications() {
    const notifyBtn = document.getElementById('newsNotifyBtn');
    notifyBtn.classList.add('active');
    localStorage.setItem('newsNotifications', 'enabled');
    startNewsNotifications();
    showNotification('News notifications enabled!', 'success');
}

function disableNewsNotifications() {
    const notifyBtn = document.getElementById('newsNotifyBtn');
    notifyBtn.classList.remove('active');
    localStorage.setItem('newsNotifications', 'disabled');
    showNotification('News notifications disabled', 'success');
}

function startNewsNotifications() {
    // Check for new news every 30 minutes
    setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/news/headlines`);
            const data = await response.json();

            if (data.success && data.articles && data.articles.length > 0) {
                const article = data.articles[0];
                new Notification('Breaking News', {
                    body: article.title,
                    icon: article.urlToImage || '/favicon.ico'
                });
            }
        } catch (error) {
            console.error('News notification error:', error);
        }
    }, 1800000); // 30 minutes
}

// ===== WEATHER FUNCTIONALITY =====
function initializeWeather() {
    const locationInput = document.getElementById('locationInput');
    const detectLocationBtn = document.getElementById('detectLocationBtn');
    const notifyBtn = document.getElementById('weatherNotifyBtn');

    if (locationInput) {
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = locationInput.value.trim();
                if (city) loadWeather(city);
            }
        });
    }

    if (detectLocationBtn) {
        detectLocationBtn.addEventListener('click', detectLocation);
    }

    if (notifyBtn) {
        notifyBtn.addEventListener('click', toggleWeatherNotifications);
    }

    // Load weather for default location or user's location
    const savedLocation = localStorage.getItem('weatherLocation');
    if (savedLocation) {
        loadWeather(savedLocation);
    } else {
        detectLocation();
    }

    // Check if notifications are enabled
    if (localStorage.getItem('weatherNotifications') === 'enabled') {
        const notifyBtn = document.getElementById('weatherNotifyBtn');
        if (notifyBtn) notifyBtn.classList.add('active');
        startWeatherNotifications();
    }
}

function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                loadWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                loadWeather('New York'); // Default fallback
            }
        );
    } else {
        loadWeather('New York');
    }
}

async function loadWeatherByCoords(lat, lon) {
    const weatherLoading = document.getElementById('weatherLoading');
    const weatherContent = document.getElementById('weatherContent');

    weatherLoading.style.display = 'block';
    weatherContent.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/weather/coords?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        weatherLoading.style.display = 'none';

        if (data.success) {
            displayWeather(data.weather);
            localStorage.setItem('weatherLocation', data.weather.name);
        } else {
            showNotification('Failed to load weather', 'error');
        }
    } catch (error) {
        console.error('Weather loading error:', error);
        weatherLoading.style.display = 'none';
        showNotification('Failed to load weather', 'error');
    }
}

async function loadWeather(city) {
    const weatherLoading = document.getElementById('weatherLoading');
    const weatherContent = document.getElementById('weatherContent');

    weatherLoading.style.display = 'block';
    weatherContent.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/weather/city?city=${encodeURIComponent(city)}`);
        const data = await response.json();

        weatherLoading.style.display = 'none';

        if (data.success) {
            displayWeather(data.weather);
            localStorage.setItem('weatherLocation', city);
        } else {
            showNotification('City not found', 'error');
        }
    } catch (error) {
        console.error('Weather loading error:', error);
        weatherLoading.style.display = 'none';
        showNotification('Failed to load weather', 'error');
    }
}

function displayWeather(weather) {
    const weatherContent = document.getElementById('weatherContent');
    weatherContent.style.display = 'block';

    // Current weather
    document.getElementById('cityName').textContent = weather.name;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    document.getElementById('temperature').textContent = `${Math.round(weather.main.temp)}°C`;
    document.getElementById('weatherDescription').textContent = weather.weather[0].description;
    document.getElementById('weatherIcon').className = `weather-icon fas ${getWeatherIcon(weather.weather[0].main)}`;
    document.getElementById('humidity').textContent = `${weather.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${weather.wind.speed} km/h`;
    document.getElementById('pressure').textContent = `${weather.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(weather.visibility / 1000).toFixed(1)} km`;
    document.getElementById('uvIndex').textContent = weather.uvi || 'N/A';
    document.getElementById('cloudiness').textContent = `${weather.clouds.all}%`;
    document.getElementById('sunrise').textContent = new Date(weather.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunset').textContent = new Date(weather.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Forecast (simulated - you would get this from a separate API call)
    displayForecast();
    displayHourlyForecast();
}

function displayForecast() {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    // Simulated 5-day forecast
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    days.forEach((day, index) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="date">${day}</div>
            <i class="fas ${getWeatherIcon('Clear')}"></i>
            <div class="temp">${20 + index}°C</div>
        `;
        forecastGrid.appendChild(card);
    });
}

function displayHourlyForecast() {
    const hourlyForecast = document.getElementById('hourlyForecast');
    hourlyForecast.innerHTML = '';

    // Simulated hourly forecast
    for (let i = 0; i < 24; i += 3) {
        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <div class="time">${i}:00</div>
            <i class="fas ${getWeatherIcon('Clear')}"></i>
            <div class="temp">${18 + i}°C</div>
        `;
        hourlyForecast.appendChild(card);
    }
}

function getWeatherIcon(condition) {
    const icons = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Drizzle': 'fa-cloud-rain',
        'Thunderstorm': 'fa-bolt',
        'Snow': 'fa-snowflake',
        'Mist': 'fa-smog',
        'Fog': 'fa-smog'
    };
    return icons[condition] || 'fa-cloud';
}

function toggleWeatherNotifications() {
    const notifyBtn = document.getElementById('weatherNotifyBtn');
    
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                enableWeatherNotifications();
            }
        });
    } else {
        if (notifyBtn.classList.contains('active')) {
            disableWeatherNotifications();
        } else {
            enableWeatherNotifications();
        }
    }
}

function enableWeatherNotifications() {
    const notifyBtn = document.getElementById('weatherNotifyBtn');
    notifyBtn.classList.add('active');
    localStorage.setItem('weatherNotifications', 'enabled');
    startWeatherNotifications();
    showNotification('Weather notifications enabled!', 'success');
}

function disableWeatherNotifications() {
    const notifyBtn = document.getElementById('weatherNotifyBtn');
    notifyBtn.classList.remove('active');
    localStorage.setItem('weatherNotifications', 'disabled');
    showNotification('Weather notifications disabled', 'success');
}

function startWeatherNotifications() {
    // Check weather every hour
    setInterval(async () => {
        const location = localStorage.getItem('weatherLocation') || 'New York';
        try {
            const response = await fetch(`${API_BASE_URL}/weather/city?city=${encodeURIComponent(location)}`);
            const data = await response.json();

            if (data.success) {
                const weather = data.weather;
                new Notification('Weather Update', {
                    body: `${weather.name}: ${Math.round(weather.main.temp)}°C, ${weather.weather[0].description}`,
                    icon: '/favicon.ico'
                });
            }
        } catch (error) {
            console.error('Weather notification error:', error);
        }
    }, 3600000); // 1 hour
}

// ===== CONTACT FUNCTIONALITY =====
function initializeContact() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    // Simulate form submission
    setTimeout(() => {
        document.getElementById('contactForm').style.display = 'none';
        document.getElementById('formSuccess').style.display = 'block';

        // Reset form after 3 seconds
        setTimeout(() => {
            document.getElementById('contactForm').reset();
            document.getElementById('contactForm').style.display = 'flex';
            document.getElementById('formSuccess').style.display = 'none';
        }, 3000);
    }, 1000);
}

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}