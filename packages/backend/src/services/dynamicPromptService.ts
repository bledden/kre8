/**
 * Dynamic Prompt Builder Service
 *
 * Builds context-aware prompts using RAG instead of static 1000-line templates.
 * The goal: vague prompts get personality + smart defaults, specific prompts
 * get genre-appropriate guidance.
 */

import { loadPromptTemplate, loadFewShotExamples, renderPrompt, FewShotExample } from './configLoader.js';
import { SoundSearchResult, buildSoundContext } from './soundSearchService.js';

// =============================================================================
// Prompt Analysis
// =============================================================================

interface PromptAnalysis {
  /** Is this a vague/casual prompt? */
  isVague: boolean;
  /** Detected genre keywords */
  genres: string[];
  /** Detected mood/vibe keywords */
  moods: string[];
  /** Detected tempo hints */
  tempoHint: 'slow' | 'medium' | 'fast' | null;
  /** Explicit BPM if mentioned */
  explicitBpm: number | null;
  /** Is this a game/cinematic request? */
  isGameMusic: boolean;
  /** Detected complexity level */
  complexity: 'simple' | 'moderate' | 'complex';
}

const GENRE_PATTERNS: Record<string, RegExp> = {
  'lofi': /\b(lo-?fi|lofi|chillhop)\b/i,
  'house': /\b(house|four.?on.?the.?floor)\b/i,
  'techno': /\b(techno|industrial|berlin)\b/i,
  'trap': /\b(trap|atlanta|808s?)\b/i,
  'ambient': /\b(ambient|drone|atmospheric|soundscape)\b/i,
  'dnb': /\b(d&?n&?b|drum.?and.?bass|jungle|breakbeat)\b/i,
  'dubstep': /\b(dubstep|wobble|brostep)\b/i,
  'synthwave': /\b(synthwave|retrowave|outrun|80s)\b/i,
  'jazz': /\b(jazz|swing|bebop|nu.?jazz)\b/i,
  'hiphop': /\b(hip.?hop|boom.?bap|rap)\b/i,
  'trance': /\b(trance|progressive|euphoric)\b/i,
  'game': /\b(game|boss|battle|rpg|8.?bit|chiptune|dungeon|exploration|menu|victory)\b/i,
  'cinematic': /\b(cinematic|film|epic|orchestral|trailer|score)\b/i,
};

const MOOD_PATTERNS: Record<string, RegExp> = {
  'chill': /\b(chill|relaxed|calm|peaceful|mellow|cozy)\b/i,
  'dark': /\b(dark|moody|brooding|sinister|ominous)\b/i,
  'uplifting': /\b(uplifting|happy|joyful|bright|energetic|euphoric)\b/i,
  'melancholic': /\b(melancholic|sad|emotional|nostalgic|bittersweet)\b/i,
  'aggressive': /\b(aggressive|hard|intense|heavy|powerful)\b/i,
  'dreamy': /\b(dreamy|ethereal|floaty|spacey|hypnotic)\b/i,
  'groovy': /\b(groovy|funky|bouncy|danceable)\b/i,
  'heroic': /\b(heroic|epic|triumphant|majestic|adventurous)\b/i,
  'mysterious': /\b(mysterious|suspenseful|tense|eerie)\b/i,
};

const TEMPO_PATTERNS = {
  slow: /\b(slow|relaxed|downtempo|ambient|chill|lo-?fi|peaceful)\b/i,
  fast: /\b(fast|uptempo|energetic|intense|driving|d&?n&?b|jungle)\b/i,
};

/**
 * Analyze a user prompt to understand intent and extract musical context
 */
