import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { configCache, promptCache } from '../utils/lruCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Config is in root config/ directory, not packages/config/
const CONFIG_ROOT = join(__dirname, '../../../../config');

export interface PromptTemplate {
  system: string;
  user: string;
  examples?: Array<{ prompt: string; code: string }>;
}

export interface ModelConfig {
  name: string;
  provider: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface AppDefaults {
  tempo: number;
  scale: string;
  key: string;
  samples: Record<string, string>;
}

/**
 * Load prompt template from file (with caching)
 */
export function loadPromptTemplate(name: string): string {
  const cacheKey = `prompt:${name}`;
  const cached = promptCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const path = join(CONFIG_ROOT, 'prompts', `${name}.txt`);
    const content = readFileSync(path, 'utf-8');
    promptCache.set(cacheKey, content);
    return content;
  } catch (error) {
    console.error(`Failed to load prompt template ${name}:`, error);
    throw new Error(`Prompt template ${name} not found`);
  }
}

/**
 * Load JSON config file (with caching)
 */
export function loadJsonConfig<T>(path: string): T {
  const cacheKey = `config:${path}`;
  const cached = configCache.get(cacheKey);
  if (cached) {
    return cached as T;
  }

  try {
    const fullPath = join(CONFIG_ROOT, path);
    const content = readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(content) as T;
    configCache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error(`Failed to load config ${path}:`, error);
    throw new Error(`Config file ${path} not found`);
  }
}

/**
 * Load defaults configuration
 */
export function loadDefaults(): AppDefaults {
  return loadJsonConfig<AppDefaults>('defaults.json');
}

/**
 * Load model configurations
 */
export function loadModels(): ModelConfig[] {
  return loadJsonConfig<ModelConfig[]>('models.json');
}

/**
 * Few-shot example structure (supports Claude's enhanced format)
 */
export interface FewShotExample {
  prompt: string;
  code: string;
  genre?: string; // Optional: genre classification (e.g., "jazz", "techno")
  complexity?: string; // Optional: complexity level (e.g., "beginner", "intermediate", "advanced")
}

/**
 * Load few-shot examples
 * Supports both basic format (prompt, code) and enhanced format (with genre, complexity)
 */
export function loadFewShotExamples(): Array<FewShotExample> {
  try {
    return loadJsonConfig<Array<FewShotExample>>('prompts/few_shot_examples.json');
  } catch (error) {
    console.warn('Few-shot examples not found, using empty array');
    return [];
  }
}

/**
 * Render prompt template with variables
 * Optimized: single-pass replacement using replace callback
 */
export function renderPrompt(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  // Single-pass replacement using replace with callback function
  // More efficient than multiple regex replacements
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    return String(value ?? '');
  });
}

