# Prompt Quality Testing Plan
## AI Music Generation - Enhanced Prompts v2.0

**Version**: 2.0
**Date**: 2025-11-20
**Status**: Ready for Execution
**Complements**: [TESTING_PLAN.md](TESTING_PLAN.md) (technical tests)

---

## 🎯 Purpose

This plan focuses specifically on testing the **enhanced prompt templates** (v2.0) created in Phase 2, including:
- 20 few-shot examples (expanded from 4)
- Comprehensive Strudel syntax reference
- Music theory context (BPM, genres, chords)
- Enhanced refinement prompts

This is separate from (but complements) the technical testing in [TESTING_PLAN.md](TESTING_PLAN.md).

---

## 📊 Quick Reference

| Test Phase | Duration | Cost | Status |
|------------|----------|------|--------|
| Phase 1: Mock Validation | 30 min | Free | ⬜ Not Started |
| Phase 2: Quality Testing | 2-3 hours | ~$1-2 | ⬜ Not Started |
| Phase 3: Model Comparison | 3-4 hours | ~$5-10 | ⬜ Not Started |
| Phase 4: Iteration | Ongoing | Variable | ⬜ Not Started |

---

## Phase 1: Mock Validation ⚡ (Free & Fast)

### Objective
Confirm prompt templates render correctly without API costs.

### Setup
```bash
# Set mock mode
cat > .env << 'EOF'
USE_MOCK_AI=true
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
EOF

# Start servers
cd packages/backend && npm run dev &
cd packages/frontend && npm run dev
```

### Tests

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| 1 | Submit "create a drum beat" | Returns mock Strudel code | ⬜ |
| 2 | Check response format | Contains markdown code block | ⬜ |
| 3 | Check template variables | `{{defaults}}`, `{{examples}}`, `{{user_prompt}}` replaced | ⬜ |
| 4 | Check few-shot examples | All 20 examples loaded | ⬜ |
| 5 | Submit refinement | Mock refinement response | ⬜ |
| 6 | Check console | No errors | ⬜ |

### Validation Checklist
- ⬜ Prompts load from files successfully
- ⬜ Examples render in correct format
- ⬜ No template syntax errors
- ⬜ Mock service returns formatted code
- ⬜ Refinement template works

**Exit Criteria**: All tests pass → Move to Phase 2

---

## Phase 2: Quality Testing (Real AI - Claude 3.5 Sonnet)

### Setup
```bash
cat > .env << 'EOF'
USE_MOCK_AI=false
OPENROUTER_API_KEY=your_key_here
WHISPER_API_KEY=your_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
PORT=3001
CORS_ORIGIN=http://localhost:5173
EOF

# Restart backend
cd packages/backend && npm run dev
```

### Test Suite A: Syntax Validation (5 tests)

**Target**: 95%+ pass rate

| # | Prompt | Syntax Valid? | Runs in Strudel? | Notes |
|---|--------|---------------|------------------|-------|
| A1 | "Create a simple drum beat" | ⬜ | ⬜ | Basic s() usage |
| A2 | "Make a slow piano melody" | ⬜ | ⬜ | Note patterns |
| A3 | "Play a bassline" | ⬜ | ⬜ | Octave usage |
| A4 | "Create kick and snare pattern" | ⬜ | ⬜ | Classic pattern |
| A5 | "Generate hi-hats" | ⬜ | ⬜ | Repetition syntax |

**Pass Criteria**: Code executes without syntax errors

---

### Test Suite B: Genre Accuracy (10 tests)

**Target**: 4.0/5 average on all metrics

| # | Prompt | Genre (1-5) | Tempo (1-5) | Quality (1-5) | Notes |
|---|--------|-------------|-------------|---------------|-------|
| B1 | "Create a house track at 125 BPM" | ⬜ | ⬜ | ⬜ | Four-on-floor? |
| B2 | "Make a hip-hop beat with 808s at 90 BPM" | ⬜ | ⬜ | ⬜ | Syncopated? |
| B3 | "Generate a jazz chord progression" | ⬜ | ⬜ | ⬜ | Maj7/min7? |
| B4 | "Create techno with filtered bassline" | ⬜ | ⬜ | ⬜ | Uses .cutoff()? |
| B5 | "Make an ambient soundscape" | ⬜ | ⬜ | ⬜ | Reverb/delay? |
| B6 | "Create drum and bass at 170 BPM" | ⬜ | ⬜ | ⬜ | Fast breaks? |
| B7 | "Generate trap with hi-hat rolls" | ⬜ | ⬜ | ⬜ | Triplet hats? |
| B8 | "Make a reggae rhythm" | ⬜ | ⬜ | ⬜ | Offbeat chords? |
| B9 | "Create a funk groove" | ⬜ | ⬜ | ⬜ | Syncopated bass? |
| B10 | "Generate classical strings" | ⬜ | ⬜ | ⬜ | Harmonic chords? |

