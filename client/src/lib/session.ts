/**
 * Session Management Utilities
 * 
 * Centralized session cleanup logic to prevent circular dependencies.
 * This module has NO external imports except types.
 */

/**
 * Clear all localStorage and sessionStorage session artifacts.
 * 
 * This is a pure function with no external dependencies.
 * Removes all session data while preserving user preferences.
 */
export function clearSessionStorageArtifacts(): void {
  // Authentication tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Session-specific settings (user will re-configure on next login)
  localStorage.removeItem('domainExpertise');
  localStorage.removeItem('domainExpertiseId');
  localStorage.removeItem('multiProductEliteAI');
  localStorage.removeItem('shiftGearsAutoPaused');
  localStorage.removeItem('queryPitchesAutoPaused');
  localStorage.removeItem('floatingAssistantPrefs');
  localStorage.removeItem('revWinnerChat');
  
  // Clear sessionStorage completely (any temporary session data)
  sessionStorage.clear();
  
  // User preferences PRESERVED (theme, cookie preferences)
  // These items are intentionally NOT cleared:
  // - theme (light/dark mode preference)
  // - cookie-preferences (GDPR consent)
}

/**
 * CRITICAL: Clear ALL session data to force fresh login
 * 
 * This function guarantees complete session cleanup by removing:
 * - Authentication tokens (accessToken, refreshToken, user)
 * - Session-specific settings (domain expertise, AI preferences, etc.)
 * - React Query cache (all cached API responses) - via optional callback
 * - All sessionStorage data
 * 
 * User preferences are PRESERVED:
 * - theme (light/dark mode preference)
 * - cookie-preferences (GDPR consent)
 * 
 * Usage: Call this helper in the `finally` block of logout handlers
 * to guarantee cleanup even if the backend is unreachable.
 * 
 * @param options.clearCache - Optional callback to clear React Query cache.
 *                             Pass () => queryClient.clear() from caller.
 */
export function clearAllSessionData(options?: { clearCache?: () => void }): void {
  // Clear all storage artifacts
  clearSessionStorageArtifacts();
  
  // Clear React Query cache if callback provided
  if (options?.clearCache) {
    options.clearCache();
  }
}
