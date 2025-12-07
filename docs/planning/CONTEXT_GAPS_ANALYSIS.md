# Context-Aware Generation: Gap Analysis & Implementation Plan

**Date**: 2025-01-20  
**Status**: Analysis Complete - Ready for Implementation

---

## Current Flow Analysis

```
User Context (location, time, weather)
    ↓
contextService (Grok tool calls)
    ↓
Musical Recommendations (text) ← GAP 1: Too vague
    ↓
Enhanced Prompt (appended text) ← GAP 3: Weak format
    ↓
music_generation.txt (comprehensive but generic) ← GAP 2: No context mappings
    ↓
Grok generates Strudel code ← GAP 4: No validation
```

---

## Gap Analysis

### GAP 1: Context → Musical Recommendations Is Too Vague ⚠️ CRITICAL

**Current Implementation** (`contextService.ts:288-316`):
```typescript
// Just regex parsing for words like "mood:", "tempo:"
const moodMatch = content.match(/mood[:\s]+([^,.\n]+)/i);
const tempoMatch = content.match(/tempo[:\s]+([^,.\n]+)/i);
```

**Problems**:
1. **Unreliable Parsing**: Grok's natural language like "The mood should be reflective" doesn't match regex patterns
2. **No Structured Output**: Grok returns free-form text, not structured data
3. **Loss of Context**: Weather data like "rainy, 65°F, Brooklyn" gets lost in text parsing
4. **No Validation**: Can't verify if parsing succeeded

**Impact**: **HIGH** - Context information is lost or misinterpreted

**Root Cause**: Using natural language → regex parsing instead of structured tool response

---

### GAP 2: No Context-to-Strudel Mappings in music_generation.txt ⚠️ CRITICAL

**Current State**: `music_generation.txt` has:
- ✅ Comprehensive genre guides (House, Techno, Hip-Hop, etc.)
- ✅ Strudel syntax reference
- ✅ Music theory context
- ❌ **ZERO guidance on context variables**

**Missing Sections**:
```markdown
## CONTEXT-AWARE GENERATION

When user context is provided, apply these mappings:

**Weather → Musical Parameters:**
- Rainy/Cloudy: Lower tempo (-10-20 BPM), `.cutoff(400-1000)`, heavy `.room(0.6-0.8)`, minor scales
- Sunny/Clear: Higher tempo (+10 BPM), bright `.cutoff(2000+)`, major/lydian scales
- Stormy: Aggressive patterns, `.distort(0.2)`, tense harmonics

**Time of Day:**
- Morning (6-10am): Rising energy, major keys, clean tones, 100-120 BPM
- Afternoon (10am-4pm): Full energy, bright, uptempo
- Evening (4-8pm): Winding down, warm filters, 80-110 BPM
- Night (8pm-12am): Atmospheric, spacious, ambient-leaning
- Late Night (12-6am): Minimal, hypnotic, deep, 60-90 BPM

**Location Influences:**
- Urban: Electronic, industrial textures, faster
- Coastal: Flowing, ambient, wave-like patterns
- Mountains: Epic, spacious reverbs, orchestral elements
```

**Impact**: **HIGH** - Grok has no guidance on how to translate context to Strudel code

---

### GAP 3: Enhanced Prompt Format Is Weak ⚠️ HIGH

**Current Implementation** (`contextService.ts:322-347`):
```typescript
// Just appends text like:
parts.push(`\n\n[Context gathered: ${contextSummary}]`);
parts.push(`\n\n[Musical direction: ${recParts.join('; ')}]`);
```

**Problems**:
1. **Low Priority**: Appended text competes with 500+ lines of genre documentation
2. **Generic Format**: `[Musical direction: Mood: reflective; Tempo: slow]` is vague
3. **No Structure**: Can't distinguish between weather, time, location influences
4. **May Be Ignored**: Grok may prioritize genre examples over appended context

**Impact**: **MEDIUM** - Context may be ignored in favor of genre examples

**Better Approach**: Inject context as structured parameters at the TOP of the prompt, before genre examples

---

### GAP 4: No Validation That Output Actually Differs ⚠️ MEDIUM

