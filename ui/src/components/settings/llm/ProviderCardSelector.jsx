import React from 'react';
import { Check, Cpu, Sparkles, Zap, Network, Bot, Server } from 'lucide-react';
import Badge from '../../ui/Badge';

const PROVIDER_OPTIONS = [
  {
    id: 'ollama',
    label: 'Ollama Native',
    desc: 'Local daemon running on localhost:11434',
    tag: 'Local Offline',
    icon: <Server size={14} />
  },
  {
    id: 'openai',
    label: 'OpenAI Compatible',
    desc: 'Direct OpenAI or local vLLM / LocalAI proxy',
    tag: 'Standard API',
    icon: <Bot size={14} />
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    desc: 'gemini-1.5-flash, gemini-2.0 via OpenAI spec',
    tag: 'Google Cloud',
    icon: <Sparkles size={14} />
  },
  {
    id: 'groq',
    label: 'Groq Cloud',
    desc: 'Ultra low-latency LPU inference',
    tag: 'Fast LPUs',
    icon: <Zap size={14} />
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    desc: 'Unified gateway across 200+ foundation models',
    tag: 'Multi-Model',
    icon: <Network size={14} />
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    desc: 'deepseek-chat and reasoning models',
    tag: 'Reasoning API',
    icon: <Cpu size={14} />
  },
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    desc: 'NVIDIA accelerated microservice endpoints',
    tag: 'Enterprise NIM',
    icon: <Cpu size={14} />
  }
];

export default function ProviderCardSelector({ provider, onSelectProvider }) {
  return (
    <div className="provider-grid">
      {PROVIDER_OPTIONS.map((p) => {
        const isSelected = provider === p.id;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectProvider(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectProvider(p.id);
              }
            }}
            className={`provider-card ${isSelected ? 'selected' : ''}`}
          >
            <div>
              <div className="provider-card-header">
                <span className="provider-card-title">{p.label}</span>
                {isSelected ? (
                  <span className="provider-check-pill" title="Active selection">
                    <Check size={10} strokeWidth={3} />
                  </span>
                ) : (
                  <Badge variant="neutral" size="sm">
                    {p.tag}
                  </Badge>
                )}
              </div>
              <p className="provider-card-desc">{p.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
