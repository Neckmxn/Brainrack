require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');
const cron = require('node-cron');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 3000;

// API Keys
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY || '';
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || '';

// Setup VAPID only if keys exist
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@brainrack.ai',
      VAPID_PUBLIC,
      VAPID_PRIVATE
    );
  } catch (e) {
    console.log('VAPID setup skipped - invalid keys');
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// File upload config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Push notification subscriptions (in-memory for free tier)
let weatherSubscriptions = [];
let newsSubscriptions = [];

// ============== HEALTH CHECK ==============
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============== SERVE PAGES ==============
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ============== API KEY CHECK MIDDLEWARE ==============
function checkOpenRouterKey(req, res, next) {
  if (!OPENROUTER_KEY) {
    return res.status(500).json({
      error: 'OpenRouter API key not configured. Please add OPENROUTER_KEY to environment variables.'
    });
  }
  next();
}

function checkWeatherKey(req, res, next) {
  if (!OPENWEATHER_KEY) {
    return res.status(500).json({
      error: 'OpenWeather API key not configured. Please add OPENWEATHER_KEY to environment variables.'
    });
  }
  next();
}

function checkNewsKey(req, res, next) {
  if (!NEWS_API_KEY) {
    return res.status(500).json({
      error: 'News API key not configured. Please add NEWS_API_KEY to environment variables.'
    });
  }
  next();
}

// ============== AI CHAT (STREAMING) ==============
app.post('/api/chat', checkOpenRouterKey, async (req, res) => {
  try {
    const { messages, model } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-3.5-turbo',
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter error:', response.status, errorData);
      return res.status(response.status).json({
        error: `AI service error: ${response.status}`
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = response.body;
    let buffer = '';

    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
          } else {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // Skip malformed chunks
            }
          }
        }
      }
    });

    reader.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    reader.on('error', (err) => {
      console.error('Stream error:', err);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      reader.destroy();
    });

  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to get AI response' });
    }
  }
});