**Current State**: No verification that:
- Rainy Brooklyn night beat ≠ Sunny LA afternoon beat
- Context actually influences generation
- Generated code matches context parameters

**Missing Validation**:
1. Extract `.cpm()` values → verify tempo matches context
2. Check scale usage (minor vs major) → verify mood matches
3. Verify effect parameters (reverb amount, cutoff) → verify weather/time influence
4. A/B test: Same prompt, different contexts → compare outputs

**Impact**: **MEDIUM** - Can't verify context-aware generation works

---

### GAP 5: Grok Tool Execution Is Simulated ⚠️ CRITICAL

**Current Implementation** (`contextService.ts:217-225`):
```typescript
// Add tool response (xAI executes these server-side)
messages.push({
  role: 'tool',
  tool_call_id: toolCall.id,
  content: 'Tool executed by xAI', // Placeholder
});
```

**Problem**: 
- Comment says "xAI handles execution" but content is a placeholder
- **Unknown**: Does xAI's API actually execute `web_search`/`x_search` automatically?
- If not, context gathering returns nothing useful

**Impact**: **CRITICAL** - Context gathering may not work at all

**Need to Verify**:
1. Test xAI API with tool calls
2. Check if tool responses are actually returned
3. If not, implement tool execution ourselves

---

## Implementation Plan

### Priority 0: Verify xAI Tool Execution (CRITICAL)

**Goal**: Confirm whether xAI executes tools automatically or we need to implement them

**Steps**:

1. **Test xAI API Response**:
   ```typescript
   // Add logging to see actual tool responses
   console.log('[Context] Tool call response:', JSON.stringify(contextResponse.data, null, 2));
   ```

2. **Check xAI Documentation**:
   - Review xAI API docs for tool execution behavior
   - Check if `tool_choice: 'auto'` triggers automatic execution
   - Verify if tool responses are included in API response

3. **Implement Fallback** (if needed):
   ```typescript
   // If xAI doesn't execute tools, implement ourselves
   if (toolCall.function.name === 'web_search') {
     const query = JSON.parse(toolCall.function.arguments).query;
     const searchResult = await executeWebSearch(query); // Implement
     messages.push({
       role: 'tool',
       tool_call_id: toolCall.id,
       content: JSON.stringify(searchResult),
     });
   }
   ```

**Files to Modify**:
- `packages/backend/src/services/contextService.ts`

**Estimated Time**: 2-4 hours (testing + fallback implementation)

---

### Priority 1: Add Context-to-Strudel Mappings to Prompt (HIGH)

**Goal**: Add explicit context variable mappings to `music_generation.txt`

**Implementation**:

Add new section to `config/prompts/music_generation.txt`:

