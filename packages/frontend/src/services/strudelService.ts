// Strudel integration - uses @strudel/web package
import { StrudelCode } from '@kre8/shared';

let strudelRepl: any = null;
let strudelInitPromise: Promise<any> | null = null;
let audioInitialized = false;
let patternBaseTempo: number = 120; // Base tempo from the pattern's .cpm() value

/**
 * Initialize audio FIRST before Strudel REPL
 * This must be called from a user gesture (click/keypress) to work in browsers
 */
async function initAudioFirst(): Promise<void> {
  if (audioInitialized) return;

  try {
    const strudelModule = await import('@strudel/web');

    // Get or create AudioContext
    const ctx = strudelModule.getAudioContext();
    console.log('[Strudel] Initial AudioContext state:', ctx.state);

    // Resume if suspended (required for Safari/iOS and autoplay policy)
    if (ctx.state === 'suspended') {
      console.log('[Strudel] Resuming suspended AudioContext...');
      await ctx.resume();
    }

    // IMPORTANT: Set up analyser BEFORE Strudel initializes audio routing
    // This ensures we intercept all audio connections to destination
    await createAnalyserNode();

    // Initialize audio with worklets - this loads AudioWorklets which are REQUIRED for sound
    await strudelModule.initAudio();

    console.log('[Strudel] AudioContext state after initAudio:', ctx.state);
    audioInitialized = true;
    console.log('[Strudel] Audio system ready with visualization support');
  } catch (error) {
    console.error('[Strudel] Failed to initialize audio:', error);
    throw error;
  }
}

/**
 * Initialize Strudel REPL
 * Uses the official initStrudel() function from @strudel/web
 */
export async function initStrudel(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (strudelInitPromise) {
    await strudelInitPromise;
    return;
  }

  // Already initialized
  if (strudelRepl) return;

  try {
    // CRITICAL: Initialize audio BEFORE creating the REPL
    // This ensures AudioWorklets are loaded and AudioContext is running
    await initAudioFirst();

    // Dynamically import Strudel
    const strudelModule = await import('@strudel/web');

    // Use the official initStrudel function with prebake to load samples
    // Load multiple sample libraries for broader genre coverage:
    // 1. tidalcycles/dirt-samples - standard drum/percussion samples
    // 2. General MIDI sounds are built-in (gm_piano, gm_violin, etc.)
    // 3. Additional sample packs for orchestral/acoustic sounds
    strudelInitPromise = strudelModule.initStrudel({
      prebake: async () => {
        console.log('[Strudel] Loading sample libraries...');

        // Core drum samples (bd, sd, hh, cp, etc.)
        await strudelModule.samples('github:tidalcycles/dirt-samples');
        console.log('[Strudel] dirt-samples loaded');

        // Additional melodic/instrument samples
        try {
          await strudelModule.samples('github:TristanCacqueray/mirus');
          console.log('[Strudel] mirus samples loaded');
        } catch (e) {
          console.warn('[Strudel] mirus samples failed to load (non-critical):', e);
        }

        console.log('[Strudel] All sample libraries loaded successfully');

        // Register General MIDI soundfonts (gm_epiano1, gm_acoustic_grand_piano, etc.)
        try {
          const soundfontsModule = await import('@strudel/soundfonts');
          soundfontsModule.registerSoundfonts();
          console.log('[Strudel] GM soundfonts registered');
        } catch (e) {
          console.warn('[Strudel] GM soundfonts failed to register (non-critical):', e);
        }

        console.log('[Strudel] Available: dirt-samples (drums), gm_* (General MIDI), mirus (melodic)');
      },
    });
    strudelRepl = await strudelInitPromise;

    console.log('[Strudel] REPL initialized with samples and soundfonts');
  } catch (error) {
    console.error('[Strudel] Failed to initialize:', error);
    strudelInitPromise = null;
    throw error;
  }
}

/**
 * Execute Strudel code
 */
