const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
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

const upload = multer({ storage });

// API Keys from environment variables
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ===== HELPER FUNCTIONS =====

async function callOpenRouter(messages, model = 'openai/gpt-3.5-turbo') {
    try {
        const response = await axios.post(
            OPENROUTER_API_URL,
            {
                model: model,
                messages: messages
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Brainrack AI'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
        throw new Error('Failed to get AI response');
    }
}

async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

function extractTextFromTxt(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

async function extractTextFromDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
        return await extractTextFromPDF(filePath);
    } else if (ext === '.txt') {
        return extractTextFromTxt(filePath);
    } else if (ext === '.docx') {
        // For DOCX, you would need a library like mammoth
        // For simplicity, treating as text for now
        return extractTextFromTxt(filePath);
    } else {
        throw new Error('Unsupported file format');
    }
}

// ===== ROUTES =====

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ===== CHAT API =====
app.post('/api/chat', async (req, res) => {
    try {
        const { message, language } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const messages = [
            {
                role: 'system',
                content: `You are a helpful AI assistant. Respond in the same language as the user's input. Be concise and friendly.`
            },
            {
                role: 'user',
                content: message
            }
        ];

        const response = await callOpenRouter(messages);

        res.json({ success: true, response });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== IMAGE AI API =====
app.post('/api/image/generate', async (req, res) => {
    try {
        const { prompt, size, style } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        // Enhanced prompt with style
        const enhancedPrompt = `${prompt}, ${style} style, high quality, detailed`;

        const messages = [
            {
                role: 'user',
                content: `Generate an image with the following description: ${enhancedPrompt}`
            }
        ];

        // Note: OpenRouter doesn't directly support image generation
        // You would need to use a model that supports image generation like DALL-E
        // For this example, we'll return a placeholder response
        const response = await callOpenRouter([
            {
                role: 'system',
                content: 'You are an AI that describes how an image would look based on a prompt.'
            },
            {
                role: 'user',
                content: `Describe in detail what an image of "${enhancedPrompt}" would look like.`
            }
        ]);

        // In a real implementation, you would use an image generation API
        // For now, returning a placeholder
        res.json({
            success: true,
            imageUrl: `https://via.placeholder.com/${size.replace('x', 'x')}?text=Generated+Image`,
            description: response
        });
    } catch (error) {
        console.error('Image generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/image/enhance', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imagePath = req.file.path;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Image is required' });
        }

        // In a real implementation, you would use an image enhancement API
        // For now, returning the original image URL
        const imageUrl = `/${imagePath}`;

        res.json({
            success: true,
            imageUrl: imageUrl,
            message: 'Image enhancement complete'
        });

        // Clean up uploaded file after some time
        setTimeout(() => {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }, 60000);
    } catch (error) {
        console.error('Image enhancement error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== DOCUMENT AI API =====
app.post('/api/document/analyze', upload.single('document'), async (req, res) => {
    try {
        const documentPath = req.file.path;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Document is required' });
        }

        const text = await extractTextFromDocument(documentPath);

        const messages = [
            {
                role: 'system',
                content: 'You are an AI document analyzer. Provide a comprehensive analysis of the document including main topics, key points, and overall summary.'
            },
            {
                role: 'user',
                content: `Analyze this document:\n\n${text.substring(0, 8000)}`
            }
        ];

        const analysis = await callOpenRouter(messages);

        // Clean up uploaded file
        fs.unlinkSync(documentPath);

        res.json({ success: true, analysis });
    } catch (error) {
        console.error('Document analysis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/document/question', upload.single('document'), async (req, res) => {
    try {
        const { question } = req.body;
        const documentPath = req.file.path;

        if (!req.file || !question) {
            return res.status(400).json({ success: false, error: 'Document and question are required' });
        }

        const text = await extractTextFromDocument(documentPath);

        const messages = [
            {
                role: 'system',
                content: 'You are an AI assistant that answers questions about documents. Provide accurate and specific answers based on the document content.'
            },
            {
                role: 'user',
                content: `Document content:\n${text.substring(0, 8000)}\n\nQuestion: ${question}`
            }
        ];

        const answer = await callOpenRouter(messages);

        // Clean up uploaded file
        fs.unlinkSync(documentPath);

        res.json({ success: true, answer });
    } catch (error) {
        console.error('Question answering error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/document/summarize', upload.single('document'), async (req, res) => {
    try {
        const { length } = req.body;
        const documentPath = req.file.path;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Document is required' });
        }

        const text = await extractTextFromDocument(documentPath);

        let summaryInstruction = '';
        if (length === 'short') {
            summaryInstruction = 'Provide a very brief summary in 3-5 sentences.';
        } else if (length === 'medium') {
            summaryInstruction = 'Provide a medium-length summary in 1-2 paragraphs.';
        } else {
            summaryInstruction = 'Provide a detailed summary covering all major points.';
        }

        const messages = [
            {
                role: 'system',
                content: `You are an AI document summarizer. ${summaryInstruction}`
            },
            {
                role: 'user',
                content: `Summarize this document:\n\n${text.substring(0, 8000)}`
            }
        ];

        const summary = await callOpenRouter(messages);

        // Clean up uploaded file
        fs.unlinkSync(documentPath);

        res.json({ success: true, summary });
    } catch (error) {
        console.error('Document summarization error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== VIDEO AI API =====
app.post('/api/video/generate', async (req, res) => {
    try {
        const { prompt, duration, style, quality } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        // In a real implementation, you would use a video generation API
        // For now, returning a placeholder response
        const messages = [
            {
                role: 'system',
                content: 'You are an AI that describes video content based on prompts.'
            },
            {
                role: 'user',
                content: `Describe a ${duration} second ${style} video about: ${prompt}`
            }
        ];

        const description = await callOpenRouter(messages);

        // Placeholder video URL
        res.json({
            success: true,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            description
        });
    } catch (error) {
        console.error('Video generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== BUSINESS AI API =====
app.post('/api/business/solve', async (req, res) => {
    try {
        const { businessType, problem, category, includeExamples, includeSteps } = req.body;

        if (!problem) {
            return res.status(400).json({ success: false, error: 'Problem description is required' });
        }

        let systemPrompt = 'You are an expert business consultant. Provide practical and actionable solutions to business problems.';

        if (includeExamples) {
            systemPrompt += ' Include real-world examples where applicable.';
        }

        if (includeSteps) {
            systemPrompt += ' Provide step-by-step action plans.';
        }

        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: `Business Type: ${businessType || 'General'}\nCategory: ${category}\n\nProblem: ${problem}\n\nProvide a comprehensive solution.`
            }
        ];

        const solution = await callOpenRouter(messages, 'openai/gpt-4-turbo');

        res.json({ success: true, solution });
    } catch (error) {
        console.error('Business solution error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== STARTUP AI API =====
app.post('/api/startup/ideas', async (req, res) => {
    try {
        const {
            interests,
            targetMarket,
            budget,
            timeframe,
            additionalInfo,
            includeTrends,
            includeCompetitors,
            includeMonetization
        } = req.body;

        if (!interests) {
            return res.status(400).json({ success: false, error: 'Interests are required' });
        }

        let systemPrompt = 'You are an expert startup advisor. Generate innovative and practical startup ideas.';

        if (includeTrends) {
            systemPrompt += ' Include current market trends.';
        }

        if (includeCompetitors) {
            systemPrompt += ' Include competitor analysis.';
        }

        if (includeMonetization) {
            systemPrompt += ' Include monetization strategies.';
        }

        const userPrompt = `
Interests/Skills: ${interests}
Target Market: ${targetMarket || 'General'}
Budget: ${budget}
Timeframe: ${timeframe}
${additionalInfo ? `Additional Info: ${additionalInfo}` : ''}

Generate 3-5 innovative startup ideas with detailed descriptions, implementation strategies, and potential challenges.
`;

        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: userPrompt
            }
        ];

        const ideas = await callOpenRouter(messages, 'openai/gpt-4-turbo');

        res.json({ success: true, ideas });
    } catch (error) {
        console.error('Startup ideas error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== NEWS API =====
app.get('/api/news/:category', async (req, res) => {
    try {
        const { category } = req.params;

        let endpoint = 'top-headlines';
        let params = {
            apiKey: NEWS_API_KEY,
            country: 'us',
            pageSize: 20
        };

        if (category === 'headlines') {
            params.category = 'general';
        } else if (category === 'general') {
            endpoint = 'everything';
            params.q = 'latest';
            params.sortBy = 'publishedAt';
            delete params.country;
        } else {
            params.category = category;
        }

        const response = await axios.get(`https://newsapi.org/v2/${endpoint}`, { params });

        res.json({
            success: true,
            articles: response.data.articles
        });
    } catch (error) {
        console.error('News API error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch news' });
    }
});

// ===== WEATHER API =====
app.get('/api/weather/city', async (req, res) => {
    try {
        const { city } = req.query;

        if (!city) {
            return res.status(400).json({ success: false, error: 'City is required' });
        }

        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        res.json({
            success: true,
            weather: response.data
        });
    } catch (error) {
        console.error('Weather API error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch weather' });
    }
});

app.get('/api/weather/coords', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ success: false, error: 'Coordinates are required' });
        }

        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat,
                lon,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        res.json({
            success: true,
            weather: response.data
        });
    } catch (error) {
        console.error('Weather API error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch weather' });
    }
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     🧠 Brainrack AI Server Started    ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                           ║
║  URL: http://localhost:${PORT}          ║
║                                        ║
║  Features:                             ║
║  ✓ AI Chat                             ║
║  ✓ Image Generation & Enhancement      ║
║  ✓ Document Analysis                   ║
║  ✓ Video Generation                    ║
║  ✓ Business Solutions                  ║
║  ✓ Startup Ideas                       ║
║  ✓ Real-time News                      ║
║  ✓ Weather Updates                     ║
╚════════════════════════════════════════╝
    `);

    // Check for required API keys
    if (!OPENROUTER_KEY) {
        console.warn('⚠️  WARNING: OPENROUTER_KEY not found in environment variables');
    }
    if (!NEWS_API_KEY) {
        console.warn('⚠️  WARNING: NEWS_API_KEY not found in environment variables');
    }
    if (!WEATHER_API_KEY) {
        console.warn('⚠️  WARNING: WEATHER_API_KEY not found in environment variables');
    }
});

module.exports = app;