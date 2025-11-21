import { describe, it, expect } from 'vitest';
import {
  sanitizePrompt,
  validateStrudelCode,
  validateMusicConfig,
  toBrandedStrudelCode,
  Ok,
  Err,
} from '../ai-contracts';

describe('AI Contracts', () => {
  describe('sanitizePrompt', () => {
    it('should trim whitespace', () => {
      const result = sanitizePrompt('  test prompt  ');
      expect(result).toBe('test prompt');
    });
    
    it('should limit length to 2000 characters', () => {
      const longPrompt = 'a'.repeat(3000);
      const result = sanitizePrompt(longPrompt);
      expect(result.length).toBe(2000);
    });
    
    it('should remove HTML tags', () => {
      const result = sanitizePrompt('test<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('validateStrudelCode', () => {
    it('should accept valid Strudel code', () => {
      const result = validateStrudelCode('s("bd sd").gain(0.9)');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('s("bd sd").gain(0.9)');
      }
    });
    
    it('should reject code with eval()', () => {
      const result = validateStrudelCode('eval("bad code")');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('validation_error');
      }
    });
    
    it('should reject code with require()', () => {
      const result = validateStrudelCode('require("fs")');
      expect(result.success).toBe(false);
    });
    
    it('should reject code with import statements', () => {
      const result = validateStrudelCode('import something from "module"');
      expect(result.success).toBe(false);
    });
    
    it('should reject code with fetch()', () => {
      const result = validateStrudelCode('fetch("http://evil.com")');
      expect(result.success).toBe(false);
    });
  });

  describe('validateMusicConfig', () => {
    it('should accept valid tempo', () => {
      const result = validateMusicConfig({ tempo: 120 });
      expect(result.success).toBe(true);
    });
    
    it('should reject tempo below 20', () => {
      const result = validateMusicConfig({ tempo: 10 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe('tempo');
      }
    });
    
    it('should reject tempo above 300', () => {
      const result = validateMusicConfig({ tempo: 400 });
      expect(result.success).toBe(false);
    });
    
    it('should convert samples Record to Map', () => {
      const result = validateMusicConfig({
        samples: { bd: 'url1', sd: 'url2' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.samples).toBeInstanceOf(Map);
      }
    });
  });

  describe('toBrandedStrudelCode', () => {
    it('should create branded code from string', () => {
      const branded = toBrandedStrudelCode('s("bd")');
      expect(branded).toBe('s("bd")');
    });
  });

  describe('Result helpers', () => {
    it('Ok should create success result', () => {
      const result = Ok('data');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('data');
      }
    });
    
    it('Err should create error result', () => {
      const error = {
        type: 'validation_error' as const,
        field: 'test',
        message: 'error',
        timestamp: new Date(),
      };
      const result = Err(error);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toEqual(error);
      }
    });
  });
});

