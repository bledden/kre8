import { describe, it, expect } from 'vitest';
import {
  legacyToBrandedCode,
  brandedToLegacyCode,
  legacyToEnhancedConfig,
  enhancedToLegacyConfig,
  wrapResult,
  unwrapResult,
} from '../adapters';
import { StrudelCode as LegacyStrudelCode } from '../types';
import { BrandedStrudelCode, Ok, Err, ValidationError } from '../ai-contracts';

describe('Type Adapters', () => {
  describe('legacyToBrandedCode', () => {
    it('should convert legacy StrudelCode object to branded string', () => {
      const legacy: LegacyStrudelCode = {
        code: 's("bd sd")',
        explanation: 'A simple beat',
      };
      
      const branded = legacyToBrandedCode(legacy);
      expect(branded).toBe('s("bd sd")');
      expect(typeof branded).toBe('string');
    });
  });

  describe('brandedToLegacyCode', () => {
    it('should convert branded string to legacy StrudelCode object', () => {
      const branded = 's("bd sd")' as BrandedStrudelCode;
      const legacy = brandedToLegacyCode(branded, 'A simple beat');
      
      expect(legacy.code).toBe('s("bd sd")');
      expect(legacy.explanation).toBe('A simple beat');
    });
    
    it('should include metadata when provided', () => {
      const branded = 's("bd sd")' as BrandedStrudelCode;
      const config = { tempo: 120, instruments: ['bd', 'sd'] };
      const legacy = brandedToLegacyCode(branded, 'A simple beat', config);
      
      expect(legacy.metadata?.tempo).toBe(120);
      expect(legacy.metadata?.instruments).toEqual(['bd', 'sd']);
    });
  });

  describe('legacyToEnhancedConfig', () => {
    it('should convert legacy MusicConfig to enhanced version', () => {
      const legacy = {
        tempo: 120,
        scale: 'major',
        key: 'C',
        samples: { bd: 'url1', sd: 'url2' },
      };
      
      const enhanced = legacyToEnhancedConfig(legacy);
      expect(enhanced.tempo).toBe(120);
      expect(enhanced.scale).toBe('major');
      expect(enhanced.key).toBe('C');
      expect(enhanced.samples).toBeInstanceOf(Map);
    });
    
    it('should handle undefined config', () => {
      const enhanced = legacyToEnhancedConfig(undefined);
      expect(enhanced).toEqual({});
    });
  });

  describe('enhancedToLegacyConfig', () => {
    it('should convert enhanced MusicConfig to legacy version', () => {
      const enhanced = {
        tempo: 120,
        scale: 'major',
        key: 'C',
        samples: new Map([['bd', 'url1'], ['sd', 'url2']]) as ReadonlyMap<string, string>,
      };
      
      const legacy = enhancedToLegacyConfig(enhanced);
      expect(legacy?.tempo).toBe(120);
      expect(legacy?.samples).toEqual({ bd: 'url1', sd: 'url2' });
    });
  });

  describe('wrapResult', () => {
    it('should wrap successful promise in Result', async () => {
      const promise = Promise.resolve('success');
      const result = await wrapResult(promise);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }
    });
    
    it('should wrap failed promise in Result', async () => {
      const promise = Promise.reject(new Error('test error'));
      const result = await wrapResult(promise);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('validation_error');
      }
    });
  });

  describe('unwrapResult', () => {
    it('should unwrap successful Result', () => {
      const result = Ok('success');
      const value = unwrapResult(result);
      expect(value).toBe('success');
    });
    
    it('should throw on error Result', () => {
      const error: ValidationError = {
        type: 'validation_error',
        field: 'test',
        message: 'test error',
        timestamp: new Date(),
      };
      const result = Err(error);
      
      expect(() => unwrapResult(result)).toThrow('test error');
    });
  });
});

