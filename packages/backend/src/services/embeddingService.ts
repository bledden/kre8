/**
 * Local Embedding Service
 * Generates embeddings using BGE-M3 via @huggingface/transformers
 *
 * This runs entirely locally - no external API calls needed.
 * First call will download the model (~2GB), subsequent calls use cache.
 */

// Dynamic import for ESM compatibility
let pipeline: any = null;
let extractor: any = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Configuration
const MODEL_NAME = 'Xenova/bge-m3';
const EMBEDDING_DIM = 1024;

/**
 * Initialize the embedding pipeline
 * Loads the BGE-M3 model (downloads on first run)
 */
async function initializePipeline(): Promise<void> {
  if (extractor) return;

  if (isInitializing && initPromise) {
    await initPromise;
    return;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      console.log('[Embedding] Loading BGE-M3 model (this may take a moment on first run)...');

      // Dynamic import for ESM
      const transformers = await import('@huggingface/transformers');
      pipeline = transformers.pipeline;

      // Create feature extraction pipeline
      extractor = await pipeline('feature-extraction', MODEL_NAME, {
        // Use fp16 for faster inference and less memory
        dtype: 'fp32', // fp16 can cause issues on some systems
      });

      console.log('[Embedding] BGE-M3 model loaded successfully');
    } catch (error) {
      console.error('[Embedding] Failed to load model:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  await initPromise;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  await initializePipeline();

  if (!extractor) {
    throw new Error('Embedding pipeline not initialized');
  }

  try {
    const output = await extractor(text, {
      pooling: 'cls',
      normalize: true,
    });

    // Extract the embedding array
    const embedding = Array.from(output.data as Float32Array).slice(0, EMBEDDING_DIM);

    return embedding;
  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  await initializePipeline();

  if (!extractor) {
    throw new Error('Embedding pipeline not initialized');
  }

  try {
    const output = await extractor(texts, {
      pooling: 'cls',
      normalize: true,
    });

    // Extract embeddings for each text
    const embeddings: number[][] = [];
    const data = output.data as Float32Array;

    for (let i = 0; i < texts.length; i++) {
      const start = i * EMBEDDING_DIM;
      const end = start + EMBEDDING_DIM;
      embeddings.push(Array.from(data.slice(start, end)));
    }

    return embeddings;
  } catch (error) {
    console.error('[Embedding] Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Check if the embedding service is available
 */
export async function isEmbeddingServiceAvailable(): Promise<boolean> {
  try {
    await initializePipeline();
    return !!extractor;
  } catch {
    return false;
  }
}

/**
 * Get embedding dimension
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIM;
}

/**
 * Preload the model (call during server startup)
 */
export async function preloadModel(): Promise<void> {
  try {
    await initializePipeline();
    console.log('[Embedding] Model preloaded and ready');
  } catch (error) {
    console.warn('[Embedding] Failed to preload model, will load on first use:', error);
  }
}
