// Type declarations for @strudel/web
declare module '@strudel/web' {
  export function repl(options?: any): Promise<any>;
  export function getAudioContext(): AudioContext | null;
  export function evaluate(code: string): Promise<any>;
}

