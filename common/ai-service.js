/**
 * AI Story Generation Service
 * Supports Google Gemini (free tier), OpenAI, and Anthropic
 */

const AI_PROVIDERS = {
  GEMINI: {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    free: true,
    defaultModel: 'gemini-1.5-flash'
  },
  OPENAI: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    keyUrl: 'https://platform.openai.com/api-keys',
    free: false,
    defaultModel: 'gpt-4o-mini'
  },
  ANTHROPIC: {
    name: 'Anthropic Claude',
    url: 'https://api.anthropic.com/v1/messages',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    free: false,
    defaultModel: 'claude-3-haiku-20240307'
  }
};

class AIService {
  constructor() {
    this.provider = null;
    this.apiKey = null;
    this.model = null;
  }

  async loadSettings() {
    const result = await browserAPI.storage.local.get(['aiProvider', 'aiApiKey', 'aiModel']);
    this.provider = result.aiProvider || 'GEMINI';
    this.apiKey = result.aiApiKey || '';
    this.model = result.aiModel || AI_PROVIDERS[this.provider].defaultModel;
  }

  async generateStory(words, options = {}) {
    await this.loadSettings();
    
    if (!this.apiKey) {
      throw new Error('Please set your API key in Extension Options');
    }

    const { language = 'English', difficulty = 'intermediate', style = 'engaging' } = options;
    
    const prompt = this.buildPrompt(words, language, difficulty, style);
    
    switch (this.provider) {
      case 'GEMINI':
        return this.callGemini(prompt);
      case 'OPENAI':
        return this.callOpenAI(prompt);
      case 'ANTHROPIC':
        return this.callAnthropic(prompt);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  buildPrompt(words, language, difficulty, style) {
    const wordList = words.map(w => w.word).join(', ');
    const wordDetails = words.map(w => 
      `- ${w.word}: ${w.meaning || '(meaning not available)'}`
    ).join('\n');

    return `Write a short, ${style} story (200-300 words) in ${language} that naturally incorporates these vocabulary words:

${wordDetails}

Requirements:
1. The story should be ${difficulty} level
2. Each target word should appear 1-2 times in natural context
3. After the story, list the target words with brief definitions
4. Make the story memorable and relatable

Format:
- Story title
- Story text with **bold** target words
- Word list with definitions at the end`;
  }

  async callGemini(prompt) {
    const url = `${AI_PROVIDERS.GEMINI.url}?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async callOpenAI(prompt) {
    const response = await fetch(AI_PROVIDERS.OPENAI.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callAnthropic(prompt) {
    const response = await fetch(AI_PROVIDERS.ANTHROPIC.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

// Export for use in other modules
window.AIService = AIService;
window.AI_PROVIDERS = AI_PROVIDERS;
