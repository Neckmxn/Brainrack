require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 3000;

const OPENROUTER_KEY = process.env.OPENROUTER_KEY || 'YOUR_OPENROUTER_API_KEY';
const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY || 'YOUR_OPENWEATHER_API_KEY';
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWSAPI_KEY';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC || 'BExamplePublicKey';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'examplePrivateKey';

webpush.setVapidDetails('mailto:admin@brainrack.ai', VAPID_PUBLIC, VAPID_PRIVATE);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

let weatherSubscriptions = [];
let newsSubscriptions = [];

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// OpenRouter AI Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-3.5-turbo',
        messages: messages,
        stream: true
      })
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body;
    reader.on('data', (chunk) => {
      res.write(chunk);
    });
    reader.on('end', () => {
      res.end();
    });
    reader.on('error', (err) => {
      console.error('Stream error:', err);
      res.end();
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Non-streaming chat
app.post('/api/chat-simple', async (req, res) => {
  try {
    const { messages, model } = req.body;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-3.5-turbo',
        messages: messages
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// AI Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style, size } = req.body;

    const enhancedPrompt = `Create a highly detailed, professional ${style || 'realistic'} image: ${prompt}. High quality, 4K resolution, masterpiece.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/dall-e-3',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: enhancedPrompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// AI Image Enhancement
app.post('/api/enhance-image', upload.single('image'), async (req, res) => {
  try {
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const enhanceType = req.body.enhanceType || 'enhance';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and provide a detailed description of how to ${enhanceType} it. Describe improvements in detail.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Image enhance error:', error);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
});

// Document Analysis
app.post('/api/analyze-document', upload.single('document'), async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const question = req.body.question || 'Analyze and summarize this document in detail.';

    let content = [];

    if (mimeType.startsWith('image/')) {
      const base64 = fileBuffer.toString('base64');
      content = [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
      ];
    } else {
      const textContent = fileBuffer.toString('utf-8');
      content = [
        {
          type: 'text',
          text: `Document: "${fileName}"\n\nContent:\n${textContent.substring(0, 15000)}\n\nQuestion/Task: ${question}`
        }
      ];
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert document analyzer. Provide thorough, well-structured analysis.'
          },
          {
            role: 'user',
            content: content
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze document' });
  }
});

// Video Generation (AI Script + Storyboard)
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, duration, style } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional video creator. Create detailed video scripts with scene descriptions, dialogue, visual directions, transitions, and timing. Format as a complete production-ready storyboard.'
          },
          {
            role: 'user',
            content: `Create a detailed ${duration || '60 second'} ${style || 'cinematic'} video storyboard for: ${prompt}. Include scene-by-scene breakdown with visual descriptions, camera angles, transitions, audio/music notes, and narration/dialogue.`
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

// Business Problem Solver
app.post('/api/business-solve', async (req, res) => {
  try {
    const { problem, industry, context } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a world-class business consultant with expertise in strategy, operations, marketing, finance, and management. Provide actionable, detailed solutions with step-by-step implementation plans, metrics, timelines, and risk assessments.'
          },
          {
            role: 'user',
            content: `Industry: ${industry || 'General'}\nContext: ${context || 'N/A'}\n\nBusiness Problem: ${problem}\n\nProvide a comprehensive solution with:\n1. Problem Analysis\n2. Root Causes\n3. Strategic Solutions (multiple options)\n4. Implementation Roadmap\n5. KPIs and Metrics\n6. Risk Assessment\n7. Budget Considerations\n8. Timeline`
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Business solve error:', error);
    res.status(500).json({ error: 'Failed to solve business problem' });
  }
});

// Startup Ideas
app.post('/api/startup-ideas', async (req, res) => {
  try {
    const { interests, budget, skills, market } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a visionary startup advisor and venture capital expert. Generate innovative, viable startup ideas with comprehensive business plans.'
          },
          {
            role: 'user',
            content: `Generate innovative startup ideas based on:\nInterests: ${interests || 'Technology'}\nBudget: ${budget || 'Not specified'}\nSkills: ${skills || 'General'}\nTarget Market: ${market || 'Global'}\n\nFor each idea provide:\n1. Startup Name & Concept\n2. Problem it Solves\n3. Target Audience\n4. Revenue Model\n5. MVP Features\n6. Tech Stack Suggestion\n7. Go-to-Market Strategy\n8. Estimated Costs\n9. Competitive Advantage\n10. Growth Potential & Scalability`
          }
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Startup ideas error:', error);
    res.status(500).json({ error: 'Failed to generate startup ideas' });
  }
});

// Weather API
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, q } = req.query;
    let url;

    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else if (q) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: 'Location required' });
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({ error: 'Failed to get weather data' });
  }
});

// Weather Forecast
app.get('/api/weather/forecast', async (req, res) => {
  try {
    const { lat, lon, q } = req.query;
    let url;

    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else if (q) {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: 'Location required' });
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: 'Failed to get forecast data' });
  }
});

// Air Quality
app.get('/api/weather/air', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get air quality data' });
  }
});

// News API
app.get('/api/news', async (req, res) => {
  try {
    const { category, q, page, country } = req.query;
    let url;

    if (q) {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&page=${page || 1}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?country=${country || 'us'}&category=${category || 'general'}&page=${page || 1}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ error: 'Failed to get news data' });
  }
});

// Push Notification Subscriptions
app.post('/api/subscribe/weather', (req, res) => {
  const subscription = req.body;
  weatherSubscriptions.push(subscription);
  res.json({ success: true });
});

app.post('/api/subscribe/news', (req, res) => {
  const subscription = req.body;
  newsSubscriptions.push(subscription);
  res.json({ success: true });
});

app.post('/api/unsubscribe/weather', (req, res) => {
  const { endpoint } = req.body;
  weatherSubscriptions = weatherSubscriptions.filter(s => s.endpoint !== endpoint);
  res.json({ success: true });
});

app.post('/api/unsubscribe/news', (req, res) => {
  const { endpoint } = req.body;
  newsSubscriptions = newsSubscriptions.filter(s => s.endpoint !== endpoint);
  res.json({ success: true });
});

// Get VAPID public key
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

// Send weather notifications every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  if (weatherSubscriptions.length === 0) return;
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=New York&appid=${OPENWEATHER_KEY}&units=metric`);
    const data = await response.json();
    const payload = JSON.stringify({
      title: '🌤 Brainrack Weather Update',
      body: `${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`,
      icon: '/favicon.ico',
      tag: 'weather-update'
    });
    weatherSubscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => {
        console.error('Push error:', err);
      });
    });
  } catch (error) {
    console.error('Weather notification error:', error);
  }
});

// Send news notifications every hour
cron.schedule('0 * * * *', async () => {
  if (newsSubscriptions.length === 0) return;
  try {
    const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${NEWS_API_KEY}`);
    const data = await response.json();
    if (data.articles && data.articles.length > 0) {
      const article = data.articles[0];
      const payload = JSON.stringify({
        title: '📰 Brainrack News Update',
        body: article.title,
        icon: '/favicon.ico',
        tag: 'news-update',
        data: { url: article.url }
      });
      newsSubscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(err => {
          console.error('Push error:', err);
        });
      });
    }
  } catch (error) {
    console.error('News notification error:', error);
  }
});

// Contact form
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  console.log('Contact form:', { name, email, subject, message });
  res.json({ success: true, message: 'Message received! We\'ll get back to you soon.' });
});

app.listen(PORT, () => {
  console.log(`Brainrack AI server running on http://localhost:${PORT}`);
});