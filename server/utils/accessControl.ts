import { authStorage } from "../storage-auth";
import { eventLogger } from '../services/event-logger';

// Cache for super user status with TTL
interface CacheEntry {
  isSuperUser: boolean;
  timestamp: number;
}

const superUserCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a user has super user privileges with caching
 * Normalizes email to lowercase and caches results for 5 minutes
 * @param email User's email address
 * @returns Promise<boolean> True if user has active super user override
 */
export async function isSuperUser(email: string): Promise<boolean> {
  try {
    // Normalize email for consistent caching
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check cache first
    const cached = superUserCache.get(normalizedEmail);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      // Cache hit and not expired
      return cached.isSuperUser;
    }
    
    // Cache miss or expired - query database
    const result = await authStorage.isSuperUser(normalizedEmail);
    
    // Update cache
    superUserCache.set(normalizedEmail, {
      isSuperUser: result,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    // Fail closed - deny access on error
    console.error('Error in isSuperUser utility:', error);
    return false;
  }
}

/**
 * Invalidate cache for a specific email or all emails
 * Called when super user overrides are modified
 * @param email Optional email to invalidate, or undefined to clear all
 */
export function invalidateSuperUserCache(email?: string): void {
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    superUserCache.delete(normalizedEmail);
  } else {
    superUserCache.clear();
  }
}

/**
 * Log super user access for audit trail
 * @param userId User ID
 * @param email User email
 * @param action Action performed (e.g., 'admin_access', 'license_manager_access', 'unlimited_session')
 * @param metadata Additional metadata
 */
export async function logSuperUserAccess(
  userId: string,
  email: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventLogger.log({
      actorId: userId,
      action: `super_user_${action}`,
      targetType: 'user',
      targetId: userId,
      metadata: {
        ...metadata,
        email,
        superUserBypass: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // Log but don't throw - audit logging failures shouldn't block access
    console.error('Failed to log super user access:', error);
  }
}
