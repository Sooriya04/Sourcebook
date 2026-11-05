export const DEFAULT_MOCK_VIDEO = {
  id: 'dQw4w9WgXcQ',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'Attention Is All You Need — Transformer Architecture Deep Dive',
  channel: 'AI Explained & Research',
  duration: '24:18',
  views: '840K views',
  published: '3 days ago',
  chapters: [
    { timestamp: '00:00', seconds: 0, title: 'Introduction & Sequential Model Limits' },
    { timestamp: '03:15', seconds: 195, title: 'Self-Attention Formula & Dot Product' },
    { timestamp: '08:40', seconds: 520, title: 'Multi-Head Attention Projections' },
    { timestamp: '14:22', seconds: 862, title: 'Positional Encodings without Recurrence' },
    { timestamp: '19:05', seconds: 1145, title: 'Training Efficiency & Benchmarks' },
    { timestamp: '22:30', seconds: 1350, title: 'Key Takeaways & Future Directions' }
  ],
  transcript: [
    { timestamp: '00:05', seconds: 5, text: 'Welcome back. Today we are breaking down the paper that changed modern AI forever: Attention Is All You Need.' },
    { timestamp: '01:10', seconds: 70, text: 'Before Transformers, sequential models like LSTMs had to process tokens one by one, creating a severe sequential bottleneck.' },
    { timestamp: '03:15', seconds: 195, text: 'Self-attention solves this by allowing every token to compute an attention score against all other tokens in parallel using queries, keys, and values.' },
    { timestamp: '08:40', seconds: 520, text: 'With Multi-Head Attention, we project queries, keys, and values h times with different learned linear projections to attend to information at different representation subspaces.' },
    { timestamp: '14:22', seconds: 862, text: 'Because there is no recurrence, positional encodings must be injected to give the model order awareness.' },
    { timestamp: '19:05', seconds: 1145, text: 'The result was dramatic: training times dropped by orders of magnitude while BLEU translation scores broke new records.' }
  ],
  initialMessages: [
    {
      id: 'msg-init',
      sender: 'assistant',
      text: 'I\'ve parsed and indexed this video transcript. Ask me any question, request a summary, or click any timestamp pill like [00:00] or [08:40] to jump the video directly to that moment!'
    }
  ],
  replies: {
    summary: '### Executive Summary\n\n- **Core Breakthrough [03:15]**: Eliminating recurrence entirely in favor of multi-head self-attention mechanisms.\n- **Subspace Projections [08:40]**: Allows the model to jointly attend to information from different representation subspaces at different positions.\n- **Order Awareness [14:22]**: Sine and cosine frequency encodings encode token distance without sequential recurrence.',
    default: 'At **[08:40]**, the presenter dives into **Multi-Head Attention**. Instead of performing a single attention function with $d_{model}$-dimensional queries, keys, and values, the architecture linearly projects them $h$ times to project into multiple learned subspaces.\n\nCombined with positional encodings at **[14:22]**, this completely eliminates the need for recurrence.'
  }
};