```markdown
## CONTEXT-AWARE GENERATION

When user context is provided (weather, time of day, location), apply these mappings to influence the generated music:

### WEATHER → MUSICAL PARAMETERS

**Rainy/Cloudy Weather:**
- Tempo: Reduce by 10-20 BPM from base tempo (e.g., 120 → 100-110)
- Filter: Lower cutoff `.cutoff(400-1000)` for darker, muffled tones
- Reverb: Heavy reverb `.room(0.6-0.8).size(0.9)` for spacious, atmospheric feel
- Scale: Prefer minor scales (`.scale("C:minor")`, `.scale("A:aeolian")`)
- Density: Sparse patterns, more space between elements
- Effects: Add subtle delay `.delay(0.3).delaytime(0.5)` for echo effect
- Example: `stack(s("bd ~ ~ sd").cpm(100), n("c3 e3 g3").s("sine").cutoff(600).room(0.7).scale("C:minor"))`

**Sunny/Clear Weather:**
- Tempo: Increase by 10 BPM from base tempo (e.g., 120 → 130)
- Filter: Bright, open cutoff `.cutoff(2000-4000)` or no filter
- Reverb: Light reverb `.room(0.3-0.5)` for clarity
- Scale: Prefer major scales (`.scale("C:major")`, `.scale("F:lydian")`)
- Density: Full, energetic patterns
- Effects: Clean tones, minimal processing
- Example: `stack(s("bd*4").cpm(130), n("c4 e4 g4").s("sine").cutoff(3000).scale("C:major"))`

**Stormy/Thunder:**
- Tempo: Variable, aggressive (120-140 BPM)
- Filter: Aggressive distortion `.distort(0.2-0.4)`
- Reverb: Large, dramatic `.room(0.8).size(1.0)`
- Scale: Tense scales (`.scale("C:phrygian")`, `.scale("A:locrian")`)
- Density: Intense, layered patterns
- Effects: Heavy processing, bit crushing `.crush(4-8)`
- Example: `stack(s("bd bd ~ bd").cpm(135), n("c3").s("sawtooth").distort(0.3).room(0.9).scale("C:phrygian"))`

**Snowy/Cold:**
- Tempo: Slow to medium (80-100 BPM)
- Filter: Crystalline, high-pass `.cutoff(1500+)`
- Reverb: Large, spacious `.room(0.7).size(0.95)`
- Scale: Minor or modal (`.scale("C:minor")`, `.scale("D:dorian")`)
- Density: Minimal, sparse
- Effects: Clean tones with long decay

### TIME OF DAY → MUSICAL PARAMETERS

**Morning (6:00 AM - 10:00 AM):**
- Tempo: Rising energy (100-120 BPM)
- Key: Major keys for uplifting feel (`.scale("C:major")`)
- Tone: Clean, bright tones (`.cutoff(2000+)`)
- Energy: Building, energizing patterns
- Effects: Minimal processing, clear sounds
- Example: `stack(s("bd ~ sd ~").cpm(110), n("c4 e4 g4").s("sine").scale("C:major").gain(0.8))`

**Afternoon (10:00 AM - 4:00 PM):**
- Tempo: Full energy (120-140 BPM)
- Key: Major or mixolydian (`.scale("C:mixolydian")`)
- Tone: Bright, full-bodied
- Energy: Peak energy, full arrangements
- Effects: Moderate processing
- Example: `stack(s("bd*4").cpm(130), n("c4 e4 g4 b4").s("sawtooth").scale("C:mixolydian"))`

**Evening (4:00 PM - 8:00 PM):**
- Tempo: Winding down (80-110 BPM)
- Key: Warm major or dorian (`.scale("C:mixolydian")`, `.scale("D:dorian")`)
- Tone: Warm filters `.cutoff(800-1500)`
- Energy: Relaxed, comfortable
- Effects: Warm reverb `.room(0.4).size(0.7)`
- Example: `stack(s("bd ~ ~ sd").cpm(95), n("c3 e3 g3").s("sine").cutoff(1200).room(0.5).scale("C:mixolydian"))`

**Night (8:00 PM - 12:00 AM):**
- Tempo: Atmospheric (90-110 BPM)
- Key: Minor or modal (`.scale("C:minor")`, `.scale("D:dorian")`)
- Tone: Spacious, atmospheric
- Energy: Moderate, moody
- Effects: Heavy reverb `.room(0.6-0.8)`, delay `.delay(0.4)`
- Example: `stack(s("bd ~ ~ ~").cpm(100), n("c3 e3 g3").s("sine").room(0.7).delay(0.4).scale("C:minor"))`

**Late Night (12:00 AM - 6:00 AM):**
- Tempo: Minimal, hypnotic (60-90 BPM)
- Key: Deep minor or phrygian (`.scale("C:minor")`, `.scale("A:phrygian")`)
- Tone: Deep, low-end focused
- Energy: Minimal, hypnotic
- Effects: Deep reverb, long decay
- Example: `stack(s("bd ~ ~ ~ ~ ~ ~ ~").cpm(75), n("c2").s("sine").octave(1).room(0.8).scale("C:minor"))`

### LOCATION INFLUENCES → MUSICAL PARAMETERS

**Urban/City:**
- Style: Electronic, industrial textures
- Tempo: Faster (120-140 BPM)
- Effects: Gritty `.distort(0.1-0.2)`, bit crushing `.crush(8-12)`
- Patterns: Rhythmic, driving
- Example: `stack(s("bd*4").cpm(130), n("0 3 7").s("sawtooth").distort(0.15).crush(10))`

**Coastal/Beach:**
- Style: Flowing, ambient, wave-like
- Tempo: Moderate (90-110 BPM)
- Effects: Heavy reverb `.room(0.7)`, filter sweeps `.cutoff(sine.range(500, 2000))`
- Patterns: Smooth, flowing
- Example: `stack(s("~ ~ ~ ~").cpm(100), n("c3 e3 g3").s("sine").room(0.8).cutoff(sine.range(400, 2000).slow(4)))`

**Mountain/Nature:**
- Style: Epic, spacious, orchestral elements
- Tempo: Varied (80-120 BPM)
- Effects: Large reverb `.room(0.8).size(1.0)`, long decay
- Patterns: Grand, sweeping
- Example: `stack(s("bd ~ ~ ~").cpm(100), note("c3 e3 g3 c4").s("sine").room(0.9).size(1.0))`

**Desert:**
- Style: Minimal, spacious, hypnotic
- Tempo: Slow (70-90 BPM)
- Effects: Long reverb, delay feedback
- Patterns: Repetitive, meditative

**Forest:**
- Style: Organic, evolving, natural
- Tempo: Moderate (90-110 BPM)
- Effects: Natural reverb, subtle modulation
- Patterns: Evolving, organic

### CONTEXT COMBINATIONS

When multiple context factors are present, prioritize in this order:
1. **Weather** (strongest influence on mood)
2. **Time of Day** (influences energy level)
3. **Location** (influences style/texture)

**Example Combinations:**
- Rainy + Evening + Urban = Dark, atmospheric, electronic, 90-100 BPM, minor scales, heavy reverb
- Sunny + Afternoon + Coastal = Bright, energetic, flowing, 120-130 BPM, major scales, light reverb
- Stormy + Night + Mountain = Epic, dramatic, intense, 110-130 BPM, phrygian scales, large reverb

### IMPLEMENTATION RULES

1. **Always apply context mappings** when context is provided
2. **Override genre defaults** with context parameters (e.g., if genre says 120 BPM but context says rainy → use 100-110 BPM)
3. **Combine context with genre** - use genre for structure, context for mood/parameters
4. **Be explicit** - use actual Strudel code patterns from examples above
5. **Validate output** - ensure generated code includes context-appropriate parameters
```

