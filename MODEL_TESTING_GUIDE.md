# Model Testing & Selection Guide

**Purpose**: Systematic evaluation of AI models for Strudel music code generation to identify the best-performing model(s) for the kre8 project.

---

## Quick Start

### How to Test a Different Model

1. Edit `.env` file:
   ```bash
   # Change this line:
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

   # To test GPT-4:
   OPENROUTER_MODEL=openai/gpt-4-turbo
   ```

2. Restart the backend:
   ```bash
   cd packages/backend
   npm run dev
   ```

3. Test with standardized prompts (see below)

4. Record results in [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md)

---

## Recommended Models to Test

### Tier 1: Premium Models (Best Quality Expected)

#### 1. **Anthropic Claude 3.5 Sonnet** (Current Default)
```bash
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

**Pros**:
- ✅ Excellent at following complex instructions
- ✅ Strong reasoning for musical coherence
- ✅ Good with structured output (code generation)
- ✅ Large context window (200k tokens)
- ✅ Recent training data (April 2024)

**Cons**:
- ❌ Higher cost ($3/M input, $15/M output via OpenRouter)
- ❌ May be slower than GPT-4o

**Expected Performance**: Best overall quality, especially for complex patterns and genre understanding.

---

#### 2. **OpenAI GPT-4 Turbo**
```bash
OPENROUTER_MODEL=openai/gpt-4-turbo
```

**Pros**:
- ✅ Proven code generation capabilities
- ✅ Good at following system instructions
- ✅ Large context window (128k tokens)
- ✅ Fast inference

**Cons**:
- ❌ Training cutoff (April 2023, may not know latest Strudel features)
- ❌ Moderate cost ($10/M input, $30/M output)

**Expected Performance**: Strong baseline, reliable code generation, may need more examples for Strudel syntax.

---

#### 3. **OpenAI GPT-4o** (Optimized)
```bash
OPENROUTER_MODEL=openai/gpt-4o
```

**Pros**:
- ✅ Fastest GPT-4 variant
- ✅ More recent training (Oct 2023)
- ✅ Good balance of speed and quality
- ✅ Lower cost than GPT-4 Turbo ($5/M input, $15/M output)

**Cons**:
- ❌ Smaller context window (128k vs 200k)

**Expected Performance**: Good balance of speed, cost, and quality. Likely best for production.

---

### Tier 2: Alternative Premium Models

#### 4. **Anthropic Claude 3 Opus**
```bash
OPENROUTER_MODEL=anthropic/claude-3-opus
```

**Pros**:
- ✅ Highest intelligence in Claude 3 family
- ✅ Excellent reasoning capabilities
- ✅ Very strong at complex tasks

**Cons**:
- ❌ Most expensive ($15/M input, $75/M output)
- ❌ Slower than Sonnet
- ❌ Overkill for this task?

**Expected Performance**: May be better than Sonnet for very complex patterns, but probably not worth the cost.

---

#### 5. **Google Gemini 1.5 Pro**
```bash
OPENROUTER_MODEL=google/gemini-pro-1.5
```

**Pros**:
- ✅ Massive context window (1M tokens)
- ✅ Good at pattern recognition
- ✅ Competitive pricing ($3.5/M input, $10.5/M output)
- ✅ Recent training

**Cons**:
- ❌ Less proven for code generation
- ❌ May need more prompt tuning

**Expected Performance**: Unknown for Strudel specifically, worth testing for long context needs.

---

### Tier 3: Budget/Open-Source Models

#### 6. **Meta Llama 3 70B Instruct**
```bash
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct
```

**Pros**:
- ✅ Open-source
- ✅ Very low cost ($0.59/M input, $0.79/M output)
- ✅ Fast inference
- ✅ Can self-host if needed

**Cons**:
- ❌ May need more prompt engineering
- ❌ Less capable than GPT-4/Claude for complex tasks
- ❌ Training cutoff (Dec 2023)

**Expected Performance**: Budget option, may work for simple patterns, probably struggles with complex genres.

---

#### 7. **Mistral Large**
```bash
OPENROUTER_MODEL=mistral/mistral-large
```

**Pros**:
- ✅ European alternative
- ✅ Good code generation
- ✅ Moderate cost ($4/M input, $12/M output)
- ✅ Fast

**Cons**:
- ❌ Less proven than OpenAI/Anthropic
- ❌ Smaller context window (32k)

**Expected Performance**: Mid-tier option, worth testing as GPT-4 alternative.

---

## Testing Methodology

### Standard Test Suite

Use these **exact prompts** for all models to ensure fair comparison:

#### **Test Set A: Basic Patterns** (Score: Correctness)

1. `"Create a simple drum beat"`
2. `"Make a slow piano melody"`
3. `"Play a bassline"`
4. `"Create a kick and snare pattern"`
5. `"Generate hi-hats"`

**Scoring**: Pass/Fail - Does code execute without errors?

---

#### **Test Set B: Genre-Specific** (Score: Genre Accuracy + Quality)

6. `"Create a house track at 125 BPM with four-on-the-floor kick"`
7. `"Make a hip-hop beat with 808s at 90 BPM"`
8. `"Generate a jazz chord progression with swing"`
9. `"Create a techno track with filtered bassline"`
10. `"Make an ambient soundscape with evolving pads"`

**Scoring**:
- Genre match (1-5): Does it sound like the requested genre?
- Tempo accuracy (1-5): Is BPM/CPS correct?
- Musical quality (1-5): Does it sound good?

---

#### **Test Set C: Advanced Features** (Score: Complexity + Creativity)

11. `"Create a polyrhythmic percussion pattern"`
12. `"Generate a glitchy IDM track with random elements"`
13. `"Make a dubstep wobble bass with sine modulation"`
14. `"Create a layered ambient texture with delay feedback loops"`
15. `"Generate a funk groove with syncopated bass and offbeat chords"`

**Scoring**:
- Uses advanced features (1-5): Effects, modulation, transformations?
- Creativity (1-5): Interesting, non-generic patterns?
- Code quality (1-5): Clean, readable, well-structured?

---

#### **Test Set D: Refinement** (Score: Preservation + Accuracy)

16. Generate `"simple drum beat"` → Refine: `"add hi-hats"`
17. Generate `"house track"` → Refine: `"make it faster"`
18. Generate `"piano melody"` → Refine: `"add reverb and delay"`
19. Generate `"complex layered pattern"` → Refine: `"simplify it"`
20. Generate `"drum pattern"` → Refine: `"remove snare, add rim shots"`

**Scoring**:
- Preservation (1-5): Keeps unchanged elements intact?
- Accuracy (1-5): Correctly applies requested change?
- Code quality (1-5): Maintains structure and readability?

---

### Evaluation Rubric

For each test, score 1-5 on applicable criteria:

| Score | Description |
|-------|-------------|
| **5** | Perfect - Exceeds expectations |
| **4** | Good - Meets expectations with minor issues |
| **3** | Acceptable - Works but has noticeable issues |
| **2** | Poor - Major issues, barely functional |
| **1** | Fail - Doesn't work or completely wrong |

---

### Results Template

For each model, fill out this template:

```markdown
## Model: [Name]

