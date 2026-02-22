import { Router, type Request, type Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authStorage } from "./storage-auth";
import { authenticateToken, requireAdmin } from "./middleware/auth";
import { db } from "./db";
import { auditLogs, authUsers, trafficLogs, insertTrafficLogSchema } from "../shared/schema";
import { eq, and, or, sql, between } from "drizzle-orm";
import { eventLogger } from './services/event-logger';
import { performanceMonitor } from './middleware/performance-logger';
import { jobQueue } from './services/job-queue';
import { generateAccessToken, generateRefreshToken } from "./utils/jwt";

// Helper function to get Razorpay credentials based on environment
// RAZORPAY_MODE takes absolute precedence - if set to LIVE, use LIVE regardless of NODE_ENV
function getRazorpayKeyId(): string | undefined {
  // Check RAZORPAY_MODE first - if explicitly set, use it regardless of NODE_ENV
  if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
    return process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID;
  } else if (process.env.RAZORPAY_MODE === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID;
  }
  
  // Fallback: auto-detect based on NODE_ENV only if RAZORPAY_MODE is not set
  const isDevelopment = process.env.NODE_ENV === 'development';
  const razorpayMode = isDevelopment ? 'TEST' : 'LIVE';
  
  if (razorpayMode === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID;
  } else {
    return process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID;
  }
}

function getRazorpayKeySecret(): string | undefined {
  // Check RAZORPAY_MODE first - if explicitly set, use it regardless of NODE_ENV
  if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
    return process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  } else if (process.env.RAZORPAY_MODE === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  }
  
  // Fallback: auto-detect based on NODE_ENV only if RAZORPAY_MODE is not set
  const isDevelopment = process.env.NODE_ENV === 'development';
  const razorpayMode = isDevelopment ? 'TEST' : 'LIVE';
  
  if (razorpayMode === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  } else {
    return process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  }
}

// Schema for creating admin users with strong password validation
const createAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&#]/, "Password must contain at least one special character"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
});

