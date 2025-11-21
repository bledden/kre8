import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../server';

describe('Music Routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    // Use mock AI by default for tests
    process.env.USE_MOCK_AI = 'true';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3004'; // Use unique port for this test file
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/music/generate', () => {
    it('should generate code with valid request', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a house beat' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.code).toBeDefined();
      expect(typeof response.body.data.code).toBe('string');
    });
    
    it('should include mock flag when using mock service', async () => {
      process.env.USE_MOCK_AI = 'true';
      
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'test' });
      
      expect(response.body.mock).toBe(true);
    });
    
    it('should validate request schema', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({}) // Invalid: missing prompt
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    it('should accept config parameter', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'create a beat',
          config: { tempo: 140 },
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should accept conversation history', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'add hi-hats',
          conversationHistory: [
            {
              role: 'assistant' as const,
              content: 's("bd sd")',
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/music/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/music/health')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('music-generation');
      expect(response.body.mode).toBeDefined();
    });
    
    it('should indicate mock mode when USE_MOCK_AI=true', async () => {
      process.env.USE_MOCK_AI = 'true';
      
      const response = await request(app)
        .get('/api/music/health');
      
      expect(response.body.mode).toBe('mock');
    });
  });
});

