const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language } = req.body;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant. ${language ? `Please respond in ${language}.` : ''}`
          },
          {
            role: 'user',
            content: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json({
      response: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error.response?.data?.error || error.message
    });
  }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/dall-e-3',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json({
      imageUrl: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Image generation error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.response?.data?.error || error.message
    });
  }
});

// Image enhancement endpoint
app.post('/api/enhance-image', async (req, res) => {
  try {
    const { imageData, enhancePrompt } = req.body;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: `Analyze this image and suggest enhancements: ${enhancePrompt || 'general improvement'}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json({
      enhancement: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Image enhancement error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to enhance image',
      details: error.response?.data?.error || error.message
    });
  }
});

// Document analysis endpoint
app.post('/api/analyze-document', upload.single('document'), async (req, res) => {
  try {
    const { question } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let documentText = '';

    // Parse PDF
    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer);
      documentText = pdfData.text;
    } else {
      documentText = file.buffer.toString('utf-8');
    }

    // Send to OpenRouter for analysis
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a document analysis expert. Analyze the provided document and answer questions about it.'
          },
          {
            role: 'user',
            content: `Document content:\n${documentText.substring(0, 12000)}\n\nQuestion: ${question || 'Please provide a summary of this document.'}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json({
      analysis: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Document analysis error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to analyze document',
      details: error.response?.data?.error || error.message
    });
  }
});

// Video generation endpoint (generates video script/storyboard)
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a video content creator. Create detailed video scripts, storyboards, and scene descriptions.'
          },
          {
            role: 'user',
            content: `Create a detailed video script for: ${prompt}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json({
      videoScript: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Video generation error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate video script',
      details: error.response?.data?.error || error.message
    });
  }
});

// Business problem solver endpoint
app.post('/api/business-solver', async (req, res) => {
  try {
    const { problem } = req.body;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business consultant specializing in problem-solving, strategy, and optimization.'
          },
          {
            role: 'user',
            content: problem
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json({
      solution: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Business solver error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to solve business problem',
      details: error.response?.data?.error || error.message
    });
  }
});

// Startup ideas endpoint
app.post('/api/startup-ideas', async (req, res) => {
  try {
    const { industry, budget, interests } = req.body;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a startup advisor and innovation expert. Generate innovative, practical startup ideas.'
          },
          {
            role: 'user',
            content: `Generate startup ideas for:\nIndustry: ${industry}\nBudget: ${budget}\nInterests: ${interests}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Brainrack AI'
        }
      }
    );

    res.json({
      ideas: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Startup ideas error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate startup ideas',
      details: error.response?.data?.error || error.message
    });
  }
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const WEATHER_API_KEY = process.env.OPENWEATHER_KEY;

    let url;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: 'Location required' });
    }

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Weather error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      details: error.response?.data?.message || error.message
    });
  }
});

// Weather forecast endpoint
app.get('/api/weather/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const WEATHER_API_KEY = process.env.OPENWEATHER_KEY;

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Forecast error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch forecast data',
      details: error.response?.data?.message || error.message
    });
  }
});

// News endpoint
app.get('/api/news', async (req, res) => {
  try {
    const { category = 'general', country = 'us' } = req.query;
    const NEWS_API_KEY = process.env.NEWS_API_KEY;

    const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${NEWS_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('News error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch news',
      details: error.response?.data?.message || error.message
    });
  }
});

// Text-to-Speech endpoint
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice, pitch, speed } = req.body;

    // Return instructions for client-side TTS using Web Speech API
    res.json({
      success: true,
      message: 'Use client-side Web Speech API for TTS',
      params: { text, voice, pitch, speed }
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      error: 'Failed to process text-to-speech',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Brainrack AI server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});