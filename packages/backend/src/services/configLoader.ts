import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
 * Load prompt template from file
 */
export function loadPromptTemplate(name: string): string {
  try {
    const path = join(CONFIG_ROOT, 'prompts', `${name}.txt`);
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`Failed to load prompt template ${name}:`, error);
    throw new Error(`Prompt template ${name} not found`);
  }
}

/**
 * Load JSON config file
 */
export function loadJsonConfig<T>(path: string): T {
  try {
    const fullPath = join(CONFIG_ROOT, path);
    const content = readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as T;
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
 */
export function renderPrompt(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let rendered = template;
  // Find all placeholders in template
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const matches = Array.from(template.matchAll(placeholderRegex));
  
  // Replace each placeholder
  for (const match of matches) {
    const placeholder = match[0]; // e.g., "{{name}}"
    const key = match[1]; // e.g., "name"
    const value = variables[key];
    rendered = rendered.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value ?? ''));
  }
  
  return rendered;
}