**Files to Modify**:
- `config/prompts/music_generation.txt` (add new section)

**Estimated Time**: 1-2 hours

---

### Priority 2: Structured Prompt Injection (HIGH)

**Goal**: Make context parameters higher priority in prompt structure

**Current Problem**: Context appended at end, may be ignored

**Solution**: Inject context as structured parameters at TOP of system message

**Implementation**:

Modify `aiService.ts` to inject context BEFORE genre examples:

```typescript
// In generateMusicCode(), after loading template:

// Build system message with context injection
let systemMessage = renderPrompt(promptTemplate, {
  examples: examples.length > 0
    ? examples.map((ex) => `User: ${ex.prompt}\nAssistant: ${ex.code}`).join('\n\n')
    : '',
  defaults: JSON.stringify(defaults, null, 2),
});

// If context is provided, inject structured context parameters at TOP
if (request.contextParams) {
  const contextSection = buildContextSection(request.contextParams);
  systemMessage = `${contextSection}\n\n---\n\n${systemMessage}`;
}
```

Create `buildContextSection()` function:

```typescript
// packages/backend/src/services/contextMapper.ts (new file)

export interface ContextParams {
  weather?: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
    temperature?: number;
  };
  timeOfDay?: {
    hour: number; // 0-23
    period: 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
  };
  location?: {
    type: 'urban' | 'coastal' | 'mountain' | 'desert' | 'forest' | 'rural';
    city?: string;
  };
}

export function buildContextSection(params: ContextParams): string {
  const sections: string[] = [];
  
  sections.push('## CONTEXT PARAMETERS (HIGH PRIORITY)');
  sections.push('');
  sections.push('The following context parameters MUST be applied to the generated music:');
  sections.push('');

  if (params.weather) {
    const { condition, temperature } = params.weather;
    sections.push(`**Weather**: ${condition}${temperature ? `, ${temperature}°F` : ''}`);
    
    switch (condition) {
      case 'rainy':
      case 'cloudy':
        sections.push('- Tempo: Reduce by 10-20 BPM');
        sections.push('- Use `.cutoff(400-1000)` for darker tones');
        sections.push('- Heavy reverb `.room(0.6-0.8)`');
        sections.push('- Minor scales (`.scale("C:minor")`)');
        break;
      case 'sunny':
        sections.push('- Tempo: Increase by 10 BPM');
        sections.push('- Bright cutoff `.cutoff(2000+)`');
        sections.push('- Major scales (`.scale("C:major")`)');
        break;
      case 'stormy':
        sections.push('- Aggressive patterns');
        sections.push('- Distortion `.distort(0.2-0.4)`');
        sections.push('- Phrygian/Locrian scales');
        break;
    }
    sections.push('');
  }

  if (params.timeOfDay) {
    const { period, hour } = params.timeOfDay;
    sections.push(`**Time of Day**: ${period} (${hour}:00)`);
    
    switch (period) {
      case 'morning':
        sections.push('- Tempo: 100-120 BPM');
        sections.push('- Major keys, clean tones');
        break;
      case 'afternoon':
        sections.push('- Tempo: 120-140 BPM');
        sections.push('- Full energy, bright');
        break;
      case 'evening':
        sections.push('- Tempo: 80-110 BPM');
        sections.push('- Warm filters, relaxed');
        break;
      case 'night':
        sections.push('- Tempo: 90-110 BPM');
        sections.push('- Atmospheric, spacious reverb');
        break;
      case 'late_night':
        sections.push('- Tempo: 60-90 BPM');
        sections.push('- Minimal, hypnotic, deep');
        break;
    }
    sections.push('');
  }

  if (params.location) {
    const { type, city } = params.location;
    sections.push(`**Location**: ${city || type}`);
    
    switch (type) {
      case 'urban':
        sections.push('- Electronic, industrial textures');
        sections.push('- Faster tempo (120-140 BPM)');
        sections.push('- Gritty effects `.distort(0.1-0.2)`');
        break;
      case 'coastal':
        sections.push('- Flowing, ambient, wave-like');
        sections.push('- Moderate tempo (90-110 BPM)');
        sections.push('- Heavy reverb `.room(0.7)`');
        break;
      case 'mountain':
        sections.push('- Epic, spacious, orchestral');
        sections.push('- Large reverb `.room(0.8).size(1.0)`');
        break;
    }
    sections.push('');
  }

  sections.push('**CRITICAL**: These context parameters override genre defaults when in conflict.');
  sections.push('Apply the context mappings from the CONTEXT-AWARE GENERATION section.');
  
  return sections.join('\n');
}
```

