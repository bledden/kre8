/**
 * Sound Search Service
 * Queries arrwDB for semantically relevant Strudel sounds.
 *
 * Architecture:
 * - Generates query embeddings locally using BGE-M3 (@huggingface/transformers)
 * - Uses arrwDB's /search/embedding endpoint with pre-computed embeddings
 * - Returns sound bank names, descriptions, and Strudel syntax
 * - Integrates with aiService to provide sound context for Grok
 */

import axios, { AxiosError } from 'axios';
import { generateEmbedding } from './embeddingService.js';

// =============================================================================
// arrwDB Configuration
// =============================================================================

const getArrwDbUrl = () => process.env.ARRWDB_URL || 'http://localhost:8001';
const getLibraryId = () => process.env.ARRWDB_LIBRARY_ID || null;

// Search configuration
const SEARCH_CONFIG = {
  /** Maximum results to return from a search */
  MAX_RESULTS: 10,

  /** Default number of results */
  DEFAULT_K: 5,

  /** Request timeout in milliseconds */
  TIMEOUT_MS: 10000,

  /** Minimum similarity score (1 - distance) to include */
  MIN_SIMILARITY: 0.3,
} as const;

// =============================================================================
// Types
// =============================================================================

export interface SoundResult {
  /** Sound bank name (e.g., "piano", "RolandTR808") */
  name: string;

  /** Human-readable description */
  description: string;

  /** Source library (e.g., "dirt-samples", "GM Soundfont") */
  source: string;

  /** Category (e.g., "drums", "keys", "synth") */
  category: string;

  /** Strudel syntax example */
  strudelSyntax: string;

  /** Similarity score (0-1, higher is better) */
  similarity: number;

  /** Tags for additional context */
  tags: string[];
}

export interface SoundSearchResult {
  /** List of matching sounds */
  sounds: SoundResult[];

  /** The original query */
  query: string;

  /** Total sounds searched */
  totalSearched?: number;

  /** Time taken in milliseconds */
  searchTimeMs?: number;
}

interface ArrwDbSearchResult {
  results: Array<{
    document_title: string;
    document_id: string;
    chunk: {
      id: string;
      text: string;
      metadata: {
        created_at: string;
        page_number: number | null;
        chunk_index: number;
        source_document_id: string;
      };
    };
    distance: number;
  }>;
  total_results?: number;
  query_time_ms?: number;
}

interface ArrwDbEmbeddingSearchRequest {
  embedding: number[];
  k: number;
  distance_threshold?: number;
}

// =============================================================================
// Sound Search Functions
// =============================================================================

/**
 * Search for sounds matching a query
 * Uses local BGE-M3 embeddings + arrwDB's embedding search endpoint
 */
export async function searchSounds(
  query: string,
  limit: number = SEARCH_CONFIG.DEFAULT_K
): Promise<SoundSearchResult> {
  const arrwDbUrl = getArrwDbUrl();
  const libraryId = getLibraryId();

  if (!libraryId) {
    console.warn('[SoundSearch] ARRWDB_LIBRARY_ID not configured, returning empty results');
    return { sounds: [], query };
  }

  try {
    // Generate query embedding locally using BGE-M3
    console.log(`[SoundSearch] Generating embedding for: "${query}"`);
    const queryEmbedding = await generateEmbedding(query);

    // Search arrwDB with the embedding
    const searchRequest: ArrwDbEmbeddingSearchRequest = {
      embedding: queryEmbedding,
      k: Math.min(limit, SEARCH_CONFIG.MAX_RESULTS),
    };

    const response = await axios.post<ArrwDbSearchResult>(
      `${arrwDbUrl}/v1/libraries/${libraryId}/search/embedding`,
      searchRequest,
      {
        timeout: SEARCH_CONFIG.TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const sounds: SoundResult[] = response.data.results
      .filter(result => {
        // Filter by minimum similarity (convert distance to similarity)
        const similarity = 1 - result.distance;
        return similarity >= SEARCH_CONFIG.MIN_SIMILARITY;
      })
      .map(result => parseSoundFromChunk(result));

    console.log(`[SoundSearch] Found ${sounds.length} sounds for "${query}"`);

    return {
      sounds,
      query,
      totalSearched: response.data.total_results,
      searchTimeMs: response.data.query_time_ms,
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string }; detail?: string }>;
      const message = axiosError.response?.data?.error?.message
        || axiosError.response?.data?.detail
        || axiosError.message;
      console.error('[SoundSearch] Error:', message);
    } else {
      console.error('[SoundSearch] Error:', error);
    }
    return { sounds: [], query };
  }
}

/**
 * Search sounds by category
 */
export async function searchSoundsByCategory(
  category: string,
  limit: number = SEARCH_CONFIG.DEFAULT_K
): Promise<SoundSearchResult> {
  // Enhance query with category-specific terms
  const categoryQueries: Record<string, string> = {
    drums: 'drums percussion kick snare hihat',
    bass: 'bass synth low frequency sub',
    keys: 'piano keyboard electric rhodes organ',
    synth: 'synthesizer lead pad atmospheric',
    strings: 'strings violin cello orchestral',
    brass: 'brass trumpet horn saxophone',
    vocals: 'vocal voice choir sample',
    fx: 'effects sound design texture noise',
    world: 'ethnic world traditional cultural',
  };

  const query = categoryQueries[category.toLowerCase()] || category;
  return searchSounds(query, limit);
}

