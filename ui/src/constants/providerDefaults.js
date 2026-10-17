export const DEFAULT_PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'http://localhost:20128/v1',
    model: 'ag/gemini-3.6-flash-low',
    apiKey: '',
    placeholderUrl: 'http://localhost:20128/v1',
    placeholderModel: 'ag/gemini-3.6-flash-low',
    placeholderKey: 'sk-... (optional for local proxy)'
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'gemma2',
    apiKey: '',
    placeholderUrl: 'http://localhost:11434',
    placeholderModel: 'gemma2, llama3, qwen2.5',
    placeholderKey: 'Not required for local Ollama'
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    apiKey: '',
    placeholderUrl: 'https://api.groq.com/openai/v1',
    placeholderModel: 'llama-3.3-70b-versatile',
    placeholderKey: 'gsk_...'
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
