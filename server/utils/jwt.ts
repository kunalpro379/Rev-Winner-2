import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
  }
  console.warn('⚠️  WARNING: JWT secrets not set. Using default values for development only.');
}

const SECRET = JWT_SECRET || 'dev-jwt-secret-change-in-production';
const REFRESH_SECRET = JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';

export type TokenScope = 'app' | 'marketing';

export interface JWTPayload {
  userId: string;
  id?: string; // Alias for userId - for compatibility
  email: string;
  role: string;
  username: string;
  sessionVersion: number;
  superUser?: boolean; // Flag for users with unlimited access override
  scope?: TokenScope; // Token scope - defaults to 'app'
  firstName?: string; // Used for marketing tokens
  lastName?: string; // Used for marketing tokens
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, {
    expiresIn: '15m', // Short-lived access token
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: '7d', // Long-lived refresh token
  });
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

// Marketing-scoped token generation and verification
export interface MarketingTokenPayload extends JWTPayload {
  scope: 'marketing';
}

export function generateMarketingAccessToken(payload: Omit<MarketingTokenPayload, 'scope'>): string {
  return jwt.sign({ ...payload, scope: 'marketing' }, SECRET, {
    expiresIn: '7d', // Longer-lived for marketing users
  });
}

export function verifyMarketingToken(token: string): MarketingTokenPayload {
  try {
    const payload = jwt.verify(token, SECRET) as MarketingTokenPayload;
    if (payload.scope !== 'marketing') {
      throw new Error('Invalid token scope');
    }
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired marketing token');
  }
}
