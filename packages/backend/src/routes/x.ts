import { Router, Request, Response } from 'express';
import {
  generateAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  postTweet,
  searchTweets,
  isXAuthConfigured,
  getXAuthConfig,
} from '../services/xAuthService.js';

export const xRoutes = Router();

const FRONTEND_URL = process.env.CORS_ORIGIN || 'http://localhost:5173';

/**
 * GET /api/x/config
 * Check X OAuth configuration status
 */
xRoutes.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: getXAuthConfig(),
  });
});

/**
 * GET /api/x/auth
 * Start OAuth flow - returns authorization URL
 */
xRoutes.get('/auth', (req: Request, res: Response) => {
  try {
    if (!isXAuthConfigured()) {
      res.status(503).json({
        success: false,
        error: {
          message: 'X OAuth not configured. Please set X_CLIENT_ID and X_CLIENT_SECRET.',
        },
      });
      return;
    }

    const { url, state } = generateAuthUrl();

    // Set state in a secure cookie for CSRF validation
    res.cookie('x_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.json({
      success: true,
      data: { authUrl: url },
    });
  } catch (error) {
    console.error('X auth error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to generate auth URL',
      },
    });
  }
});

/**
 * GET /api/x/callback
 * OAuth callback - exchanges code for tokens
 */
xRoutes.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('X OAuth error:', error, error_description);
      res.redirect(`${FRONTEND_URL}?x_auth_error=${encodeURIComponent(String(error_description || error))}`);
      return;
    }

    if (!code || !state) {
      res.redirect(`${FRONTEND_URL}?x_auth_error=missing_params`);
      return;
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(String(code), String(state));

    // Redirect to frontend with success (tokens stored server-side, pass session indicator)
    // In production, use secure httpOnly cookies for the session
    res.redirect(
      `${FRONTEND_URL}?x_auth_success=true&x_username=${encodeURIComponent(tokens.username)}`
    );
  } catch (error) {
    console.error('X callback error:', error);
    const message = error instanceof Error ? error.message : 'Authorization failed';
    res.redirect(`${FRONTEND_URL}?x_auth_error=${encodeURIComponent(message)}`);
  }
});

/**
 * POST /api/x/tweet
 * Post a tweet on behalf of the authenticated user
 */
xRoutes.post('/tweet', async (req: Request, res: Response) => {
  try {
    const { accessToken, text, mediaIds } = req.body;

    if (!accessToken) {
      res.status(401).json({
        success: false,
        error: { message: 'Access token required' },
      });
      return;
    }

    if (!text || text.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Tweet text required' },
      });
      return;
    }

    if (text.length > 280) {
      res.status(400).json({
        success: false,
        error: { message: 'Tweet exceeds 280 character limit' },
      });
      return;
    }

    const result = await postTweet(accessToken, text, mediaIds);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Tweet error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to post tweet',
      },
    });
  }
});

/**
 * POST /api/x/refresh
 * Refresh an expired access token
 */
xRoutes.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: { message: 'Refresh token required' },
      });
      return;
    }

    const tokens = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to refresh token',
      },
    });
  }
});

/**
 * GET /api/x/search
 * Search recent tweets (uses app-only auth)
 */
xRoutes.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, max_results } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        error: { message: 'Query parameter "q" required' },
      });
      return;
    }

    const maxResults = Math.min(parseInt(String(max_results) || '10', 10), 100);
    const tweets = await searchTweets(String(q), maxResults);

    res.json({
      success: true,
      data: { tweets },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to search tweets',
      },
    });
  }
});

/**
 * GET /api/x/health
 * Health check for X API integration
 */
xRoutes.get('/health', (req: Request, res: Response) => {
  const config = getXAuthConfig();
  res.json({
    success: true,
    data: {
      service: 'x-platform',
      status: config.configured ? 'ready' : 'not_configured',
      ...config,
    },
  });
});