// ============== AI CHAT (NON-STREAMING) ==============
app.post('/api/chat-sync', checkOpenRouterKey, async (req, res) => {
  try {
    const { messages, model } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-3.5-turbo',
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter sync error:', errorText);
      return res.status(response.status).json({ error: 'AI service error' });
    }

    const data = await response.json();
    res.json({
      content: data.choices?.[0]?.message?.content || 'No response generated.'
    });
  } catch (error) {
    console.error('Chat sync error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// ============== IMAGE GENERATION ==============
app.post('/api/generate-image', checkOpenRouterKey, async (req, res) => {
  try {
    const { prompt, style } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Generate a detailed image description and create an SVG representation for: "${prompt}" in ${style || 'realistic'} style. Return ONLY a valid SVG code wrapped in <svg> tags that visually represents this concept. Make it colorful and detailed with shapes, gradients, and paths. The SVG should be 800x600 viewBox.`
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Image generation failed' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);

    if (svgMatch) {
      const svgBase64 = Buffer.from(svgMatch[0]).toString('base64');
      res.json({
        image: `data:image/svg+xml;base64,${svgBase64}`,
        description: prompt
      });
    } else {
      res.json({
        image: null,
        description: content,
        message: 'AI generated a description. Here is the detailed description.'
      });
    }
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// ============== IMAGE ENHANCEMENT ==============
app.post('/api/enhance-image', upload.single('image'), checkOpenRouterKey, async (req, res) => {
  try {
    const { enhancement } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
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
                text: `Analyze this image and provide detailed suggestions for enhancement: ${enhancement || 'general improvement'}. Describe color corrections, composition improvements, lighting adjustments, and other recommendations.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Enhancement analysis failed' });
    }

    const data = await response.json();
    res.json({
      suggestions: data.choices?.[0]?.message?.content || 'Unable to analyze image.',
      originalImage: `data:${mimeType};base64,${base64Image}`
    });
  } catch (error) {
    console.error('Image enhance error:', error);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
});

// ============== DOCUMENT ANALYSIS ==============
app.post('/api/analyze-document', upload.single('document'), checkOpenRouterKey, async (req, res) => {
  try {
    const { question, action } = req.body;
    let content = '';

    if (req.file) {
      const fileText = req.file.buffer.toString('utf-8');
      // Limit content to prevent token overflow
      content = fileText.substring(0, 15000);
    }

    if (!content && !question) {
      return res.status(400).json({ error: 'Please upload a document or enter a question' });
    }

    const systemPrompts = {
      summarize: 'You are a document summarizer. Provide a comprehensive but concise summary highlighting key points, main arguments, and conclusions.',
      analyze: 'You are a document analyzer. Provide detailed analysis including themes, structure, key insights, strengths, weaknesses, and recommendations.',
      question: 'You are a document Q&A assistant. Answer the specific question based on the document content. Be precise and reference specific parts.',
      solve: 'You are an expert problem solver. Analyze the problem in the document and provide a detailed step-by-step solution with explanations.'
    };

    const messages = [
      {
        role: 'system',
        content: systemPrompts[action] || 'You are a helpful document assistant.'
      },
      {
        role: 'user',
        content: question
          ? `Document content:\n${content}\n\nQuestion: ${question}`
          : `Document content:\n${content}\n\nPlease ${action} this document.`
      }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Document analysis failed' });
    }

    const data = await response.json();
    res.json({
      result: data.choices?.[0]?.message?.content || 'Unable to process document.'
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze document' });
  }
});

// ============== VIDEO GENERATION ==============
app.post('/api/generate-video', checkOpenRouterKey, async (req, res) => {
  try {
    const { prompt, duration, style } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional video production assistant. Create detailed storyboards, scripts, and scene descriptions.'
          },
          {
            role: 'user',
            content: `Create a detailed video storyboard for: "${prompt}"
Duration: ${duration || '30 seconds'}
Style: ${style || 'cinematic'}

Provide:
1. Complete scene-by-scene breakdown
2. Visual descriptions for each frame
3. Camera movements and transitions
4. Background music/audio suggestions
5. Text overlays if needed
6. Color palette and mood
7. Production notes`
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Video generation failed' });
    }

    const data = await response.json();
    res.json({
      storyboard: data.choices?.[0]?.message?.content || 'Failed to generate video concept.'
    });
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: 'Failed to generate video concept' });
  }
});

// ============== BUSINESS PROBLEM SOLVER ==============
app.post('/api/business-solve', checkOpenRouterKey, async (req, res) => {
  try {
    const { problem, industry, context } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a senior business consultant. Provide comprehensive, actionable solutions with frameworks, metrics, and implementation plans.'
          },
          {
            role: 'user',
            content: `Business Problem: ${problem}
Industry: ${industry || 'General'}
Context: ${context || 'Not specified'}

Provide:
1. Problem Analysis
2. Root Cause Assessment
3. Strategic Solutions (at least 3)
4. Implementation Roadmap
5. KPIs and Success Metrics
6. Risk Assessment
7. Resource Requirements
8. Timeline`
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Business solution failed' });
    }

    const data = await response.json();
    res.json({
      solution: data.choices?.[0]?.message?.content || 'Unable to generate solution.'
    });
  } catch (error) {
    console.error('Business solve error:', error);
    res.status(500).json({ error: 'Failed to solve business problem' });
  }
});

// ============== STARTUP IDEAS ==============
app.post('/api/startup-ideas', checkOpenRouterKey, async (req, res) => {
  try {
    const { interests, budget, skills, market } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://brainrack.ai',
        'X-Title': 'Brainrack AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a startup advisor. Generate innovative, viable startup ideas with comprehensive business plans.'
          },
          {
            role: 'user',
            content: `Generate startup ideas based on:
Interests: ${interests || 'Technology'}
Budget: ${budget || 'Not specified'}
Skills: ${skills || 'General'}
Target Market: ${market || 'Global'}

For each idea provide:
1. Startup Name & Tagline
2. Problem Statement
3. Solution
4. Business Model
5. Revenue Streams
6. Target Audience
7. Competitive Advantage
8. MVP Features
9. Marketing Strategy
10. Financial Projections
11. Scalability Plan`
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Startup ideas failed' });
    }

    const data = await response.json();
    res.json({
      ideas: data.choices?.[0]?.message?.content || 'Unable to generate startup ideas.'
    });
  } catch (error) {
    console.error('Startup ideas error:', error);
    res.status(500).json({ error: 'Failed to generate startup ideas' });
  }
});

