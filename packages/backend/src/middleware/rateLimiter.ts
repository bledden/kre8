import rateLimit from 'express-rate-limit';

const REQUESTS_PER_WINDOW = parseInt(process.env.RATE_LIMIT_REQUESTS || '10', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10);

export const rateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: REQUESTS_PER_WINDOW,
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

