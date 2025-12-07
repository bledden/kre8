/**
 * Local Sample Definitions
 *
 * These are bundled at build time - no network fetches needed for sample maps.
 * Audio files are still lazy-loaded from their original sources when played.
 *
 * Total: 1,067 sample banks + 128 GM soundfonts = 1,195 sound sources
 *
 * Libraries:
 * - dirt-samples: 218 banks (drums, bass, synths, fx)
 * - drum-machines: 683 banks (70+ classic machines: 808, 909, LinnDrum, etc.)
 * - vcsl: 128 banks (orchestral/acoustic instruments)
 * - clean-breaks: 32 banks (Amen, Funky Drummer, Apache, etc.)
 * - mirus: 4 banks (IR reverbs, haunted samples)
 * - flbass: 1 bank (fretless bass guitar)
 * - pad: 1 bank (ambient textures)
 * - GM soundfonts: 128 instruments (loaded via @strudel/soundfonts)
 */

import dirtSamples from './dirt-samples.json';
import drumMachines from './drum-machines.json';
import cleanBreaks from './clean-breaks.json';
import mirus from './mirus.json';
import flbass from './flbass.json';
import vcsl from './vcsl.json';
import pad from './pad.json';

export interface SampleDefinition {
  _base: string;
  [key: string]: string | string[] | Record<string, string>;
}

export const sampleLibraries = {
  /** TidalCycles/Dirt-Samples - 400+ banks of drums, instruments, fx */
  dirtSamples: dirtSamples as SampleDefinition,

  /** Tidal Drum Machines - 70+ classic drum machines (808, 909, LinnDrum, etc.) */
  drumMachines: drumMachines as SampleDefinition,

  /** Classic breakbeats (Amen, Funky Drummer, Apache, etc.) */
  cleanBreaks: cleanBreaks as SampleDefinition,

  /** Mirus - IR reverbs and haunted samples */
  mirus: mirus as SampleDefinition,

  /** FL Bass - Fretless bass guitar samples */
  flbass: flbass as SampleDefinition,

  /** VCSL - Vancouver Community Sample Library (128 orchestral/acoustic instruments) */
  vcsl: vcsl as SampleDefinition,

  /** Pad - Ambient pad and texture samples */
  pad: pad as SampleDefinition,
} as const;

export type SampleLibraryName = keyof typeof sampleLibraries;

export { dirtSamples, drumMachines, cleanBreaks, mirus, flbass, vcsl, pad };