**Configuration**:
- Model ID: `model-name`
- Temperature: 0.7 (or other)
- Max tokens: 500 (or other)
- Test date: YYYY-MM-DD

### Test Set A: Basic Patterns (Pass/Fail)
1. ✅/❌ Simple drum beat - [Notes]
2. ✅/❌ Slow piano melody - [Notes]
3. ✅/❌ Bassline - [Notes]
4. ✅/❌ Kick and snare - [Notes]
5. ✅/❌ Hi-hats - [Notes]

**Pass Rate**: X/5 (XX%)

### Test Set B: Genre-Specific (Score 1-5)
| Test | Genre Match | Tempo Accuracy | Quality | Total | Notes |
|------|-------------|----------------|---------|-------|-------|
| House | 4 | 5 | 4 | 13/15 | Used correct BPM |
| Hip-hop | 5 | 4 | 5 | 14/15 | Great 808 usage |
| ... | ... | ... | ... | ... | ... |

**Average**: X.X/15

### Test Set C: Advanced Features (Score 1-5)
| Test | Advanced Features | Creativity | Code Quality | Total | Notes |
|------|-------------------|------------|--------------|-------|-------|
| Polyrhythms | 4 | 5 | 4 | 13/15 | Used .fast() well |
| ... | ... | ... | ... | ... | ... |

