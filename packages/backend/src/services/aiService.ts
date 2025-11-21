import axios, { AxiosError } from 'axios';
import {
  GenerationRequest,
  AIServiceResponse,
  StrudelCode,
  Message,
} from '@kre8/shared';
import {
  loadPromptTemplate,
  loadFewShotExamples,
  loadDefaults,
  renderPrompt,
} from './configLoader.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

/**
 * Generate Strudel code from natural language prompt
 */
export async function generateMusicCode(
  request: GenerationRequest
): Promise<StrudelCode> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    // Load prompt template
    const templateName = request.refinement ? 'refinement' : 'music_generation';
    const promptTemplate = loadPromptTemplate(templateName);
    const examples = loadFewShotExamples();
    const defaults = loadDefaults();

    // Build system message
    const systemMessage = renderPrompt(promptTemplate, {
      examples: examples.length > 0
        ? examples.map((ex) => `User: ${ex.prompt}\nAssistant: ${ex.code}`).join('\n\n')
        : '',
      defaults: JSON.stringify(defaults, null, 2),
    });

    // Build user message with context
    let userMessage = request.prompt;
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      const history = request.conversationHistory
        .slice(-5) // Last 5 messages for context
        .map((msg: Message) => `${msg.role}: ${msg.content}`)
        .join('\n');
      userMessage = `Previous conversation:\n${history}\n\nNew request: ${request.prompt}`;
    }

    // Add config if provided
    if (request.config) {
      userMessage += `\n\nConfiguration: ${JSON.stringify(request.config, null, 2)}`;
    }

    // Build messages array
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ];

    // Make API request
    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_BASE_URL,
      {
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
          'X-Title': 'Kre8 Music Generator',
        },
        timeout: 30000,
      }
    );

    const choice = response.data.choices[0];
    if (!choice) {
      throw new Error('No response from AI model');
    }

    const content = choice.message.content.trim();

    // Extract code from response (handle markdown code blocks)
    let code = content;
    const codeBlockMatch = content.match(/```(?:javascript|js|strudel)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1].trim();
    }

    // Extract explanation if present
    let explanation: string | undefined;
    const explanationMatch = content.match(/(?:explanation|description|note):\s*(.+?)(?:\n|$)/i);
    if (explanationMatch) {
      explanation = explanationMatch[1].trim();
    }

    return {
      code,
      explanation: explanation || 'Generated Strudel pattern',
      metadata: {
        tempo: request.config?.tempo || defaults.tempo,
        instruments: extractInstruments(code),
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      throw new Error(`AI service error: ${message}`);
    }
    throw error;
  }
}

/**
 * Extract instrument names from Strudel code
 */
function extractInstruments(code: string): string[] {
  const instruments: Set<string> = new Set();
  
  // Match .s("instrument") patterns
  const soundMatches = code.match(/\.s\(["']([^"']+)["']\)/g);
  if (soundMatches) {
    soundMatches.forEach((match) => {
      const instrument = match.match(/["']([^"']+)["']/)?.[1];
      if (instrument) instruments.add(instrument);
    });
  }

  // Match sound("pattern") patterns
  const soundPatternMatches = code.match(/sound\(["']([^"']+)["']\)/g);
  if (soundPatternMatches) {
    soundPatternMatches.forEach((match) => {
      const pattern = match.match(/["']([^"']+)["']/)?.[1];
      if (pattern) {
        // Extract individual sounds from pattern
        pattern.split(/\s+/).forEach((sound) => {
          if (sound && !sound.match(/[~\[\]<>]/)) {
            instruments.add(sound);
          }
        });
      }
    });
  }

  return Array.from(instruments);
}

