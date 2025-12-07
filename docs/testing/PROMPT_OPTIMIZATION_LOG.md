# Prompt Optimization Log

**Purpose**: Track prompt engineering iterations, model testing, and quality improvements for the kre8 music generation system.

---

## Phase 2 Improvements (2025-11-20)

### ✅ Completed Improvements

#### 1. **Few-Shot Examples Expansion**
**Status**: ✅ Complete
**Changed**: `config/prompts/few_shot_examples.json`

**Before**:
- 4 basic examples (drum beat, techno, ambient, layered)
- Limited genre coverage
- No complexity indicators

**After**:
- 20 diverse examples covering:
  - ✅ Jazz (chord progressions, swing)
  - ✅ Hip-hop (808s, syncopation)
  - ✅ House (four-on-the-floor, filtered pads)
  - ✅ Jungle/Drum & Bass (breakbeats)
  - ✅ Techno (dark basslines, distortion)
  - ✅ Trance (arpeggios, sidechain)
  - ✅ IDM (glitch, randomization)
  - ✅ Reggae (offbeat chords)
  - ✅ Dubstep (wobble bass)
  - ✅ Ambient (drones, evolving textures)
  - ✅ Funk (syncopated bass)
  - ✅ Classical (string patterns)
  - ✅ Trap (hi-hat rolls)

**Advanced Features Demonstrated**:
- ✅ Effects: reverb (.room, .size), delay (.delay, .delaytime, .delayfeedback), distortion (.distort), filtering (.cutoff, .resonance)
- ✅ Modulation: sine.range(), perlin.range(), rand, irand(), choose()
- ✅ Transformations: .sometimes(), .degradeBy(), .rev(), .fast(), .slow()
- ✅ Polyrhythms: .fast(3/2), .fast(5/4)
- ✅ Complexity levels: beginner, intermediate, advanced

**Impact**: Models now have comprehensive examples for nearly any genre request.

---

#### 2. **Main Generation Prompt Enhancement**
**Status**: ✅ Complete
**Changed**: `config/prompts/music_generation.txt`

**Improvements Made**:

**A. Comprehensive Strudel Syntax Reference**
- Pattern functions (s, n, note, stack, cat)
- Tempo control (setcps, .fast, .slow)
- Pattern syntax (~, *, /, [], <>, ?, !)
- Full effects list (13+ effects documented)
- Modulation sources (sine, rand, perlin, irand)
- Transformations (.sometimes, .often, .rarely, .every, etc.)
- Common sample banks

**B. Music Theory Context Added**
- ✅ BPM to CPS conversion table (60-180 BPM)
- ✅ Genre characteristics (tempo, rhythm, feel)
- ✅ Common chord progressions (I-V-vi-IV, ii-V-I, i-VII-VI-V)
- ✅ Musical quality guidelines

**C. Enhanced Instructions**
- 10 specific generation guidelines
- Musical coherence requirements
- Effect usage guidelines
- Experience level consideration
- Common pattern templates

**Before**: 14 lines, basic syntax, no music theory
**After**: 122 lines, comprehensive reference, genre conventions, quality focus

**Impact**: AI models now have:
- Clear genre conventions (BPM, rhythm styles)
- Music theory context for harmonic choices
- Comprehensive Strudel API reference
- Quality-focused generation guidelines

---

#### 3. **Refinement Prompt Enhancement**
**Status**: ✅ Complete
**Changed**: `config/prompts/refinement.txt`

**Improvements Made**:

**A. Common Request Patterns**
- Documented 8 common refinement types
- Provided concrete before/after examples
- Added interpretation guidelines

**B. Refinement Principles**
- 7 core principles for surgical modifications
- Emphasis on preservation over rewriting
- Musical coherence guidelines

**C. Code Examples**
- Adding instruments (with stack layering)
- Tempo adjustments
- Effect additions
- Element removal
- All with before/after code

**Before**: 10 lines, minimal guidance
**After**: 95 lines, comprehensive refinement guide

**Impact**: More precise iterative refinements, better preservation of user's musical intent.

