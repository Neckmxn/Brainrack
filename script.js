// Global Variables
let currentTheme = localStorage.getItem('theme') || 'dark';
let userSettings = {
    voiceModel: localStorage.getItem('voiceModel') || 'alloy',
    voiceSpeed: parseFloat(localStorage.getItem('voiceSpeed')) || 1.0,
    voicePitch: parseFloat(localStorage.getItem('voicePitch')) || 1.0,
    voiceVolume: parseFloat(localStorage.getItem('voiceVolume')) || 1.0,
    aiModel: localStorage.getItem('aiModel') || 'anthropic/claude-3.5-sonnet'
};

// Initialize theme
document.documentElement.setAttribute('data-theme', currentTheme);

// DOM Elements (initialized when available)
let menuBtn, menuDropdown, themeToggle, settingsBtn, profileBtn;
let settingsModal, profileModal;
let closeSettings, closeProfile;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    loadUserSettings();
});

function initializeElements() {
    // Menu elements
    menuBtn = document.getElementById('menuBtn');
    menuDropdown = document.getElementById('menuDropdown');
    themeToggle = document.getElementById('themeToggle');
    settingsBtn = document.getElementById('settingsBtn');
    profileBtn = document.getElementById('profileBtn');

    // Modal elements
    settingsModal = document.getElementById('settingsModal');
    profileModal = document.getElementById('profileModal');
    closeSettings = document.getElementById('closeSettings');
    closeProfile = document.getElementById('closeProfile');
}

function setupEventListeners() {
    // Menu toggle
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
                menuDropdown.classList.remove('active');
            }
        });
    }

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            menuDropdown.classList.remove('active');
        });
    }

    // Settings modal
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
            menuDropdown.classList.remove('active');
            loadSettingsToModal();
        });
    }

    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    // Profile modal
    if (profileBtn && profileModal) {
        profileBtn.addEventListener('click', () => {
            profileModal.classList.add('active');
            menuDropdown.classList.remove('active');
            loadProfileToModal();
        });
    }

    if (closeProfile) {
        closeProfile.addEventListener('click', () => {
            profileModal.classList.remove('active');
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
        if (e.target === profileModal) {
            profileModal.classList.remove('active');
        }
    });

    // Settings form
    setupSettingsForm();
    setupProfileForm();
}

function setupSettingsForm() {
    const voiceSpeed = document.getElementById('voiceSpeed');
    const voicePitch = document.getElementById('voicePitch');
    const voiceVolume = document.getElementById('voiceVolume');
    const speedValue = document.getElementById('speedValue');
    const pitchValue = document.getElementById('pitchValue');
    const volumeValue = document.getElementById('volumeValue');
    const saveSettingsBtn = document.getElementById('saveSettings');

    // Update slider values
    if (voiceSpeed && speedValue) {
        voiceSpeed.addEventListener('input', (e) => {
            speedValue.textContent = e.target.value;
        });
    }

    if (voicePitch && pitchValue) {
        voicePitch.addEventListener('input', (e) => {
            pitchValue.textContent = e.target.value;
        });
    }

    if (voiceVolume && volumeValue) {
        voiceVolume.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value;
        });
    }

    // Save settings
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
}

function setupProfileForm() {
    const saveProfileBtn = document.getElementById('saveProfile');

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
}

function loadUserSettings() {
    // Load settings from localStorage
    const savedSettings = {
        voiceModel: localStorage.getItem('voiceModel'),
        voiceSpeed: localStorage.getItem('voiceSpeed'),
        voicePitch: localStorage.getItem('voicePitch'),
        voiceVolume: localStorage.getItem('voiceVolume'),
        aiModel: localStorage.getItem('aiModel')
    };

    userSettings = {
        voiceModel: savedSettings.voiceModel || 'alloy',
        voiceSpeed: parseFloat(savedSettings.voiceSpeed) || 1.0,
        voicePitch: parseFloat(savedSettings.voicePitch) || 1.0,
        voiceVolume: parseFloat(savedSettings.voiceVolume) || 1.0,
        aiModel: savedSettings.aiModel || 'anthropic/claude-3.5-sonnet'
    };
}