**Update contextService to extract structured params**:

```typescript
// In contextService.ts, add function to extract structured params from Grok response:

function extractStructuredContext(
  contextSummary: string,
  location?: ContextRequest['location'],
  localTime?: string
): ContextParams {
  const params: ContextParams = {};

  // Extract weather
  const weatherMatch = contextSummary.match(/(rainy|cloudy|sunny|stormy|snowy|clear)/i);
  if (weatherMatch) {
    params.weather = {
      condition: weatherMatch[1].toLowerCase() as any,
    };
  }

  // Extract time period from localTime
  if (localTime) {
    const hour = parseInt(localTime.split(':')[0]);
    let period: ContextParams['timeOfDay']['period'];
    if (hour >= 6 && hour < 10) period = 'morning';
    else if (hour >= 10 && hour < 16) period = 'afternoon';
    else if (hour >= 16 && hour < 20) period = 'evening';
    else if (hour >= 20 || hour < 24) period = 'night';
    else period = 'late_night';

    params.timeOfDay = { hour, period };
  }

  // Extract location type
  if (location?.city) {
    // Simple heuristic (could be improved with geocoding API)
    const cityLower = location.city.toLowerCase();
    if (cityLower.includes('beach') || cityLower.includes('coast')) {
      params.location = { type: 'coastal', city: location.city };
    } else if (cityLower.includes('mountain')) {
      params.location = { type: 'mountain', city: location.city };
    } else {
      params.location = { type: 'urban', city: location.city };
    }
  }

  return params;
}
```

