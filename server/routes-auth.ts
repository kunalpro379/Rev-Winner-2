import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { authStorage } from "./storage-auth";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "./utils/jwt";
import { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail, sendNewRegistrationNotification } from "./services/email";
import { registerUserSchema, loginSchema, verifyOtpSchema, requestPasswordResetSchema, resetPasswordSchema } from "../shared/schema";
import { authenticateToken, requireAdmin } from "./middleware/auth";
import { encryptApiKey, decryptApiKey } from "./utils/crypto";
import { z } from "zod";
import { eventLogger } from './services/event-logger';

export function setupAuthRoutes(app: Router) {
  // ========================================
  // PUBLIC ROUTES (No authentication required)
  // ========================================
  
  // Initialize first admin (only works if NO admins exist)
  app.post("/api/auth/init-admin", async (req: Request, res: Response) => {
    try {
      // Check if any admin users exist
      const allUsers = await authStorage.getAllUsers(1000, 0);
      const adminExists = allUsers.some(u => u.role === 'admin');
      
      if (adminExists) {
        return res.status(403).json({ 
          message: "Admin already exists. Use /api/auth/login instead." 
        });
      }
      
      // Generate a secure random password for the admin
      const securePassword = crypto.randomBytes(16).toString('hex');
      
      // Create first admin with secure credentials
      const adminData = {
        email: "admin@revwinner.com",
        password: securePassword,
        firstName: "Master",
        lastName: "Admin",
        username: "admin",
        organization: "Rev Winner",
        role: "admin"
      };
      
      const createdUser = await authStorage.createUser(adminData);
      
      // Activate and verify admin immediately
      const admin = await authStorage.updateUser(createdUser.id, {
        status: "active",
        emailVerified: true,
      });
      
      // Log audit
      await eventLogger.log({
        actorId: admin.id,
        action: 'admin.initialized',
        targetType: 'user',
        targetId: admin.id,
        metadata: { 
          note: 'First admin created via init endpoint',
          email: admin.email,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.status(201).json({ 
        message: "Master admin created successfully",
        credentials: {
          email: "admin@revwinner.com",
          username: "admin",
          password: securePassword
        },
        note: "IMPORTANT: Save this password securely. It will not be shown again."
      });
    } catch (error) {
      console.error("Init admin error:", error);
      res.status(500).json({ message: "Failed to initialize admin" });
    }
  });
  
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerUserSchema.parse(req.body);
      
      // Block personal email providers (Gmail, Yahoo, etc.) - only work emails allowed
      const blockedEmailDomains = [
        'gmail.com', 'googlemail.com',
        'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com',
        'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
        'aol.com',
        'icloud.com', 'me.com', 'mac.com',
        'protonmail.com', 'proton.me',
        'zoho.com', 'zohomail.com',
        'mail.com', 'email.com',
        'gmx.com', 'gmx.net',
        'yandex.com', 'yandex.ru',
        'tutanota.com', 'tutamail.com',
        'fastmail.com', 'fastmail.fm',
        'rediffmail.com',
        'inbox.com'
      ];
      
      const emailDomain = data.email.toLowerCase().split('@')[1];
      const allowedExceptions = ['urhead1508@gmail.com'];
      
      if (blockedEmailDomains.includes(emailDomain) && !allowedExceptions.includes(data.email.toLowerCase())) {
        return res.status(400).json({ 
          message: "Please use your work email address. Personal email providers (Gmail, Yahoo, etc.) are not allowed for registration." 
        });
      }
      
      // Check if email or username already exists
      const existingEmail = await authStorage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const existingUsername = await authStorage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create pending user
      const user = await authStorage.createUser(data);
      
      // Generate and send OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await authStorage.createOTP(data.email, otpCode, expiresAt);
      await sendOTPEmail(data.email, otpCode, data.firstName);
      
      // Send registration notification to sales team (non-blocking)
      sendNewRegistrationNotification({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        company: data.organization,
      }).catch(err => console.error('Failed to send registration notification:', err));
      
      // Log audit
      await eventLogger.log({
        actorId: user.id,
        action: 'user.registered',
        targetType: 'user',
        targetId: user.id,
        metadata: { email: data.email, username: data.username },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.status(201).json({
        message: "Registration successful. Please check your email for verification code.",
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  // Verify OTP and activate account
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, code } = verifyOtpSchema.parse(req.body);
      
      const otp = await authStorage.getValidOTP(email, code);
      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Check attempts
      const attempts = parseInt(otp.attempts);
      if (attempts >= 5) {
        return res.status(429).json({ message: "Too many failed attempts. Please request a new code." });
      }
      
      // Mark OTP as used
      await authStorage.markOTPAsUsed(otp.id);
      
      // Activate user and create trial subscription (3 sessions, max 60 minutes each)
      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // CRITICAL FIX: Clear any existing sessions/tokens BEFORE updating user
      // This prevents old session data from being reused on Windows devices
      await authStorage.deleteUserRefreshTokens(user.id);
      
      const updatedUser = await authStorage.updateUser(user.id, {
        status: 'active',
        emailVerified: true,
      });
      
      // Create trial subscription with session tracking (3 sessions, 180 minutes total)
      await authStorage.createSubscription({
        userId: updatedUser.id, // Use updatedUser.id for consistency
        planType: 'free_trial',
        status: 'trial',
        sessionsUsed: '0',
        sessionsLimit: '3',
        minutesUsed: '0',
        minutesLimit: '180',
        sessionHistory: [],
      });
      
      // Send welcome email
      await sendWelcomeEmail(email, updatedUser.firstName);
      
      // Increment session version for fresh session
      const sessionVersion = await authStorage.incrementSessionVersion(updatedUser.id);
      
      // Generate NEW tokens with fresh sessionVersion for THIS user
      const accessToken = generateAccessToken({
        userId: updatedUser.id, // Use updatedUser.id to ensure correct user
        email: updatedUser.email,
        role: updatedUser.role,
        username: updatedUser.username,
        sessionVersion,
      });
      
      const refreshToken = generateRefreshToken({
        userId: updatedUser.id, // Use updatedUser.id to ensure correct user
        email: updatedUser.email,
        role: updatedUser.role,
        username: updatedUser.username,
        sessionVersion,
      });
      
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await authStorage.createRefreshToken(updatedUser.id, refreshToken, refreshTokenExpiry);
      
      // Log audit with correct user ID
      await eventLogger.log({
        actorId: updatedUser.id,
        action: 'user.verified',
        targetType: 'user',
        targetId: updatedUser.id,
        metadata: { 
          email: updatedUser.email,
          username: updatedUser.username,
          note: 'New user registration verified - fresh session created'
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      console.log(`✅ New user verified and logged in: ${updatedUser.id} (${updatedUser.email})`);
      
      res.json({
        message: "Email verified successfully. You have 3 free trial sessions (max 60 minutes each).",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          username: updatedUser.username,
          role: updatedUser.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });
  
  // Resend OTP
  app.post("/api/auth/resend-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }
      
      // Generate and send new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await authStorage.createOTP(email, otpCode, expiresAt);
      await sendOTPEmail(email, otpCode, user.firstName);
      
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { usernameOrEmail, password, forceLogin } = loginSchema.extend({
        forceLogin: z.boolean().optional()
      }).parse(req.body);
      
      const user = await authStorage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (user.status === 'suspended') {
        return res.status(403).json({ message: "Account suspended. Please contact support." });
      }
      
      if (!user.emailVerified) {
        return res.status(403).json({ message: "Email not verified. Please check your email for verification code." });
      }
      
      const isPasswordValid = await authStorage.verifyPassword(user.id, password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if user has an active session on another device
      const existingTokens = await authStorage.getUserRefreshTokens(user.id);
      if (existingTokens.length > 0 && !forceLogin) {
        // User is already logged in on another device, require confirmation
        return res.status(409).json({ 
          message: "You are already logged in on another device. Continuing will log you out from that device.",
          requiresConfirmation: true 
        });
      }
      
      // Check trial/subscription status (3 sessions max, 60 min each)
      const subscription = await authStorage.getSubscriptionByUserId(user.id);
      let subscriptionStatus = 'none';
      let trialExpired = false;
      let sessionsRemaining = 0;
      
      if (subscription) {
        subscriptionStatus = subscription.status;
        const sessionsUsed = parseInt(subscription.sessionsUsed || '0');
        sessionsRemaining = Math.max(0, 3 - sessionsUsed);
        
        if (subscription.status === 'trial' && sessionsUsed >= 3) {
          trialExpired = true;
        }
      }
      
      // Invalidate all existing sessions (single device access)
      await authStorage.deleteUserRefreshTokens(user.id);
      
      // Increment session version for immediate single-device logout
      const sessionVersion = await authStorage.incrementSessionVersion(user.id);
      
      // Generate tokens with sessionVersion
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        sessionVersion,
      });
      
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        sessionVersion,
      });
      
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await authStorage.createRefreshToken(user.id, refreshToken, refreshTokenExpiry);
      
      // Log audit
      await eventLogger.log({
        actorId: user.id,
        action: 'user.logged_in',
        targetType: 'user',
        targetId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          organization: user.organization,
          role: user.role,
        },
        accessToken,
        refreshToken,
        subscription: {
          status: subscriptionStatus,
          trialExpired,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Refresh access token
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
      }
      
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in database
      const storedToken = await authStorage.getRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
      
      // Verify session version for single-device access
      const user = await authStorage.getUserById(payload.userId);
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }
      
      if (user.sessionVersion !== payload.sessionVersion) {
        // Session version mismatch - user logged in on another device
        await authStorage.deleteRefreshToken(refreshToken);
        return res.status(403).json({ message: "Session invalidated. Please log in again." });
      }
      
      // Generate new access token with current sessionVersion
      const accessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        username: payload.username,
        sessionVersion: payload.sessionVersion,
      });
      
      res.json({ accessToken });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(403).json({ message: "Invalid or expired refresh token" });
    }
  });
  
  // Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = requestPasswordResetSchema.parse(req.body);
      
      // Check if user exists
      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not (security best practice)
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }
      
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await authStorage.createPasswordResetToken(email, resetToken, expiresAt);
      await sendPasswordResetEmail(email, resetToken, user.firstName);
      
      // Log audit
      await eventLogger.log({
        actorId: user.id,
        action: 'user.password_reset_requested',
        targetType: 'user',
        targetId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  
  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      console.log(`[Password Reset] ========== NEW REQUEST ==========`);
      console.log(`[Password Reset] Headers:`, JSON.stringify(req.headers));
      console.log(`[Password Reset] Body:`, JSON.stringify(req.body));
      console.log(`[Password Reset] Body type:`, typeof req.body);
      console.log(`[Password Reset] Body keys:`, Object.keys(req.body || {}));
      
      // Validate request body
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log(`[Password Reset] ❌ Empty request body`);
        return res.status(400).json({ message: "Request body is empty" });
      }
      
      // Check if required fields exist
      if (!req.body.token) {
        console.log(`[Password Reset] ❌ Missing token field`);
        return res.status(400).json({ message: "Reset token is required" });
      }
      
      if (!req.body.password) {
        console.log(`[Password Reset] ❌ Missing password field`);
        return res.status(400).json({ message: "Password is required" });
      }
      
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      console.log(`[Password Reset] ✓ Validation passed`);
      console.log(`[Password Reset] Token: ${token.substring(0, 20)}...`);
      console.log(`[Password Reset] Password length: ${password.length}`);
      
      // Verify reset token
      const resetToken = await authStorage.getValidPasswordResetToken(token);
      if (!resetToken) {
        console.log(`[Password Reset] ❌ Token validation failed - token not found or expired`);
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      console.log(`[Password Reset] Token valid for email: ${resetToken.email}`);
      
      // Update password
      await authStorage.updateUserPassword(resetToken.email, password);
      await authStorage.markPasswordResetTokenAsUsed(resetToken.id);
      
      console.log(`[Password Reset] Password updated successfully for: ${resetToken.email}`);
      
      // Get user for audit log
      const user = await authStorage.getUserByEmail(resetToken.email);
      if (user) {
        await eventLogger.log({
          actorId: user.id,
          action: 'user.password_reset_completed',
          targetType: 'user',
          targetId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(`[Password Reset] Validation error:`, error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // ========================================
  // PROTECTED ROUTES (Require authentication)
  // ========================================
  
  // Logout
  app.post("/api/auth/logout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await authStorage.deleteRefreshToken(refreshToken);
      }
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'user.logged_out',
        targetType: 'user',
        targetId: req.jwtUser?.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });
  
  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = await authStorage.getUserById(req.jwtUser!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const subscription = await authStorage.getSubscriptionByUserId(user.id);
      
      let sessionsRemaining = 0;
      let minutesRemaining = 0;
      let trialExpired = false;
      let isTrialUser = false;
      
      if (subscription) {
        const sessionsUsed = parseInt(subscription.sessionsUsed || '0');
        const minutesUsed = parseInt(subscription.minutesUsed || '0');
        const sessionsLimit = subscription.sessionsLimit ? parseInt(subscription.sessionsLimit) : null;
        const minutesLimit = subscription.minutesLimit ? parseInt(subscription.minutesLimit) : null;
        
        // Check if user is on trial: subscription status is 'trial' OR both limits are set (not null)
        isTrialUser = subscription.status === 'trial' || (sessionsLimit !== null && minutesLimit !== null);
        
        if (isTrialUser) {
          // Trial user - has limited sessions and minutes
          sessionsRemaining = Math.max(0, (sessionsLimit || 3) - sessionsUsed);
          minutesRemaining = Math.max(0, (minutesLimit || 180) - minutesUsed);
          trialExpired = sessionsUsed >= (sessionsLimit || 3) && minutesUsed >= (minutesLimit || 180);
        } else {
          // Paid user - unlimited (or return large number)
          sessionsRemaining = 999999;
          minutesRemaining = 999999;
          trialExpired = false;
        }
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          organization: user.organization,
          role: user.role,
          status: user.status,
          termsAccepted: user.termsAccepted,
          superUser: req.jwtUser!.superUser || false, // Include super user flag for frontend
        },
        subscription: subscription ? {
          status: subscription.status,
          planType: subscription.planType,
          sessionsUsed: parseInt(subscription.sessionsUsed || '0'),
          sessionsRemaining,
          sessionsLimit: subscription.sessionsLimit ? parseInt(subscription.sessionsLimit) : null,
          minutesUsed: parseInt(subscription.minutesUsed || '0'),
          minutesRemaining,
          minutesLimit: subscription.minutesLimit ? parseInt(subscription.minutesLimit) : null,
          trialExpired,
          isTrialUser,
          currentPeriodEnd: subscription.currentPeriodEnd,
        } : null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Get AI engine settings
  app.get("/api/auth/ai-engine-settings", authenticateToken, async (req: Request, res: Response) => {
    try {
      const settings = await authStorage.getAIEngineSettings(req.jwtUser!.userId);
      res.json(settings);
    } catch (error) {
      console.error("Get AI engine settings error:", error);
      res.status(500).json({ message: "Failed to get AI engine settings" });
    }
  });
  
  // Set or update AI engine settings
  app.post("/api/auth/ai-engine-settings", authenticateToken, async (req: Request, res: Response) => {
    try {
      const aiEngineSchema = z.object({
        aiEngine: z.enum(['default', 'openai', 'grok', 'claude', 'gemini', 'deepseek', 'kimi']),
        apiKey: z.string().min(1, "API key is required"),
      });
      
      const { aiEngine, apiKey } = aiEngineSchema.parse(req.body);
      
      // For default engine, skip API key validation and use a placeholder
      if (aiEngine === 'default') {
        console.log(`User ${req.jwtUser!.userId} selected Default AI Engine (Rev Winner's API key)`);
        
        // Store a placeholder encrypted value to satisfy database constraints
        const encryptedKey = encryptApiKey('default');
        
        await authStorage.updateAIEngineSettings(req.jwtUser!.userId, aiEngine, encryptedKey);
        
        await eventLogger.log({
          actorId: req.jwtUser!.userId,
          action: 'user.ai_engine_updated',
          targetType: 'user',
          targetId: req.jwtUser!.userId,
          metadata: { aiEngine: 'default' },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
        
        return res.json({ 
          message: "Default AI engine configured successfully",
          aiEngine: 'default',
          setupCompleted: true
        });
      }
      
      // Validate API key before saving (for non-default engines)
      const { validateAPIKey } = await import("./services/ai-engine");
      console.log(`🔐 Validating ${aiEngine} API key for user ${req.jwtUser!.userId}...`);
      const validation = await validateAPIKey(aiEngine, apiKey);
      
      if (!validation.valid) {
        console.error(`❌ ${aiEngine} API key validation failed:`, validation.error);
        return res.status(400).json({ 
          message: `Invalid ${aiEngine.toUpperCase()} API key: ${validation.error || 'Please check your API key and try again'}` 
        });
      }
      
      console.log(`${aiEngine} API key validated successfully`);
      
      const encryptedKey = encryptApiKey(apiKey);
      
      await authStorage.updateAIEngineSettings(req.jwtUser!.userId, aiEngine, encryptedKey);
      
      await eventLogger.log({
        actorId: req.jwtUser!.userId,
        action: 'user.ai_engine_updated',
        targetType: 'user',
        targetId: req.jwtUser!.userId,
        metadata: { aiEngine },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ 
        message: "AI engine settings updated successfully",
        aiEngine,
        setupCompleted: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update AI engine settings error:", error);
      res.status(500).json({ message: "Failed to update AI engine settings" });
    }
  });
}