// ============== WEATHER API ==============
app.get('/api/weather', checkWeatherKey, async (req, res) => {
  try {
    const { lat, lon, q } = req.query;
    let url;

    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else if (q) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: 'Location required (lat/lon or city name)' });
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// Weather Forecast
app.get('/api/weather/forecast', checkWeatherKey, async (req, res) => {
  try {
    const { lat, lon, q } = req.query;
    let url;

    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else if (q) {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&appid=${OPENWEATHER_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: 'Location required' });
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

// Air Quality
app.get('/api/weather/air', checkWeatherKey, async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Air quality error:', error);
    res.status(500).json({ error: 'Failed to fetch air quality' });
  }
});

// ============== NEWS API ==============
app.get('/api/news', checkNewsKey, async (req, res) => {
  try {
    const { category, q, page } = req.query;
    let url;

    if (q) {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&page=${page || 1}&pageSize=20&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?country=us&category=${category || 'general'}&page=${page || 1}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// ============== PUSH NOTIFICATIONS ==============
app.post('/api/subscribe/weather', (req, res) => {
  const subscription = req.body;
  if (subscription && subscription.endpoint) {
    // Remove duplicate
    weatherSubscriptions = weatherSubscriptions.filter(
      s => s.endpoint !== subscription.endpoint
    );
    weatherSubscriptions.push(subscription);
    console.log(`Weather subscriptions: ${weatherSubscriptions.length}`);
  }
  res.json({ success: true });
});

app.post('/api/subscribe/news', (req, res) => {
  const subscription = req.body;
  if (subscription && subscription.endpoint) {
    newsSubscriptions = newsSubscriptions.filter(
      s => s.endpoint !== subscription.endpoint
    );
    newsSubscriptions.push(subscription);
    console.log(`News subscriptions: ${newsSubscriptions.length}`);
  }
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

app.get('/api/vapid-public-key', (req, res) => {
  res.json({ key: VAPID_PUBLIC || '' });
});

// ============== CRON JOBS ==============
// Weather notifications every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  if (!OPENWEATHER_KEY || weatherSubscriptions.length === 0) return;

  console.log(`Sending weather notifications to ${weatherSubscriptions.length} subscribers`);

  const failedSubscriptions = [];

  for (const sub of weatherSubscriptions) {
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=New York&appid=${OPENWEATHER_KEY}&units=metric`
      );
      const weather = await weatherRes.json();

      const payload = JSON.stringify({
        title: '🌤 Brainrack Weather Update',
        body: `${weather.name}: ${Math.round(weather.main?.temp)}°C, ${weather.weather?.[0]?.description}`,
        icon: '/favicon.ico'
      });

      await webpush.sendNotification(sub, payload);
    } catch (err) {
      console.error('Weather push error:', err.statusCode || err.message);
      if (err.statusCode === 410 || err.statusCode === 404) {
        failedSubscriptions.push(sub.endpoint);
      }
    }
  }

  // Clean up expired subscriptions
  weatherSubscriptions = weatherSubscriptions.filter(
    s => !failedSubscriptions.includes(s.endpoint)
  );
});

// News notifications every hour
cron.schedule('0 * * * *', async () => {
  if (!NEWS_API_KEY || newsSubscriptions.length === 0) return;

  console.log(`Sending news notifications to ${newsSubscriptions.length} subscribers`);

  const failedSubscriptions = [];

  try {
    const newsRes = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${NEWS_API_KEY}`
    );
    const news = await newsRes.json();
    const article = news.articles?.[0];

    if (article) {
      for (const sub of newsSubscriptions) {
        try {
          const payload = JSON.stringify({
            title: '📰 Brainrack News Update',
            body: article.title,
            icon: '/favicon.ico',
            data: { url: article.url }
          });

          await webpush.sendNotification(sub, payload);
        } catch (err) {
          console.error('News push error:', err.statusCode || err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            failedSubscriptions.push(sub.endpoint);
          }
        }
      }
    }
  } catch (err) {
    console.error('News fetch error:', err.message);
  }

  newsSubscriptions = newsSubscriptions.filter(
    s => !failedSubscriptions.includes(s.endpoint)
  );
});

// ============== CATCH ALL ROUTES ==============
app.get('*', (req, res) => {
  const requestedFile = path.join(__dirname, 'public', req.path);
  res.sendFile(requestedFile, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    }
  });
});

// ============== ERROR HANDLING ==============
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============== START SERVER ==============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`  Brainrack AI Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  OpenRouter: ${OPENROUTER_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`  OpenWeather: ${OPENWEATHER_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`  NewsAPI: ${NEWS_API_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`  VAPID: ${VAPID_PUBLIC ? '✓ configured' : '✗ missing'}`);
  console.log(`========================================`);
});