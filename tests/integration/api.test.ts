import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../packages/backend/src/server';

describe('API Integration Tests', () => {
  beforeAll(() => {
    // Set test environment
    process.env.USE_MOCK_AI = 'true';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3003'; // Use different port to avoid conflicts
  });
  
  afterAll(() => {
    // Cleanup if needed
  });

  describe('Music Generation Flow', () => {
    it('should generate code end-to-end', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'create a simple drum beat',
          config: { tempo: 120 },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toContain('s(');
    });
    
    it('should handle refinement requests', async () => {
      // First generate initial code
      const initial = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a beat' });
      
      expect(initial.body.success).toBe(true);
      
      // Then refine
      const refined = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'add hi-hats',
          refinement: true,
          conversationHistory: [
            {
              role: 'assistant',
              content: initial.body.data.code,
              timestamp: new Date(),
            },
          ],
        });
      
      expect(refined.body.success).toBe(true);
    });
  });

  describe('Configuration Endpoints', () => {
    it('should return defaults', async () => {
      const response = await request(app)
        .get('/api/config/defaults');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tempo).toBeDefined();
    });
    
    it('should return available models', async () => {
      const response = await request(app)
        .get('/api/config/models');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return few-shot examples', async () => {
      const response = await request(app)
        .get('/api/config/examples');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});

