export const DEFAULT_PROVIDER_CONFIGS = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'gemma2',
    apiKey: '',
    placeholderUrl: 'http://localhost:11434',
    placeholderModel: 'gemma2, llama3, qwen2.5',
    placeholderKey: 'Not required for local Ollama'
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    apiKey: '',
    placeholderUrl: 'https://api.openai.com/v1 (or local proxy)',
    placeholderModel: 'gpt-4o-mini, gpt-4o, o3-mini',
    placeholderKey: 'sk-...'
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-1.5-flash',
    apiKey: '',
    placeholderUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    placeholderModel: 'gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro',
    placeholderKey: 'AIzaSy...'
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    apiKey: '',
    placeholderUrl: 'https://api.groq.com/openai/v1',
    placeholderModel: 'llama-3.3-70b-versatile, llama-3.1-8b-instant',
    placeholderKey: 'gsk_...'
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct',
    apiKey: '',
    placeholderUrl: 'https://openrouter.ai/api/v1',
    placeholderModel: 'meta-llama/llama-3.3-70b-instruct, anthropic/claude-3.5-sonnet',
    placeholderKey: 'sk-or-v1-...'
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: '',
    placeholderUrl: 'https://api.deepseek.com/v1',
    placeholderModel: 'deepseek-chat, deepseek-reasoner',
    placeholderKey: 'sk-...'
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'meta/llama-3.1-70b-instruct',
    apiKey: '',
    placeholderUrl: 'https://integrate.api.nvidia.com/v1',
    placeholderModel: 'meta/llama-3.1-70b-instruct',
    placeholderKey: 'nvapi-...'
  }
};