---

## Testing Plan

### Test Prompts (Organized by Genre)

#### **Basic Tests** (Beginner-Level)
1. ✅ "Create a simple drum beat"
2. ✅ "Make a slow piano melody"
3. ✅ "Play a bassline"

#### **Genre-Specific Tests** (Intermediate)
4. ⏳ "Create a house track at 125 BPM"
5. ⏳ "Make a hip-hop beat with 808s"
6. ⏳ "Generate a jazz chord progression"
7. ⏳ "Create a techno track with filtered pads"
8. ⏳ "Make an ambient soundscape"
9. ⏳ "Generate a drum and bass breakbeat"
10. ⏳ "Create a trap beat with hi-hat rolls"

#### **Complex/Advanced Tests**
11. ⏳ "Create a polyrhythmic percussion pattern with 3/4 against 4/4"
12. ⏳ "Generate a glitchy IDM track with random elements"
13. ⏳ "Make a dubstep wobble bass with modulation"
14. ⏳ "Create an evolving ambient texture with delay feedback"
15. ⏳ "Generate a funk groove with syncopated bass and offbeat guitar"

#### **Refinement Tests**
16. ⏳ Generate basic beat → "add hi-hats"
17. ⏳ Generate house track → "make it faster"
18. ⏳ Generate melody → "add reverb and delay"
19. ⏳ Generate complex pattern → "simplify it"
20. ⏳ Generate drum pattern → "remove snare, add rim shots"

#### **Edge Cases**
21. ⏳ "Create silence" (should generate ~)
22. ⏳ "Make a beat at 300 BPM" (very fast)
23. ⏳ "Generate a 12-minute ambient drone" (very long)
24. ⏳ "Create a beat with 17/16 time signature" (unusual meter)
25. ⏳ "Mix classical and dubstep" (genre fusion)

---

## Model Testing Plan

### Models to Test

1. **anthropic/claude-3.5-sonnet** (Default)
   - Status: ⏳ Testing
   - Expected: Best overall quality, understands music theory

2. **openai/gpt-4-turbo**
   - Status: ⏳ Pending
   - Expected: Good code generation, may need more examples

3. **openai/gpt-4o**
   - Status: ⏳ Pending
   - Expected: Fast, good balance

4. **google/gemini-pro-1.5**
   - Status: ⏳ Pending
   - Expected: Good with patterns, may need syntax guidance

5. **meta-llama/llama-3-70b-instruct**
   - Status: ⏳ Pending
   - Expected: Open-source option, may need more prompting

### Evaluation Criteria

For each model, score 1-5 on:

| Criteria | Weight | Description |
|----------|--------|-------------|
| **Syntax Correctness** | 5x | Does the code run without errors? |
| **Musical Quality** | 5x | Does it sound good and coherent? |
| **Genre Accuracy** | 3x | Matches requested style? |
| **Tempo Accuracy** | 2x | Uses appropriate BPM/CPS? |
| **Effect Usage** | 2x | Uses effects tastefully? |
| **Code Readability** | 1x | Clean, commented code? |
| **Creativity** | 3x | Interesting patterns, not generic? |
| **Complexity Match** | 2x | Matches request complexity? |

**Weighted Score Formula**:
```
Score = (Syntax*5 + Musical*5 + Genre*3 + Tempo*2 + Effects*2 + Readability*1 + Creativity*3 + Complexity*2) / 23
```

---

## Next Steps

### Immediate (Phase 2 - Ongoing)

1. ✅ Expand few-shot examples to 20+ (COMPLETE)
2. ✅ Enhance main generation prompt with music theory (COMPLETE)
3. ✅ Improve refinement prompt with examples (COMPLETE)
4. ⏳ **Test current prompts with Claude 3.5 Sonnet** (IN PROGRESS)
5. ⏳ Document test results
6. ⏳ Test with alternative models (GPT-4, Gemini)
7. ⏳ Compare model performance
8. ⏳ Identify weak areas and iterate

### Future Improvements