**Update ContextResult interface**:

```typescript
export interface ContextResult {
  // ... existing fields ...
  structuredParams?: ContextParams; // NEW
}
```

**Files to Create/Modify**:
- `packages/backend/src/services/contextMapper.ts` (new)
- `packages/backend/src/services/contextService.ts` (modify)
- `packages/backend/src/services/aiService.ts` (modify)

**Estimated Time**: 4-6 hours

---

### Priority 3: Output Validation (MEDIUM)

**Goal**: Verify that generated code actually reflects context

**Implementation**:

Create validation service:

```typescript
// packages/backend/src/services/contextValidator.ts (new)

import { StrudelCode } from '@kre8/shared';
import { ContextParams } from './contextMapper.js';

export interface ValidationResult {
  matchesContext: boolean;
  score: number; // 0-1
  details: {
    tempoMatch?: boolean;
    scaleMatch?: boolean;
    effectsMatch?: boolean;
    issues: string[];
  };
}

export function validateContextMatch(
  code: StrudelCode,
  contextParams: ContextParams
): ValidationResult {
  const codeStr = code.code;
  const details: ValidationResult['details'] = {
    issues: [],
  };
  let score = 0;
  let checks = 0;

  // 1. Validate tempo
  if (contextParams.weather || contextParams.timeOfDay) {
    const expectedTempo = getExpectedTempo(contextParams);
    const actualTempo = extractTempoFromCode(codeStr);
    
    if (actualTempo) {
      checks++;
      const tempoMatch = Math.abs(actualTempo - expectedTempo) <= 15; // ±15 BPM tolerance
      details.tempoMatch = tempoMatch;
      if (tempoMatch) {
        score += 0.4;
      } else {
        details.issues.push(`Tempo mismatch: expected ~${expectedTempo} BPM, got ${actualTempo} BPM`);
      }
    }
  }

  // 2. Validate scale
  if (contextParams.weather || contextParams.timeOfDay) {
    const expectedScale = getExpectedScale(contextParams);
    const actualScale = extractScaleFromCode(codeStr);
    
    if (actualScale) {
      checks++;
      const scaleMatch = actualScale.toLowerCase().includes(expectedScale.toLowerCase());
      details.scaleMatch = scaleMatch;
      if (scaleMatch) {
        score += 0.3;
      } else {
        details.issues.push(`Scale mismatch: expected ${expectedScale}, got ${actualScale}`);
      }
    }
  }

  // 3. Validate effects
  if (contextParams.weather) {
    const expectedEffects = getExpectedEffects(contextParams.weather.condition);
    checks++;
    let effectsScore = 0;
    
    if (expectedEffects.reverb && codeStr.includes('.room(')) {
      effectsScore += 0.15;
    }
    if (expectedEffects.cutoff && codeStr.includes('.cutoff(')) {
      effectsScore += 0.15;
    }
    if (expectedEffects.distort && codeStr.includes('.distort(')) {
      effectsScore += 0.1;
    }
    
    details.effectsMatch = effectsScore > 0.2;
    score += effectsScore;
  }

  return {
    matchesContext: score >= 0.6, // 60% threshold
    score: checks > 0 ? score / checks : 0,
    details,
  };
}

function getExpectedTempo(params: ContextParams): number {
  let baseTempo = 120; // Default

  if (params.timeOfDay) {
    switch (params.timeOfDay.period) {
      case 'morning': baseTempo = 110; break;
      case 'afternoon': baseTempo = 130; break;
      case 'evening': baseTempo = 95; break;
      case 'night': baseTempo = 100; break;
      case 'late_night': baseTempo = 75; break;
    }
  }

  if (params.weather) {
    switch (params.weather.condition) {
      case 'rainy':
      case 'cloudy': baseTempo -= 15; break;
      case 'sunny': baseTempo += 10; break;
      case 'stormy': baseTempo += 10; break;
    }
  }

  return baseTempo;
}

function getExpectedScale(params: ContextParams): string {
  if (params.weather) {
    switch (params.weather.condition) {
      case 'rainy':
      case 'cloudy':
      case 'snowy': return 'minor';
      case 'sunny': return 'major';
      case 'stormy': return 'phrygian';
    }
  }

  if (params.timeOfDay) {
    switch (params.timeOfDay.period) {
      case 'morning':
      case 'afternoon': return 'major';
      case 'evening': return 'mixolydian';
      case 'night':
      case 'late_night': return 'minor';
    }
  }

  return 'major'; // Default
}

function getExpectedEffects(weather: string): {
  reverb: boolean;
  cutoff: boolean;
  distort: boolean;
} {
  switch (weather) {
    case 'rainy':
    case 'cloudy': return { reverb: true, cutoff: true, distort: false };
    case 'sunny': return { reverb: false, cutoff: true, distort: false };
    case 'stormy': return { reverb: true, cutoff: false, distort: true };
    default: return { reverb: false, cutoff: false, distort: false };
  }
}

function extractTempoFromCode(code: string): number | null {
  // Match .cpm(120) or .cpm(120.5)
  const match = code.match(/\.cpm\s*\(\s*(\d+(?:\.\d+)?)\s*\)/);
  return match ? parseFloat(match[1]) : null;
}

function extractScaleFromCode(code: string): string | null {
  // Match .scale("C:minor") or .scale("A:major")
  const match = code.match(/\.scale\s*\(\s*["']\w+:(\w+)["']\s*\)/);
  return match ? match[1] : null;
}
```