**Scoring Rubric**:
- **5**: Perfect - Exactly what was requested
- **4**: Good - Minor deviations
- **3**: Acceptable - Recognizable but off
- **2**: Poor - Wrong but functional
- **1**: Fail - Completely wrong

---

### Test Suite C: Advanced Features (5 tests)

**Target**: 80%+ feature usage, 4.0/5 creativity

| # | Prompt | Effects? | Modulation? | Transforms? | Creativity (1-5) | Notes |
|---|--------|----------|-------------|-------------|------------------|-------|
| C1 | "Create polyrhythmic percussion" | ⬜ | ⬜ | ⬜ (fast ratios) | ⬜ | 3/2, 5/4? |
| C2 | "Generate glitchy IDM" | ⬜ (distort) | ⬜ (rand) | ⬜ (sometimes) | ⬜ | Generative? |
| C3 | "Make dubstep wobble bass" | ⬜ (cutoff) | ⬜ (sine.range) | ⬜ | ⬜ | LFO? |
| C4 | "Create ambient with delay feedback" | ⬜ (delay) | ⬜ | ⬜ | ⬜ | .delayfeedback? |
| C5 | "Generate layered pattern (4+ elements)" | ⬜ | ⬜ | ⬜ | ⬜ | Uses stack()? |

---

### Test Suite D: Refinement Quality (7 tests)

**Target**: 4.5/5 on preservation and accuracy

| # | Base → Refinement | Preservation (1-5) | Accuracy (1-5) | Notes |
|---|-------------------|-------------------|----------------|-------|
| D1 | "drum beat" → "add hi-hats" | ⬜ | ⬜ | Original intact? |
| D2 | "house track" → "make it faster" | ⬜ | ⬜ | Only setcps changed? |
| D3 | "piano melody" → "add reverb" | ⬜ | ⬜ | Adds .room()? |
| D4 | "complex pattern" → "simplify" | ⬜ | ⬜ | Reduces complexity? |
| D5 | "drum pattern" → "remove snare, add rim" | ⬜ | ⬜ | Surgical swap? |
| D6 | "techno beat" → "add bassline" | ⬜ | ⬜ | Layers with stack()? |
| D7 | "ambient" → "make rhythmic" | ⬜ | ⬜ | Adds rhythm? |

**Preservation Scoring**:
- **5**: All original code preserved exactly
- **4**: Minor formatting changes only
- **3**: Some original elements changed unnecessarily
- **2**: Major rewrites of unchanged elements
- **1**: Complete rewrite (failure)

**Accuracy Scoring**:
- **5**: Perfect match to refinement request
- **4**: Good match, minor deviations
- **3**: Partial match
- **2**: Wrong change applied
- **1**: No change or opposite change

---

### Results Recording

For each test, create entry:

```markdown
## Test B3: Jazz Chord Progression

**Prompt**: "Generate a jazz chord progression"

**Generated Code**:
```javascript
setcps(0.8);
stack(
  n("<[cmaj7,e3,g3,b3] [fmaj7,f3,a3,c4] [g7,g3,b3,d4,f4]>")
    .s("piano").gain(0.7).slow(2),
  s("~ rim ~ rim").gain(0.5)
).swing()
```

**Execution**:
- ✅ Syntax valid
- ✅ Runs in Strudel
- ✅ Produces sound

**Scores**:
- Genre Match: 5/5 (Uses jazz chords, swing rhythm)
- Tempo: 4/5 (0.8 cps ≈ 96 BPM, acceptable for jazz)
- Quality: 5/5 (Sounds great, proper voicings)

**Features**:
- ✅ Uses chord notation (maj7, min7)
- ✅ Uses .swing() transformation
- ✅ Appropriate tempo for genre
- ✅ Layered with subtle percussion

**Notes**: Excellent jazz generation. Uses our enhanced examples correctly.

**Audio**: [Link to recording if saved]
```

