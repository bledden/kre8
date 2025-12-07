import crypto from 'crypto';
import axios from 'axios';

// =============================================================================
// X Platform OAuth 2.0 with PKCE
// Allows any user to connect their X account and share content
// =============================================================================

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const X_CALLBACK_URL = process.env.X_CALLBACK_URL || 'http://localhost:3001/api/x/callback';

// OAuth 2.0 endpoints
const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const X_API_BASE = 'https://api.twitter.com/2';

// In-memory store for PKCE challenges (use Redis in production)
const pkceStore = new Map<string, { codeVerifier: string; expiresAt: number }>();

// User tokens store (use database in production)
const userTokens = new Map<string, {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  username: string;
}>();

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

/**
 * Generate the authorization URL for X OAuth 2.0
 * Returns the URL and a state token for CSRF protection
 */
export function generateAuthUrl(): { url: string; state: string } {
  if (!X_CLIENT_ID) {
    throw new Error('X_CLIENT_ID not configured');
  }

  const state = generateRandomString(32);
  const { codeVerifier, codeChallenge } = generatePKCE();

  // Store PKCE verifier with 10-minute expiry
  pkceStore.set(state, {
    codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Clean up expired entries
  for (const [key, value] of pkceStore.entries()) {
    if (value.expiresAt < Date.now()) {
      pkceStore.delete(key);
    }
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: X_CLIENT_ID,
    redirect_uri: X_CALLBACK_URL,
    scope: 'tweet.read tweet.write users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `${X_AUTH_URL}?${params.toString()}`,
    state,
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  username: string;
}> {
  if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
    throw new Error('X OAuth credentials not configured');
  }

  // Retrieve and validate PKCE verifier
  const pkceData = pkceStore.get(state);
  if (!pkceData) {
    throw new Error('Invalid or expired state parameter');
  }
  if (pkceData.expiresAt < Date.now()) {
    pkceStore.delete(state);
    throw new Error('Authorization session expired');
  }

  const { codeVerifier } = pkceData;
  pkceStore.delete(state); // One-time use

  // Exchange code for token
  const tokenResponse = await axios.post(
    X_TOKEN_URL,
    new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: X_CLIENT_ID,
      redirect_uri: X_CALLBACK_URL,
      code_verifier: codeVerifier,
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );

  const { access_token, refresh_token, expires_in } = tokenResponse.data;

  // Get user info
  const userResponse = await axios.get(`${X_API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const { id: userId, username } = userResponse.data.data;

  // Store tokens (session-based, keyed by a session ID we'll create)
  const sessionId = generateRandomString(32);
  userTokens.set(sessionId, {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: Date.now() + expires_in * 1000,
    userId,
    username,
  });

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    userId,
    username,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
    throw new Error('X OAuth credentials not configured');
  }

  const response = await axios.post(
    X_TOKEN_URL,
    new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: X_CLIENT_ID,
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
  };
}

/**
 * Post a tweet on behalf of the authenticated user
 */
export async function postTweet(
  accessToken: string,
  text: string,
  mediaIds?: string[]
): Promise<{ tweetId: string; tweetUrl: string }> {
  const payload: { text: string; media?: { media_ids: string[] } } = { text };

  if (mediaIds && mediaIds.length > 0) {
    payload.media = { media_ids: mediaIds };
  }

  const response = await axios.post(
    `${X_API_BASE}/tweets`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const tweetId = response.data.data.id;

  // Get username to construct URL (we'd need to store this or fetch it)
  const userResponse = await axios.get(`${X_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const username = userResponse.data.data.username;

  return {
    tweetId,
    tweetUrl: `https://x.com/${username}/status/${tweetId}`,
  };
}

/**
 * Search recent tweets (uses App-Only auth - bearer token)
 */
export async function searchTweets(
  query: string,
  maxResults: number = 10
): Promise<Array<{ id: string; text: string; author_id: string }>> {
  const bearerToken = process.env.X_API_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('X_API_BEARER_TOKEN not configured');
  }

  const params = new URLSearchParams({
    query,
    max_results: maxResults.toString(),
    'tweet.fields': 'author_id,created_at',
  });

  const response = await axios.get(
    `${X_API_BASE}/tweets/search/recent?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }
  );

  return response.data.data || [];
}

/**
 * Check if X OAuth is configured
 */
export function isXAuthConfigured(): boolean {
  return !!(X_CLIENT_ID && X_CLIENT_SECRET);
}

/**
 * Get configuration status
 */
export function getXAuthConfig() {
  return {
    configured: isXAuthConfigured(),
    callbackUrl: X_CALLBACK_URL,
    bearerTokenConfigured: !!process.env.X_API_BEARER_TOKEN,
  };
}
