# Kre8 "Beat Maker for X" Implementation Plan

## Strategic Positioning

**Current State**: Voice-to-Strudel music generator with basic playback
**Target State**: "Beat Maker for X" - Create shareable audio content for the X platform

### Key Insight
X currently has:
- Spaces (live audio rooms)
- Audio tweets (voice posts)
- 30-second clip sharing

X does NOT have:
- Music creation tools
- Beat makers
- Audio synthesis

Kre8 fills the gap: **audio content creation for X**

---

## Implementation Steps

### Phase 1: Audio Export (Core "Usefulness")

#### 1.1 Fix Audio Recording to Capture Strudel Output
**File**: `packages/frontend/src/services/audioRecorder.ts`

**Current Issue**: Recording captures microphone, not Strudel's audio output

**Solution**: Use Web Audio API to capture AudioContext destination
```typescript
// Record from Strudel's AudioContext, not microphone
const audioContext = getAudioContext(); // from @strudel/web
const destination = audioContext.createMediaStreamDestination();
// Connect Strudel's output to this destination
```

#### 1.2 Add MP3/WAV Export Options
**File**: `packages/frontend/src/services/audioRecorder.ts`

- WebM is not universally playable
- Add conversion to MP3 using `lamejs` or WAV using native APIs
- MP3 is better for X sharing (smaller file size)

#### 1.3 Add "Record 30 seconds" Preset
**File**: `packages/frontend/src/components/PlaybackControls.tsx`

- Add quick-record button: "Record 30s for X"
- Auto-stop after 30 seconds (matches X Spaces clip length)
- Show countdown timer during recording

---

### Phase 2: Visual Enhancements ("Beauty")

#### 2.1 Real-time Audio Visualizer
**New File**: `packages/frontend/src/components/AudioVisualizer.tsx`

Replace the static "AI Thought Process" graph with live audio visualization:
- Waveform display (AnalyserNode.getByteTimeDomainData)
- Frequency bars (AnalyserNode.getByteFrequencyData)
- Animate in sync with Strudel playback

#### 2.2 Pattern Timeline View
**New File**: `packages/frontend/src/components/PatternTimeline.tsx`

Show when instruments/sounds will play:
- Visual grid showing pattern over time
- Highlight current position during playback
- Makes the pattern understandable at a glance

#### 2.3 Genre-Specific Visual Themes
**File**: `packages/frontend/src/stores/appStore.ts`

Add theme state based on detected genre:
- Lo-fi: Warm purple/orange tones, softer animations
- Techno: Sharp blues, fast-paced animations
- Ambient: Soft greens, slow breathing animations

---

### Phase 3: Share to X Integration

#### 3.1 Attach Audio to Tweet
**File**: `packages/frontend/src/components/ShareToX.tsx`

Current: Text-only tweet
Target: Tweet with audio attachment

X API v2 supports media uploads. Flow:
1. Export audio as MP3
2. Upload to X media endpoint
3. Attach media_id to tweet

#### 3.2 One-Click "Create & Share"
**File**: `packages/frontend/src/components/PlaybackControls.tsx`

Add unified flow:
1. Click "Share to X"
2. Auto-record 30 seconds
3. Open share modal with audio preview
4. Post tweet with audio attached

---

### Phase 4: Preset Demo Beats

#### 4.1 Quick-Start Gallery
**New File**: `packages/frontend/src/components/PresetGallery.tsx`

Show 6-8 preset beats users can instantly play:
- "Chill Lo-fi"
- "Hard Techno"
- "Trap Beat"
- "Ambient Drone"
- "House Groove"
- "Drum & Bass"

Each preset is a pre-validated Strudel pattern from `few_shot_examples.json`.

#### 4.2 "Start from Preset" Flow
Instead of blank slate, let users:
1. Pick a preset
2. Play it
3. Modify with voice: "make it faster" / "add more bass"

---

### Phase 5: Improved UX

#### 5.1 Clearer Messaging
**File**: `packages/frontend/src/components/InputPanel.tsx`

Change placeholder from:
> "Describe the music you want to create..."

To:
> "Create a beat: 'lo-fi hip-hop', 'fast techno', 'ambient drone'..."

Set expectations for electronic music output.

#### 5.2 Genre Suggestions
**File**: `packages/frontend/src/components/InputPanel.tsx`

Add clickable genre tags below input:
```
Try: [Lo-fi] [Techno] [Trap] [House] [Ambient] [D&B]
```

Clicking a tag fills in a starter prompt.

#### 5.3 Voice Feedback
**File**: `packages/frontend/src/components/PlaybackControls.tsx`

When generation completes, use Grok's TTS to say:
> "Here's your lo-fi beat at 85 BPM"

Uses the existing `XAI_TTS_VOICE` (Eve) configuration.

---

## File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `services/audioRecorder.ts` | Modify | Capture Strudel output, add MP3 export |
| `components/PlaybackControls.tsx` | Modify | Add 30s record, visual timer |
| `components/AudioVisualizer.tsx` | New | Real-time waveform/frequency display |
| `components/PatternTimeline.tsx` | New | Visual pattern grid |
| `components/PresetGallery.tsx` | New | Quick-start beat selection |
| `components/ShareToX.tsx` | Modify | Support audio attachment |
| `components/InputPanel.tsx` | Modify | Better messaging, genre tags |
| `components/GenerativeGraph.tsx` | Replace | Swap for AudioVisualizer |
| `stores/appStore.ts` | Modify | Add theme state, preset state |
| `index.css` | Modify | Genre-specific theme colors |

---

## Priority Order

1. **Audio Export** (Phase 1) - Core usefulness, enables sharing
2. **Preset Gallery** (Phase 4) - Immediate value, reduces blank-slate problem
3. **Visual Enhancements** (Phase 2) - Beauty factor
4. **Share Integration** (Phase 3) - X platform integration
5. **UX Polish** (Phase 5) - Refinement

---

## Technical Notes

### Audio Recording from Strudel
```typescript
import { getAudioContext } from '@strudel/web';

const ctx = getAudioContext();
const dest = ctx.createMediaStreamDestination();
// Need to modify Strudel's output chain to include this destination
```

### MP3 Encoding
Use `lamejs` for client-side MP3 encoding:
```bash
npm install lamejs
```

### X Media Upload
X API v2 media upload flow:
1. POST to https://upload.twitter.com/1.1/media/upload.json (INIT)
2. POST chunks (APPEND)
3. POST (FINALIZE)
4. Include media_id in tweet creation

---

## Success Metrics

- **Usefulness**: Users can export and share beats within 2 clicks
- **Beauty**: Visualizer is engaging to watch during playback
- **Stickiness**: Presets get users making sounds in <5 seconds