/**
 * Get drum machine sounds for a specific genre
 */
export async function searchDrumMachine(
  genre: string,
  limit: number = 3
): Promise<SoundSearchResult> {
  const genreQueries: Record<string, string> = {
    techno: 'Roland TR-909 808 drum machine electronic',
    house: 'Roland TR-909 707 LinnDrum classic house',
    trap: 'Roland TR-808 MPC hard hitting bass',
    dnb: 'breakbeat amen sampler drum break',
    lofi: 'SP-1200 MPC lo-fi dusty drums',
    drill: 'TR-808 aggressive sliding bass',
    synthwave: 'LinnDrum 707 retro 80s drums',
    ambient: 'soft percussion atmospheric drums',
  };

  const query = genreQueries[genre.toLowerCase()] || `${genre} drum machine`;
  return searchSounds(query, limit);
}

/**
 * Parse sound information from arrwDB chunk text
 */
function parseSoundFromChunk(result: {
  document_title: string;
  chunk: {
    id: string;
    text: string;
    metadata: {
      created_at: string;
      page_number: number | null;
      chunk_index: number;
      source_document_id: string;
    };
  };
  distance: number;
}): SoundResult {
  const similarity = 1 - result.distance;

  // Parse the search_text format:
  // "name | description | Category: cat | Source: src | Tags: tag1, tag2"
  const chunkText = result.chunk?.text || '';
  const parts = chunkText.split(' | ');

  let name = result.document_title;
  let description = '';
  let category = 'unknown';
  let source = 'unknown';
  let tags: string[] = [];

  if (parts.length >= 2) {
    // First part is name, second is description
    name = parts[0].trim();
    description = parts[1].trim();

    // Parse remaining parts
    for (let i = 2; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.startsWith('Category:')) {
        category = part.replace('Category:', '').trim();
      } else if (part.startsWith('Source:')) {
        source = part.replace('Source:', '').trim();
      } else if (part.startsWith('Tags:')) {
        const tagStr = part.replace('Tags:', '').trim();
        tags = tagStr.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
  }

  // Generate Strudel syntax based on source and name
  const strudelSyntax = generateStrudelSyntax(name, source, category);

  return {
    name,
    description,
    source,
    category,
    strudelSyntax,
    similarity,
    tags,
  };
}

/**
 * Generate Strudel syntax for a sound
 */
function generateStrudelSyntax(name: string, source: string, category: string): string {
  // Drum machines use .bank()
  if (source === 'Drum Machines' || category === 'drum_machine') {
    return `s("bd sd hh").bank("${name}")`;
  }

  // GM Soundfont uses .soundfont()
  if (source === 'GM Soundfont') {
    return `note("c4 e4 g4").s("${name}").soundfont()`;
  }

  // Built-in synths (no .s() needed for some)
  if (source === 'Built-in Synths') {
    if (['sine', 'square', 'sawtooth', 'triangle'].includes(name.toLowerCase())) {
      return `note("c4 e4 g4").s("${name.toLowerCase()}")`;
    }
    return `note("c4 e4 g4").s("${name}")`;
  }

  // Wavetables use .wt()
  if (source === 'Wavetables') {
    return `note("c4").s("wavetable").wt("${name}")`;
  }

  // VCSL/Orchestral samples use .s()
  if (source === 'VCSL' || category === 'orchestral') {
    return `note("c4 e4 g4").s("${name}")`;
  }

  // dirt-samples (most common)
  // For drums, show rhythm pattern; for melodic, show notes
  if (category === 'drums' || category === 'percussion') {
    return `s("${name}:0 ${name}:1 ${name}:2 ${name}:3")`;
  }

  // Default: melodic pattern
  return `note("c4 e4 g4 b4").s("${name}")`;
}

// =============================================================================
// Context Building for AI
// =============================================================================

/**
 * Build sound context for injection into AI prompts
 * Used by aiService to give Grok knowledge of available sounds
 *
 * CRITICAL: This must instruct the AI to use MULTIPLE sounds in composition
 */
export function buildSoundContext(searchResult: SoundSearchResult): string | null {
  if (!searchResult.sounds.length) return null;

  const parts: string[] = [
    '## SOUND PALETTE FOR THIS REQUEST',
    '',
    '**IMPORTANT COMPOSITION RULES:**',
    '1. USE AT LEAST 3-5 DIFFERENT SOUNDS from the list below',
    '2. Layer drums + bass + melodic elements for full compositions',
    '3. Each instrument should have its own pattern within the stack()',
    '4. Vary the rhythms - don\'t make everything play the same pattern',
    '',
    '**Recommended layering:**',
    '- DRUMS: kick, snare/clap, hi-hats (use different sounds for each)',
    '- BASS: low-frequency element for groove',
    '- MELODIC: chord stabs, arpeggios, or lead lines',
    '- TEXTURE: pads, fx, or ambient elements (optional)',
    '',
    '**Your available sounds:**',
    '',
  ];

  // Group by category
  const byCategory = groupByCategory(searchResult.sounds);

  for (const [category, sounds] of Object.entries(byCategory)) {
    parts.push(`### ${capitalizeFirst(category)}`);

    sounds.forEach(sound => {
      parts.push(`- **${sound.name}**: ${sound.description}`);
      parts.push(`  → Use: \`${sound.strudelSyntax}\``);
    });

    parts.push('');
  }

  parts.push('**Remember: Combine multiple sounds from above into your stack() for a rich, layered composition!**');
  parts.push('---');
  return parts.join('\n');
}

/**
 * Get recommended sounds for a music generation request
 * Analyzes the request and returns a DIVERSE set of sounds:
 * - Drums (kick, snare, hats)
 * - Bass
 * - Melodic (synths, keys, leads)
 * - Optional texture/fx
 *
 * This ensures the AI has material for full compositions, not just one sound.
 */
export async function getSoundsForRequest(
  prompt: string,
  options: {
    includeGenre?: string;
    includeDrums?: boolean;
    includeBass?: boolean;
    includeLeads?: boolean;
    limit?: number;
  } = {}
): Promise<SoundSearchResult> {
  const {
    includeGenre,
    includeDrums = true,
    includeBass = true,
    includeLeads = true,
    limit = 12 // Increased default for more variety
  } = options;

  // Extract genre-like words from prompt
  const genreKeywords = extractGenreKeywords(prompt);
  const genreContext = includeGenre
    ? [includeGenre, ...genreKeywords].join(' ')
    : genreKeywords.join(' ') || 'electronic';

  const allSounds: SoundResult[] = [];
  const seen = new Set<string>();

  const addUnique = (sounds: SoundResult[]) => {
    for (const sound of sounds) {
      if (!seen.has(sound.name)) {
        seen.add(sound.name);
        allSounds.push(sound);
      }
    }
  };

  // 1. Get drums (3 sounds: kick-like, snare-like, hat-like)
  if (includeDrums) {
    const drumResults = await searchSounds(`${genreContext} drums kick snare percussion`, 4);
    addUnique(drumResults.sounds.slice(0, 4));
  }

  // 2. Get bass sounds
  if (includeBass) {
    const bassResults = await searchSounds(`${genreContext} bass sub low frequency`, 3);
    addUnique(bassResults.sounds.slice(0, 3));
  }

  // 3. Get melodic sounds (synths, keys, leads)
  if (includeLeads) {
    const melodicResults = await searchSounds(`${genreContext} synth keyboard lead melody chord`, 4);
    addUnique(melodicResults.sounds.slice(0, 4));
  }

  // 4. Get main prompt results (may find unique sounds)
  const mainResults = await searchSounds(prompt, 3);
  addUnique(mainResults.sounds.slice(0, 3));

  // Limit total results
  const finalSounds = allSounds.slice(0, limit);

  console.log(`[SoundSearch] Assembled ${finalSounds.length} diverse sounds for composition`);

  return {
    sounds: finalSounds,
    query: prompt,
    totalSearched: finalSounds.length,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function groupByCategory(sounds: SoundResult[]): Record<string, SoundResult[]> {
  return sounds.reduce((acc, sound) => {
    const cat = sound.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sound);
    return acc;
  }, {} as Record<string, SoundResult[]>);
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function extractGenreKeywords(prompt: string): string[] {
  const genrePatterns = [
    /\b(techno|house|trance|edm|electronic)\b/gi,
    /\b(hip.?hop|trap|drill|rap)\b/gi,
    /\b(jazz|blues|soul|funk|r&b|rnb)\b/gi,
    /\b(rock|metal|punk|indie)\b/gi,
    /\b(ambient|chill|lofi|lo-fi|downtempo)\b/gi,
    /\b(dnb|drum.?and.?bass|jungle|breakbeat)\b/gi,
    /\b(dubstep|bass.?music|uk.?garage)\b/gi,
    /\b(classical|orchestral|cinematic)\b/gi,
    /\b(synthwave|retro|80s|vaporwave)\b/gi,
    /\b(reggae|dub|ska)\b/gi,
    /\b(world|ethnic|african|asian|latin)\b/gi,
  ];

  const keywords: string[] = [];

  for (const pattern of genrePatterns) {
    const matches = prompt.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }
  }

  return [...new Set(keywords)];
}

/**
 * Check if arrwDB is available
 */
export async function isArrwDbAvailable(): Promise<boolean> {
  const arrwDbUrl = getArrwDbUrl();

  try {
    const response = await axios.get(`${arrwDbUrl}/health`, {
      timeout: 3000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Get arrwDB configuration status
 */
export function getArrwDbConfig() {
  return {
    url: getArrwDbUrl(),
    libraryId: getLibraryId(),
    isConfigured: !!getLibraryId(),
  };
}