export function analyzePrompt(prompt: string): PromptAnalysis {
  // Detect genres
  const genres: string[] = [];
  for (const [genre, pattern] of Object.entries(GENRE_PATTERNS)) {
    if (pattern.test(prompt)) {
      genres.push(genre);
    }
  }

  // Detect moods
  const moods: string[] = [];
  for (const [mood, pattern] of Object.entries(MOOD_PATTERNS)) {
    if (pattern.test(prompt)) {
      moods.push(mood);
    }
  }

  // Detect tempo hints
  let tempoHint: 'slow' | 'medium' | 'fast' | null = null;
  if (TEMPO_PATTERNS.slow.test(prompt)) tempoHint = 'slow';
  else if (TEMPO_PATTERNS.fast.test(prompt)) tempoHint = 'fast';

  // Extract explicit BPM
  const bpmMatch = prompt.match(/\b(\d{2,3})\s*bpm\b/i);
  const explicitBpm = bpmMatch ? parseInt(bpmMatch[1], 10) : null;

  // Check for game/cinematic
  const isGameMusic = GENRE_PATTERNS.game.test(prompt) || GENRE_PATTERNS.cinematic.test(prompt);

  // Determine if vague
  const wordCount = prompt.split(/\s+/).length;
  const hasGenre = genres.length > 0;
  const hasTempo = tempoHint !== null || explicitBpm !== null;

  // Vague if: short AND lacks specificity
  const isVague = wordCount < 6 && !hasGenre && !hasTempo;

  // Determine complexity based on prompt length and specificity
  let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
  if (wordCount < 5) complexity = 'simple';
  else if (wordCount > 20 || prompt.includes('arrangement') || prompt.includes('full track')) complexity = 'complex';

  return {
    isVague,
    genres,
    moods,
    tempoHint,
    explicitBpm,
    isGameMusic,
    complexity,
  };
}

// =============================================================================
// Genre-Specific Context
// =============================================================================

interface GenreContext {
  tempoRange: { min: number; max: number };
  defaultTempo: number;
  pattern: string;
  cpmFormula: string;
  characteristics: string[];
  effects: string[];
  scales: string[];
}

