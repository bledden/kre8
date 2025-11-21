import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../packages/backend/src/server';

// Test prompts from MODEL_TESTING_GUIDE.md
const TEST_PROMPTS = {
  basic: [
    'Create a simple drum beat',
    'Make a basic pattern with kick and snare',
  ],
  genres: [
    'Generate a jazz chord progression',
    'Create a hip-hop beat with 808s',
    'Make a techno track',
    'Create an ambient soundscape',
  ],
};

describe('Prompt Quality Tests', () => {
  beforeAll(() => {
    process.env.USE_MOCK_AI = 'true';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3002'; // Use different port to avoid conflicts
  });
  
  afterAll(() => {
    // Cleanup if needed
  });

  describe('Basic Patterns', () => {
    TEST_PROMPTS.basic.forEach(prompt => {
      it(`should generate valid code for: "${prompt}"`, async () => {
        const response = await request(app)
          .post('/api/music/generate')
          .send({ prompt });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.code).toMatch(/s\(|n\(|stack\(/);
      });
    });
  });

  describe('Genre Accuracy', () => {
    it('should generate jazz-style code', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a jazz chord progression' });
      
      const code = response.body.data.code;
      expect(code).toBeDefined();
      // Jazz typically uses piano/guitar and chord progressions
      expect(code.toLowerCase()).toMatch(/piano|gtr|maj|min/);
    });
    
    it('should generate hip-hop style code', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a hip-hop beat' });
      
      const code = response.body.data.code;
      expect(code).toBeDefined();
    });
  });

  describe('Code Validity', () => {
    it('should generate syntactically valid Strudel code', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'test' });
      
      const code = response.body.data.code;
      
      // Check for dangerous patterns
      expect(code).not.toMatch(/eval\(|Function\(|require\(/);
      // Check for valid Strudel syntax
      expect(code).toMatch(/s\(|n\(|setcps\(/);
    });
    
    it('should include explanation', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a beat' });
      
      expect(response.body.data.explanation).toBeDefined();
      expect(typeof response.body.data.explanation).toBe('string');
    });
  });

  describe('Refinement Quality', () => {
    it('should handle refinement requests', async () => {
      // Generate initial code
      const initial = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a beat' });
      
      expect(initial.status).toBe(200);
      expect(initial.body.success).toBe(true);
      const originalCode = initial.body.data.code;
      expect(originalCode).toBeDefined();
      
      // Request refinement (uses refinement template)
      const refined = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'add hi-hats',
          conversationHistory: [
            {
              role: 'assistant' as const,
              content: originalCode,
              timestamp: new Date().toISOString(),
            },
          ],
          refinement: true,
        });
      
      expect(refined.status).toBe(200);
      expect(refined.body.success).toBe(true);
      expect(refined.body.data).toBeDefined();
      
      const refinedCode = refined.body.data.code;
      expect(refinedCode).toBeDefined();
      // Refinement should generate new code (in real AI, it would preserve and modify)
      // In mock mode, it generates new code based on refinement template
      expect(typeof refinedCode).toBe('string');
      expect(refinedCode.length).toBeGreaterThan(0);
    });
  });
});

