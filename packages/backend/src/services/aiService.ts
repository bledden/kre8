import axios, { AxiosError } from 'axios';
import {
  GenerationRequest,
  AIServiceResponse,
  StrudelCode,
  Message,
} from '@kre8/shared';
import {
  loadDefaults,
} from './configLoader.js';
import { AI_CONFIG, MUSIC_CONFIG } from '../constants/index.js';
import { withRetry } from '../utils/retry.js';
import { searchPreferences, buildPreferenceContext } from './preferenceService.js';
import { getSoundsForRequest } from './soundSearchService.js';
import { buildDynamicPrompt, analyzePrompt } from './dynamicPromptService.js';

// =============================================================================
// xAI/Grok API Configuration
// =============================================================================
// Read API key lazily to ensure dotenv has loaded
const getApiKey = () => process.env.XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1/chat/completions';

// Task-specific model routing for optimal performance
const MODELS = {
  // Creative tasks: music generation, image-to-music, full tracks
  // Uses reasoning mode for best quality output
  CREATIVE: process.env.XAI_MODEL_CREATIVE || 'grok-4-1-fast-reasoning',

  // Agent tasks: x_search, web_search, code_execution, collections
  // Optimized for tool calling
  AGENT: process.env.XAI_MODEL_AGENT || 'grok-4-1-fast',

  // Simple tasks: voice feedback, error messages, status text
  // Fastest response time
  SIMPLE: process.env.XAI_MODEL_SIMPLE || 'grok-4-1-fast-non-reasoning',
} as const;

// Legacy fallback (used if task-specific env vars not set)
// Keeping for backwards compatibility with existing deployments
const _XAI_MODEL_LEGACY = process.env.XAI_MODEL; // eslint-disable-line @typescript-eslint/no-unused-vars

// TTS voice configuration
export const XAI_TTS_VOICE = process.env.XAI_TTS_VOICE || 'Eve';

/**
 * Task types for model routing
 */
export type TaskType =
  | 'generate_music'
  | 'refine_music'
  | 'image_to_music'
  | 'full_track_production'
  | 'x_search'
  | 'web_search'
  | 'code_validation'
  | 'sentiment_analysis'
  | 'collections_search'
  | 'context'
  | 'voice_feedback'
  | 'error_message'
  | 'status_text';

/**
 * Get the optimal model for a given task type
 */
export function getModelForTask(task: TaskType): string {
  switch (task) {
    // Creative tasks - need reasoning for best quality
    case 'generate_music':
    case 'refine_music':
    case 'image_to_music':
    case 'full_track_production':
      return MODELS.CREATIVE;

    // Agent/tool tasks - optimized for tool calling
    case 'x_search':
    case 'web_search':
    case 'code_validation':
    case 'sentiment_analysis':
    case 'collections_search':
    case 'context':
      return MODELS.AGENT;

    // Simple text - fast responses
    case 'voice_feedback':
    case 'error_message':
    case 'status_text':
      return MODELS.SIMPLE;

    default:
      return MODELS.CREATIVE; // Default to best quality
  }
}

/**
 * Get model configuration info for display/debugging
 */
