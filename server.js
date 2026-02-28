const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Routes for HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/image', (req, res) => {
  res.sendFile(path.join(__dirname, 'image.html'));
});

app.get('/document', (req, res) => {
  res.sendFile(path.join(__dirname, 'document.html'));
});

app.get('/video', (req, res) => {
  res.sendFile(path.join(__dirname, 'video.html'));
});

app.get('/business', (req, res) => {
  res.sendFile(path.join(__dirname, 'business.html'));
});

app.get('/startup', (req, res) => {
  res.sendFile(path.join(__dirname, 'startup.html'));
});

app.get('/news', (req, res) => {
  res.sendFile(path.join(__dirname, 'news.html'));
});

app.get('/weather', (req, res) => {
  res.sendFile(path.join(__dirname, 'weather.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contactus.html'));
});

// API Routes
// OpenRouter AI Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'anthropic/claude-3.5-sonnet' } = req.body;
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Chat API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get AI response', 
      details: error.response?.data || error.message 
    });
  }
});

// Image Generation API
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/dall-e-3',
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Image Generation Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate image', 
      details: error.response?.data || error.message 
    });
  }
});

// Document Upload and Analysis
app.post('/api/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // Extract text based on file type
    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (fileExtension === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else {
      // Cleanup and return error
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Cleanup uploaded file
    fs.unlinkSync(filePath);

    res.json({ 
      success: true, 
      text: extractedText,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Document Upload Error:', error);
    res.status(500).json({ 
      error: 'Failed to process document', 
      details: error.message 
    });
  }
});

// News API
app.get('/api/news/:category?', async (req, res) => {
  try {
    const category = req.params.category || 'general';
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'News API key not configured' });
    }

    let url = '';
    if (category === 'headlines') {
      url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
    } else if (category === 'latest') {
      url = `https://newsapi.org/v2/everything?q=latest&sortBy=publishedAt&apiKey=${apiKey}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${apiKey}`;
    }

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('News API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch news', 
      details: error.response?.data || error.message 
    });
  }
});

// Weather API
app.get('/api/weather/:location?', async (req, res) => {
  try {
    const location = req.params.location || 'London';
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    // Get current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
    const weatherResponse = await axios.get(weatherUrl);

    // Get forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`;
    const forecastResponse = await axios.get(forecastUrl);

    res.json({
      current: weatherResponse.data,
      forecast: forecastResponse.data
    });
  } catch (error) {
    console.error('Weather API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather', 
      details: error.response?.data || error.message 
    });
  }
});

// Weather by coordinates
app.get('/api/weather-coords/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    // Get current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const weatherResponse = await axios.get(weatherUrl);

    // Get forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastResponse = await axios.get(forecastUrl);

    res.json({
      current: weatherResponse.data,
      forecast: forecastResponse.data
    });
  } catch (error) {
    console.error('Weather API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather', 
      details: error.response?.data || error.message 
    });
  }
});

// Text-to-Speech API (using OpenRouter for voice generation)
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;
    
    // Note: This is a placeholder. OpenRouter doesn't directly support TTS.
    // You would need to integrate with OpenAI's TTS API or another service
    res.json({ 
      message: 'TTS endpoint - implement with OpenAI TTS API or similar service',
      text: text
    });
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Here you would typically save to database or send email
    console.log('Contact Form Submission:', { name, email, message });
    
    res.json({ 
      success: true, 
      message: 'Thank you for contacting us! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Brainrack AI',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Brainrack AI Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});