/**
 * Mock API responses for testing
 */

export const mockOpenRouterResponse = {
  id: 'test-response-id',
  choices: [{
    message: {
      role: 'assistant',
      content: '```javascript\ns("bd sd").gain(0.9)\n```',
    },
    finish_reason: 'stop',
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
  model: 'anthropic/claude-3.5-sonnet',
};

export const mockStrudelCode = {
  code: 's("bd sd").gain(0.9)',
  explanation: 'A simple drum beat with kick and snare',
  metadata: {
    tempo: 120,
    instruments: ['bd', 'sd'],
  },
};

export const mockTranscriptionResponse = {
  text: 'Create a funky house beat with deep bassline',
  language: 'en',
  confidence: 0.95,
};

export const mockGenerationRequest = {
  prompt: 'create a house beat',
  config: {
    tempo: 120,
    scale: 'major',
    key: 'C',
  },
};