const GENRE_CONTEXTS: Record<string, GenreContext> = {
  lofi: {
    tempoRange: { min: 70, max: 85 },
    defaultTempo: 80,
    pattern: 's("bd ~ sd ~")',
    cpmFormula: 'CPM = BPM / 4 (use 4-beat patterns)',
    characteristics: [
      '4-beat cycle: `s("bd ~ sd ~")` - keep it simple but musical',
      '3-4 layers: drums + bass + chords + optional texture',
      'Muted, dusty, nostalgic aesthetic',
      'Use sine/triangle synths - warm, not harsh',
      'Add subtle variation: `.sometimes(x => x.lpf(600))` or `.every(8, x => x.room(0.7))`',
    ],
    effects: ['.lpf(800-1500) on everything', '.room(0.5).size(0.7)', '.crush(12) for vinyl warmth', 'Subtle filter movement: .cutoff(sine.range(600, 1200).slow(8))'],
    scales: ['C:minor', 'D:dorian', 'A:minor'],
  },
  house: {
    tempoRange: { min: 118, max: 130 },
    defaultTempo: 124,
    pattern: 's("bd*4")',
    cpmFormula: 'CPM = BPM / 4',
    characteristics: [
      'Four-on-the-floor kick: `s("bd*4")`',
      'Offbeat hi-hats: `s("[~ hh]*4")`',
      'Claps on 2 & 4: `s("~ cp ~ cp")`',
    ],
    effects: ['.room(0.3-0.5)', 'Filter sweeps with sine.range()'],
    scales: ['C:minor', 'A:minor', 'F:minor'],
  },
  techno: {
    tempoRange: { min: 125, max: 145 },
    defaultTempo: 132,
    pattern: 's("bd*4")',
    cpmFormula: 'CPM = BPM / 4',
    characteristics: [
      'Dark, driving, hypnotic',
      'Minimal melodic content',
      'Focus on rhythm and texture',
      'Acid basslines with filter modulation',
    ],
    effects: ['.distort(0.1-0.3)', '.cutoff(sine.range(200, 3000))', '.resonance(0.5-0.7)'],
    scales: ['C:phrygian', 'A:minor', 'D:locrian'],
  },
  trap: {
    tempoRange: { min: 130, max: 150 },
    defaultTempo: 140,
    pattern: 's("bd ~ ~ ~ ~ ~ cp ~")',
    cpmFormula: 'CPM = BPM / 8 (half-time, 8-beat patterns)',
    characteristics: [
      '8-beat half-time pattern',
      'Rolling hi-hat triplets: `s("hh*3")`',
      'Deep 808 sub bass',
      'Snare/clap on beat 5 (of 8)',
    ],
    effects: ['Heavy low end', '.distort(0.1) on bass'],
    scales: ['C:minor', 'F:minor'],
  },
  ambient: {
    tempoRange: { min: 60, max: 90 },
    defaultTempo: 70,
    pattern: 'n("c2").s("sawtooth").cutoff(200)',
    cpmFormula: 'CPM = BPM / 4, use .slow(4) for glacial pace',
    characteristics: [
      'Drones and evolving textures',
      'Minimal or no rhythm',
      'Long, slow modulations',
      'Focus on space and atmosphere',
    ],
    effects: ['.room(0.8).size(0.95)', '.delay(0.5).delayfeedback(0.7)', 'perlin modulation'],
    scales: ['C:major', 'A:minor', 'D:dorian'],
  },
  dnb: {
    tempoRange: { min: 160, max: 180 },
    defaultTempo: 174,
    pattern: 's("bd ~ ~ bd sd ~ bd ~").fast(2)',
    cpmFormula: 'CPM = BPM / 4, use .fast(2) on patterns',
    characteristics: [
      'Fast breakbeats',
      'Rolling bass (reese bass with filter modulation)',
      'Chopped drums, syncopated patterns',
    ],
    effects: ['.cutoff(sine.range(150, 500))', '.room(0.4-0.6)'],
    scales: ['C:minor', 'A:minor'],
  },
  synthwave: {
    tempoRange: { min: 100, max: 120 },
    defaultTempo: 110,
    pattern: 's("bd ~ sd ~")',
    cpmFormula: 'CPM = BPM / 4',
    characteristics: [
      '80s aesthetic, gated reverb feel',
      'Arpeggiated sawtooth leads',
      'Punchy drums, bright synths',
      'Neon nostalgia vibes',
    ],
    effects: ['.room(0.4)', '.cutoff(2000-4000)', 'Arpeggio with .fast(2)'],
    scales: ['A:minor', 'C:major', 'D:dorian'],
  },
  game: {
    tempoRange: { min: 100, max: 160 },
    defaultTempo: 130,
    pattern: 's("bd*4")',
    cpmFormula: 'CPM = BPM / 4',
    characteristics: [
      'Clear, memorable melodies',
      'Use GM instruments: gm_brass_section, gm_string_ensemble_1, gm_timpani',
      'Match intensity to scene (boss=fast+intense, exploration=medium+open)',
    ],
    effects: ['.room(0.4-0.6) for space', 'Orchestral layering'],
    scales: ['C:major', 'A:minor', 'D:dorian'],
  },
};

/**
 * Build genre-specific context section for the prompt
 */