**Average**: X.X/15

### Test Set D: Refinement (Score 1-5)
| Test | Preservation | Accuracy | Code Quality | Total | Notes |
|------|--------------|----------|--------------|-------|-------|
| Add hi-hats | 5 | 5 | 4 | 14/15 | Perfect layering |
| ... | ... | ... | ... | ... | ... |

**Average**: X.X/15

### Overall Metrics
- **Total Score**: XX/100 (weighted average)
- **Pass Rate**: XX%
- **Avg Generation Time**: X.Xs
- **Avg Token Usage**: XXX tokens
- **Estimated Cost/Request**: $X.XX

### Strengths
- What this model does well
- Specific examples

### Weaknesses
- What this model struggles with
- Specific examples

### Recommendation
- **Production Ready**: Yes/No
- **Best Use Case**: [When to use this model]
- **Fallback Candidate**: Yes/No
```

---

## Testing Best Practices

### 1. **Controlled Environment**
- Test all models with identical prompts
- Use same temperature (0.7 recommended)
- Same max_tokens (500-1000)
- Test at similar times (avoid API rate limit variations)

### 2. **Multiple Runs**
- Run each test 2-3 times for consistency
- Some models have randomness even at low temperature
- Average the scores

### 3. **Blind Testing** (Optional)
- Don't tell human evaluators which model generated which code
- Reduces bias in quality scoring

### 4. **Real-World Usage**
- After systematic testing, use the top 2-3 models in production for a week
- Track user satisfaction (thumbs up/down)
- Monitor error rates

---

## Configuration Tuning

### Temperature Settings

Test each model with different temperatures:

| Temperature | Use Case | Expected Behavior |
|-------------|----------|-------------------|
| **0.0** | Deterministic | Same output every time, may be too repetitive |
| **0.3** | Conservative | Very consistent, less creative |
| **0.5** | Balanced | Good consistency with some variation |
| **0.7** | Creative (Recommended) | Good balance of quality and creativity |
| **0.9** | Very Creative | High variation, may produce errors |
| **1.0** | Maximum Creativity | Unpredictable, high error rate |

**Recommendation**: Start with 0.7, adjust based on results.

---

### Max Tokens Settings

| Max Tokens | Use Case |
|------------|----------|
| **250** | Simple patterns only |
| **500** | Most patterns (Recommended) |
| **1000** | Complex layered compositions |
| **2000** | Very complex or long pieces |

**Recommendation**: 500 tokens covers 95% of use cases.

---

## Model Selection Decision Tree

```
Is cost a primary concern?
├─ Yes → Test Llama 3 70B or Mistral Large
└─ No  → Continue below

Is speed critical (real-time generation)?
├─ Yes → Test GPT-4o or Claude Sonnet
└─ No  → Continue below

Do you need complex musical reasoning?
├─ Yes → Test Claude 3.5 Sonnet or GPT-4 Turbo
└─ No  → Test GPT-4o (best balance)