---

## Phase 3: Model Comparison

### Models to Test

| Model | ID | Cost/Req | Status |
|-------|----|----------|--------|
| **Claude 3.5 Sonnet** (baseline) | `anthropic/claude-3.5-sonnet` | $0.0105 | ⬜ |
| **GPT-4o** | `openai/gpt-4o` | $0.0135 | ⬜ |
| **GPT-4 Turbo** | `openai/gpt-4-turbo` | $0.027 | ⬜ |
| **Gemini 1.5 Pro** | `google/gemini-pro-1.5` | $0.00945 | ⬜ |

### Testing Procedure

For each model:

1. Update `.env`: `OPENROUTER_MODEL=model-id`
2. Restart backend
3. Run **Test Suite B** (10 genre tests)
4. Record all scores
5. Calculate weighted average
6. Note generation time and cost

### Comparison Spreadsheet

| Model | Avg Genre | Avg Tempo | Avg Quality | Weighted Score | Time (s) | Cost/Test |
|-------|-----------|-----------|-------------|----------------|----------|-----------|
| Claude Sonnet | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | $0.0105 |
| GPT-4o | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | $0.0135 |
| GPT-4 Turbo | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | $0.027 |
| Gemini Pro | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | $0.00945 |

**Weighted Score Formula**:
```
Score = (Genre*3 + Tempo*2 + Quality*5) / 10
Max = 5.0
```

### Model Selection

**Decision Criteria**:
1. Minimum threshold: Weighted Score ≥ 4.0
2. If multiple qualify: Choose best value (score per dollar)
3. Speed tiebreaker: Prefer faster if scores within 0.2

**Recommendation Template**:
```markdown
## Model Recommendation

**Winner**: [Model Name]

**Reasoning**:
- Score: X.X/5.0 (meets 4.0 threshold)
- Cost: $X.XX per request
- Speed: X.Xs average
- Value: Highest score-to-cost ratio

**Runners-up**:
1. [Model]: X.X/5.0 - [Reason not chosen]
2. [Model]: X.X/5.0 - [Reason not chosen]
```

---

## Phase 4: Iteration & Refinement

### Failure Analysis

For any test scoring < 3.5/5:

1. **Document Failure**:
   ```markdown
   - Test ID: B7
   - Prompt: "Generate trap with hi-hat rolls"
   - Score: 3.0/5 (Genre)
   - Issue: Missing triplet hi-hats, felt more like house
   ```

2. **Root Cause**:
   - ⬜ Missing genre example?
   - ⬜ Unclear instructions?
   - ⬜ Insufficient music theory?
   - ⬜ Model limitation?

3. **Proposed Fix**:
   - Add trap-specific example with triplet hats
   - Clarify genre characteristics in prompt
   - Add BPM guidance for trap (140-160)

4. **Re-test**:
   - Apply fix
   - Re-run same test
   - Validate improvement

5. **Document in** [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md)

### Improvement Tracking

| Iteration | Syntax Rate | Genre Avg | Tempo Avg | Quality Avg | Refinement Avg |
|-----------|-------------|-----------|-----------|-------------|----------------|
| v1.0 (baseline) | 80% | 3.0/5 | 2.5/5 | 3.2/5 | 2.8/5 |
| v2.0 (current) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| v2.1 (after fixes) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Target**: All metrics ≥ 4.0/5

---

## 📝 Testing Checklist

### Before Starting
- ⬜ Backend/frontend installed
- ⬜ `.env` configured
- ⬜ OpenRouter API key funded
- ⬜ Spreadsheet/notes ready
- ⬜ Audio recording setup (optional)

### Phase 1 (Mock)
- ⬜ All 6 validation tests pass
- ⬜ No console errors
- ⬜ Templates render correctly

### Phase 2 (Real AI)
- ⬜ Run Test Suite A (5 tests)
- ⬜ Run Test Suite B (10 tests)
- ⬜ Run Test Suite C (5 tests)
- ⬜ Run Test Suite D (7 tests)
- ⬜ Calculate averages
- ⬜ Document findings

