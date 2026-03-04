import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyMarketingToken, JWTPayload, MarketingTokenPayload } from '../utils/jwt';
import { authStorage } from '../storage-auth';
import { isSuperUser, logSuperUserAccess } from '../utils/accessControl';
import { db } from '../db';
import { marketingAccess } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Extend Express Request to include JWT user data
declare module 'express-serve-static-core' {
  interface Request {
    jwtUser?: JWTPayload;
  }
}

// Type for authenticated requests where jwtUser is guaranteed to exist
export interface AuthenticatedRequest extends Request {
  jwtUser: JWTPayload;
}

// Type for authenticated route handlers
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => any;

// Wrapper to convert AuthenticatedHandler to Express RequestHandler
export function withAuthenticated(handler: AuthenticatedHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as AuthenticatedRequest, res, next);
  };
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Fallback to cookie if Authorization header is missing
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const payload = verifyAccessToken(token);
    
    // Verify session version for single-device access enforcement
    const user = await authStorage.getUserById(payload.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }
    
    if (user.sessionVersion !== payload.sessionVersion) {
      // Session version mismatch - user logged in on another device
      return res.status(403).json({ 
        message: 'Session invalidated. You have been logged in on another device.',
        sessionInvalidated: true 
      });
    }
    
    // Check if user has super user privileges (grants unlimited access)
    const superUser = await isSuperUser(user.email);
    
    // Attach user info and super user flag to request
    req.jwtUser = {
      ...payload,
      superUser
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Middleware that asserts req.jwtUser exists (for type narrowing)
export function requireAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): asserts req is AuthenticatedRequest {
  if (!req.jwtUser) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.jwtUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Allow super users to access admin routes (via superUserOverrides table)
  if (req.jwtUser.superUser) {
    return next();
  }

  // Allow super_admin and admin roles
  if (req.jwtUser.role === 'super_admin' || req.jwtUser.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Admin access required' });
}

// Middleware to require license_manager role or super user status
export function requireLicenseManager(req: Request, res: Response, next: NextFunction) {
  if (!req.jwtUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  console.log(`[requireLicenseManager] Checking access for user ${req.jwtUser.userId}, role: ${req.jwtUser.role}, superUser: ${req.jwtUser.superUser}`);

  // Allow super users to access license manager routes (via superUserOverrides table)
  if (req.jwtUser.superUser) {
    console.log(`[requireLicenseManager] ✅ Access granted - super user`);
    return next();
  }

  // Allow super_admin, admin, and license_manager roles
  if (req.jwtUser.role === 'super_admin' || req.jwtUser.role === 'admin' || req.jwtUser.role === 'license_manager') {
    console.log(`[requireLicenseManager] ✅ Access granted - role: ${req.jwtUser.role}`);
    return next();
  }

  console.log(`[requireLicenseManager] ❌ Access denied - role: ${req.jwtUser.role}`);
  return res.status(403).json({ message: 'License Manager access required' });
}

export async function requireTermsAcceptance(req: Request, res: Response, next: NextFunction) {
  if (!req.jwtUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const user = await authStorage.getUserById(req.jwtUser.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.termsAccepted) {
      return res.status(403).json({ 
        message: 'You must accept the Terms & Conditions to access this feature',
        termsRequired: true 
      });
    }

    next();
  } catch (error) {
    console.error('Terms acceptance check error:', error);
    return res.status(500).json({ message: 'Failed to verify terms acceptance' });
  }
}

export function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  // This will be populated by checking subscription status in a separate middleware
  // For now, we'll implement a basic version
  next();
}

// Marketing authentication middleware - handles both regular users and marketing-only users
export async function authenticateMarketing(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  
  // Also check marketing-specific header
  const marketingToken = req.headers['x-marketing-token'] as string;
  
  if (!token && !marketingToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Try marketing token first (x-marketing-token header)
  if (marketingToken) {
    try {
      const payload = verifyMarketingToken(marketingToken);
      
      // Verify user exists and sessionVersion matches for session invalidation support
      const user = await authStorage.getUserById(payload.userId);
      if (!user) {
        return res.status(403).json({ message: 'User not found' });
      }
      
      // Validate sessionVersion to enforce session invalidation (normalize types for comparison)
      const userSessionVersion = Number(user.sessionVersion || 0);
      const payloadSessionVersion = Number(payload.sessionVersion || 0);
      if (userSessionVersion !== payloadSessionVersion) {
        return res.status(403).json({ 
          message: 'Session invalidated. Please log in again.',
          sessionInvalidated: true 
        });
      }
      
      // Verify marketing access is still active
      const [access] = await db.select()
        .from(marketingAccess)
        .where(and(
          eq(marketingAccess.userId, payload.userId),
          eq(marketingAccess.status, 'active')
        ))
        .limit(1);
      
      if (!access) {
        return res.status(403).json({ message: 'Marketing access revoked or expired' });
      }
      
      if (access.expiresAt && new Date(access.expiresAt) < new Date()) {
        return res.status(403).json({ message: 'Marketing access has expired' });
      }
      
      req.jwtUser = {
        userId: payload.userId,
        id: payload.userId, // Alias for compatibility with routes using user.id
        email: payload.email,
        role: 'user',
        username: payload.username || payload.email,
        sessionVersion: payload.sessionVersion,
        scope: 'marketing',
        firstName: payload.firstName,
        lastName: payload.lastName,
      };
      return next();
    } catch (error) {
      console.error('Marketing token verification failed:', error);
      return res.status(403).json({ message: 'Invalid marketing token' });
    }
  }
  
  // Fall back to regular token (Authorization header or cookie)
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      const user = await authStorage.getUserById(payload.userId);
      
      if (!user) {
        return res.status(403).json({ message: 'User not found' });
      }
      
      if (user.sessionVersion !== payload.sessionVersion) {
        return res.status(403).json({ 
          message: 'Session invalidated',
          sessionInvalidated: true 
        });
      }
      
      const superUser = await isSuperUser(user.email);
      req.jwtUser = { ...payload, id: payload.userId, superUser, scope: 'app' };
      return next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  }
  
  return res.status(401).json({ message: 'Authentication required' });
}