function buildGenreContext(genres: string[]): string {
  if (genres.length === 0) return '';

  const sections: string[] = ['## GENRE GUIDELINES\n'];

  for (const genre of genres) {
    const ctx = GENRE_CONTEXTS[genre];
    if (!ctx) continue;

    sections.push(`### ${genre.toUpperCase()}`);
    sections.push(`- Tempo: ${ctx.tempoRange.min}-${ctx.tempoRange.max} BPM (default: ${ctx.defaultTempo})`);
    sections.push(`- ${ctx.cpmFormula}`);
    sections.push(`- Base pattern: \`${ctx.pattern}\``);
    sections.push('');
    sections.push('**Characteristics:**');
    ctx.characteristics.forEach(c => sections.push(`- ${c}`));
    sections.push('');
    sections.push('**Effects:**');
    ctx.effects.forEach(e => sections.push(`- ${e}`));
    sections.push('');
    sections.push(`**Scales:** ${ctx.scales.map(s => `\`.scale("${s}")\``).join(', ')}`);
    sections.push('');
  }

  return sections.join('\n');
}

// =============================================================================
// Default Aesthetic (for vague prompts)
// =============================================================================

const DEFAULT_AESTHETIC = `
## YOUR DEFAULT STYLE

When the request is vague or casual, apply this default aesthetic:

**Sound:** Polished, professional, immediately pleasing - NOT boring!
**Tempo:** 100-110 BPM (versatile, groovy)
**Mood:** Chill but interesting, subtle complexity that evolves
**Structure:** 3-4 layers minimum:
  - Drums (kick + snare + hats as separate patterns)
  - Bass (melodic, filtered with movement)
  - Melodic element (chords with progression, arp, or lead)
  - Optional texture (pad, fx)

**ALWAYS include:**
- Tasteful filtering: \`.lpf(1500-3000)\` for warmth
- Light reverb: \`.room(0.3-0.5)\` for cohesion
- Varied gains: kick loud (0.85), hats soft (0.4), melody mid (0.6)
- Musical chord progressions (4 chords minimum), not random notes
- AT LEAST ONE evolving element: filter sweep, \`.sometimes()\`, or \`.every()\`

**Add life with subtle variation:**
- Filter movement: \`.cutoff(sine.range(600, 2000).slow(8))\`
- Occasional variation: \`.sometimes(x => x.room(0.6))\`
- Build/release: \`.every(8, x => x.lpf(1000))\`

**Example vague prompt response:**
\`\`\`javascript
stack(
  s("bd ~ sd ~").gain(0.85),
  s("hh*8").gain(0.4).lpf(4000).sometimes(x => x.gain(0.6)),
  n("0 ~ 3 5").s("sawtooth").octave(2).cutoff(sine.range(400, 1200).slow(8)).gain(0.7),
  note("<[c4,e4,g4] [a3,c4,e4] [f3,a3,c4] [g3,b3,d4]>").s("triangle").gain(0.5).room(0.4).lpf(2000)
).cpm(26)
\`\`\`

Make it sound GOOD and ALIVE, not static or generic.
`;

// =============================================================================
// Few-Shot Example Selection
// =============================================================================

/**
 * Select relevant few-shot examples based on analysis
 */
function selectRelevantExamples(
  analysis: PromptAnalysis,
  allExamples: FewShotExample[],
  maxExamples: number = 3
): FewShotExample[] {
  if (allExamples.length === 0) return [];

  // Score each example by relevance
  const scored = allExamples.map(ex => {
    let score = 0;
    const exLower = ex.prompt.toLowerCase();

    // Genre match
    for (const genre of analysis.genres) {
      if (ex.genre?.toLowerCase() === genre || exLower.includes(genre)) {
        score += 10;
      }
    }

    // Mood match
    for (const mood of analysis.moods) {
      if (exLower.includes(mood)) {
        score += 5;
      }
    }

    // Complexity match
    if (ex.complexity === analysis.complexity) {
      score += 3;
    }

    // Game music match
    if (analysis.isGameMusic && ex.genre === 'game-music') {
      score += 10;
    }

    // Vague prompts benefit from intermediate examples
    if (analysis.isVague && ex.complexity === 'intermediate') {
      score += 2;
    }

    return { example: ex, score };
  });

  // Sort by score and take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxExamples).map(s => s.example);
}

// =============================================================================
// Main Dynamic Prompt Builder
// =============================================================================

export interface DynamicPromptOptions {
  prompt: string;
  sounds?: SoundSearchResult;
  mode?: 'loop' | 'layer' | 'arrangement' | 'auto';
  existingLayers?: Array<{ name: string; code: string; muted?: boolean }>;
  contextInfo?: string; // Time/weather context from contextService
}

export interface DynamicPromptResult {
  systemPrompt: string;
  userMessage: string;
  analysis: PromptAnalysis;
  suggestedTempo: number;
}

/**
 * Build a dynamic, context-aware prompt
 */
export function buildDynamicPrompt(options: DynamicPromptOptions): DynamicPromptResult {
  const { prompt, sounds, mode = 'auto', existingLayers, contextInfo } = options;

  // Analyze the prompt
  const analysis = analyzePrompt(prompt);

  // Load core rules
  const coreRules = loadPromptTemplate('core_rules');

  // Build context sections
  const contextParts: string[] = [];

  // 1. Add default aesthetic for vague prompts
  if (analysis.isVague) {
    contextParts.push(DEFAULT_AESTHETIC);
  }

  // 2. Add genre-specific context
  const genreContext = buildGenreContext(analysis.genres);
  if (genreContext) {
    contextParts.push(genreContext);
  }

  // 3. Add sound palette from RAG
  if (sounds && sounds.sounds.length > 0) {
    const soundContext = buildSoundContext(sounds);
    if (soundContext) {
      contextParts.push(soundContext);
    }
  }

  // 4. Add time/weather context
  if (contextInfo) {
    contextParts.push(`## CONTEXT\n${contextInfo}`);
  }

  // 5. Add mode-specific instructions
  const modeInstructions = buildModeInstructions(mode, existingLayers);
  if (modeInstructions) {
    contextParts.push(modeInstructions);
  }

  // 6. Add relevant few-shot examples
  const allExamples = loadFewShotExamples();
  const relevantExamples = selectRelevantExamples(analysis, allExamples);
  if (relevantExamples.length > 0) {
    const exampleText = relevantExamples
      .map(ex => `**Example:** "${ex.prompt}"\n\`\`\`javascript\n${ex.code}\n\`\`\``)
      .join('\n\n');
    contextParts.push(`## RELEVANT EXAMPLES\n\n${exampleText}`);
  }

  // Render the system prompt
  const systemPrompt = renderPrompt(coreRules, {
    context: contextParts.join('\n\n'),
    user_prompt: prompt,
  });

  // Calculate suggested tempo
  let suggestedTempo = 105; // Default
  if (analysis.explicitBpm) {
    suggestedTempo = analysis.explicitBpm;
  } else if (analysis.genres.length > 0) {
    const genre = analysis.genres[0];
    const ctx = GENRE_CONTEXTS[genre];
    if (ctx) suggestedTempo = ctx.defaultTempo;
  } else if (analysis.tempoHint === 'slow') {
    suggestedTempo = 80;
  } else if (analysis.tempoHint === 'fast') {
    suggestedTempo = 140;
  }

  return {
    systemPrompt,
    userMessage: prompt,
    analysis,
    suggestedTempo,
  };
}

/**
 * Build mode-specific instructions
 */
function buildModeInstructions(
  mode: 'loop' | 'layer' | 'arrangement' | 'auto',
  existingLayers?: Array<{ name: string; code: string; muted?: boolean }>
): string | null {
  if (mode === 'auto') return null;

  if (mode === 'loop') {
    return `
## MODE: LOOP

Create a focused, loopable pattern:
- 3-4 layers in a stack()
- 4-8 bar loop that grooves
- No .every() or .sometimes() - keep it steady
- Drums + bass + melodic element minimum
`;
  }

  if (mode === 'layer') {
    const layerInfo = existingLayers && existingLayers.length > 0
      ? `\nEXISTING LAYERS:\n${existingLayers.filter(l => !l.muted).map((l, i) => `${i + 1}. ${l.name}: ${l.code}`).join('\n')}\n\nAdd something COMPLEMENTARY.`
      : 'No existing layers - create a foundation (drums or bass).';

    return `
## MODE: LAYER (ADDITIVE)

Output ONLY a single layer, NOT a full stack().
${layerInfo}

Example outputs (pick ONE):
- Drums: \`s("bd ~ sd ~").gain(0.9)\`
- Bass: \`n("0 ~ 3 5").s("sawtooth").octave(2).cutoff(600)\`
- Melody: \`note("c4 e4 g4 b4").s("triangle").gain(0.5)\`
`;
  }

  if (mode === 'arrangement') {
    return `
## MODE: ARRANGEMENT (FULL TRACK)

Create an evolving composition:
- 5-8 layers
- Use .every(N, fn) for variation
- Filter sweeps: \`.cutoff(sine.range(400, 3000).slow(16))\`
- Build tension and release
- 16-32 bar structure
`;
  }

  return null;
}

/**
 * Quick helper to check if a prompt needs the full treatment
 */
export function needsEnhancement(prompt: string): boolean {
  const analysis = analyzePrompt(prompt);
  return analysis.isVague || analysis.genres.length === 0;
}