1. **Add Genre-Specific Prompt Variants**
   - Separate prompts for jazz, techno, ambient, etc.
   - Load based on detected genre keywords
   - More specialized examples per genre

2. **Implement Dynamic Example Selection**
   - Select few-shot examples based on user request
   - If user asks for "jazz", prioritize jazz examples
   - Reduces prompt size, increases relevance

3. **Add Prompt Caching**
   - Cache generated prompts to reduce template rendering overhead
   - Invalidate cache when config files change

4. **Create Evaluation Suite**
   - Automated testing of generated code validity
   - Unit tests for common patterns
   - Regression testing for quality

5. **Expand to Audio-to-Pattern**
   - Use audio analysis results in prompt
   - "Generate pattern matching this audio's tempo and style"

6. **Add Style Transfer**
   - "Make this pattern sound more like [genre]"
   - Advanced refinement capabilities

---

## Metrics to Track

### Generation Quality Metrics
- ✅ Code validity rate (% of generated code that executes)
- ✅ User satisfaction (via ratings)
- ✅ Refinement success rate (% of refinements that work)
- ✅ Genre accuracy (subjective evaluation)
- ✅ Musical coherence (subjective evaluation)

### Performance Metrics
- ✅ Average generation time
- ✅ Token usage per request
- ✅ Cache hit rate
- ✅ API error rate

### Cost Metrics
- ✅ Cost per generation
- ✅ Total API spend
- ✅ Cost by model

---

## Lessons Learned

### What Works Well

1. **Comprehensive Examples** - 20 diverse examples dramatically improve genre coverage
2. **Music Theory Context** - BPM/CPS table and genre characteristics help tempo accuracy
3. **Effect Reference** - Full effect list ensures models use Strudel features properly
4. **Refinement Examples** - Before/after code examples improve iterative changes

### What Needs Improvement

1. **Testing Needed** - Must validate that improvements actually work in practice
2. **Model Comparison** - Need to test multiple models to find best fit
3. **Edge Cases** - Unusual requests may still fail
4. **Validation** - Need robust code validation before execution

### Open Questions

1. **Optimal Example Count** - Is 20 enough? Too many? (Will test)
2. **Model Selection** - Which model performs best for music generation?
3. **Prompt Length** - Is the prompt too long? Does it hurt performance?
4. **Temperature Setting** - What temperature produces best results? (0.7? 0.9?)
5. **Streaming** - Does streaming output improve UX for long generations?

---

## Version History

### v2.0 - 2025-11-20 (Current)
- ✅ Expanded few-shot examples from 4 to 20
- ✅ Added comprehensive Strudel syntax reference (50+ features)
- ✅ Added music theory context (BPM conversions, genre characteristics)
- ✅ Enhanced refinement prompt with examples
- ✅ Added genre and complexity metadata to examples
- 📝 Status: Ready for testing

### v1.0 - 2025-11-20 (Baseline - Composer)
- Basic prompt template
- 4 simple examples
- Minimal instructions
- No music theory context

---

## Contact & Collaboration

**Claude's Role**: Prompt engineering, model testing, quality optimization
**Composer's Role**: Infrastructure, bug fixes, feature additions
**Collaboration**: Test results → prompt iterations → deployment

**Current Focus**: Testing v2.0 prompts with real user requests and multiple models.

---

## Appendix: Prompt Template Variables

Current template system uses `{{variable}}` syntax:

| Variable | Source | Description |
|----------|--------|-------------|
| `{{defaults}}` | `config/defaults.json` | Default tempo, scale, key, samples |
| `{{examples}}` | `config/prompts/few_shot_examples.json` | Few-shot example pairs |
| `{{user_prompt}}` | API request | User's natural language request |
| `{{current_code}}` | API request | Existing code (refinement only) |

**Potential New Variables**:
- `{{audio_analysis}}` - Results from audio file analysis
- `{{conversation_history}}` - Previous prompts/refinements
- `{{user_preferences}}` - Learned user preferences (future)
- `{{genre_specific_tips}}` - Dynamic genre guidance
