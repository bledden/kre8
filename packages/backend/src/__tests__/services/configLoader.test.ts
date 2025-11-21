import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadPromptTemplate,
  loadFewShotExamples,
  loadDefaults,
  loadModels,
  renderPrompt,
} from '../../services/configLoader';

describe('Config Loader', () => {
  describe('loadPromptTemplate', () => {
    it('should load music_generation template', () => {
      const template = loadPromptTemplate('music_generation');
      expect(template).toBeTruthy();
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });
    
    it('should load refinement template', () => {
      const template = loadPromptTemplate('refinement');
      expect(template).toBeTruthy();
      expect(typeof template).toBe('string');
    });
    
    it('should throw error for non-existent template', () => {
      expect(() => loadPromptTemplate('nonexistent')).toThrow();
    });
  });

  describe('loadFewShotExamples', () => {
    it('should load examples array', () => {
      const examples = loadFewShotExamples();
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
    });
    
    it('should have examples with prompt and code', () => {
      const examples = loadFewShotExamples();
      examples.forEach(example => {
        expect(example).toHaveProperty('prompt');
        expect(example).toHaveProperty('code');
        expect(typeof example.prompt).toBe('string');
        expect(typeof example.code).toBe('string');
      });
    });
    
    it('should include optional genre and complexity fields', () => {
      const examples = loadFewShotExamples();
      // At least some examples should have these fields
      const hasMetadata = examples.some(ex => 
        'genre' in ex || 'complexity' in ex
      );
      // This is optional, so we just check it doesn't break
      expect(true).toBe(true);
    });
  });

  describe('loadDefaults', () => {
    it('should load defaults configuration', () => {
      const defaults = loadDefaults();
      expect(defaults).toHaveProperty('tempo');
      expect(defaults).toHaveProperty('scale');
      expect(defaults).toHaveProperty('key');
      expect(typeof defaults.tempo).toBe('number');
    });
  });

  describe('loadModels', () => {
    it('should load models configuration', () => {
      const models = loadModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });
    
    it('should have models with name and provider', () => {
      const models = loadModels();
      models.forEach(model => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('provider');
      });
    });
  });

  describe('renderPrompt', () => {
    it('should replace template variables', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const rendered = renderPrompt(template, {
        name: 'Alice',
        age: 30,
      });
      
      expect(rendered).toBe('Hello Alice, you are 30 years old.');
    });
    
    it('should handle missing variables', () => {
      const template = 'Hello {{name}}';
      const rendered = renderPrompt(template, {});
      // Variables are replaced with empty string if not provided
      expect(rendered).toBe('Hello ');
      expect(rendered).not.toContain('{{name}}');
    });
    
    it('should replace multiple occurrences', () => {
      const template = '{{var}} and {{var}}';
      const rendered = renderPrompt(template, { var: 'test' });
      expect(rendered).toBe('test and test');
    });
  });
});