Need very long context (conversation history)?
└─ Yes → Gemini 1.5 Pro (1M context)
```

---

## Expected Results (Predictions)

Based on model capabilities, here are predictions (to be validated):

| Model | Basic Patterns | Genre Accuracy | Advanced Features | Refinement | Overall |
|-------|----------------|----------------|-------------------|------------|---------|
| **Claude 3.5 Sonnet** | 95% | 4.5/5 | 4.8/5 | 4.7/5 | **A+** |
| **GPT-4 Turbo** | 90% | 4.2/5 | 4.3/5 | 4.5/5 | **A** |
| **GPT-4o** | 92% | 4.3/5 | 4.4/5 | 4.4/5 | **A** |
| **Gemini 1.5 Pro** | 85% | 3.8/5 | 3.9/5 | 4.0/5 | **B+** |
| **Claude 3 Opus** | 98% | 4.7/5 | 4.9/5 | 4.8/5 | **A+** (but expensive) |
| **Llama 3 70B** | 70% | 3.2/5 | 2.8/5 | 3.5/5 | **C+** |
| **Mistral Large** | 80% | 3.5/5 | 3.6/5 | 3.8/5 | **B** |

**Prediction Summary**:
- **Best Quality**: Claude 3.5 Sonnet or Opus
- **Best Value**: GPT-4o
- **Best Speed**: GPT-4o
- **Best Budget**: Mistral Large
- **Worst (but cheapest)**: Llama 3 70B

---

## Cost Analysis

### Estimated Cost Per Request

Assuming average prompt size: ~1500 tokens input, ~400 tokens output

| Model | Input Cost | Output Cost | Total/Request | Total/1000 Requests |
|-------|-----------|-------------|---------------|---------------------|
| **Claude 3.5 Sonnet** | $0.0045 | $0.006 | **$0.0105** | **$10.50** |
| **GPT-4 Turbo** | $0.015 | $0.012 | **$0.027** | **$27.00** |
| **GPT-4o** | $0.0075 | $0.006 | **$0.0135** | **$13.50** |
| **Gemini 1.5 Pro** | $0.00525 | $0.0042 | **$0.00945** | **$9.45** |
| **Claude 3 Opus** | $0.0225 | $0.03 | **$0.0525** | **$52.50** |
| **Llama 3 70B** | $0.00089 | $0.00032 | **$0.00121** | **$1.21** |
| **Mistral Large** | $0.006 | $0.0048 | **$0.0108** | **$10.80** |

**Cheapest**: Llama 3 70B ($0.00121/request)
**Best Value**: Gemini 1.5 Pro ($0.00945/request, if quality is good)
**Recommended**: Claude 3.5 Sonnet ($0.0105/request) or GPT-4o ($0.0135/request)
**Most Expensive**: Claude 3 Opus ($0.0525/request - 5x more than Sonnet)

---

## Fallback Strategy

Implement a **tiered fallback system**:

```javascript
const modelTiers = [
  'anthropic/claude-3.5-sonnet',  // Primary (best quality)
  'openai/gpt-4o',                 // Fallback 1 (fast, reliable)
  'openai/gpt-4-turbo',            // Fallback 2 (proven)
  'meta-llama/llama-3-70b-instruct' // Fallback 3 (budget)
];

async function generateWithFallback(prompt) {
  for (const model of modelTiers) {
    try {
      return await generateMusic(prompt, { model });
    } catch (error) {
      console.warn(`Model ${model} failed, trying next...`);
      continue;
    }
  }
  throw new Error('All models failed');
}
```

---

## Next Steps

1. ✅ Set up testing environment (`.env` configuration)
2. ⏳ Run Test Set A (Basic Patterns) on Claude 3.5 Sonnet (baseline)
3. ⏳ Run Test Set B-D on Claude 3.5 Sonnet
4. ⏳ Test GPT-4o (expected best value)
5. ⏳ Test GPT-4 Turbo (proven alternative)
6. ⏳ Test Gemini 1.5 Pro (low cost option)
7. ⏳ Compare results and select production model
8. ⏳ Document findings in PROMPT_OPTIMIZATION_LOG.md
9. ⏳ Implement fallback strategy if needed

---

## Tools & Automation (Future)

### Automated Testing Script (Concept)

```bash
#!/bin/bash
# test-models.sh

MODELS=(
  "anthropic/claude-3.5-sonnet"
  "openai/gpt-4o"
  "openai/gpt-4-turbo"
)

for model in "${MODELS[@]}"; do
  echo "Testing $model..."
  export OPENROUTER_MODEL="$model"
  npm run test:prompts -- --output "results-$model.json"
done

npm run compare:results
```

This could be built in Phase 3 for continuous testing.

---

## References

- [OpenRouter Model Pricing](https://openrouter.ai/models)
- [Anthropic Claude Models](https://www.anthropic.com/claude)
- [OpenAI GPT-4 Documentation](https://platform.openai.com/docs/models/gpt-4)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Meta Llama 3](https://ai.meta.com/llama/)

---

**Last Updated**: 2025-11-20
**Status**: Ready for systematic testing
**Owner**: Claude (Prompt Engineering Lead)