function loadSettingsToModal() {
    const voiceModel = document.getElementById('voiceModel');
    const voiceSpeed = document.getElementById('voiceSpeed');
    const voicePitch = document.getElementById('voicePitch');
    const voiceVolume = document.getElementById('voiceVolume');
    const aiModel = document.getElementById('aiModel');
    const speedValue = document.getElementById('speedValue');
    const pitchValue = document.getElementById('pitchValue');
    const volumeValue = document.getElementById('volumeValue');

    if (voiceModel) voiceModel.value = userSettings.voiceModel;
    if (voiceSpeed) {
        voiceSpeed.value = userSettings.voiceSpeed;
        if (speedValue) speedValue.textContent = userSettings.voiceSpeed;
    }
    if (voicePitch) {
        voicePitch.value = userSettings.voicePitch;
        if (pitchValue) pitchValue.textContent = userSettings.voicePitch;
    }
    if (voiceVolume) {
        voiceVolume.value = userSettings.voiceVolume;
        if (volumeValue) volumeValue.textContent = userSettings.voiceVolume;
    }
    if (aiModel) aiModel.value = userSettings.aiModel;
}

function saveSettings() {
    const voiceModel = document.getElementById('voiceModel');
    const voiceSpeed = document.getElementById('voiceSpeed');
    const voicePitch = document.getElementById('voicePitch');
    const voiceVolume = document.getElementById('voiceVolume');
    const aiModel = document.getElementById('aiModel');

    if (voiceModel) {
        userSettings.voiceModel = voiceModel.value;
        localStorage.setItem('voiceModel', voiceModel.value);
    }

    if (voiceSpeed) {
        userSettings.voiceSpeed = parseFloat(voiceSpeed.value);
        localStorage.setItem('voiceSpeed', voiceSpeed.value);
    }

    if (voicePitch) {
        userSettings.voicePitch = parseFloat(voicePitch.value);
        localStorage.setItem('voicePitch', voicePitch.value);
    }

    if (voiceVolume) {
        userSettings.voiceVolume = parseFloat(voiceVolume.value);
        localStorage.setItem('voiceVolume', voiceVolume.value);
    }

    if (aiModel) {
        userSettings.aiModel = aiModel.value;
        localStorage.setItem('aiModel', aiModel.value);
    }

    // Show success message
    alert('Settings saved successfully!');
    settingsModal.classList.remove('active');
}

function loadProfileToModal() {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userLanguage = document.getElementById('userLanguage');

    if (userName) userName.value = localStorage.getItem('userName') || '';
    if (userEmail) userEmail.value = localStorage.getItem('userEmail') || '';
    if (userLanguage) userLanguage.value = localStorage.getItem('userLanguage') || 'en';
}

function saveProfile() {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userLanguage = document.getElementById('userLanguage');

    if (userName && userName.value) {
        localStorage.setItem('userName', userName.value);
    }

    if (userEmail && userEmail.value) {
        localStorage.setItem('userEmail', userEmail.value);
    }

    if (userLanguage) {
        localStorage.setItem('userLanguage', userLanguage.value);
        // Trigger storage event for other components
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'userLanguage',
            newValue: userLanguage.value
        }));
    }

    alert('Profile saved successfully!');
    profileModal.classList.remove('active');
}

// Utility Functions
function showNotification(title, message, type = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'
        });
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// API Helper Functions
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Service Worker Registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    // Don't auto-request, let user enable via buttons
    console.log('Notification permission not granted yet');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search/input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const chatInput = document.getElementById('chatInput');
        const locationInput = document.getElementById('locationInput');
        if (chatInput) chatInput.focus();
        else if (locationInput) locationInput.focus();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        if (settingsModal) settingsModal.classList.remove('active');
        if (profileModal) profileModal.classList.remove('active');
        if (menuDropdown) menuDropdown.classList.remove('active');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('App is online');
    showNotification('Connection Restored', 'You are back online', 'success');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    showNotification('Connection Lost', 'You are currently offline', 'error');
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    // Only show warning if user has unsaved data
    const chatInput = document.getElementById('chatInput');
    const hasUnsavedContent = chatInput && chatInput.value.trim().length > 0;

    if (hasUnsavedContent) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Export functions for use in other scripts
window.BrainrackAI = {
    userSettings,
    showNotification,
    formatDate,
    truncateText,
    fetchAPI
};

console.log('🧠 Brainrack AI loaded successfully');