**Add validation to generation endpoint**:

```typescript
// In music.ts route:
const result = await generateMusicCode({ ... });

// Validate context match if context was used
if (contextInfo && contextResult.structuredParams) {
  const validation = validateContextMatch(result, contextResult.structuredParams);
  
  if (!validation.matchesContext) {
    console.warn('[Context] Generated code does not match context:', validation.details.issues);
    // Could retry or log for analysis
  }
  
  // Include validation in response
  res.json({
    success: true,
    data: result,
    context: {
      ...contextInfo,
      validation, // NEW
    },
  });
}
```

**Files to Create/Modify**:
- `packages/backend/src/services/contextValidator.ts` (new)
- `packages/backend/src/routes/music.ts` (modify)

**Estimated Time**: 3-4 hours

---

### Priority 4: A/B Testing Framework (LOW)

**Goal**: Compare outputs with different contexts

**Implementation**: Create test endpoint that generates same prompt with different contexts

```typescript
// packages/backend/src/routes/music.ts

musicRoutes.post('/generate/compare', async (req, res) => {
  const { prompt, contexts } = req.body; // Array of different contexts
  
  const results = await Promise.all(
    contexts.map(async (context) => {
      const result = await generateMusicCode({ prompt, context });
      const validation = context.structuredParams 
        ? validateContextMatch(result, context.structuredParams)
        : null;
      return { context, result, validation };
    })
  );
  
  res.json({ success: true, comparisons: results });
});
```

**Estimated Time**: 2-3 hours

---

## Summary

| Priority | Gap | Fix | Time | Impact |
|----------|-----|-----|------|--------|
| **P0** | Tool execution | Verify + implement fallback | 2-4h | CRITICAL |
| **P1** | Context mappings | Add to prompt | 1-2h | HIGH |
| **P2** | Prompt injection | Structured injection | 4-6h | HIGH |
| **P3** | Validation | Code validation | 3-4h | MEDIUM |
| **P4** | A/B testing | Test framework | 2-3h | LOW |

**Total Estimated Time**: 12-19 hours

**Recommended Order**:
1. P0: Verify tool execution (blocking issue)
2. P1: Add context mappings (quick win)
3. P2: Structured injection (biggest quality improvement)
4. P3: Validation (verify it works)
5. P4: A/B testing (nice to have)

---

## Next Steps

Would you like me to:
1. **Start with P0** - Verify and fix tool execution?
2. **Start with P1** - Add context mappings to prompt (quickest win)?
3. **Implement all fixes** in priority order?

