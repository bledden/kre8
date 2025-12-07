import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { FeedbackRequest, FeedbackRating, RelevantPreference, PreferenceSearchResult } from '@kre8/shared';

// =============================================================================
// User Preferences Service
// Uses xAI Collections for storing and retrieving user feedback with embeddings
// =============================================================================

const getApiKey = () => process.env.XAI_API_KEY;
const getManagementApiKey = () => process.env.XAI_MANAGEMENT_API_KEY;
const getCollectionId = () => process.env.XAI_PREFERENCES_COLLECTION_ID;

const XAI_API_BASE = 'https://api.x.ai';
const XAI_MANAGEMENT_BASE = 'https://management-api.x.ai';

interface XAIFileUploadResponse {
  id: string;
  name: string;
  created_at: string;
  bytes: number;
}

interface XAISearchResult {
  results: Array<{
    file_id: string;
    score: number;
    content: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Store user feedback in xAI Collections
 * Uploads as a document with embeddings for semantic search
 */
export async function storeFeedback(request: FeedbackRequest): Promise<{ success: boolean; feedbackId: string }> {
  const managementKey = getManagementApiKey();
  const collectionId = getCollectionId();

  if (!managementKey || !collectionId) {
    console.warn('[Preferences] Missing XAI_MANAGEMENT_API_KEY or XAI_PREFERENCES_COLLECTION_ID');
    return { success: false, feedbackId: '' };
  }

  const feedbackId = uuidv4();
  const timestamp = new Date().toISOString();

  // Build document content optimized for semantic search
  const documentContent = buildFeedbackDocument(feedbackId, request, timestamp);

  try {
    // Step 1: Upload file to xAI Files API
    const formData = new FormData();
    const blob = new Blob([documentContent], { type: 'text/plain' });
    formData.append('file', blob, `feedback-${feedbackId}.txt`);
    formData.append('purpose', 'collections');

    const fileResponse = await axios.post<XAIFileUploadResponse>(
      `${XAI_API_BASE}/v1/files`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${managementKey}`,
        },
        timeout: 30000,
      }
    );

    const fileId = fileResponse.data.id;
    console.log('[Preferences] File uploaded:', fileId);

    // Step 2: Add file to collection with metadata
    await axios.post(
      `${XAI_MANAGEMENT_BASE}/v1/collections/${collectionId}/documents/${fileId}`,
      {
        metadata: {
          feedback_id: feedbackId,
          rating: String(request.rating),
          genre: request.metadata?.genre || 'unknown',
          tempo: String(request.metadata?.tempo || 0),
          prompt: request.prompt.substring(0, 200), // Truncate for metadata
          has_text_feedback: String(!!request.textFeedback),
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${managementKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('[Preferences] Feedback stored:', feedbackId, `rating=${request.rating}`);
    return { success: true, feedbackId };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      console.error('[Preferences] Store error:', message);
    } else {
      console.error('[Preferences] Store error:', error);
    }
    return { success: false, feedbackId: '' };
  }
}

/**
 * Search for relevant user preferences based on a prompt
 * Uses xAI Collections semantic search
 */
export async function searchPreferences(
  query: string,
  limit: number = 5
): Promise<PreferenceSearchResult> {
  const apiKey = getApiKey();
  const collectionId = getCollectionId();

  if (!apiKey || !collectionId) {
    console.warn('[Preferences] Missing XAI_API_KEY or XAI_PREFERENCES_COLLECTION_ID');
    return { preferences: [] };
  }

  try {
    const response = await axios.post<XAISearchResult>(
      `${XAI_API_BASE}/v1/documents/search`,
      {
        query,
        collection_ids: [collectionId],
        max_results: limit,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const preferences: RelevantPreference[] = response.data.results.map((result) => {
      const parsed = parseFeedbackDocument(result.content);
      return {
        rating: parsed.rating,
        textFeedback: parsed.textFeedback,
        prompt: parsed.prompt,
        similarity: result.score,
      };
    });

    // Generate a summary if we have preferences
    const summary = preferences.length > 0 ? generatePreferenceSummary(preferences) : undefined;

    console.log('[Preferences] Found', preferences.length, 'relevant preferences for query');
    return { preferences, summary };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      console.error('[Preferences] Search error:', message);
    } else {
      console.error('[Preferences] Search error:', error);
    }
    return { preferences: [] };
  }
}

/**
 * Build a document optimized for semantic search
 * Includes both structured data and natural language for embedding quality
 */
function buildFeedbackDocument(
  feedbackId: string,
  request: FeedbackRequest,
  timestamp: string
): string {
  const ratingLabel = getRatingLabel(request.rating);
  const parts: string[] = [];

  parts.push(`=== User Music Feedback ===`);
  parts.push(`Feedback ID: ${feedbackId}`);
  parts.push(`Timestamp: ${timestamp}`);
  parts.push(``);
  parts.push(`Rating: ${request.rating}/5 (${ratingLabel})`);
  parts.push(``);
  parts.push(`Original Request: ${request.prompt}`);
  parts.push(``);

  if (request.textFeedback) {
    parts.push(`User Feedback: ${request.textFeedback}`);
    parts.push(``);
  }

  if (request.metadata) {
    parts.push(`Track Details:`);
    if (request.metadata.tempo) parts.push(`- Tempo: ${request.metadata.tempo} BPM`);
    if (request.metadata.genre) parts.push(`- Genre: ${request.metadata.genre}`);
    if (request.metadata.instruments?.length) {
      parts.push(`- Instruments: ${request.metadata.instruments.join(', ')}`);
    }
    if (request.metadata.listenDurationMs) {
      const seconds = Math.round(request.metadata.listenDurationMs / 1000);
      parts.push(`- Listen Duration: ${seconds} seconds`);
    }
  }

  parts.push(``);
  parts.push(`Generated Code:`);
  parts.push(request.code);

  return parts.join('\n');
}

/**
 * Parse a feedback document back into structured data
 */
function parseFeedbackDocument(content: string): {
  rating: FeedbackRating;
  textFeedback?: string;
  prompt: string;
} {
  let rating: FeedbackRating = 3;
  let textFeedback: string | undefined;
  let prompt = '';

  // Parse rating
  const ratingMatch = content.match(/Rating:\s*(\d)\/5/);
  if (ratingMatch) {
    const parsed = parseInt(ratingMatch[1]);
    if (parsed >= 1 && parsed <= 5) rating = parsed as FeedbackRating;
  }

  // Parse user feedback
  const feedbackMatch = content.match(/User Feedback:\s*(.+?)(?=\n\n|\nTrack Details:|Generated Code:|$)/s);
  if (feedbackMatch) {
    textFeedback = feedbackMatch[1].trim();
  }

  // Parse original prompt
  const promptMatch = content.match(/Original Request:\s*(.+?)(?=\n\n|\nUser Feedback:|$)/s);
  if (promptMatch) {
    prompt = promptMatch[1].trim();
  }

  return { rating, textFeedback, prompt };
}

/**
 * Get a human-readable label for a rating
 */
function getRatingLabel(rating: FeedbackRating): string {
  const labels: Record<FeedbackRating, string> = {
    1: 'Very Bad - Did not like this at all',
    2: 'Bad - Not what I was looking for',
    3: 'Okay - Decent but could be better',
    4: 'Good - Liked this track',
    5: 'Excellent - Exactly what I wanted',
  };
  return labels[rating];
}

/**
 * Generate a summary of user preferences for prompt injection
 */
function generatePreferenceSummary(preferences: RelevantPreference[]): string {
  const liked = preferences.filter(p => p.rating >= 4);
  const disliked = preferences.filter(p => p.rating <= 2);

  const parts: string[] = [];

  if (liked.length > 0) {
    parts.push('User tends to LIKE:');
    liked.forEach(p => {
      if (p.textFeedback) {
        parts.push(`- "${p.textFeedback}" (from: ${p.prompt.substring(0, 50)}...)`);
      } else {
        parts.push(`- Tracks like: ${p.prompt.substring(0, 80)}...`);
      }
    });
  }

  if (disliked.length > 0) {
    parts.push('User tends to DISLIKE:');
    disliked.forEach(p => {
      if (p.textFeedback) {
        parts.push(`- "${p.textFeedback}" (from: ${p.prompt.substring(0, 50)}...)`);
      } else {
        parts.push(`- Tracks like: ${p.prompt.substring(0, 80)}...`);
      }
    });
  }

  return parts.join('\n');
}

/**
 * Build preference context to inject into generation prompts
 */
export function buildPreferenceContext(searchResult: PreferenceSearchResult): string | null {
  if (!searchResult.preferences.length) return null;

  const parts: string[] = [
    '## USER PREFERENCES (Important - Consider these when generating!)',
    '',
  ];

  if (searchResult.summary) {
    parts.push(searchResult.summary);
    parts.push('');
  }

  // Add specific relevant feedback
  const relevant = searchResult.preferences.slice(0, 3);
  if (relevant.some(p => p.textFeedback)) {
    parts.push('Recent specific feedback:');
    relevant.forEach(p => {
      if (p.textFeedback) {
        const emoji = p.rating >= 4 ? '👍' : p.rating <= 2 ? '👎' : '➖';
        parts.push(`${emoji} "${p.textFeedback}"`);
      }
    });
  }

  parts.push('');
  parts.push('---');

  return parts.join('\n');
}
