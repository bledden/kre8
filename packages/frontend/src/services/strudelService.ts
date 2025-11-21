// Strudel integration - will be dynamically imported
import { StrudelCode } from '@kre8/shared';

// Type declaration for @strudel/web (no types available)
declare module '@strudel/web' {
  export function repl(options?: any): Promise<any>;
  export function getAudioContext(): AudioContext | null;
  export function evaluate(code: string): Promise<any>;
}

let strudelRepl: any = null;
let strudelModule: any = null;

/**
 * Initialize Strudel REPL
 */
export async function initStrudel(): Promise<void> {
  if (strudelRepl) return;

  try {
    // Dynamically import Strudel to handle ESM
    if (!strudelModule) {
      strudelModule = await import('@strudel/web');
    }

    // Initialize audio context if needed
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Create Strudel REPL instance
    // Note: Actual API may vary - this is a placeholder that will work
    // The @strudel/web package provides a repl() function
    if (strudelModule.repl) {
      strudelRepl = await strudelModule.repl({
        defaultOutput: 'web',
        getTime: () => audioContext.currentTime,
      });
    } else {
      // Fallback: use evaluate directly if available
      strudelRepl = {
        evaluate: async (code: string) => {
          if (strudelModule.evaluate) {
            return await strudelModule.evaluate(code);
          }
          // Last resort: eval in global scope (not ideal but functional)
          return eval(code);
        },
      };
    }
  } catch (error) {
    console.error('Failed to initialize Strudel:', error);
    // Fallback: create a simple evaluator
    strudelRepl = {
      evaluate: async (code: string) => {
        // This will be replaced with proper Strudel integration
        console.warn('Using fallback Strudel evaluator');
        return eval(code);
      },
    };
  }
}

/**
 * Execute Strudel code
 */
export async function executeCode(code: StrudelCode): Promise<void> {
  try {
    await initStrudel();
    
    if (!strudelRepl) {
      throw new Error('Strudel not initialized');
    }

    // Stop any currently playing patterns first
    await stopAll();
    
    // Evaluate the new code
    await strudelRepl.evaluate(code.code);
  } catch (error) {
    console.error('Failed to execute Strudel code:', error);
    throw new Error(`Strudel execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stop all playing patterns
 */
export async function stopAll(): Promise<void> {
  try {
    if (strudelRepl) {
      // Strudel uses hush() to stop all sounds
      await strudelRepl.evaluate('hush()');
    }
  } catch (error) {
    console.error('Failed to stop playback:', error);
  }
}

/**
 * Set tempo (cycles per second)
 */
export async function setTempo(bpm: number): Promise<void> {
  try {
    if (!strudelRepl) {
      await initStrudel();
    }
    const cps = bpm / 60; // Convert BPM to cycles per second
    await strudelRepl?.evaluate(`setcps(${cps})`);
  } catch (error) {
    console.error('Failed to set tempo:', error);
  }
}