export function setupAdminRoutes(app: Router) {
  // ========================================
  // ADMIN LOGIN (Public - No Auth Required)
  // ========================================
  
  // Admin login endpoint
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        usernameOrEmail: z.string().min(1, "Email or username is required"),
        password: z.string().min(1, "Password is required"),
        forceLogin: z.boolean().optional(),
      });

      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }

      const { usernameOrEmail, password, forceLogin } = validationResult.data;

      // Find user by email or username
      const user = await authStorage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user has a password set
      if (!user.hashedPassword) {
        console.error("Admin user found but has no password:", { email: user.email, userId: user.id });
        return res.status(500).json({ message: "Account configuration error. Please contact support." });
      }

      // Verify user is an admin or super_admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        // Log audit for unauthorized access attempt
        await eventLogger.log({
          actorId: user.id,
          action: 'admin.access_denied',
          targetType: 'user',
          targetId: user.id,
          metadata: { reason: 'User is not an admin or super admin', role: user.role },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
      if (!isValidPassword) {
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

      // Delete all existing refresh tokens for single-device access
      await authStorage.deleteUserRefreshTokens(user.id);
      
      // Increment session version for immediate single-device logout
      const sessionVersion = await authStorage.incrementSessionVersion(user.id);

      // Generate tokens with session version and all required fields
      /*
      // const accessToken = jwt.sign(
      //   { 
      //     userId: user.id, 
      //     email: user.email,
      //     role: user.role,
      //     username: user.username,
      //     sessionVersion 
      //   },
      //   process.env.JWT_SECRET!,
      //   { expiresIn: '15m' }
      // );

      // const refreshToken = jwt.sign(
      //   { 
      //     userId: user.id, 
      //     email: user.email,
      //     role: user.role,
      //     username: user.username,
      //     sessionVersion 
      //   },
      //   process.env.JWT_REFRESH_SECRET!,
      //   { expiresIn: '7d' }
      // );
*/
const accessToken = generateAccessToken({
  userId: user.id,
  email: user.email,
  role: user.role,
  username: user.username,
  sessionVersion
});

const refreshToken = generateRefreshToken({
  userId: user.id,
  email: user.email,
  role: user.role,
  username: user.username,
  sessionVersion
});
      // Log successful admin login
      await eventLogger.log({
        actorId: user.id,
        action: 'admin.login',
        targetType: 'user',
        targetId: user.id,
        metadata: { email: user.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // All other admin routes require authentication and admin role
  app.use("/api/admin", authenticateToken, requireAdmin);
  
  // ========================================
  // USER MANAGEMENT
  // ========================================
  
  // Get all users with detailed information and filters (must come BEFORE /:id)
  app.get("/api/admin/users/detailed", async (req: Request, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        role: req.query.role as string,
        planType: req.query.planType as string,
      };
      
      const users = await authStorage.getAllUsersWithDetails(filters);
      res.json({ users });
    } catch (error) {
      console.error("Get detailed users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  // Get individual users (not part of any organization) with pagination and filters
  app.get("/api/admin/users/individual", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const subscriptionStatus = req.query.subscriptionStatus as string;
      const planType = req.query.planType as string;
      
      // Build filter conditions
      const filters: any = {};
      if (search) filters.search = search;
      if (subscriptionStatus && subscriptionStatus !== 'all') filters.status = subscriptionStatus;
      if (planType && planType !== 'all') filters.planType = planType;
      
      // Get individual users (not part of any organization) with subscription data
      const allUsersData = await authStorage.getIndividualUsersWithDetails(filters);
      
      // Apply pagination
      const totalCount = allUsersData.length;
      const totalPages = Math.ceil(totalCount / limit);
      const paginatedUsers = allUsersData.slice(offset, offset + limit);
      
      // Transform data to match frontend expectations
      const usersWithSubscriptions = paginatedUsers.map((row: any) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        organization: row.organization,
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        subscription: row.subscription_id ? {
          id: row.subscription_id,
          userId: row.id,
          planType: row.plan_type,
          status: row.subscription_status,
          currentPeriodStart: row.current_period_start,
          currentPeriodEnd: row.current_period_end,
          minutesUsed: row.minutes_used || '0',
          minutesLimit: row.minutes_limit,
          createdAt: row.created_at,
        } : null,
      }));
      
      res.json({ 
        users: usersWithSubscriptions, 
        pagination: {
          page,
          limit,
          totalPages,
          totalCount
        }
      });
    } catch (error) {
      console.error("Get individual users error:", error);
      res.status(500).json({ message: "Failed to get individual users" });
    }
  });

  // Get all users with pagination and filters
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const subscriptionStatus = req.query.subscriptionStatus as string;
      const planType = req.query.planType as string;
      
      // Build filter conditions
      const filters: any = {};
      if (search) filters.search = search;
      if (subscriptionStatus && subscriptionStatus !== 'all') filters.status = subscriptionStatus;
      if (planType && planType !== 'all') filters.planType = planType;
      
      // Get users with subscription data using optimized query
      const allUsersData = await authStorage.getAllUsersWithDetails(filters);
      
      // Apply pagination
      const totalCount = allUsersData.length;
      const totalPages = Math.ceil(totalCount / limit);
      const paginatedUsers = allUsersData.slice(offset, offset + limit);
      
      // Transform data to match frontend expectations
      const usersWithSubscriptions = paginatedUsers.map((row: any) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        organization: row.organization,
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        subscription: row.subscription_id ? {
          id: row.subscription_id,
          userId: row.id,
          planType: row.plan_type,
          status: row.subscription_status,
          currentPeriodStart: row.current_period_start,
          currentPeriodEnd: row.current_period_end,
          minutesUsed: row.minutes_used || '0',
          minutesLimit: row.minutes_limit,
          createdAt: row.created_at,
        } : null,
      }));
      
      res.json({ 
        users: usersWithSubscriptions, 
        pagination: {
          page,
          limit,
          totalPages,
          totalCount
        }
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  // Get comprehensive user profile with all details (must come BEFORE /:id)
  app.get("/api/admin/users/:id/detailed", async (req: Request, res: Response) => {
    try {
      const profile = await authStorage.getUserDetailedProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log the profile data to verify what's being returned from database
      console.log('Admin User Detailed Profile API Response:', {
        userId: profile.user?.id,
        email: profile.user?.email,
        plan_type: profile.user?.plan_type,
        subscription_status: profile.user?.subscription_status,
        subscription_id: profile.user?.subscription_id,
        sessions_used: profile.user?.sessions_used,
        sessions_limit: profile.user?.sessions_limit,
        minutes_used: profile.user?.minutes_used,
        minutes_limit: profile.user?.minutes_limit,
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Get user detailed profile error:", error);
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });
  
  // Get single user
  app.get("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await authStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const subscription = await authStorage.getSubscriptionByUserId(user.id);
      const payments = await authStorage.getPaymentsByUserId(user.id);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          organization: user.organization,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        subscription,
        payments,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Suspend user
  app.post("/api/admin/users/:id/suspend", async (req: Request, res: Response) => {
    try {
      const user = await authStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent self-suspension
      if (req.jwtUser?.userId === req.params.id) {
        return res.status(400).json({ message: "Cannot suspend your own account" });
      }
      
      const updatedUser = await authStorage.updateUser(req.params.id, {
        status: 'suspended',
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'user.suspended',
        targetType: 'user',
        targetId: req.params.id,
        metadata: { adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "User suspended successfully", user: updatedUser });
    } catch (error) {
      console.error("Suspend user error:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });
  
  // Reactivate user
  app.post("/api/admin/users/:id/activate", async (req: Request, res: Response) => {
    try {
      const user = await authStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Note: Allowing self-activation is safe (admin reactivating themselves after suspension would be a valid recovery scenario)
      // However, they shouldn't be able to reach this point if they're suspended
      
      const updatedUser = await authStorage.updateUser(req.params.id, {
        status: 'active',
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'user.activated',
        targetType: 'user',
        targetId: req.params.id,
        metadata: { adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "User activated successfully", user: updatedUser });
    } catch (error) {
      console.error("Activate user error:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  // Update user (edit all fields)
  app.patch("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await authStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the current admin user making the request
      const currentAdmin = req.jwtUser?.userId ? await authStorage.getUserById(req.jwtUser.userId) : null;
      const isSuperAdmin = currentAdmin?.role === 'super_admin';

      const updateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        mobile: z.string().optional(),
        organization: z.string().optional(),
        role: z.enum(['user', 'license_manager', 'admin', 'super_admin']).optional(),
        status: z.enum(['active', 'suspended', 'deleted']).optional(),
      });

      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }

      // Prevent self-destructive changes (demoting own role or changing own status)
      if (req.jwtUser?.userId === req.params.id) {
        if (validationResult.data.role && validationResult.data.role !== user.role) {
          return res.status(400).json({ message: "Cannot change your own role" });
        }
        if (validationResult.data.status && validationResult.data.status !== user.status) {
          return res.status(400).json({ message: "Cannot change your own status" });
        }
      }

      // Role change restrictions: Only super admins can assign super_admin or admin roles
      if (validationResult.data.role) {
        const newRole = validationResult.data.role;
        
        // Only super_admin can assign super_admin role
        if (newRole === 'super_admin' && !isSuperAdmin) {
          return res.status(403).json({ 
            message: "Only super administrators can assign super admin role" 
          });
        }
        
        // Only super_admin can assign admin role
        if (newRole === 'admin' && !isSuperAdmin) {
          return res.status(403).json({ 
            message: "Only super administrators can assign admin role" 
          });
        }

        // Prevent modifying another super_admin unless you are also super_admin
        if (user.role === 'super_admin' && !isSuperAdmin) {
          return res.status(403).json({ 
            message: "Only super administrators can modify super admin accounts" 
          });
        }
      }

      // If email is being changed, check it's not already in use
      if (validationResult.data.email && validationResult.data.email !== user.email) {
        const existingUser = await authStorage.getUserByEmail(validationResult.data.email);
        if (existingUser) {
          return res.status(409).json({ message: "Email already in use by another user" });
        }
      }

      const updatedUser = await authStorage.updateUser(req.params.id, validationResult.data);

      // Log audit with role change details
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: validationResult.data.role ? 'user.role_changed' : 'user.updated',
        targetType: 'user',
        targetId: req.params.id,
        metadata: { 
          adminId: req.jwtUser?.userId,
          adminRole: currentAdmin?.role,
          changes: validationResult.data,
          previousRole: user.role,
          newRole: validationResult.data.role
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await authStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting yourself
      if (req.jwtUser?.userId === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Soft delete by updating status to 'deleted'
      await authStorage.updateUser(req.params.id, {
        status: 'deleted',
      });

      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'user.deleted',
        targetType: 'user',
        targetId: req.params.id,
        metadata: { 
          adminId: req.jwtUser?.userId,
          deletedUserEmail: user.email
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // ========================================
  // COMPREHENSIVE USER MANAGEMENT (Enhanced)
  // ========================================
  
  // Update user status (pause/restore/activate/suspend)
  app.patch("/api/admin/users/:id/status", async (req: Request, res: Response) => {
    try {
      const statusSchema = z.object({
        status: z.enum(['active', 'suspended', 'pending']),
        reason: z.string().optional(),
      });
      
      const validationResult = statusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const user = await authStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent self-status change
      if (req.jwtUser?.userId === req.params.id) {
        return res.status(400).json({ message: "Cannot change your own status" });
      }
      
      await authStorage.updateUserStatus(
        req.params.id, 
        validationResult.data.status,
        validationResult.data.reason
      );
      
      res.json({ 
        message: `User status updated to ${validationResult.data.status} successfully` 
      });
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  
  // Grant time extension to user
  app.post("/api/admin/users/:id/time-extension", async (req: Request, res: Response) => {
    try {
      const extensionSchema = z.object({
        extensionType: z.enum(['trial_extension', 'minutes_addition', 'subscription_extension']),
        extensionValue: z.string().min(1, "Extension value is required"),
        reason: z.string().min(1, "Reason is required"),
        expiresAt: z.string().optional(),
      });
      
      const validationResult = extensionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const user = await authStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await authStorage.grantTimeExtension(
        req.params.id,
        validationResult.data.extensionType,
        validationResult.data.extensionValue,
        validationResult.data.reason,
        req.jwtUser?.userId || '',
        validationResult.data.expiresAt ? new Date(validationResult.data.expiresAt) : undefined
      );
      
      res.json({ message: "Time extension granted successfully" });
    } catch (error) {
      console.error("Grant time extension error:", error);
      res.status(500).json({ message: "Failed to grant time extension" });
    }
  });
  
  // Get user session history
  app.get("/api/admin/users/:id/session-history", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const sessions = await authStorage.getUserSessionHistory(req.params.id, limit);
      res.json({ sessions });
    } catch (error) {
      console.error("Get session history error:", error);
      res.status(500).json({ message: "Failed to get session history" });
    }
  });
  
  // Get user time extensions
  app.get("/api/admin/users/:id/time-extensions", async (req: Request, res: Response) => {
    try {
      const extensions = await authStorage.getUserTimeExtensions(req.params.id);
      res.json({ extensions });
    } catch (error) {
      console.error("Get time extensions error:", error);
      res.status(500).json({ message: "Failed to get time extensions" });
    }
  });
  
  // Issue refund
  app.post("/api/admin/refunds", async (req: Request, res: Response) => {
    try {
      const refundSchema = z.object({
        paymentId: z.string().min(1, "Payment ID is required"),
        userId: z.string().min(1, "User ID is required"),
        amount: z.string().min(1, "Amount is required"),
        currency: z.string().default("USD"),
        reason: z.string().min(1, "Reason is required"),
      });
      
      const validationResult = refundSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      await authStorage.issueRefund(
        validationResult.data.paymentId,
        validationResult.data.userId,
        validationResult.data.amount,
        validationResult.data.currency,
        validationResult.data.reason,
        req.jwtUser?.userId || ''
      );
      
      res.json({ message: "Refund issued successfully" });
    } catch (error) {
      console.error("Issue refund error:", error);
      res.status(500).json({ message: "Failed to issue refund" });
    }
  });
  
  // Get user refunds
  app.get("/api/admin/users/:id/refunds", async (req: Request, res: Response) => {
    try {
      const refunds = await authStorage.getRefundsByUserId(req.params.id);
      res.json({ refunds });
    } catch (error) {
      console.error("Get user refunds error:", error);
      res.status(500).json({ message: "Failed to get refunds" });
    }
  });
  
  // ========================================
  // METRICS & ANALYTICS
  // ========================================
  
  // Get dashboard metrics
  app.get("/api/admin/metrics/dashboard", async (req: Request, res: Response) => {
    try {
      const userMetrics = await authStorage.getUserMetrics();
      const subscriptionMetrics = await authStorage.getSubscriptionMetrics();
      const revenueMetrics = await authStorage.getRevenueMetrics();
      
      res.json({
        users: userMetrics,
        subscriptions: subscriptionMetrics,
        revenue: revenueMetrics,
      });
    } catch (error) {
      console.error("Get metrics error:", error);
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });
  
  // Get user metrics
  app.get("/api/admin/metrics/users", async (req: Request, res: Response) => {
    try {
      const data = await authStorage.getUserMetrics();
      res.json({ data });
    } catch (error) {
      console.error("Get user metrics error:", error);
      res.status(500).json({ message: "Failed to get user metrics" });
    }
  });
  
  // Get subscription metrics
  app.get("/api/admin/metrics/subscriptions", async (req: Request, res: Response) => {
    try {
      const data = await authStorage.getSubscriptionMetrics();
      res.json({ data });
    } catch (error) {
      console.error("Get subscription metrics error:", error);
      res.status(500).json({ message: "Failed to get subscription metrics" });
    }
  });
  
  // Get revenue metrics
  app.get("/api/admin/metrics/revenue", async (req: Request, res: Response) => {
    try {
      const data = await authStorage.getRevenueMetrics();
      res.json({ data });
    } catch (error) {
      console.error("Get revenue metrics error:", error);
      res.status(500).json({ message: "Failed to get revenue metrics" });
    }
  });

  // ========================================
  // SYSTEM HEALTH & PERFORMANCE
  // ========================================

  // System health endpoint - performance monitoring
  app.get("/api/admin/system-health", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const healthReport = performanceMonitor.getHealthReport();
      const jobStats = jobQueue.getStats();
      
      res.json({
        success: true,
        health: {
          ...healthReport,
          queue: {
            ...healthReport.queue,
            ...jobStats
          }
        }
      });
    } catch (error) {
      console.error("Get system health error:", error);
      res.status(500).json({ message: "Failed to get system health" });
    }
  });

  // Route-level performance metrics
  app.get("/api/admin/system-health/routes", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const routeMetrics = performanceMonitor.getRouteMetrics();
      res.json({
        success: true,
        routes: routeMetrics
      });
    } catch (error) {
      console.error("Get route metrics error:", error);
      res.status(500).json({ message: "Failed to get route metrics" });
    }
  });

  // Reset performance metrics (useful for testing)
  app.post("/api/admin/system-health/reset", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      performanceMonitor.reset();
      res.json({
        success: true,
        message: "Performance metrics reset successfully"
      });
    } catch (error) {
      console.error("Reset metrics error:", error);
      res.status(500).json({ message: "Failed to reset metrics" });
    }
  });
  
  // ========================================
  // SUBSCRIPTION PLANS
  // ========================================
  
  // Get all subscription plans
  app.get("/api/admin/plans", async (req: Request, res: Response) => {
    try {
      const plans = await authStorage.getAllPlans();
      res.json({ plans });
    } catch (error) {
      console.error("Get plans error:", error);
      res.status(500).json({ message: "Failed to get plans" });
    }
  });
  
  // ========================================
  // ADMIN MANAGEMENT
  // ========================================
  
  // Create new admin user
  app.post("/api/admin/create-admin", async (req: Request, res: Response) => {
    try {
      // Validate request body with strong password requirements
      const validationResult = createAdminSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(", ");
        return res.status(400).json({ 
          message: "Validation failed: " + errors,
          errors: validationResult.error.errors
        });
      }
      
      const { email, password, firstName, lastName } = validationResult.data;
      
      // Check if user already exists
      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      // Generate unique username from email
      let username = email.split('@')[0];
      
      // Ensure username is unique by checking and appending suffix if needed
      let usernameExists = await authStorage.getUserByUsername(username);
      let suffix = 1;
      while (usernameExists) {
        username = `${email.split('@')[0]}_${suffix}`;
        usernameExists = await authStorage.getUserByUsername(username);
        suffix++;
      }
      
      // Create admin user
      const createdUser = await authStorage.createUser({
        email,
        password,
        firstName,
        lastName,
        username,
        organization: "System Administrator",
        role: "admin",
      });
      
      // Update to active status and verify email for admin
      const newAdmin = await authStorage.updateUser(createdUser.id, {
        status: "active",
        emailVerified: true,
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'admin.created',
        targetType: 'user',
        targetId: newAdmin.id,
        metadata: { 
          createdBy: req.jwtUser?.userId,
          email: newAdmin.email,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.status(201).json({ 
        message: "Admin user created successfully",
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName,
          username: newAdmin.username,
          role: newAdmin.role,
        }
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });
  
  // ========================================
  // RAZORPAY CONFIGURATION
  // ========================================
  
  // Get Razorpay configuration status
  app.get("/api/admin/razorpay/config", async (req: Request, res: Response) => {
    try {
      const keyId = getRazorpayKeyId();
      const keySecret = getRazorpayKeySecret();
      
      const isConfigured = !!(keyId && keySecret);
      
      // Mask key ID to show prefix and last 4 characters
      let maskedKeyId = null;
      if (keyId) {
        if (keyId.length >= 12) {
          maskedKeyId = `${keyId.substring(0, 8)}...${keyId.substring(keyId.length - 4)}`;
        } else {
          maskedKeyId = `${keyId.substring(0, 4)}...`;
        }
      }
      
      res.json({
        configured: isConfigured,
        testMode: false, // Razorpay production mode
        keyId: maskedKeyId,
        lastUpdated: null, // Environment secrets don't have timestamps
      });
    } catch (error) {
      console.error("Get Razorpay config error:", error);
      res.status(500).json({ message: "Failed to get Razorpay configuration" });
    }
  });
  
  // ========================================
  // ENHANCED ANALYTICS
  // ========================================
  
  // Get user growth data
  app.get("/api/admin/analytics/user-growth", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await authStorage.getUserGrowthData(days);
      res.json({ data });
    } catch (error) {
      console.error("Get user growth error:", error);
      res.status(500).json({ message: "Failed to get user growth data" });
    }
  });
  
  // Get revenue trends
  app.get("/api/admin/analytics/revenue-trends", async (req: Request, res: Response) => {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const data = await authStorage.getRevenueTrends(months);
      res.json({ data });
    } catch (error) {
      console.error("Get revenue trends error:", error);
      res.status(500).json({ message: "Failed to get revenue trends" });
    }
  });
  
  // Get top users by usage
  app.get("/api/admin/analytics/top-users", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const users = await authStorage.getTopUsersByUsage(limit);
      res.json({ users });
    } catch (error) {
      console.error("Get top users error:", error);
      res.status(500).json({ message: "Failed to get top users" });
    }
  });
  
  // ========================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================
  
  // Extend trial period
  app.post("/api/admin/subscriptions/:userId/extend-trial", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { days } = req.body;
      
      if (!days || days < 1) {
        return res.status(400).json({ message: "Days must be a positive number" });
      }
      
      await authStorage.extendTrialPeriod(userId, parseInt(days));
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'subscription.trial_extended',
        targetType: 'user',
        targetId: userId,
        metadata: { days, adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Trial period extended successfully" });
    } catch (error) {
      console.error("Extend trial error:", error);
      res.status(500).json({ message: "Failed to extend trial period" });
    }
  });
  
  // Cancel subscription
  app.post("/api/admin/subscriptions/:subscriptionId/cancel", async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body;
      
      const subscription = await authStorage.cancelSubscriptionWithReason(subscriptionId, reason || "Canceled by admin");
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'subscription.canceled',
        targetType: 'subscription',
        targetId: subscriptionId,
        metadata: { reason, adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Subscription canceled successfully", subscription });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
  
  // Get expiring subscriptions
  app.get("/api/admin/subscriptions/expiring-soon", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const subscriptions = await authStorage.getExpiringSubscriptions(days);
      res.json({ subscriptions });
    } catch (error) {
      console.error("Get expiring subscriptions error:", error);
      res.status(500).json({ message: "Failed to get expiring subscriptions" });
    }
  });
  
  // ========================================
  // MINUTES MANAGEMENT
  // ========================================
  
  // Grant minutes to user
  app.post("/api/admin/minutes/grant", async (req: Request, res: Response) => {
    try {
      const { userId, minutes, reason, expiryDays } = req.body;
      
      if (!userId || !minutes || minutes < 1) {
        return res.status(400).json({ message: "User ID and positive minutes amount required" });
      }
      
      await authStorage.grantMinutes(userId, parseInt(minutes), reason || "Admin grant", expiryDays || 30);
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'minutes.granted',
        targetType: 'user',
        targetId: userId,
        metadata: { minutes, reason, expiryDays, adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Minutes granted successfully" });
    } catch (error) {
      console.error("Grant minutes error:", error);
      res.status(500).json({ message: "Failed to grant minutes" });
    }
  });
  
  // Bulk grant minutes
  app.post("/api/admin/minutes/bulk-grant", async (req: Request, res: Response) => {
    try {
      const { userIds, minutes, reason, expiryDays } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "User IDs array required" });
      }
      
      if (!minutes || minutes < 1) {
        return res.status(400).json({ message: "Positive minutes amount required" });
      }
      
      await authStorage.bulkGrantMinutes(userIds, parseInt(minutes), reason || "Bulk admin grant", expiryDays || 30);
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'minutes.bulk_granted',
        targetType: 'bulk_users',
        metadata: { userCount: userIds.length, minutes, reason, expiryDays, adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: `Minutes granted to ${userIds.length} users successfully` });
    } catch (error) {
      console.error("Bulk grant minutes error:", error);
      res.status(500).json({ message: "Failed to bulk grant minutes" });
    }
  });
  
  // Get all minutes purchases
  app.get("/api/admin/minutes/purchases", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const purchases = await authStorage.getAllMinutesPurchases(limit);
      res.json({ purchases });
    } catch (error) {
      console.error("Get minutes purchases error:", error);
      res.status(500).json({ message: "Failed to get minutes purchases" });
    }
  });
  
  // Get expiring minutes
  app.get("/api/admin/minutes/expiring-soon", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const purchases = await authStorage.getExpiringMinutesPurchases(days);
      res.json({ purchases });
    } catch (error) {
      console.error("Get expiring minutes error:", error);
      res.status(500).json({ message: "Failed to get expiring minutes" });
    }
  });
  
  // Extend minutes purchase
  app.patch("/api/admin/minutes/:purchaseId/extend", async (req: Request, res: Response) => {
    try {
      const { purchaseId } = req.params;
      const { additionalDays } = req.body;
      
      if (!additionalDays || additionalDays < 1) {
        return res.status(400).json({ message: "Additional days must be a positive number" });
      }
      
      await authStorage.extendMinutesPurchase(purchaseId, parseInt(additionalDays));
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'minutes_purchase.extended',
        targetType: 'minutes_purchase',
        targetId: purchaseId,
        metadata: { additionalDays, adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Minutes purchase extended successfully" });
    } catch (error) {
      console.error("Extend minutes purchase error:", error);
      res.status(500).json({ message: "Failed to extend minutes purchase" });
    }
  });
  
  // ========================================
  // PROMO CODE MANAGEMENT
  // ========================================
  
  // Get all promo codes
  app.get("/api/admin/promo-codes", async (req: Request, res: Response) => {
    try {
      const codes = await authStorage.getAllPromoCodes();
      res.json({ codes });
    } catch (error) {
      console.error("Get promo codes error:", error);
      res.status(500).json({ message: "Failed to get promo codes" });
    }
  });
  
  // Create promo code
  app.post("/api/admin/promo-codes", async (req: Request, res: Response) => {
    try {
      const createSchema = z.object({
        code: z.string().min(3).max(50),
        category: z.enum(['all', 'platform_subscription', 'session_minutes', 'train_me', 'service', 'dai']),
        allowedPlanTypes: z.array(z.string()).optional(), // Add this field
        discountType: z.enum(['percentage', 'fixed']),
        discountValue: z.string(),
        maxUses: z.string().optional(),
        expiresAt: z.string().optional(),
      });
      
      const validationResult = createSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const { code, category, allowedPlanTypes, discountType, discountValue, maxUses, expiresAt } = validationResult.data;
      
      const promoCode = await authStorage.createPromoCode({
        code,
        category,
        allowedPlanTypes, // Pass this to storage
        discountType,
        discountValue,
        maxUses,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'promo_code.created',
        targetType: 'promo_code',
        targetId: promoCode.id,
        metadata: { code, category, allowedPlanTypes, discountType, discountValue, adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.status(201).json({ message: "Promo code created successfully", promoCode });
    } catch (error) {
      console.error("Create promo code error:", error);
      res.status(500).json({ message: "Failed to create promo code" });
    }
  });
  
  // Update promo code
  app.patch("/api/admin/promo-codes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        isActive: z.boolean().optional(),
        maxUses: z.string().optional(),
        expiresAt: z.string().optional(),
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const data = validationResult.data;
      const updateData: any = {};
      
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
      if (data.expiresAt !== undefined) updateData.expiresAt = new Date(data.expiresAt);
      
      const promoCode = await authStorage.updatePromoCode(id, updateData);
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'promo_code.updated',
        targetType: 'promo_code',
        targetId: id,
        metadata: { changes: updateData, adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Promo code updated successfully", promoCode });
    } catch (error) {
      console.error("Update promo code error:", error);
      res.status(500).json({ message: "Failed to update promo code" });
    }
  });
  
  // Delete promo code
  app.delete("/api/admin/promo-codes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await authStorage.deletePromoCode(id);
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'promo_code.deleted',
        targetType: 'promo_code',
        targetId: id,
        metadata: { adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Promo code deleted successfully" });
    } catch (error) {
      console.error("Delete promo code error:", error);
      res.status(500).json({ message: "Failed to delete promo code" });
    }
  });
  
  // Get promo code analytics
  app.get("/api/admin/promo-codes/analytics", async (req: Request, res: Response) => {
    try {
      const analytics = await authStorage.getPromoCodeAnalytics();
      res.json({ analytics });
    } catch (error) {
      console.error("Get promo code analytics error:", error);
      res.status(500).json({ message: "Failed to get promo code analytics" });
    }
  });
  
  // Get promo code usage history
  app.get("/api/admin/promo-codes/:id/usage-history", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const history = await authStorage.getPromoCodeUsageHistory(id);
      res.json({ history });
    } catch (error) {
      console.error("Get promo code usage history error:", error);
      res.status(500).json({ message: "Failed to get promo code usage history" });
    }
  });
  
  // ========================================
  // BILLING PORTAL
  // ========================================
  
  // Get all transactions (payments + session minutes purchases)
  app.get("/api/admin/billing/transactions", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        page = '1', 
        limit = '50', 
        status, 
        type, 
        customerType,
        search, 
        startDate, 
        endDate,
        export: exportFormat
      } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Check if export is requested
      if (exportFormat === 'csv') {
        // Adjust endDate to include the full day (23:59:59)
        let adjustedEndDate = endDate as string;
        if (adjustedEndDate && !adjustedEndDate.includes(' ')) {
          adjustedEndDate = `${adjustedEndDate} 23:59:59`;
        }
        
        // Get ALL transactions for export (no pagination)
        const allTransactions = await authStorage.getBillingTransactions({
          limit: 10000, // Large limit for export
          offset: 0,
          status: status as string,
          type: type as string,
          customerType: customerType as string,
          search: search as string,
          startDate: startDate as string,
          endDate: adjustedEndDate,
        });
        
        // Generate CSV
        const csvHeaders = [
          'Date',
          'User Name',
          'User Email',
          'Transaction Type',
          'Customer Type',
          'Organization',
          'Amount',
          'Currency',
          'Status',
          'Razorpay Payment ID',
          'Razorpay Order ID',
          'Refunded Amount',
          'Refund Reason',
        ];
        
        const csvRows = allTransactions.map((t) => [
          new Date(t.createdAt).toISOString(),
          `${t.userFirstName} ${t.userLastName}`,
          t.userEmail,
          t.type === 'subscription_payment' ? 'Subscription' : 'Minutes',
          t.customerType || 'Individual Subscriber',
          t.organizationName || '',
          (parseFloat(t.amount) / 100).toFixed(2),
          t.currency,
          t.status,
          t.razorpayPaymentId || '',
          t.razorpayOrderId || '',
          t.refundAmount ? (parseFloat(t.refundAmount) / 100).toFixed(2) : '',
          t.refundReason || '',
        ]);
        
        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => 
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
              ? `"${cell.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes if needed
              : cell
          ).join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="billing-transactions-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csvContent);
      }
      
      // Regular JSON response
      // Get all transactions with user information
      // Adjust endDate to include the full day (23:59:59) if provided
      let adjustedEndDate: string | undefined = endDate as string | undefined;
      if (adjustedEndDate && adjustedEndDate.trim() && !adjustedEndDate.includes(' ')) {
        adjustedEndDate = `${adjustedEndDate.trim()} 23:59:59`;
      } else if (!adjustedEndDate || !adjustedEndDate.trim()) {
        adjustedEndDate = undefined;
      }
      
      const transactions = await authStorage.getBillingTransactions({
        limit: limitNum,
        offset,
        status: status && (status as string).trim() ? status as string : undefined,
        type: type && (type as string).trim() ? type as string : undefined,
        customerType: customerType && (customerType as string).trim() ? customerType as string : undefined,
        search: search && (search as string).trim() ? search as string : undefined,
        startDate: startDate && (startDate as string).trim() ? startDate as string : undefined,
        endDate: adjustedEndDate,
      });
      
      // Get total count for pagination
      // Use same adjusted endDate for count
      const totalCount = await authStorage.getBillingTransactionsCount({
        status: status && (status as string).trim() ? status as string : undefined,
        type: type && (type as string).trim() ? type as string : undefined,
        customerType: customerType && (customerType as string).trim() ? customerType as string : undefined,
        search: search && (search as string).trim() ? search as string : undefined,
        startDate: startDate && (startDate as string).trim() ? startDate as string : undefined,
        endDate: adjustedEndDate,
      });
      
      res.json({
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
        },
      });
    } catch (error) {
      console.error("Get billing transactions error:", error);
      res.status(500).json({ message: "Failed to get billing transactions" });
    }
  });
  
  // Get billing analytics
  app.get("/api/admin/billing/analytics", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const periodDays = parseInt(period as string);
      
      const analytics = await authStorage.getBillingAnalytics(periodDays);
      
      res.json(analytics);
    } catch (error) {
      console.error("Get billing analytics error:", error);
      res.status(500).json({ message: "Failed to get billing analytics" });
    }
  });
  
  // Get enhanced billing analytics
  app.get("/api/admin/billing/analytics/enhanced", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const periodDays = parseInt(period as string);
      
      const analytics = await authStorage.getEnhancedBillingAnalytics(periodDays);
      
      res.json(analytics);
    } catch (error) {
      console.error("Get enhanced billing analytics error:", error);
      res.status(500).json({ message: "Failed to get enhanced billing analytics" });
    }
  });
  
  // Get payment method breakdown
  app.get("/api/admin/billing/payment-methods", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const periodDays = parseInt(period as string);
      
      const breakdown = await authStorage.getPaymentMethodBreakdown(periodDays);
      
      res.json(breakdown);
    } catch (error) {
      console.error("Get payment method breakdown error:", error);
      res.status(500).json({ message: "Failed to get payment method breakdown" });
    }
  });
  
  // Get customer insights
  app.get("/api/admin/analytics/customer-insights", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const insights = await authStorage.getCustomerInsights();
      
      res.json(insights);
    } catch (error) {
      console.error("Get customer insights error:", error);
      res.status(500).json({ message: "Failed to get customer insights" });
    }
  });
  
  // Process refund
  app.post("/api/admin/billing/refund", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const refundSchema = z.object({
        transactionId: z.string(),
        transactionType: z.enum(['payment', 'minutes_purchase', 'subscription_payment', 'addon_purchase']),
        amount: z.string().optional(), // Optional for partial refunds
        reason: z.string().min(1, "Refund reason is required"),
      });
      
      const validationResult = refundSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors,
        });
      }
      
      const { transactionId, transactionType, amount, reason } = validationResult.data;
      
      // Verify user is authenticated
      if (!req.jwtUser || !req.jwtUser.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const adminId = req.jwtUser.userId;
      
      // Check Razorpay credentials
      if (!getRazorpayKeyId() || !getRazorpayKeySecret()) {
        return res.status(400).json({
          message: "Razorpay credentials not configured",
        });
      }
      
      // Get transaction details
      let transaction: any;
      let razorpayPaymentId;
      let refundAmountInPaise: number | undefined;
      let originalAmountInPaise: number | undefined;
      
      if (transactionType === 'payment' || transactionType === 'subscription_payment') {
        transaction = await authStorage.getPaymentById(transactionId);
        if (!transaction) {
          return res.status(404).json({ message: "Payment not found" });
        }
        if (transaction.status === 'refunded') {
          return res.status(400).json({ message: "This payment has already been fully refunded" });
        }
        razorpayPaymentId = transaction.razorpayPaymentId;
        originalAmountInPaise = parseFloat(transaction.amount);
        refundAmountInPaise = amount ? parseFloat(amount) : originalAmountInPaise;
      } else if (transactionType === 'minutes_purchase') {
        transaction = await authStorage.getSessionMinutesPurchaseById(transactionId);
        if (!transaction) {
          return res.status(404).json({ message: "Minutes purchase not found" });
        }
        if (transaction.status === 'refunded') {
          return res.status(400).json({ message: "This purchase has already been refunded" });
        }
        razorpayPaymentId = transaction.razorpayPaymentId;
        originalAmountInPaise = parseFloat(transaction.amountPaid);
        refundAmountInPaise = amount ? parseFloat(amount) : originalAmountInPaise;
      } else if (transactionType === 'addon_purchase') {
        const { billingStorage } = await import("./storage-billing");
        transaction = await billingStorage.getAddonPurchase(transactionId);
        if (!transaction) {
          return res.status(404).json({ message: "Addon purchase not found" });
        }
        if (transaction.status === 'refunded') {
          return res.status(400).json({ message: "This addon purchase has already been refunded" });
        }
        
        // For addon purchases, get the payment ID from multiple possible sources
        const metadata = transaction.metadata as any;
        
        // Try to get payment ID from:
        // 1. Gateway transaction (for direct purchases)
        // 2. Metadata paymentId (for cart purchases)
        // 3. Metadata cashfreePaymentId (for Cashfree payments)
        if (transaction.gatewayTransactionId) {
          const gatewayTransaction = await billingStorage.getGatewayTransaction(transaction.gatewayTransactionId);
          if (gatewayTransaction && gatewayTransaction.providerTransactionId) {
            razorpayPaymentId = gatewayTransaction.providerTransactionId;
          }
        }
        
        // If not found in gateway transaction, check metadata
        if (!razorpayPaymentId && metadata) {
          razorpayPaymentId = metadata.paymentId || metadata.cashfreePaymentId || metadata.razorpayPaymentId;
        }
        
        if (!razorpayPaymentId) {
          return res.status(400).json({ 
            message: "No payment reference found for this addon purchase",
            debug: {
              hasGatewayTransactionId: !!transaction.gatewayTransactionId,
              hasMetadata: !!metadata,
              metadataKeys: metadata ? Object.keys(metadata) : []
            }
          });
        }
        
        originalAmountInPaise = parseFloat(transaction.purchaseAmount);
        refundAmountInPaise = amount ? parseFloat(amount) : originalAmountInPaise;
      }
      
      if (!razorpayPaymentId) {
        return res.status(400).json({ message: "No Razorpay payment ID found for this transaction" });
      }
      
      console.log(`[Refund] Processing refund for payment ID: ${razorpayPaymentId}`);
      console.log(`[Refund] Transaction type: ${transactionType}`);
      console.log(`[Refund] Transaction ID: ${transactionId}`);
      
      // For addon purchases, check the gateway provider
      if (transactionType === 'addon_purchase') {
        const metadata = transaction.metadata as any;
        const gatewayProvider = metadata?.gatewayProvider;
        console.log(`[Refund] Gateway provider: ${gatewayProvider}`);
        
        if (gatewayProvider && gatewayProvider !== 'razorpay') {
          return res.status(400).json({ 
            message: `This addon purchase was made with ${gatewayProvider}, not Razorpay. Please use the appropriate refund method.`,
            gatewayProvider 
          });
        }
      }
      
      if (typeof refundAmountInPaise !== "number" || typeof originalAmountInPaise !== "number") {
        return res.status(400).json({ message: "Refund amount or original amount is missing" });
      }

      const refundAmount = refundAmountInPaise;
      const originalAmount = originalAmountInPaise;

      // Validate refund amount
      if (refundAmount <= 0) {
        return res.status(400).json({ message: "Refund amount must be greater than zero" });
      }
      
      if (refundAmount > originalAmount) {
        return res.status(400).json({ 
          message: "Refund amount cannot exceed the original transaction amount",
          refundAmount,
          originalAmount,
        });
      }
      
      // Process refund via Razorpay API
      const Razorpay = (await import("razorpay")).default;
      const keyId = getRazorpayKeyId();
      const keySecret = getRazorpayKeySecret();
      if (!keyId || !keySecret) {
        return res.status(400).json({ message: "Razorpay credentials not configured" });
      }
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      
      const refundAmountInSmallestUnit = Math.round(refundAmount); // Amount is already in paise/cents
      
      console.log(`[Refund] Calling Razorpay API with:`);
      console.log(`  - Payment ID: ${razorpayPaymentId}`);
      console.log(`  - Currency: ${transaction.currency}`);
      console.log(`  - Amount: ${refundAmountInSmallestUnit} (smallest unit)`);
      console.log(`  - Amount (display): ${transaction.currency === 'INR' ? '₹' : '$'}${(refundAmount / 100).toFixed(2)}`);
      console.log(`  - Using credentials: ${keyId?.substring(0, 10)}...`);
      
      let refundResponse;
      try {
        refundResponse = await razorpay.payments.refund(razorpayPaymentId, {
          amount: refundAmountInSmallestUnit,
          notes: {
            reason,
            adminId,
            transactionId,
            currency: transaction.currency, // Log currency for reference
          },
        });
        console.log(`[Refund] Razorpay refund successful:`, refundResponse);
      } catch (razorpayError: any) {
        console.error(`[Refund] Razorpay API error:`, razorpayError);
        
        // Provide more helpful error messages
        let errorMessage = "Failed to process refund with Razorpay";
        if (razorpayError.error?.description) {
          errorMessage = razorpayError.error.description;
        } else if (razorpayError.message) {
          errorMessage = razorpayError.message;
        }
        
        // Check if it's a payment ID not found error
        if (errorMessage.includes("does not exist") || errorMessage.includes("not found")) {
          errorMessage = `Payment ID ${razorpayPaymentId} not found in Razorpay. This may be because: 1) The payment was made with a different gateway (Cashfree), 2) The payment is in a different Razorpay account (test vs live), or 3) The payment ID is incorrect.`;
        }
        
        return res.status(400).json({ 
          message: errorMessage,
          error: razorpayError.error || razorpayError.message,
          paymentId: razorpayPaymentId,
        });
      }
      
      // Update transaction in database
      const refundData = {
        refundedAt: new Date(),
        refundAmount: refundAmount.toString(),
        refundReason: reason,
        razorpayRefundId: refundResponse.id,
        gatewayRefundId: refundResponse.id, // For addon purchases
        refundedBy: adminId,
        status: amount ? 'partially_refunded' : 'refunded',
      };
      
      if (transactionType === 'payment' || transactionType === 'subscription_payment') {
        await authStorage.updatePaymentRefund(transactionId, refundData);
      } else if (transactionType === 'minutes_purchase') {
        await authStorage.updateMinutesPurchaseRefund(transactionId, refundData);
      } else if (transactionType === 'addon_purchase') {
        const { billingStorage } = await import("./storage-billing");
        await billingStorage.updateAddonPurchaseRefund(transactionId, refundData);
      }
      
      // Create audit log
      await eventLogger.log({
        actorId: adminId,
        action: 'billing.refund_processed',
        targetType: transactionType,
        targetId: transactionId,
        metadata: {
          refundAmount: refundAmount.toString(),
          refundAmountInDollars: refundAmount.toFixed(2),
          reason,
          razorpayRefundId: refundResponse.id,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({
        message: "Refund processed successfully",
        refund: {
          id: refundResponse.id,
          amount: refundAmountInPaise,
          status: refundResponse.status || 'processed',
        },
      });
    } catch (error: any) {
      console.error("Process refund error:", error);
      if (error.response?.status === 400) {
        return res.status(400).json({
          message: error.response?.data?.message || "Invalid refund request",
        });
      }
      res.status(500).json({ message: "Failed to process refund" });
    }
  });
  
  // Delete transaction
  app.delete("/api/admin/billing/transaction/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type } = req.query;
      
      // Verify user is authenticated
      if (!req.jwtUser || !req.jwtUser.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const adminId = req.jwtUser.userId;
      
      if (!id || !type) {
        return res.status(400).json({ message: "Transaction ID and type are required" });
      }
      
      // Validate transaction type
      if (type !== 'payment' && type !== 'minutes_purchase' && type !== 'subscription_payment' && type !== 'addon_purchase') {
        return res.status(400).json({ message: "Invalid transaction type" });
      }
      
      // For addon_purchase type, we need to check which table it's actually in
      // because addon purchases are from the addon_purchases table
      let deleted = false;
      let actualType = type as string;
      
      if (type === 'addon_purchase') {
        // Try to delete from addon_purchases table
        deleted = await authStorage.deleteAddonPurchase(id);
        if (!deleted) {
          console.error(`Failed to delete addon purchase ${id} - not found in addon_purchases table`);
          return res.status(404).json({ message: "Addon purchase not found" });
        }
      } else if (type === 'payment' || type === 'subscription_payment') {
        deleted = await authStorage.deletePayment(id);
        if (!deleted) {
          console.error(`Failed to delete payment ${id} - not found in payments table`);
          return res.status(404).json({ message: "Payment not found" });
        }
      } else if (type === 'minutes_purchase') {
        deleted = await authStorage.deleteSessionMinutesPurchase(id);
        if (!deleted) {
          console.error(`Failed to delete minutes purchase ${id} - not found in session_minutes_purchases table`);
          return res.status(404).json({ message: "Minutes purchase not found" });
        }
      }
      
      console.log(`Successfully deleted ${type} transaction: ${id}`);
      
      
      // Create audit log
      await eventLogger.log({
        actorId: adminId,
        action: 'billing.transaction_deleted',
        targetType: type as string,
        targetId: id,
        metadata: {
          deletedBy: adminId,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Transaction deleted successfully" });
    } catch (error: any) {
      console.error("Delete transaction error:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  
  // ========================================
  // RAZORPAY TEST CONNECTION
  // ========================================
  
  // Get payment gateway configuration
  app.get("/api/admin/payment-config", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      // RAZORPAY_MODE takes absolute precedence - if set to LIVE, use LIVE regardless of NODE_ENV
      let razorpayMode: string;
      if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
        razorpayMode = 'LIVE';
      } else if (process.env.RAZORPAY_MODE === 'TEST') {
        razorpayMode = 'TEST';
      } else {
        // Fallback: auto-detect based on NODE_ENV only if RAZORPAY_MODE is not set
        const isDevelopment = process.env.NODE_ENV === 'development';
        razorpayMode = isDevelopment ? 'TEST' : 'LIVE';
      }
      const cashfreeMode = process.env.CASHFREE_ENVIRONMENT || (process.env.NODE_ENV === 'development' ? 'SANDBOX' : 'PRODUCTION');
      
      const razorpayKeyId = getRazorpayKeyId();
      const cashfreeAppId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_SANDBOX_APP_ID;
      
      // Check if LIVE/PRODUCTION credentials are also configured
      const hasRazorpayLive = !!(process.env.RAZORPAY_LIVE_KEY_ID || (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('test')));
      const hasCashfreeProduction = !!(process.env.CASHFREE_APP_ID && !process.env.CASHFREE_APP_ID.includes('TEST'));
      
      res.json({
        razorpay: {
          mode: razorpayMode,
          configured: !!razorpayKeyId,
          keyIdPrefix: razorpayKeyId?.substring(0, 8) + '...',
          hasLiveCredentials: hasRazorpayLive,
        },
        cashfree: {
          mode: cashfreeMode,
          configured: !!cashfreeAppId,
          appIdPrefix: cashfreeAppId?.substring(0, 8) + '...',
          hasProductionCredentials: hasCashfreeProduction,
        },
        environment: process.env.NODE_ENV || 'production',
      });
    } catch (error: any) {
      console.error("Get payment config error:", error);
      res.status(500).json({ message: "Failed to get payment configuration" });
    }
  });
  
  // Test Razorpay connection
  app.post("/api/admin/razorpay/test-connection", async (req: Request, res: Response) => {
    try {
      const Razorpay = (await import("razorpay")).default;
      const razorpayKeyId = getRazorpayKeyId();
      const razorpayKeySecret = getRazorpayKeySecret();
      
      if (!razorpayKeyId || !razorpayKeySecret) {
        return res.status(400).json({ 
          success: false,
          message: "Razorpay credentials not configured" 
        });
      }
      
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });
      
      // RAZORPAY_MODE takes absolute precedence - if set to LIVE, use LIVE regardless of NODE_ENV
      let razorpayMode: string;
      if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
        razorpayMode = 'LIVE';
      } else if (process.env.RAZORPAY_MODE === 'TEST') {
        razorpayMode = 'TEST';
      } else {
        // Fallback: auto-detect based on NODE_ENV only if RAZORPAY_MODE is not set
        const isDevelopment = process.env.NODE_ENV === 'development';
        razorpayMode = isDevelopment ? 'TEST' : 'LIVE';
      }
      
      // Test by fetching payments (will fail gracefully if credentials are invalid)
      try {
        await razorpay.payments.all({ count: 1 });
        return res.json({
          success: true,
          message: `Razorpay connection successful (${razorpayMode} mode)`,
          mode: razorpayMode,
        });
      } catch (err: any) {
        if (err.statusCode === 401) {
          console.error("Razorpay authentication failed:", err);
          return res.status(401).json({
            success: false,
            message: "Invalid Razorpay credentials",
            mode: razorpayMode,
          });
        }
        // Log detailed error server-side, but return generic message to client
        console.error("Razorpay connection test failed:", err);
        throw new Error("Connection test failed");
      }
    } catch (error: any) {
      console.error("Test Razorpay connection error:", error);
      // Return generic error message to prevent information leakage
      res.status(500).json({ 
        success: false,
        message: "Failed to test connection. Please check server logs for details." 
      });
    }
  });

  // ========================================
  // BILLING RECONCILIATION
  // ========================================

  // Manual billing reconciliation trigger
  app.post("/api/admin/billing/reconcile", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { runBillingReconciliation } = await import('./services/billing-reconciliation');
      
      const discrepancies = await runBillingReconciliation();
      
      // Group by severity
      const critical = discrepancies.filter(d => d.severity === 'critical');
      const warnings = discrepancies.filter(d => d.severity === 'warning');
      const info = discrepancies.filter(d => d.severity === 'info');
      
      res.json({
        success: true,
        totalDiscrepancies: discrepancies.length,
        summary: {
          critical: critical.length,
          warnings: warnings.length,
          info: info.length
        },
        discrepancies: discrepancies.map(d => ({
          type: d.type,
          severity: d.severity,
          details: d.details,
          suggestedAction: d.suggestedAction,
          paymentId: d.paymentId,
          subscriptionId: d.subscriptionId,
          userId: d.userId
        }))
      });
    } catch (error: any) {
      console.error("Billing reconciliation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to run billing reconciliation" 
      });
    }
  });

  // ========================================
  // AUDIT LOGS
  // ========================================

  // Get audit logs with filtering
  app.get("/api/admin/audit-logs", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        action, 
        targetType, 
        targetId, 
        actorId,
        limit = "100",
        offset = "0"
      } = req.query;

      let query = db.select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        actorEmail: authUsers.email,
        actorName: sql<string>`CONCAT(${authUsers.firstName}, ' ', ${authUsers.lastName})`,
      })
      .from(auditLogs)
      .leftJoin(authUsers, eq(auditLogs.actorId, authUsers.id))
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

      // Apply filters
      const conditions = [];
      if (action) {
        conditions.push(sql`${auditLogs.action} LIKE ${`%${action}%`}`);
      }
      if (targetType) {
        conditions.push(eq(auditLogs.targetType, targetType as string));
      }
      if (targetId) {
        conditions.push(eq(auditLogs.targetId, targetId as string));
      }
      if (actorId) {
        conditions.push(eq(auditLogs.actorId, actorId as string));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const logs = await query;

      res.json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (error: any) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to retrieve audit logs" 
      });
    }
  });

  // Get audit logs for a specific user
  app.get("/api/admin/audit-logs/user/:userId", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit = "50" } = req.query;

      const logs = await db
        .select({
          id: auditLogs.id,
          actorId: auditLogs.actorId,
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .where(
          or(
            eq(auditLogs.actorId, userId),
            eq(auditLogs.targetId, userId)
          )
        )
        .orderBy(sql`${auditLogs.createdAt} DESC`)
        .limit(parseInt(limit as string));

      res.json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (error: any) {
      console.error("Get user audit logs error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to retrieve user audit logs" 
      });
    }
  });

  // ========================================
  // CASHFREE PAYMENT GATEWAY
  // ========================================

  // Get Cashfree configuration status
  app.get("/api/admin/cashfree/config", async (req: Request, res: Response) => {
    try {
      const appIdConfigured = !!process.env.CASHFREE_APP_ID;
      const secretKeyConfigured = !!process.env.CASHFREE_SECRET_KEY;
      const webhookSecretConfigured = !!process.env.CASHFREE_WEBHOOK_SECRET;
      
      res.json({
        success: true,
        config: {
          appIdConfigured,
          secretKeyConfigured,
          webhookSecretConfigured,
          allConfigured: appIdConfigured && secretKeyConfigured && webhookSecretConfigured,
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        },
      });
    } catch (error: any) {
      console.error("Get Cashfree config error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get Cashfree configuration" 
      });
    }
  });

  // Test Cashfree API connection
  app.post("/api/admin/cashfree/test-connection", async (req: Request, res: Response) => {
    try {
      const appId = process.env.CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;

      if (!appId || !secretKey) {
        return res.status(400).json({
          success: false,
          message: "Cashfree credentials not configured",
        });
      }

      // Determine environment
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction 
        ? 'https://api.cashfree.com/pg' 
        : 'https://sandbox.cashfree.com/pg';

      // Test API connection by fetching API version/health
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
        body: JSON.stringify({
          order_id: `test_${Date.now()}`,
          order_amount: 1.00,
          order_currency: 'INR',
          customer_details: {
            customer_id: 'test_customer',
            customer_email: 'test@example.com',
            customer_phone: '9999999999',
          },
        }),
      });

      if (response.ok || response.status === 400) {
        // 400 might mean validation error but API is reachable
        const data = await response.json();
        
        res.json({
          success: true,
          message: "Cashfree API connection successful",
          environment: isProduction ? 'production' : 'sandbox',
          apiReachable: true,
        });
      } else if (response.status === 401) {
        res.status(401).json({
          success: false,
          message: "Invalid Cashfree credentials",
          apiReachable: true,
        });
      } else {
        const errorData = await response.text();
        res.status(response.status).json({
          success: false,
          message: `Cashfree API error: ${response.statusText}`,
          details: errorData,
        });
      }
    } catch (error: any) {
      console.error("Test Cashfree connection error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect to Cashfree API",
        error: error.message,
      });
    }
  });

  // Get recent audit logs summary (last 24 hours)
  app.get("/api/admin/audit-logs/summary", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentLogs = await db
        .select({
          action: auditLogs.action,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(auditLogs)
        .where(sql`${auditLogs.createdAt} > ${oneDayAgo}`)
        .groupBy(auditLogs.action)
        .orderBy(sql`COUNT(*) DESC`);

      const totalCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(auditLogs)
        .where(sql`${auditLogs.createdAt} > ${oneDayAgo}`);

      res.json({
        success: true,
        period: "last_24_hours",
        totalEvents: totalCount[0]?.count || 0,
        eventsByAction: recentLogs,
      });
    } catch (error: any) {
      console.error("Get audit logs summary error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to retrieve audit logs summary" 
      });
    }
  });

  // ========================================
  // TRAFFIC ANALYTICS
  // ========================================

  // Track visit endpoint (public)
  app.post("/api/track-visit", async (req: Request, res: Response) => {
    try {
      const { visitedPage } = req.body;
      if (!visitedPage) {
        return res.status(400).json({ message: "visitedPage is required" });
      }

      // Extract real client IP from various headers (order matters - most reliable first)
      // Cloudflare uses cf-connecting-ip, standard proxies use x-forwarded-for
      const cfConnectingIp = req.headers['cf-connecting-ip'] as string;
      const xRealIp = req.headers['x-real-ip'] as string;
      const xForwardedFor = req.headers['x-forwarded-for'] as string;
      
      // Priority: CF > X-Real-IP > X-Forwarded-For (first IP) > req.ip
      let clientIp = 'Unknown';
      if (cfConnectingIp) {
        clientIp = cfConnectingIp.trim();
      } else if (xRealIp) {
        clientIp = xRealIp.trim();
      } else if (xForwardedFor) {
        // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
        // The first one is the original client
        clientIp = xForwardedFor.split(',')[0].trim();
      } else if (req.ip) {
        // Remove IPv6 prefix for IPv4 addresses, but keep ::1 as is
        clientIp = req.ip.replace('::ffff:', '').trim();
      }
      
      // Normalize localhost IPs
      if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost') {
        clientIp = '::1'; // Standardize to ::1 for consistency
      }
      
      // Check if IP is private/internal (shouldn't be geolocated)
      const isPrivateIp = (ip: string): boolean => {
        if (!ip || ip === 'Unknown') return true;
        // Normalize IP for checking (remove any whitespace)
        const normalizedIp = ip.trim();
        // Private IP ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, localhost, IPv6 localhost
        return /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|::1$|::ffff:127\.|localhost|0\.0\.0\.0)/i.test(normalizedIp) ||
               normalizedIp === '::1' ||
               normalizedIp.startsWith('fe80:') || // IPv6 link-local
               normalizedIp.startsWith('fc00:') || // IPv6 unique local
               normalizedIp.startsWith('fd00:');   // IPv6 unique local
      };
      
      const userAgent = req.get('user-agent') || '';
      
      // Parse device and browser from user agent
      const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
      const deviceType = isMobile ? 'Mobile' : 'Desktop';
      
      let browser = 'Unknown';
      if (/Edg\//.test(userAgent)) browser = 'Edge';
      else if (/Chrome\//.test(userAgent)) browser = 'Chrome';
      else if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari';
      else if (/Firefox\//.test(userAgent)) browser = 'Firefox';

      // Get geolocation using the new service
      const { geolocationService } = await import("./services/geolocation-service");
      const location = await geolocationService.getLocation(clientIp);

      await db.insert(trafficLogs).values({
        ipAddress: clientIp,
        country: location.country,
        state: location.state,
        city: location.city,
        deviceType,
        browser,
        visitedPage,
      });

      res.json({ success: true });
    } catch (error: any) {
      // Check if it's a database connection error
      if (error.message?.includes('endpoint has been disabled') || 
          error.code === 'XX000') {
        console.error("Database unavailable - visit tracking skipped");
        // Return success to avoid breaking the user experience
        return res.json({ success: true, skipped: true });
      }
      
      console.error("Track visit error:", error);
      res.status(500).json({ message: "Failed to track visit" });
    }
  });

  // Get traffic analytics with path parameters (admin only)
  // Supports: /api/admin/traffic/:startDate/:endDate/:country/:page
  app.get("/api/admin/traffic/:startDate/:endDate/:country/:page", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, country, page } = req.params;

      let query = db.select().from(trafficLogs);
      const conditions = [];

      if (startDate && startDate !== 'all' && endDate && endDate !== 'all') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(between(trafficLogs.visitTime, start, end));
      }

      if (country && country !== 'all') {
        conditions.push(eq(trafficLogs.country, country));
      }

      if (page && page !== 'all') {
        conditions.push(eq(trafficLogs.visitedPage, page));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const logs = await query.orderBy(sql`${trafficLogs.visitTime} DESC`);

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      console.error("Get traffic analytics error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to retrieve traffic analytics" 
      });
    }
  });

  // Get traffic analytics (admin only) - query parameter version
  app.get("/api/admin/traffic", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, country, page } = req.query;

      let query = db.select().from(trafficLogs);
      const conditions = [];

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        conditions.push(between(trafficLogs.visitTime, start, end));
      }

      if (country && country !== 'all') {
        conditions.push(eq(trafficLogs.country, country as string));
      }

      if (page && page !== 'all') {
        conditions.push(eq(trafficLogs.visitedPage, page as string));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const logs = await query.orderBy(sql`${trafficLogs.visitTime} DESC`);

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      console.error("Get traffic analytics error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to retrieve traffic analytics" 
      });
    }
  });

  // Fix existing localhost traffic logs (admin only)
  app.post("/api/admin/traffic/fix-localhost", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Update all localhost IPs that have "Unknown" location data
      const localhostIps = ['::1', '127.0.0.1', 'localhost'];
      
      let updatedCount = 0;
      for (const ip of localhostIps) {
        const result = await db.update(trafficLogs)
          .set({
            country: 'Local',
            state: 'Development',
            city: 'Localhost',
          })
          .where(
            and(
              eq(trafficLogs.ipAddress, ip),
              or(
                eq(trafficLogs.country, 'Unknown'),
                eq(trafficLogs.state, 'Unknown'),
                eq(trafficLogs.city, 'Unknown')
              )
            )
          )
          .returning();
        updatedCount += result.length || 0;
      }
      
      // Also update any IPs that are localhost but stored differently
      const result2 = await db.update(trafficLogs)
        .set({
          country: 'Local',
          state: 'Development',
          city: 'Localhost',
        })
        .where(
          and(
            or(
              sql`${trafficLogs.ipAddress} LIKE '::1%'`,
              sql`${trafficLogs.ipAddress} LIKE '127.0.0.1%'`,
              sql`${trafficLogs.ipAddress} = 'localhost'`
            ),
            or(
              eq(trafficLogs.country, 'Unknown'),
              eq(trafficLogs.state, 'Unknown'),
              eq(trafficLogs.city, 'Unknown')
            )
          )
        )
        .returning();
      updatedCount += result2.length || 0;
      
      res.json({ 
        success: true, 
        message: `Updated ${updatedCount} localhost traffic log records`,
        updatedCount
      });
    } catch (error: any) {
      console.error("Fix localhost traffic logs error:", error);
      res.status(500).json({ message: "Failed to fix localhost traffic logs" });
    }
  });

  // ========================================
  // ORGANIZATION MANAGEMENT (Super Admin Only)
  // ========================================

  // List all organizations with pagination and search
  app.get("/api/admin/organizations", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { search, status, limit, offset } = req.query;
      
      const organizations = await authStorage.getAllOrganizations({
        search: search as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      });
      
      const total = await authStorage.getOrganizationsCount({
        search: search as string,
        status: status as string
      });
      
      res.json({
        success: true,
        organizations,
        total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      });
    } catch (error: any) {
      console.error("Get organizations error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to retrieve organizations" 
      });
    }
  });

  // Get organization details
  app.get("/api/admin/organizations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const detail = await authStorage.getAdminOrganizationDetail(id);
      
      res.json({
        success: true,
        organization: detail
      });
    } catch (error: any) {
      console.error("Get organization details error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to retrieve organization details" 
      });
    }
  });

  // Update organization (suspend/activate)
  app.patch("/api/admin/organizations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        status: z.enum(["active", "suspended", "deleted"]).optional(),
        reason: z.string().optional(),
        companyName: z.string().min(1).optional(),
        billingEmail: z.string().email().optional(),
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const { status, reason, companyName, billingEmail } = validationResult.data;
      
      // Get organization to verify it exists
      const org = await authStorage.getOrganizationById(id);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }
      
      // Update organization
      const updateData: Record<string, any> = {};
      if (status) updateData.status = status;
      if (companyName) updateData.companyName = companyName;
      if (billingEmail) updateData.billingEmail = billingEmail;
      
      if (Object.keys(updateData).length > 0) {
        await authStorage.updateOrganization(id, updateData);
      }
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: status ? `organization.${status}` : 'organization.updated',
        targetType: 'organization',
        targetId: id,
        metadata: { 
          adminId: req.jwtUser?.userId,
          changes: updateData,
          reason 
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      // Return updated organization details
      const updatedOverview = await authStorage.getOrganizationOverview(id);
      
      res.json({
        success: true,
        message: `Organization ${status ? status : 'updated'} successfully`,
        organization: updatedOverview
      });
    } catch (error: any) {
      console.error("Update organization error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to update organization" 
      });
    }
  });

  // Change License Manager for an organization
  app.post("/api/admin/organizations/:id/change-manager", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const changeManagerSchema = z.object({
        newManagerEmail: z.string().email("Valid email is required"),
        reason: z.string().optional(),
      });
      
      const validationResult = changeManagerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const { newManagerEmail, reason } = validationResult.data;
      
      // Get organization
      const org = await authStorage.getOrganizationById(id);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }
      
      // Find the new manager by email
      const newManager = await authStorage.getUserByEmail(newManagerEmail);
      if (!newManager) {
        return res.status(404).json({
          success: false,
          message: "User not found with this email. The user must have an account first."
        });
      }
      
      // Get old manager info for logging
      const oldManagerId = org.primaryManagerId;
      const oldManager = oldManagerId ? await authStorage.getUserById(oldManagerId) : null;
      
      // Update organization's primaryManagerId
      await authStorage.updateOrganization(id, {
        primaryManagerId: newManager.id
      });
      
      // Update the new manager's role to license_manager if not already
      if (newManager.role !== 'license_manager' && newManager.role !== 'admin') {
        await authStorage.updateUser(newManager.id, {
          role: 'license_manager'
        });
      }
      
      // Create organization membership for new manager if not exists
      const existingMembership = await authStorage.getUserMembership(newManager.id);
      if (!existingMembership || existingMembership.organizationId !== id) {
        // Create membership for new manager
        await authStorage.createOrganizationMembership({
          organizationId: id,
          userId: newManager.id,
          role: 'owner'
        });
      } else {
        // Update existing membership to owner role
        await authStorage.updateMembershipRole(existingMembership.id, 'owner');
      }
      
      // Demote old manager's membership to member (if different from new manager)
      if (oldManagerId && oldManagerId !== newManager.id) {
        const oldMembership = await authStorage.getUserMembership(oldManagerId);
        if (oldMembership) {
          await authStorage.updateMembershipRole(oldMembership.id, 'member');
        }
      }
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'organization.manager_changed',
        targetType: 'organization',
        targetId: id,
        metadata: { 
          adminId: req.jwtUser?.userId,
          oldManagerId,
          oldManagerEmail: oldManager?.email,
          newManagerId: newManager.id,
          newManagerEmail,
          reason 
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      // Return updated organization details
      const updatedOverview = await authStorage.getOrganizationOverview(id);
      
      res.json({
        success: true,
        message: `License Manager changed to ${newManager.firstName} ${newManager.lastName} (${newManagerEmail})`,
        organization: updatedOverview
      });
    } catch (error: any) {
      console.error("Change organization manager error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to change License Manager" 
      });
    }
  });

  // Add seats to organization's license package
  app.post("/api/admin/organizations/:id/seats", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const addSeatsSchema = z.object({
        seats: z.number().int().positive("Seats must be a positive number"),
        reason: z.string().optional(),
      });
      
      const validationResult = addSeatsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const { seats, reason } = validationResult.data;
      
      // Get organization and active license package
      const org = await authStorage.getOrganizationById(id);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }
      
      const activePackage = await authStorage.getActiveLicensePackage(id);
      if (!activePackage) {
        return res.status(404).json({
          success: false,
          message: "No active license package found for this organization"
        });
      }
      
      // Increment seats using existing method
      const updatedPackage = await authStorage.incrementPackageSeats(activePackage.id, seats);
      
      // Create billing adjustment record (admin-granted, no payment)
      await authStorage.createBillingAdjustment({
        organizationId: id,
        licensePackageId: activePackage.id,
        adjustmentType: 'admin_seat_addition',
        deltaSeats: seats,
        amount: '0',
        currency: 'USD',
        status: 'completed',
        addedBy: req.jwtUser?.userId
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'organization.seats_added',
        targetType: 'organization',
        targetId: id,
        metadata: { 
          adminId: req.jwtUser?.userId,
          additionalSeats: seats,
          newTotalSeats: updatedPackage.totalSeats,
          reason 
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({
        success: true,
        message: `Successfully added ${seats} seat(s) to the organization`,
        licensePackage: updatedPackage
      });
    } catch (error: any) {
      console.error("Add seats error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to add seats" 
      });
    }
  });

  // Assign license to user within organization
  app.post("/api/admin/organizations/:id/assign-license", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const assignSchema = z.object({
        userEmail: z.string().email("Valid email is required"),
        notes: z.string().optional(),
      });
      
      const validationResult = assignSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const { userEmail, notes } = validationResult.data;
      
      // Get organization and active license package
      const org = await authStorage.getOrganizationById(id);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }
      
      const activePackage = await authStorage.getActiveLicensePackage(id);
      if (!activePackage) {
        return res.status(404).json({
          success: false,
          message: "No active license package found for this organization"
        });
      }
      
      // Check available seats
      const availableSeats = await authStorage.getAvailableSeats(activePackage.id);
      if (availableSeats <= 0) {
        return res.status(400).json({
          success: false,
          message: "No available seats in the license package"
        });
      }
      
      // Find or validate user
      let targetUser = await authStorage.getUserByEmail(userEmail);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found. The user must have an existing account."
        });
      }
      
      // Check if user already has an active license for THIS organization's package
      const existingAssignment = await authStorage.getUserActiveLicenseAssignment(targetUser.id);
      if (existingAssignment) {
        // Check if the existing assignment is for this organization's package
        const existingPackage = await authStorage.getLicensePackageById(existingAssignment.licensePackageId);
        if (existingPackage && existingPackage.organizationId === id) {
          return res.status(400).json({
            success: false,
            message: "User already has an active license assignment for this organization"
          });
        }
      }
      
      // Ensure user has organization membership
      const existingMembership = await authStorage.getUserMembership(targetUser.id);
      if (!existingMembership || existingMembership.organizationId !== id) {
        try {
          await authStorage.createOrganizationMembership({
            organizationId: id,
            userId: targetUser.id,
            role: 'member',
            status: 'active'
          });
        } catch (membershipError: any) {
          // Handle duplicate membership gracefully (might already exist)
          if (membershipError.code !== '23505') {
            throw membershipError;
          }
        }
      } else if (existingMembership.status !== 'active') {
        // Reactivate membership if it exists but is inactive
        await authStorage.updateMembershipStatus(existingMembership.id, 'active');
      }
      
      // Create license assignment
      const assignment = await authStorage.createLicenseAssignment({
        licensePackageId: activePackage.id,
        userId: targetUser.id,
        assignedBy: req.jwtUser?.userId,
        notes: notes || 'Assigned by admin',
        status: 'active'
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'organization.license_assigned',
        targetType: 'user',
        targetId: targetUser.id,
        metadata: { 
          adminId: req.jwtUser?.userId,
          organizationId: id,
          userEmail,
          assignmentId: assignment.id,
          notes 
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({
        success: true,
        message: `License assigned to ${userEmail} successfully`,
        assignment
      });
    } catch (error: any) {
      console.error("Assign license error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to assign license" 
      });
    }
  });

  // Revoke license from user within organization
  app.post("/api/admin/organizations/:id/revoke-license", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const revokeSchema = z.object({
        userId: z.string().min(1, "User ID is required"),
        reason: z.string().optional(),
      });
      
      const validationResult = revokeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const { userId, reason } = validationResult.data;
      
      // Get organization
      const org = await authStorage.getOrganizationById(id);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }
      
      // Get user's active license assignment
      const activeAssignment = await authStorage.getUserActiveLicenseAssignment(userId);
      if (!activeAssignment) {
        return res.status(404).json({
          success: false,
          message: "User does not have an active license assignment"
        });
      }
      
      // Verify the assignment belongs to this organization's package
      const licensePackage = await authStorage.getLicensePackageById(activeAssignment.licensePackageId);
      if (!licensePackage || licensePackage.organizationId !== id) {
        return res.status(400).json({
          success: false,
          message: "User's license is not from this organization"
        });
      }
      
      // Revoke the license using existing method
      await authStorage.unassignLicense(activeAssignment.id);
      
      // Get user info for logging
      const user = await authStorage.getUserById(userId);
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'organization.license_revoked',
        targetType: 'user',
        targetId: userId,
        metadata: { 
          adminId: req.jwtUser?.userId,
          organizationId: id,
          userEmail: user?.email,
          assignmentId: activeAssignment.id,
          reason 
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({
        success: true,
        message: `License revoked from ${user?.email || userId} successfully`
      });
    } catch (error: any) {
      console.error("Revoke license error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to revoke license" 
      });
    }
  });

  // ========================================
  // AI TOKEN USAGE TRACKING
  // ========================================

  // Get AI token usage for admin (all users or specific user)
  app.get("/api/admin/ai-token-usage", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, startDate, endDate, provider } = req.query;
      
      const options: {
        startDate?: Date;
        endDate?: Date;
        provider?: string;
      } = {};
      
      if (startDate) {
        options.startDate = new Date(startDate as string);
      }
      if (endDate) {
        options.endDate = new Date(endDate as string);
      }
      if (provider && provider !== 'all') {
        options.provider = provider as string;
      }
      
      // If userId provided, get usage for specific user; otherwise get all
      if (userId) {
        const usage = await authStorage.getAITokenUsage(userId as string, options);
        const summary = await authStorage.getAITokenUsageSummary(userId as string, options);
        res.json({ usage, summary });
      } else {
        // Get aggregated usage across all users (admin view)
        // Build WHERE clause properly using 1=1 base
        let whereClause = sql`1=1`;
        if (options.startDate) {
          whereClause = sql`${whereClause} AND created_at >= ${options.startDate}`;
        }
        if (options.endDate) {
          whereClause = sql`${whereClause} AND created_at <= ${options.endDate}`;
        }
        if (options.provider) {
          whereClause = sql`${whereClause} AND provider = ${options.provider}`;
        }
        
        const allUsage = await db.execute(sql`
          SELECT 
            provider,
            SUM(total_tokens) as total_tokens,
            SUM(prompt_tokens) as prompt_tokens,
            SUM(completion_tokens) as completion_tokens,
            COUNT(*) as request_count
          FROM ai_token_usage
          WHERE ${whereClause}
          GROUP BY provider
          ORDER BY total_tokens DESC
        `);
        
        res.json({ 
          summary: allUsage.rows,
          byProvider: allUsage.rows 
        });
      }
    } catch (error: any) {
      console.error("Get AI token usage error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to fetch AI token usage" 
      });
    }
  });

  // Simple in-memory cache for AI token usage summary
  const aiTokenCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Get AI token usage summary by provider (optimized with caching)
  app.get("/api/admin/ai-token-usage/summary", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, provider } = req.query;
      
      // Create cache key
      const cacheKey = `${startDate || 'null'}_${endDate || 'null'}_${provider || 'all'}`;
      
      // Check cache
      const cached = aiTokenCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('[AI Token Usage] Returning cached data');
        return res.json(cached.data);
      }
      
      let whereClause = sql`1=1`;
      if (startDate) {
        whereClause = sql`${whereClause} AND created_at >= ${new Date(startDate as string)}`;
      }
      if (endDate) {
        whereClause = sql`${whereClause} AND created_at <= ${new Date(endDate as string)}`;
      }
      if (provider && provider !== 'all') {
        whereClause = sql`${whereClause} AND provider = ${provider as string}`;
      }
      
      // Combine both queries into a single optimized query with CTE
      const result = await db.execute(sql`
        WITH provider_summary AS (
          SELECT 
            provider,
            COALESCE(SUM(total_tokens), 0) as total_tokens,
            COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
            COALESCE(SUM(completion_tokens), 0) as completion_tokens,
            COUNT(*) as request_count,
            MIN(created_at) as first_usage,
            MAX(created_at) as last_usage
          FROM ai_token_usage
          WHERE ${whereClause}
          GROUP BY provider
        )
        SELECT 
          json_build_object(
            'byProvider', COALESCE(json_agg(
              json_build_object(
                'provider', provider,
                'total_tokens', total_tokens::text,
                'prompt_tokens', prompt_tokens::text,
                'completion_tokens', completion_tokens::text,
                'request_count', request_count::text,
                'first_usage', first_usage,
                'last_usage', last_usage
              ) ORDER BY total_tokens DESC
            ), '[]'::json),
            'totals', json_build_object(
              'total_tokens', COALESCE(SUM(total_tokens), 0)::text,
              'prompt_tokens', COALESCE(SUM(prompt_tokens), 0)::text,
              'completion_tokens', COALESCE(SUM(completion_tokens), 0)::text,
              'request_count', COALESCE(SUM(request_count), 0)::text
            )
          ) as result
        FROM provider_summary
      `);
      
      const responseData = result.rows[0]?.result || {
        byProvider: [],
        totals: {
          total_tokens: "0",
          prompt_tokens: "0",
          completion_tokens: "0",
          request_count: "0"
        }
      };

      // Cache the result
      aiTokenCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      
      // Clear old cache entries (simple cleanup)
      if (aiTokenCache.size > 100) {
        const entries = Array.from(aiTokenCache.entries());
        entries.slice(0, 50).forEach(([key]) => aiTokenCache.delete(key));
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("Get AI token usage summary error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to fetch AI token usage summary" 
      });
    }
  });

  // Get AI token usage daily breakdown (for charts)
  app.get("/api/admin/ai-token-usage/daily", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, provider } = req.query;

      let whereClause = sql`1=1`;
      if (startDate) {
        whereClause = sql`${whereClause} AND COALESCE(occurred_at, created_at) >= ${new Date(startDate as string)}`;
      }
      if (endDate) {
        whereClause = sql`${whereClause} AND COALESCE(occurred_at, created_at) <= ${new Date(endDate as string)}`;
      }
      if (provider && provider !== 'all') {
        whereClause = sql`${whereClause} AND provider = ${provider as string}`;
      }

      const result = await db.execute(sql`
        SELECT
          date_trunc('day', COALESCE(occurred_at, created_at)) as day,
          COALESCE(SUM(total_tokens), 0) as total_tokens,
          COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
          COALESCE(SUM(completion_tokens), 0) as completion_tokens,
          COUNT(*) as request_count
        FROM ai_token_usage
        WHERE ${whereClause}
        GROUP BY day
        ORDER BY day ASC
      `);

      res.json({ daily: result.rows });
    } catch (error: any) {
      console.error("Get AI token usage daily error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch AI token usage daily"
      });
    }
  });

  // Get AI token usage for authenticated user (non-admin)
  app.get("/api/ai-token-usage/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { startDate, endDate, provider } = req.query;
      
      const options: {
        startDate?: Date;
        endDate?: Date;
        provider?: string;
      } = {};
      
      if (startDate) {
        options.startDate = new Date(startDate as string);
      }
      if (endDate) {
        options.endDate = new Date(endDate as string);
      }
      if (provider && provider !== 'all') {
        options.provider = provider as string;
      }
      
      const usage = await authStorage.getAITokenUsage(userId, options);
      const summary = await authStorage.getAITokenUsageSummary(userId, options);
      
      res.json({ usage, summary });
    } catch (error: any) {
      console.error("Get user AI token usage error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to fetch AI token usage" 
      });
    }
  });
  
  // ========================================
  // TERMS AND CONDITIONS MANAGEMENT
  // ========================================
  
  // Get active terms and conditions
  app.get("/api/admin/terms", async (req: Request, res: Response) => {
    try {
      const activeTerms = await authStorage.getActiveTermsAndConditions();
      res.json({ terms: activeTerms });
    } catch (error) {
      console.error("Get active terms error:", error);
      res.status(500).json({ message: "Failed to get terms and conditions" });
    }
  });
  
  // Get all terms versions
  app.get("/api/admin/terms/versions", async (req: Request, res: Response) => {
    try {
      const allVersions = await authStorage.getAllTermsVersions();
      res.json({ versions: allVersions });
    } catch (error) {
      console.error("Get terms versions error:", error);
      res.status(500).json({ message: "Failed to get terms versions" });
    }
  });
  
  // Create new terms and conditions
  app.post("/api/admin/terms", async (req: Request, res: Response) => {
    try {
      const createSchema = z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string().min(1, "Content is required"),
        version: z.string().min(1, "Version is required"),
      });
      
      const validationResult = createSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const { title, content, version } = validationResult.data;
      
      const newTerms = await authStorage.createTermsAndConditions({
        title,
        content,
        version,
        lastModifiedBy: req.jwtUser?.userId || '',
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'terms.created',
        targetType: 'terms',
        targetId: newTerms.id,
        metadata: { 
          title,
          version,
          adminId: req.jwtUser?.userId 
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.status(201).json({ 
        message: "Terms and conditions created successfully",
        terms: newTerms 
      });
    } catch (error) {
      console.error("Create terms error:", error);
      res.status(500).json({ message: "Failed to create terms and conditions" });
    }
  });
  
  // Update terms and conditions
  app.patch("/api/admin/terms/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        version: z.string().min(1).optional(),
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }
      
      const updatedTerms = await authStorage.updateTermsAndConditions(id, {
        ...validationResult.data,
        lastModifiedBy: req.jwtUser?.userId || '',
      });
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'terms.updated',
        targetType: 'terms',
        targetId: id,
        metadata: { 
          changes: validationResult.data,
          adminId: req.jwtUser?.userId 
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ 
        message: "Terms and conditions updated successfully",
        terms: updatedTerms 
      });
    } catch (error) {
      console.error("Update terms error:", error);
      res.status(500).json({ message: "Failed to update terms and conditions" });
    }
  });
  
  // Set active terms version
  app.post("/api/admin/terms/:id/activate", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await authStorage.setActiveTerms(id);
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'terms.activated',
        targetType: 'terms',
        targetId: id,
        metadata: { adminId: req.jwtUser?.userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.json({ message: "Terms version activated successfully" });
    } catch (error) {
      console.error("Activate terms error:", error);
      res.status(500).json({ message: "Failed to activate terms version" });
    }
  });

  // ========================================
  // FIX SUBSCRIPTION LIMITS (Admin Data Migration)
  // ========================================
  app.post("/api/admin/fix-subscription-limits", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log('[Admin] Starting subscription limits fix...');
      
      // Find all paid subscriptions that have trial limits set
      const subscriptions = await db.query.subscriptions.findMany();
      
      let fixedCount = 0;
      const updates: any[] = [];
      
      for (const sub of subscriptions) {
        // Check if this is a paid subscription with trial limits
        if (sub.status === 'active' && sub.planType === 'monthly') {
          // Paid subscriptions should have null limits (unlimited)
          if (sub.sessionsLimit !== null || sub.minutesLimit !== null) {
            console.log(`[Admin Fix] Found paid subscription with trial limits: ${sub.id}, user: ${sub.userId}`);
            console.log(`  Current limits - sessions: ${sub.sessionsLimit}, minutes: ${sub.minutesLimit}`);
            
            // Update to null limits (unlimited)
            await authStorage.updateSubscription(sub.id, {
              sessionsLimit: null,
              minutesLimit: null,
            });
            
            fixedCount++;
            updates.push({
              subscriptionId: sub.id,
              userId: sub.userId,
              oldLimits: { sessions: sub.sessionsLimit, minutes: sub.minutesLimit },
              newLimits: { sessions: null, minutes: null },
            });
            
            console.log(`[Admin Fix] Updated subscription ${sub.id} to unlimited access`);
          }
        }
      }
      
      // Log audit
      await eventLogger.log({
        actorId: req.jwtUser?.userId,
        action: 'subscription.fix_limits',
        targetType: 'subscription',
        targetId: 'bulk',
        metadata: { fixedCount, updates },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      console.log(`[Admin Fix] Subscription fix completed: ${fixedCount} subscriptions updated`);
      
      res.json({
        message: `Successfully fixed ${fixedCount} subscription limits`,
        fixedCount,
        updates,
      });
    } catch (error) {
      console.error("Fix subscription limits error:", error);
      res.status(500).json({ message: "Failed to fix subscription limits" });
    }
  });
}
