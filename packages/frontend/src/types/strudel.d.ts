// Type declarations for @strudel/web
// Based on the actual exports from @strudel/web/web.mjs

declare module '@strudel/soundfonts' {
  export function registerSoundfonts(): void;
  export function loadSoundfont(url: string): Promise<any>;
  export function setSoundfontUrl(url: string): void;
  export function getFontBufferSource(name: string, value: any, ac: AudioContext): Promise<AudioBufferSourceNode>;
  export const soundfontList: Record<string, string[]>;
  export function startPresetNote(preset: any, pitch: number, time: number, duration: number, options?: any): void;
}

declare module '@strudel/web' {
  export interface StrudelInitOptions {
    prebake?: () => Promise<void> | void;
    miniAllStrings?: boolean;
    [key: string]: any;
  }

  export interface StrudelRepl {
    evaluate: (code: string, autoplay?: boolean) => Promise<any>;
    start: () => void;
    stop: () => void;
    setPattern: (pattern: any, autoplay?: boolean) => void;
    setCps: (cps: number) => void;
    scheduler?: {
      started: boolean;
      now: () => number;
    };
  }

  // Main initialization function - returns a Promise that resolves to the repl
  export function initStrudel(options?: StrudelInitOptions): Promise<StrudelRepl>;

  // Re-exported from @strudel/webaudio - sets up click handler to resume audio context
  export function initAudioOnFirstClick(): void;

  // Re-exported from superdough via @strudel/webaudio - directly resumes audio context
  export function initAudio(options?: any): Promise<void>;

  // Get the shared AudioContext instance
  export function getAudioContext(): AudioContext;

  // Load samples from a URL (e.g., 'github:tidalcycles/dirt-samples')
  export function samples(url: string, options?: any): Promise<void>;

  // Stop all playback
  export function hush(): void;

  // Evaluate and play code using the transpiler
  export function evaluate(code: string, autoplay?: boolean): Promise<any>;

  // Default prebake function that loads core modules
  export function defaultPrebake(): Promise<void>;
}