export function getModelConfig() {
  return {
    creative: MODELS.CREATIVE,
    agent: MODELS.AGENT,
    simple: MODELS.SIMPLE,
    ttsVoice: XAI_TTS_VOICE,
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
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
 * Extract the original user prompt from an enhanced prompt
 * Context-enhanced prompts end with "User request: <original prompt>"
 */
function extractOriginalPrompt(enhancedPrompt: string): string {
  // Look for "User request:" marker added by contextService
  const match = enhancedPrompt.match(/User request:\s*(.+?)$/s);
  if (match) {
    return match[1].trim();
  }
  // Fallback: return the whole prompt if no marker found
  return enhancedPrompt;
}

/**
 * Generate Strudel code from natural language prompt
 * Uses dynamic prompt building with RAG for context-aware generation
 */
export async function generateMusicCode(
  request: GenerationRequest
): Promise<StrudelCode> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  try {
    const defaults = loadDefaults();

    // Analyze the prompt to understand user intent
    const analysis = analyzePrompt(request.prompt);
    console.log('[AI] Prompt analysis:', {
      isVague: analysis.isVague,
      genres: analysis.genres,
      moods: analysis.moods,
      complexity: analysis.complexity,
    });

    // Extract original prompt for sound search (strip context enhancement markers)
    const originalPrompt = extractOriginalPrompt(request.prompt);

    // Search for relevant sounds from arrwDB
    let soundResult = null;
    try {
      console.log('[AI] Sound search using:', originalPrompt);
      soundResult = await getSoundsForRequest(originalPrompt, {
        includeGenre: request.config?.style || analysis.genres[0],
        limit: 10,
      });
      console.log('[AI] Found', soundResult.sounds.length, 'relevant sounds');
    } catch (soundError) {
      console.warn('[AI] Sound search failed, continuing without:', soundError);
    }

    // Search for user preferences
    let preferenceContext = '';
    try {
      const preferenceResult = await searchPreferences(request.prompt, 5);
      preferenceContext = buildPreferenceContext(preferenceResult) || '';
      if (preferenceContext) {
        console.log('[AI] Injected', preferenceResult.preferences.length, 'preferences');
      }
    } catch (prefError) {
      console.warn('[AI] Preference search failed:', prefError);
    }

    // Build conversation context if available
    let conversationContext = '';
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      const history = request.conversationHistory
        .slice(-AI_CONFIG.CONVERSATION_HISTORY_LIMIT)
        .map((msg: Message) => `${msg.role}: ${msg.content}`)
        .join('\n');
      conversationContext = `Previous conversation:\n${history}\n\n`;
    }

    // Build dynamic prompt using RAG results
    const dynamicPrompt = buildDynamicPrompt({
      prompt: request.prompt,
      sounds: soundResult || undefined,
      mode: (request.config?.mode as 'loop' | 'layer' | 'arrangement' | 'auto') || 'auto',
      existingLayers: request.existingLayers,
      contextInfo: preferenceContext || undefined,
    });

    console.log('[AI] Dynamic prompt built:', {
      isVague: analysis.isVague,
      suggestedTempo: dynamicPrompt.suggestedTempo,
      promptLength: dynamicPrompt.systemPrompt.length,
    });

    // Build final user message
    let userMessage = conversationContext + request.prompt;

    // Add config extras if provided
    if (request.config) {
      const { mode, ...restConfig } = request.config;
      if (Object.keys(restConfig).length > 0) {
        userMessage += `\n\nConfiguration: ${JSON.stringify(restConfig, null, 2)}`;
      }
    }

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: dynamicPrompt.systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // Determine task type for model routing
    const taskType: TaskType = request.refinement ? 'refine_music' : 'generate_music';
    const model = getModelForTask(taskType);

    // Make API request to Grok with retry logic for transient failures
    const response = await withRetry(
      () => axios.post<GrokResponse>(
        XAI_BASE_URL,
        {
          model,
          messages,
          temperature: AI_CONFIG.DEFAULT_TEMPERATURE,
          max_tokens: AI_CONFIG.MAX_TOKENS,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: AI_CONFIG.REQUEST_TIMEOUT_MS,
        }
      ),
      {
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[AI] Retry attempt ${attempt} after ${delayMs}ms:`, error);
        },
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

    // Strip comments from code (they break Strudel's parser)
    code = stripComments(code);

    // Convert setcps() statements to .cpm() chain if needed
    code = convertToCpm(code);

    // Extract explanation if present
    let explanation: string | undefined;
    const explanationMatch = content.match(/(?:explanation|description|note):\s*(.+?)(?:\n|$)/i);
    if (explanationMatch) {
      explanation = explanationMatch[1].trim();
    }

    // Extract tempo info - both CPM (for Strudel) and BPM (for display)
    const { cpm, bpm } = extractTempoInfo(code, defaults.tempo);

    return {
      code,
      explanation: explanation || 'Generated Strudel pattern',
      metadata: {
        tempo: bpm, // Legacy field, same as bpm
        bpm,        // Perceived BPM for display
        cpm,        // Raw CPM for Strudel
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
 * Convert setcps() statements to .cpm() chain
 * Transforms: setcps(0.5); stack(...) -> stack(...).cpm(120)
 */
function convertToCpm(code: string): string {
  // Match setcps(value) at the start, possibly with semicolon and newline
  const setcpsMatch = code.match(/^setcps\s*\(\s*([\d.]+)\s*\)\s*;?\s*\n?/);

  if (setcpsMatch) {
    const cps = parseFloat(setcpsMatch[1]);
    // Convert CPS to CPM (BPM): cps * 60 = cpm
    const cpm = Math.round(cps * MUSIC_CONFIG.CPS_TO_CPM_FACTOR);

    // Remove the setcps statement
    let pattern = code.slice(setcpsMatch[0].length).trim();

    // Remove trailing semicolon if present
    pattern = pattern.replace(/;$/, '').trim();

    // Append .cpm() to the pattern
    return `${pattern}.cpm(${cpm})`;
  }

  // No setcps found, just remove any trailing semicolons
  return code.replace(/;$/gm, '').trim();
}

/**
 * Strip JavaScript comments from code (they break Strudel's parser)
 * Optimized: uses array accumulation instead of string concatenation
 */
function stripComments(code: string): string {
  // Use array for O(n) performance instead of string concat O(n²)
  const result: string[] = [];
  let inString = false;
  let stringChar = '';
  let i = 0;
  let segmentStart = 0;

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];

    // Handle string boundaries
    if ((char === '"' || char === "'" || char === '`') && (i === 0 || code[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }

    // Skip single-line comments when not in string
    if (!inString && char === '/' && nextChar === '/') {
      // Flush segment before comment
      if (i > segmentStart) {
        result.push(code.slice(segmentStart, i));
      }
      // Skip until end of line
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      segmentStart = i;
      continue;
    }

    // Skip multi-line comments when not in string
    if (!inString && char === '/' && nextChar === '*') {
      // Flush segment before comment
      if (i > segmentStart) {
        result.push(code.slice(segmentStart, i));
      }
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2; // Skip */
      segmentStart = i;
      continue;
    }

    i++;
  }

  // Flush remaining segment
  if (i > segmentStart) {
    result.push(code.slice(segmentStart, i));
  }

  // Clean up extra whitespace from removed comments
  return result.join('')
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Extract tempo info from Strudel code
 * Returns both CPM (for Strudel) and BPM (for display)
 *
 * IMPORTANT: CPM (cycles per minute) is NOT the same as BPM!
 * For a standard 4-beat pattern: BPM = CPM * 4
 * Example: .cpm(30) with "bd ~ sd ~" (4 beats) = 120 BPM
 */
function extractTempoInfo(code: string, defaultBpm: number): { cpm: number; bpm: number } {
  // Match .cpm(number)
  const cpmMatch = code.match(/\.cpm\s*\(\s*(\d+(?:\.\d+)?)\s*\)/);
  if (cpmMatch) {
    const cpm = parseFloat(cpmMatch[1]);
    const beatsPerCycle = estimateBeatsPerCycle(code);
    const bpm = Math.round(cpm * beatsPerCycle);
    return { cpm: Math.round(cpm), bpm };
  }

  // Match setcps(number) - cycles per second
  const cpsMatch = code.match(/setcps\s*\(\s*([\d.]+)\s*\)/);
  if (cpsMatch) {
    const cps = parseFloat(cpsMatch[1]);
    const cpm = cps * 60;
    const beatsPerCycle = estimateBeatsPerCycle(code);
    const bpm = Math.round(cpm * beatsPerCycle);
    return { cpm: Math.round(cpm), bpm };
  }

  // Default: assume 4 beats per cycle
  const defaultCpm = Math.round(defaultBpm / 4);
  return { cpm: defaultCpm, bpm: defaultBpm };
}

/**
 * Estimate beats per cycle by analyzing the pattern structure
 * Default to 4 for standard 4/4 time
 */
function estimateBeatsPerCycle(code: string): number {
  // Check for half-time patterns (8 elements like "bd ~ ~ ~ ~ ~ sd ~")
  // These are common in trap, dubstep, lo-fi
  const halfTimePattern = /s\s*\(\s*["'][^"']*~[^"']*~[^"']*~[^"']*~[^"']*["']\s*\)/;
  if (halfTimePattern.test(code)) {
    // Count elements in the main pattern to verify
    const mainPattern = code.match(/s\s*\(\s*["']([^"']+)["']\s*\)/);
    if (mainPattern) {
      const elements = mainPattern[1].split(/\s+/).length;
      if (elements >= 8) return 8;
    }
  }

  // Check for .fast(2) which doubles effective tempo
  if (/\.fast\s*\(\s*2\s*\)/.test(code)) {
    return 2; // Effectively doubles, so 2 beats per cycle
  }

  // Default: standard 4-beat patterns (most common)
  return 4;
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

