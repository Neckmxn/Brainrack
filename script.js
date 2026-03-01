// Global variables and settings
let currentTheme = localStorage.getItem('theme') || 'dark';
let voiceSettings = JSON.parse(localStorage.getItem('voiceSettings') || '{"speed": 1.0, "pitch": 1.0, "volume": 1.0, "voice": null}');

// Apply theme on page load
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    setupMenuListeners();
});

// Theme management
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    currentTheme = theme;
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// Menu functionality
function setupMenuListeners() {
    const menuIcon = document.getElementById('menuIcon');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const themeToggle = document.getElementById('themeToggle');

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

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }
}

// API Helper Functions
async function callAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {}
    };

    if (body) {
        if (body instanceof FormData) {
            options.body = body;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(endpoint, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Notification helpers
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showNotification(title, body, icon = 'ðŸ§ ') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: icon,
            badge: icon
        });
    }
}

// Voice settings management
function saveVoiceSettings(settings) {
    voiceSettings = { ...voiceSettings, ...settings };
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
}

function getVoiceSettings() {
    return voiceSettings;
}

// Speech synthesis helper
function speakText(text, language = 'en-US') {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const settings = getVoiceSettings();

        utterance.lang = language;
        utterance.rate = settings.speed || 1.0;
        utterance.pitch = settings.pitch || 1.0;
        utterance.volume = settings.volume || 1.0;

        if (settings.voice) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.name === settings.voice);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        window.speechSynthesis.speak(utterance);
    }
}

// Get available voices
function getAvailableVoices() {
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();

        if (voices.length > 0) {
            resolve(voices);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                resolve(voices);
            };
        }
    });
}

// Loading indicator
function showLoading(element, message = 'Loading...') {
    element.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--text-secondary-dark);">${message}</p>
        </div>
    `;
}

// Error display
function showError(element, message) {
    element.innerHTML = `
        <div style="background: rgba(231, 76, 60, 0.1); border: 2px solid #e74c3c; border-radius: 12px; padding: 1.5rem; text-align: center;">
            <p style="color: #e74c3c; font-weight: 600;">âŒ ${message}</p>
        </div>
    `;
}

// Success display
function showSuccess(element, message) {
    element.innerHTML = `
        <div style="background: rgba(46, 204, 113, 0.1); border: 2px solid #2ecc71; border-radius: 12px; padding: 1.5rem; text-align: center;">
            <p style="color: #2ecc71; font-weight: 600;">âœ… ${message}</p>
        </div>
    `;
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Local storage helpers
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy text:', err);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard!');
        } catch (err) {
            console.error('Could not copy text:', err);
        }
        document.body.removeChild(textArea);
    }
}

// Toast notification
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--accent-blue);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// File size formatter
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Validate file type
function validateFileType(file, allowedTypes) {
    const fileType = file.type;
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    return allowedTypes.some(type => {
        if (type.includes('*')) {
            const baseType = type.split('/')[0];
            return fileType.startsWith(baseType);
        }
        return fileType === type || fileExtension === type.replace('.', '');
    });
}

// Get geolocation
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                }
            );
        } else {
            reject(new Error('Geolocation is not supported'));
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    requestNotificationPermission();

    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
});

// Export functions for use in other scripts
window.BrainrackAI = {
    callAPI,
    toggleTheme,
    applyTheme,
    requestNotificationPermission,
    showNotification,
    saveVoiceSettings,
    getVoiceSettings,
    speakText,
    getAvailableVoices,
    showLoading,
    showError,
    showSuccess,
    formatDate,
    saveToLocalStorage,
    getFromLocalStorage,
    debounce,
    copyToClipboard,
    showToast,
    formatFileSize,
    validateFileType,
    getCurrentLocation
};