# 🧠 Brainrack AI

**Your All-in-One AI-Powered Assistant Platform**

Brainrack AI is a comprehensive web application that combines multiple AI-powered features into one seamless experience. From intelligent conversations to image generation, document analysis to business solutions, Brainrack AI has you covered.

---

## ✨ Features

### 🤖 AI Chat
- Multi-language voice input and output
- Typing animation for AI responses
- Customizable voice settings (speed, pitch, volume, model)
- Auto-detect language from user input

### 🎨 Image AI
- **Generate Images**: Create stunning images from text descriptions
- **Enhance Images**: Improve and modify existing images with AI
- Multiple style options (realistic, artistic, anime, digital art, 3D render)
- Download generated/enhanced images

### 📄 Document AI
- **Analyze Documents**: Get comprehensive analysis of PDFs, DOCX, and TXT files
- **Ask Questions**: Query specific information from documents
- **Summarize**: Get short, medium, or detailed summaries
- Support for multiple document formats

### 🎥 Video AI
- Generate videos from text descriptions
- Multiple style options (realistic, animated, artistic, cinematic)
- Quality settings (720p, 1080p, 4K)
- Various duration options

### 💼 Business AI
- Solve business problems with AI-powered solutions
- Category-specific advice (marketing, operations, finance, HR, etc.)
- Real-world examples and step-by-step action plans

### 🚀 Startup Ideas
- Generate innovative startup ideas based on your interests
- Market analysis and competitor insights
- Monetization strategies
- Budget and timeframe considerations

### 📰 Real-time News
- Latest headlines from multiple categories
- Real-time Chrome notifications for breaking news
- Categories: Latest, Headlines, Technology, Business, Sports, Entertainment, Health, Science

### 🌤️ Weather Updates
- Real-time weather data for any location
- Auto-detect current location
- 5-day forecast and hourly updates
- Detailed weather metrics (humidity, wind, pressure, visibility, UV index)
- Chrome notifications for weather updates

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- API Keys:
  - [OpenRouter API Key](https://openrouter.ai/)
  - [News API Key](https://newsapi.org/)
  - [OpenWeather API Key](https://openweathermap.org/api)

### Installation

1. **Clone or download the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your API keys:
     ```
     OPENROUTER_KEY=your_openrouter_api_key_here
     NEWS_API_KEY=your_news_api_key_here
     WEATHER_API_KEY=your_openweather_api_key_here
     ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Enjoy Brainrack AI!

---

## 🎯 Usage

### AI Chat
1. Navigate to the AI Chat page (Dashboard)
2. Type your message or click the microphone icon for voice input
3. The AI will respond in the same language you use
4. If you use voice input, the AI will respond with voice output
5. Customize voice settings in the Settings menu (three dots)

### Image Generation
1. Go to Image AI page
2. Enter a description of the image you want
3. Select size and style preferences
4. Click "Generate Image"
5. Download the generated image

### Document Analysis
1. Go to Document AI page
2. Upload a PDF, DOCX, or TXT file
3. Choose to analyze, ask questions, or summarize
4. Get instant AI-powered insights

### News & Weather
1. Navigate to News or Weather pages
2. For News: Select categories and enable notifications
3. For Weather: Search for a city or use auto-detect location
4. Enable Chrome notifications for real-time updates

---

## 🎨 Theme

Brainrack AI features a beautiful dark gradient blue theme with:
- Smooth animations and transitions
- Responsive design for all devices
- Light/Dark mode toggle
- Clean and minimal UI

---

## 📁 Project Structure

```
brainrack-ai/
├── index.html              # Landing page with about section
├── dashboard.html          # AI Chat page
├── image.html             # Image generation & enhancement
├── document.html          # Document analysis
├── video.html             # Video generation
├── business.html          # Business problem solver
├── startup.html           # Startup ideas generator
├── news.html              # Real-time news
├── weather.html           # Weather updates
├── contactus.html         # Contact page
├── style.css              # Complete styling
├── script.js              # Client-side functionality
├── server.js              # Express server with API routes
├── package.json           # Dependencies
├── .env.example           # Environment variables template
└── README.md              # This file
```

---

## 🔑 API Keys Setup

### OpenRouter (Required)
1. Visit [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up for an account
3. Generate an API key
4. Add to `.env` as `OPENROUTER_KEY`

### News API (Required for News feature)
1. Visit [https://newsapi.org/](https://newsapi.org/)
2. Register for a free account
3. Get your API key
4. Add to `.env` as `NEWS_API_KEY`

### OpenWeather API (Required for Weather feature)
1. Visit [https://openweathermap.org/api](https://openweathermap.org/api)
2. Sign up for a free account
3. Generate an API key
4. Add to `.env` as `WEATHER_API_KEY`

---

## 🌟 Key Features

### Voice Interaction
- **Multi-language Support**: Automatically detects and responds in the user's language
- **Voice Input**: Click microphone to speak
- **Voice Output**: AI responds with voice when using voice input
- **Customizable**: Adjust speed, pitch, volume, and voice model

### Real-time Notifications
- **News Notifications**: Get breaking news alerts
- **Weather Notifications**: Stay updated on weather changes
- **Chrome Integration**: Native browser notifications

### User Settings
- **Profile Management**: Save your name and email
- **Theme Toggle**: Switch between light and dark modes
- **Voice Settings**: Customize AI voice preferences
- **Persistent Storage**: Settings saved in browser

---

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3 (Custom design with CSS variables)
- JavaScript (ES6+)
- Font Awesome Icons
- Web Speech API (voice input/output)

### Backend
- Node.js
- Express.js
- Multer (file uploads)
- Axios (API requests)
- pdf-parse (PDF processing)

### APIs
- OpenRouter AI
- News API
- OpenWeather API

---

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and private
- Use environment variables for all sensitive data
- The `.env` file is included in `.gitignore`

---

## 📝 Developer Information

- **Development Team**: Brainrack AI Development Team
- **Version**: 1.0.0
- **Last Updated**: 2025
- **License**: MIT

---

## 🤝 Support

For support, feedback, or feature requests:
- Email: support@brainrackai.com
- Phone: +1 (555) 123-4567
- Address: 123 AI Street, Tech Valley, CA 94000

---

## 🎉 Enjoy Brainrack AI!

Thank you for using Brainrack AI. We hope this platform helps you unleash your creativity and solve complex problems with the power of AI.

**Happy Creating! 🚀**