export async function executeCode(code: StrudelCode): Promise<void> {
  try {
    // Initialize Strudel (which now also initializes audio first)
    await initStrudel();

    if (!strudelRepl) {
      throw new Error('Strudel not initialized');
    }

    const strudelModule = await import('@strudel/web');
    const ctx = strudelModule.getAudioContext();

    // Double-check audio is ready before evaluating
    if (ctx.state !== 'running') {
      console.log('[Strudel] AudioContext not running, resuming...');
      await ctx.resume();
    }

    // Log the code being evaluated
    console.log('[Strudel] Evaluating code:', code.code);
    console.log('[Strudel] AudioContext state before evaluate:', ctx.state, 'time:', ctx.currentTime.toFixed(3));

    // First, stop any existing playback to reset the scheduler state
    if (strudelRepl.scheduler?.started) {
      console.log('[Strudel] Stopping existing playback before new evaluation...');
      strudelRepl.stop();
    }

    // Small delay to let the scheduler fully stop
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Evaluate the code - this will parse it and set up the pattern
    // The second parameter (true) auto-starts playback
    const pattern = await strudelRepl.evaluate(code.code, true);

    console.log('[Strudel] Pattern evaluated:', pattern);
    console.log('[Strudel] Pattern steps:', pattern?.__steps);

    // Log scheduler state after evaluation
    console.log('[Strudel] After evaluate:', {
      schedulerStarted: strudelRepl.scheduler?.started,
      schedulerCps: strudelRepl.scheduler?.cps,
      schedulerPattern: !!strudelRepl.scheduler?.pattern,
      audioContextTime: ctx.currentTime.toFixed(3),
    });

    // Ensure scheduler is running
    if (!strudelRepl.scheduler?.started) {
      console.log('[Strudel] Scheduler not started, starting manually...');
      await strudelRepl.start();
    }

    // Debug: set up a timer to log scheduler activity
    let triggerCount = 0;
    const checkInterval = setInterval(() => {
      console.log('[Strudel] Scheduler check:', {
        time: ctx.currentTime.toFixed(3),
        started: strudelRepl.scheduler?.started,
        triggers: triggerCount,
      });
    }, 1000);

    // Clean up after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);

    console.log('[Strudel] Playback started successfully');
  } catch (error) {
    console.error('[Strudel] Failed to execute code:', error);
    throw new Error(`Strudel execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stop all playing patterns
 */
export async function stopAll(): Promise<void> {
  try {
    if (strudelRepl) {
      // Use the REPL's stop method to halt playback
      strudelRepl.stop();
      console.log('[Strudel] Playback stopped');
    }
  } catch (error) {
    console.error('[Strudel] Failed to stop playback:', error);
  }
}

/**
 * Set the base tempo extracted from the pattern's .cpm() value
 * This is used to calculate relative tempo adjustments
 */
export function setPatternBaseTempo(tempo: number): void {
  patternBaseTempo = tempo;
  console.log('[Strudel] Pattern base tempo set to', tempo, 'CPM');
}

/**
 * Get the current pattern's base tempo
 */
export function getPatternBaseTempo(): number {
  return patternBaseTempo;
}

/**
 * Set tempo (cycles per minute / BPM)
 * This adjusts the global scheduler CPS relative to the pattern's base tempo
 */
export async function setTempo(targetCpm: number): Promise<void> {
  try {
    if (!strudelRepl) {
      await initStrudel();
    }
    // Calculate the multiplier needed to achieve the target tempo
    // If pattern has .cpm(82) and we want 120 CPM, multiplier = 120/82 ≈ 1.46
    // Global CPS = multiplier (since default CPS = 1.0)
    const multiplier = targetCpm / patternBaseTempo;
    strudelRepl?.setCps(multiplier);
    console.log('[Strudel] Tempo set to', targetCpm, 'CPM (multiplier:', multiplier.toFixed(3), 'base:', patternBaseTempo, ')');
  } catch (error) {
    console.error('[Strudel] Failed to set tempo:', error);
  }
}

/**
 * Get the Strudel AudioContext for audio capture/visualization
 * Returns null if Strudel hasn't been initialized yet
 */
export async function getStrudelAudioContext(): Promise<AudioContext | null> {
  try {
    const strudelModule = await import('@strudel/web');
    return strudelModule.getAudioContext();
  } catch (error) {
    console.error('[Strudel] Failed to get AudioContext:', error);
    return null;
  }
}

// Global analyser node that taps into Strudel's audio output
let globalAnalyser: AnalyserNode | null = null;
let analyserConnected = false;
let destinationOverridden = false;

/**
 * Create and connect an AnalyserNode to Strudel's audio output
 * This intercepts all audio going to the AudioContext destination
 */
export async function createAnalyserNode(): Promise<AnalyserNode | null> {
  // Return existing analyser if already set up
  if (globalAnalyser && analyserConnected) {
    return globalAnalyser;
  }

  const ctx = await getStrudelAudioContext();
  if (!ctx) return null;

  try {
    // Create the analyser node with settings optimized for visualization
    globalAnalyser = ctx.createAnalyser();
    globalAnalyser.fftSize = 256;
    globalAnalyser.smoothingTimeConstant = 0.75;
    globalAnalyser.minDecibels = -90;
    globalAnalyser.maxDecibels = -10;

    // Use the destination interception pattern
    // We need to override the connect method on destination to tap into audio
    if (!destinationOverridden) {
      overrideDestinationConnect(ctx, globalAnalyser);
      destinationOverridden = true;
    }

    analyserConnected = true;
    console.log('[Strudel] AnalyserNode created and ready for visualization');

    return globalAnalyser;
  } catch (error) {
    console.error('[Strudel] Failed to create analyser node:', error);
    return null;
  }
}

/**
 * Override the AudioContext to intercept all connections to destination
 * This is a workaround to tap into audio without modifying Strudel's routing
 */
function overrideDestinationConnect(ctx: AudioContext, analyser: AnalyserNode): void {
  // Create a gain node that acts as our master output
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(ctx.destination);
  masterGain.connect(analyser);

  // Store original connect method
  const originalConnect = AudioNode.prototype.connect as (
    destinationNode: AudioNode,
    output?: number,
    input?: number
  ) => AudioNode;

  // Patch the AudioNode prototype to intercept connections to destination
  (AudioNode.prototype as any).connect = function(
    destination: AudioNode | AudioParam,
    outputIndex?: number,
    inputIndex?: number
  ): AudioNode | void {
    // Check if connecting to the context's destination
    if (destination === ctx.destination) {
      // Route through our master gain instead (which feeds the analyser)
      console.log('[Strudel] Intercepted destination connection, routing through analyser');
      return originalConnect.call(this, masterGain, outputIndex, inputIndex);
    }
    // Otherwise, use original connect
    if (destination instanceof AudioNode) {
      return originalConnect.call(this, destination, outputIndex, inputIndex);
    }
    // For AudioParam connections (used for modulation)
    return (this as AudioNode).connect(destination as AudioParam, outputIndex);
  };

  console.log('[Strudel] Destination interception enabled');
}

/**
 * Get the global analyser node (creates one if it doesn't exist)
 */
export async function getAnalyserNode(): Promise<AnalyserNode | null> {
  if (globalAnalyser) return globalAnalyser;
  return createAnalyserNode();
}

// Store for custom vocal samples
interface VocalSample {
  id: string;
  dataUrl: string;
  name: string;
}

let loadedVocalSamples: Map<string, VocalSample> = new Map();

/**
 * Load a custom vocal sample into Strudel
 * The sample can then be used with s("vocal") or s("vocal:0"), s("vocal:1"), etc.
 */
export async function loadVocalSample(sample: VocalSample): Promise<void> {
  try {
    await initStrudel();
    const strudelModule = await import('@strudel/web');

    // Store the sample
    loadedVocalSamples.set(sample.id, sample);

    // Build the samples object with all vocals
    const vocalUrls: string[] = Array.from(loadedVocalSamples.values()).map(s => s.dataUrl);

    // Register samples with Strudel using the samples function
    // The samples function can take an object mapping sample names to URLs
    const samplesFunc = (strudelModule as any).samples;
    if (typeof samplesFunc === 'function') {
      await samplesFunc({ vocal: vocalUrls });
    }

    console.log(`[Strudel] Loaded vocal sample: ${sample.name} (${vocalUrls.length} total vocals)`);
  } catch (error) {
    console.error('[Strudel] Failed to load vocal sample:', error);
    throw error;
  }
}

/**
 * Load multiple vocal samples at once
 */
export async function loadVocalSamples(samples: VocalSample[]): Promise<void> {
  try {
    await initStrudel();
    const strudelModule = await import('@strudel/web');

    // Store all samples
    samples.forEach(sample => {
      loadedVocalSamples.set(sample.id, sample);
    });

    // Build the samples object with all vocals
    const vocalUrls: string[] = Array.from(loadedVocalSamples.values()).map(s => s.dataUrl);

    if (vocalUrls.length === 0) {
      console.log('[Strudel] No vocal samples to load');
      return;
    }

    // Register samples with Strudel using the samples function
    const samplesFunc = (strudelModule as any).samples;
    if (typeof samplesFunc === 'function') {
      await samplesFunc({ vocal: vocalUrls });
    }

    console.log(`[Strudel] Loaded ${vocalUrls.length} vocal samples`);
  } catch (error) {
    console.error('[Strudel] Failed to load vocal samples:', error);
    throw error;
  }
}

/**
 * Clear a specific vocal sample
 */
export function clearVocalSample(sampleId: string): void {
  loadedVocalSamples.delete(sampleId);
  console.log(`[Strudel] Cleared vocal sample: ${sampleId}`);
}

/**
 * Clear all vocal samples
 */
export function clearAllVocalSamples(): void {
  loadedVocalSamples.clear();
  console.log('[Strudel] Cleared all vocal samples');
}

/**
 * Get the number of loaded vocal samples
 */
export function getVocalSampleCount(): number {
  return loadedVocalSamples.size;
}

/**
 * Generate Strudel code snippet for using vocals
 * Returns example code that can be inserted into patterns
 */
export function getVocalCodeSnippet(): string {
  const count = loadedVocalSamples.size;
  if (count === 0) {
    return '// No vocals loaded yet';
  }

  if (count === 1) {
    return 's("vocal").loopAt(4)';
  }

  // Multiple samples - show how to sequence them
  const indices = Array.from({ length: count }, (_, i) => i).join(' ');
  return `s("vocal:${indices}").loopAt(2)`;
}