### Phase 3 (Models)
- ⬜ Test Claude 3.5 Sonnet
- ⬜ Test GPT-4o
- ⬜ Test GPT-4 Turbo
- ⬜ Test Gemini 1.5 Pro
- ⬜ Compare results
- ⬜ Select production model

### Phase 4 (Iterate)
- ⬜ Analyze failures (if any)
- ⬜ Implement fixes
- ⬜ Re-test
- ⬜ Document improvements

---

## 🚀 Quick Start

### Phase 1: Mock
```bash
echo "USE_MOCK_AI=true" > .env
npm run dev
# Test in browser: http://localhost:5173
```

### Phase 2: Real AI
```bash
cat > .env << 'EOF'
USE_MOCK_AI=false
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
EOF
cd packages/backend && npm run dev
```

### Phase 3: Switch Models
```bash
# Test GPT-4o
sed -i '' 's/OPENROUTER_MODEL=.*/OPENROUTER_MODEL=openai\/gpt-4o/' .env
# Restart backend
```

---

## 📊 Success Criteria

### Phase 1 Success
- ⬜ All templates load
- ⬜ All 20 examples render
- ⬜ No errors

### Phase 2 Success (v2.0 Prompts)
- ⬜ Syntax validity ≥ 95%
- ⬜ Genre accuracy ≥ 4.0/5
- ⬜ Tempo accuracy ≥ 4.0/5
- ⬜ Musical quality ≥ 4.0/5
- ⬜ Advanced features ≥ 80%
- ⬜ Refinement ≥ 4.5/5

### Phase 3 Success (Model Selection)
- ⬜ 3+ models tested
- ⬜ Clear winner identified
- ⬜ Recommendation documented

### Phase 4 Success (Iteration)
- ⬜ All failures analyzed
- ⬜ Fixes implemented
- ⬜ Improvement validated

---

## 📈 Expected vs. Actual Results

### Predictions (Phase 2 Expected)

Based on v2.0 enhancements:

| Metric | v1.0 Baseline | v2.0 Expected | Improvement |
|--------|---------------|---------------|-------------|
| Syntax Valid | 80% | 95% | +19% |
| Genre Accuracy | 3.0/5 | 4.2/5 | +40% |
| Tempo Accuracy | 2.5/5 | 4.5/5 | +80% |
| Quality | 3.2/5 | 4.3/5 | +34% |
| Refinement | 2.8/5 | 4.6/5 | +64% |

### Actual Results (To be filled after testing)

| Metric | Actual v2.0 | vs. Expected | vs. Baseline |
|--------|-------------|--------------|--------------|
| Syntax Valid | ⬜ | ⬜ | ⬜ |
| Genre Accuracy | ⬜ | ⬜ | ⬜ |
| Tempo Accuracy | ⬜ | ⬜ | ⬜ |
| Quality | ⬜ | ⬜ | ⬜ |
| Refinement | ⬜ | ⬜ | ⬜ |

---

## 🔗 Related Documents

- [TESTING_PLAN.md](TESTING_PLAN.md) - Technical testing (unit, integration, E2E)
- [MODEL_TESTING_GUIDE.md](MODEL_TESTING_GUIDE.md) - Detailed model comparison guide
- [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md) - Results tracking
- [CLAUDE_PHASE2_COMPLETE.md](CLAUDE_PHASE2_COMPLETE.md) - What was improved in v2.0

---

## 💾 Data Collection

Save results in:
- Spreadsheet: Google Sheets or local CSV
- Document: [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md)
- Audio: Optional recordings of best examples

**CSV Template**:
```csv
Test_ID,Phase,Prompt,Model,Genre_Score,Tempo_Score,Quality_Score,Preservation_Score,Accuracy_Score,Notes
A1,2,"simple drum beat",claude-sonnet,5,5,4,N/A,N/A,"Perfect"
B1,2,"house 125 BPM",claude-sonnet,4,5,4,N/A,N/A,"Good layering"
```

---

**Last Updated**: 2025-11-20
**Version**: 2.0
**Status**: Ready for Execution
**Estimated Time**: 6-8 hours total
**Estimated Cost**: $5-15 (depending on models tested)

---

**Ready to begin testing!** Start with Phase 1 (mock validation) to verify everything works, then proceed to Phase 2 (real AI quality testing).
