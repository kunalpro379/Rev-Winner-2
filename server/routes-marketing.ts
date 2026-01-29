import type { Express, Request, Response } from "express";
import { z } from "zod";
import { marketingInsightsService } from "./services/marketing-insights";
import { authenticateToken, authenticateMarketing } from "./middleware/auth";
import { generateMarketingAccessToken } from "./utils/jwt";
import { db } from "./db";
import { organizationMemberships, authUsers, marketingAccess } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

const discoverQuerySchema = z.object({
  queryType: z.enum(["challenges", "faqs", "unique_queries", "unanswered", "custom"]),
  customQuestion: z.string().optional(),
  dataMode: z.enum(["data_bank", "universal"]).default("data_bank"),
});

const postGenerationSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  length: z.enum(["short", "medium", "long"]),
  tone: z.enum(["professional", "bold", "thought-leadership", "conversational", "analytical"]),
  hashtagMode: z.enum(["manual", "auto", "both"]),
  manualHashtags: z.array(z.string()).optional(),
  includeContact: z.boolean().default(false),
  contactDetails: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  dataMode: z.enum(["data_bank", "universal"]).default("data_bank"),
});

const videoScriptSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  length: z.enum(["short", "medium", "long"]),
  tone: z.enum(["professional", "bold", "thought-leadership", "conversational", "analytical"]),
  hashtagMode: z.enum(["manual", "auto", "both"]),
  manualHashtags: z.array(z.string()).optional(),
  dataMode: z.enum(["data_bank", "universal"]).default("data_bank"),
});

const researchSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  outputType: z.enum(["research_paper", "newsletter", "blog", "strategy"]),
  dataMode: z.enum(["data_bank", "universal"]).default("data_bank"),
});

const infographicSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  outputType: z.enum(["infographic", "chart", "numbers", "summary"]),
  dataMode: z.enum(["data_bank", "universal"]).default("data_bank"),
});

const userSettingsSchema = z.object({
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactWebsite: z.string().url().optional().or(z.literal("")),
  preferredTone: z.enum(["professional", "bold", "thought-leadership", "conversational", "analytical"]).optional(),
  defaultHashtagMode: z.enum(["manual", "auto", "both"]).optional(),
  dataBankMode: z.boolean().optional(),
});

const grantAccessSchema = z.object({
  userEmail: z.string().email("Valid email required"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
});

const setupPasswordSchema = z.object({
  token: z.string().min(1, "Access token required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const marketingLoginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

async function getOrganizationContext(userId: string) {
  let organizationId: string | undefined;
  let companyName: string | undefined;
  
  const membership = await db.select({ organizationId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(and(
      eq(organizationMemberships.userId, userId),
      eq(organizationMemberships.status, "active")
    ))
    .limit(1);
  
  if (membership.length > 0) {
    organizationId = membership[0].organizationId;
  }
  
  if (!organizationId) {
    const [userData] = await db.select({ organization: authUsers.organization })
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);
    
    companyName = userData?.organization || undefined;
  }
  
  return { organizationId, companyName };
}

async function checkMarketingAccess(userId: string): Promise<boolean> {
  const [user] = await db.select({ role: authUsers.role })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .limit(1);
  
  if (user?.role === "license_manager" || user?.role === "admin" || user?.role === "super_admin") {
    return true;
  }
  
  const [access] = await db.select()
    .from(marketingAccess)
    .where(and(
      eq(marketingAccess.userId, userId),
      eq(marketingAccess.status, "active")
    ))
    .limit(1);
  
  if (access) {
    if (access.expiresAt && new Date(access.expiresAt) < new Date()) {
      return false;
    }
    return true;
  }
  
  return false;
}

export function registerMarketingRoutes(app: Express) {
  
  app.post("/api/marketing/discover", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const hasAccess = await checkMarketingAccess(user.id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Marketing add-on access required" });
      }
      
      const validatedBody = discoverQuerySchema.parse(req.body);
      const { organizationId, companyName } = await getOrganizationContext(user.id);
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const { domainOverride, accessAll } = req.body;
      
      console.log(`📊 Marketing discover query from user ${user.email}: ${validatedBody.queryType} (${validatedBody.dataMode} mode)${isSuperAdmin ? ` [Super Admin: domainOverride=${domainOverride}, accessAll=${accessAll}]` : ""}`);
      
      let effectiveUserEmail = user.email;
      if (isSuperAdmin) {
        if (accessAll) {
          effectiveUserEmail = SUPER_ADMIN_EMAIL;
        } else if (domainOverride) {
          const normalizedDomain = domainOverride.toLowerCase().replace(/\s+/g, "");
          const domain = normalizedDomain.includes(".") ? normalizedDomain : `${normalizedDomain}.com`;
          effectiveUserEmail = `user@${domain}`;
        }
      }
      
      const result = await marketingInsightsService.discover({
        queryType: validatedBody.queryType,
        customQuestion: validatedBody.customQuestion,
        organizationId,
        companyName,
        dataMode: validatedBody.dataMode,
        userEmail: effectiveUserEmail,
      });
      
      res.json(result);
      
    } catch (error: any) {
      console.error("Marketing discover error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to process discovery query",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/generate/post", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const hasAccess = await checkMarketingAccess(user.id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Marketing add-on access required" });
      }
      
      const validatedBody = postGenerationSchema.parse(req.body);
      const { organizationId, companyName } = await getOrganizationContext(user.id);
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const { domainOverride, accessAll } = req.body;
      
      let effectiveUserEmail = user.email;
      if (isSuperAdmin) {
        if (accessAll) {
          effectiveUserEmail = SUPER_ADMIN_EMAIL;
        } else if (domainOverride) {
          const normalizedDomain = domainOverride.toLowerCase().replace(/\s+/g, "");
          const domain = normalizedDomain.includes(".") ? normalizedDomain : `${normalizedDomain}.com`;
          effectiveUserEmail = `user@${domain}`;
        }
      }
      
      console.log(`📝 Marketing post generation for user ${user.email}: "${validatedBody.topic}"${isSuperAdmin ? ` [Super Admin]` : ""}`);
      
      const result = await marketingInsightsService.generatePost({
        userId: user.id,
        ...validatedBody,
        organizationId,
        companyName,
        userEmail: effectiveUserEmail,
      });
      
      res.json(result);
      
    } catch (error: any) {
      console.error("Post generation error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to generate post",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/generate/video-script", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const hasAccess = await checkMarketingAccess(user.id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Marketing add-on access required" });
      }
      
      const validatedBody = videoScriptSchema.parse(req.body);
      const { organizationId, companyName } = await getOrganizationContext(user.id);
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const { domainOverride, accessAll } = req.body;
      
      let effectiveUserEmail = user.email;
      if (isSuperAdmin) {
        if (accessAll) {
          effectiveUserEmail = SUPER_ADMIN_EMAIL;
        } else if (domainOverride) {
          const normalizedDomain = domainOverride.toLowerCase().replace(/\s+/g, "");
          const domain = normalizedDomain.includes(".") ? normalizedDomain : `${normalizedDomain}.com`;
          effectiveUserEmail = `user@${domain}`;
        }
      }
      
      console.log(`🎬 Video script generation for user ${user.email}: "${validatedBody.topic}"${isSuperAdmin ? ` [Super Admin]` : ""}`);
      
      const result = await marketingInsightsService.generateVideoScript({
        userId: user.id,
        ...validatedBody,
        organizationId,
        companyName,
        userEmail: effectiveUserEmail,
      });
      
      res.json(result);
      
    } catch (error: any) {
      console.error("Video script generation error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to generate video script",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/generate/research", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const hasAccess = await checkMarketingAccess(user.id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Marketing add-on access required" });
      }
      
      const validatedBody = researchSchema.parse(req.body);
      const { organizationId, companyName } = await getOrganizationContext(user.id);
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const { domainOverride, accessAll } = req.body;
      
      let effectiveUserEmail = user.email;
      if (isSuperAdmin) {
        if (accessAll) {
          effectiveUserEmail = SUPER_ADMIN_EMAIL;
        } else if (domainOverride) {
          const normalizedDomain = domainOverride.toLowerCase().replace(/\s+/g, "");
          const domain = normalizedDomain.includes(".") ? normalizedDomain : `${normalizedDomain}.com`;
          effectiveUserEmail = `user@${domain}`;
        }
      }
      
      console.log(`📚 Research generation for user ${user.email}: "${validatedBody.topic}"${isSuperAdmin ? ` [Super Admin]` : ""}`);
      
      const result = await marketingInsightsService.generateResearch({
        userId: user.id,
        ...validatedBody,
        organizationId,
        companyName,
        userEmail: effectiveUserEmail,
      });
      
      res.json(result);
      
    } catch (error: any) {
      console.error("Research generation error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to generate research",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/generate/infographic", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const hasAccess = await checkMarketingAccess(user.id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Marketing add-on access required" });
      }
      
      const validatedBody = infographicSchema.parse(req.body);
      const { organizationId, companyName } = await getOrganizationContext(user.id);
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const { domainOverride, accessAll } = req.body;
      
      let effectiveUserEmail = user.email;
      if (isSuperAdmin) {
        if (accessAll) {
          effectiveUserEmail = SUPER_ADMIN_EMAIL;
        } else if (domainOverride) {
          const normalizedDomain = domainOverride.toLowerCase().replace(/\s+/g, "");
          const domain = normalizedDomain.includes(".") ? normalizedDomain : `${normalizedDomain}.com`;
          effectiveUserEmail = `user@${domain}`;
        }
      }
      
      console.log(`📊 Infographic generation for user ${user.email}: "${validatedBody.topic}"${isSuperAdmin ? ` [Super Admin]` : ""}`);
      
      const result = await marketingInsightsService.generateInfographic({
        userId: user.id,
        ...validatedBody,
        organizationId,
        companyName,
        userEmail: effectiveUserEmail,
      });
      
      res.json(result);
      
    } catch (error: any) {
      console.error("Infographic generation error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to generate infographic data",
        error: error.message,
      });
    }
  });
  
  app.get("/api/marketing/settings", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const settings = await marketingInsightsService.getUserSettings(user.id);
      
      res.json({ success: true, settings });
      
    } catch (error: any) {
      console.error("Get settings error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch settings",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/settings", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const validatedBody = userSettingsSchema.parse(req.body);
      
      const settings = await marketingInsightsService.saveUserSettings(user.id, validatedBody);
      
      res.json({ success: true, settings });
      
    } catch (error: any) {
      console.error("Save settings error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid settings",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to save settings",
        error: error.message,
      });
    }
  });
  
  app.get("/api/marketing/stats", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const { organizationId } = await getOrganizationContext(user.id);
      
      const stats = await marketingInsightsService.getQuickStats(organizationId, user.email);
      
      res.json({ success: true, stats });
      
    } catch (error: any) {
      console.error("Marketing stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch marketing stats",
        error: error.message,
      });
    }
  });
  
  app.get("/api/marketing/access/check", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, hasAccess: false });
      }
      
      const hasAccess = await checkMarketingAccess(user.id);
      
      res.json({ success: true, hasAccess });
      
    } catch (error: any) {
      console.error("Check access error:", error);
      res.status(500).json({
        success: false,
        hasAccess: false,
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/access/grant", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const [userData] = await db.select({ role: authUsers.role })
        .from(authUsers)
        .where(eq(authUsers.id, user.id))
        .limit(1);
      
      if (userData?.role !== "license_manager" && userData?.role !== "admin" && userData?.role !== "super_admin") {
        return res.status(403).json({ success: false, message: "License manager or admin access required" });
      }
      
      const validatedBody = grantAccessSchema.parse(req.body);
      
      let [targetUser] = await db.select()
        .from(authUsers)
        .where(eq(authUsers.email, validatedBody.userEmail.toLowerCase()))
        .limit(1);
      
      if (!targetUser) {
        const username = validatedBody.userEmail.split("@")[0] + "_" + crypto.randomBytes(4).toString("hex");
        const tempPassword = crypto.randomBytes(16).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const [newUser] = await db.insert(authUsers).values({
          email: validatedBody.userEmail.toLowerCase(),
          firstName: validatedBody.firstName,
          lastName: validatedBody.lastName,
          username,
          hashedPassword,
          role: "user",
          status: "active",
          emailVerified: true,
        }).returning();
        
        targetUser = newUser;
      }
      
      const accessToken = crypto.randomBytes(32).toString("hex");
      
      const [existingAccess] = await db.select()
        .from(marketingAccess)
        .where(eq(marketingAccess.userId, targetUser.id))
        .limit(1);
      
      if (existingAccess) {
        await db.update(marketingAccess)
          .set({
            status: "active",
            accessToken,
            passwordSetup: false,
            grantedBy: user.id,
            updatedAt: new Date(),
          })
          .where(eq(marketingAccess.id, existingAccess.id));
      } else {
        await db.insert(marketingAccess).values({
          userId: targetUser.id,
          grantedBy: user.id,
          accessToken,
          status: "active",
          passwordSetup: false,
        });
      }
      
      const accessLink = `${process.env.APP_URL || "https://revwinner.com"}/marketing/setup?token=${accessToken}`;
      
      res.json({
        success: true,
        message: "Marketing access granted",
        accessLink,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
        },
      });
      
    } catch (error: any) {
      console.error("Grant access error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to grant access",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/access/setup-password", async (req: Request, res: Response) => {
    try {
      const validatedBody = setupPasswordSchema.parse(req.body);
      
      const [access] = await db.select()
        .from(marketingAccess)
        .where(and(
          eq(marketingAccess.accessToken, validatedBody.token),
          eq(marketingAccess.status, "active")
        ))
        .limit(1);
      
      if (!access) {
        return res.status(404).json({ success: false, message: "Invalid or expired access link" });
      }
      
      const hashedPassword = await bcrypt.hash(validatedBody.password, 10);
      
      await db.update(marketingAccess)
        .set({
          hashedPassword,
          passwordSetup: true,
          accessToken: null,
          updatedAt: new Date(),
        })
        .where(eq(marketingAccess.id, access.id));
      
      res.json({ success: true, message: "Password set successfully" });
      
    } catch (error: any) {
      console.error("Setup password error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to set password",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/access/login", async (req: Request, res: Response) => {
    try {
      const validatedBody = marketingLoginSchema.parse(req.body);
      
      const [user] = await db.select()
        .from(authUsers)
        .where(eq(authUsers.email, validatedBody.email.toLowerCase()))
        .limit(1);
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      
      const [access] = await db.select()
        .from(marketingAccess)
        .where(and(
          eq(marketingAccess.userId, user.id),
          eq(marketingAccess.status, "active")
        ))
        .limit(1);
      
      if (!access) {
        return res.status(403).json({ success: false, message: "Marketing access not granted or revoked" });
      }
      
      if (!access.passwordSetup || !access.hashedPassword) {
        return res.status(403).json({ success: false, message: "Please complete password setup first" });
      }
      
      if (access.expiresAt && new Date(access.expiresAt) < new Date()) {
        return res.status(403).json({ success: false, message: "Marketing access has expired" });
      }
      
      const passwordMatch = await bcrypt.compare(validatedBody.password, access.hashedPassword);
      
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      
      // Increment sessionVersion for session management (allows invalidation)
      const newSessionVersion = (user.sessionVersion || 0) + 1;
      await db.update(authUsers)
        .set({ sessionVersion: newSessionVersion })
        .where(eq(authUsers.id, user.id));
      
      // Use proper JWT utility for marketing tokens
      const token = generateMarketingAccessToken({
        userId: user.id,
        email: user.email,
        role: 'user',
        username: user.username || user.email,
        sessionVersion: newSessionVersion,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      
      console.log(`📊 Marketing login successful for ${user.email}`);
      
      res.json({ 
        success: true, 
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
      
    } catch (error: any) {
      console.error("Marketing login error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to login",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/access/revoke", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const [userData] = await db.select({ role: authUsers.role })
        .from(authUsers)
        .where(eq(authUsers.id, user.id))
        .limit(1);
      
      if (userData?.role !== "license_manager" && userData?.role !== "admin" && userData?.role !== "super_admin") {
        return res.status(403).json({ success: false, message: "License manager or admin access required" });
      }
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }
      
      await db.update(marketingAccess)
        .set({ status: "revoked", updatedAt: new Date() })
        .where(eq(marketingAccess.userId, userId));
      
      res.json({ success: true, message: "Access revoked" });
      
    } catch (error: any) {
      console.error("Revoke access error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to revoke access",
        error: error.message,
      });
    }
  });
  
  app.get("/api/marketing/access/users", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const [userData] = await db.select({ role: authUsers.role })
        .from(authUsers)
        .where(eq(authUsers.id, user.id))
        .limit(1);
      
      if (userData?.role !== "license_manager" && userData?.role !== "admin" && userData?.role !== "super_admin") {
        return res.status(403).json({ success: false, message: "License manager or admin access required" });
      }
      
      const accessList = await db.select({
        id: marketingAccess.id,
        userId: marketingAccess.userId,
        status: marketingAccess.status,
        passwordSetup: marketingAccess.passwordSetup,
        createdAt: marketingAccess.createdAt,
        email: authUsers.email,
        firstName: authUsers.firstName,
        lastName: authUsers.lastName,
      })
        .from(marketingAccess)
        .innerJoin(authUsers, eq(marketingAccess.userId, authUsers.id))
        .where(eq(marketingAccess.grantedBy, user.id));
      
      res.json({ success: true, users: accessList });
      
    } catch (error: any) {
      console.error("List access users error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to list users",
        error: error.message,
      });
    }
  });
  
  app.get("/api/marketing/domain-expertise", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      
      const domain = user.email ? user.email.split("@")[1] || "" : "";
      const companyName = domain ? capitalizeCompanyName(domain.split(".")[0]) : "";
      
      res.json({
        success: true,
        domainExpertise: {
          email: user.email,
          domain,
          companyName,
          isSuperAdmin,
          canAccessAll: isSuperAdmin,
          canEditDomain: isSuperAdmin,
        },
      });
      
    } catch (error: any) {
      console.error("Get domain expertise error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get domain expertise",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/domain-expertise", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      
      if (!isSuperAdmin) {
        return res.status(403).json({ success: false, message: "Only super admin can modify domain expertise" });
      }
      
      const { customDomain, accessAll } = req.body;
      
      res.json({
        success: true,
        message: accessAll ? "Access All mode enabled" : `Domain set to ${customDomain}`,
        domainExpertise: {
          customDomain: accessAll ? null : customDomain,
          accessAll,
        },
      });
      
    } catch (error: any) {
      console.error("Set domain expertise error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to set domain expertise",
        error: error.message,
      });
    }
  });
  
  app.get("/api/marketing/available-domains", authenticateMarketing, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";
      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      
      if (!isSuperAdmin) {
        return res.status(403).json({ success: false, message: "Only super admin can view all domains" });
      }
      
      const { getAvailableDomains } = await import("./data/dummy-backups/seed-marketing-data");
      const domainList = await getAvailableDomains();
      
      res.json({
        success: true,
        domains: domainList,
      });
      
    } catch (error: any) {
      console.error("Get available domains error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get available domains",
        error: error.message,
      });
    }
  });
  
  app.post("/api/marketing/seed-dummy-data", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const [userData] = await db.select({ role: authUsers.role })
        .from(authUsers)
        .where(eq(authUsers.id, user.id))
        .limit(1);
      
      if (userData?.role !== "admin" && userData?.role !== "super_admin") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      
      console.log(`🌱 Admin ${user.email} triggered marketing dummy data seeding`);
      
      const { seedMarketingDummyData } = await import("./data/dummy-backups/seed-marketing-data");
      const result = await seedMarketingDummyData();
      
      res.json({
        success: true,
        message: `Seeded ${result.backupsCreated} conversation backups across ${result.domainsCreated} domains`,
        backupsCreated: result.backupsCreated,
        domainsCreated: result.domainsCreated,
      });
      
    } catch (error: any) {
      console.error("Seed dummy data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to seed dummy data",
        error: error.message,
      });
    }
  });
  
  app.delete("/api/marketing/seed-dummy-data", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const [userData] = await db.select({ role: authUsers.role })
        .from(authUsers)
        .where(eq(authUsers.id, user.id))
        .limit(1);
      
      if (userData?.role !== "admin" && userData?.role !== "super_admin") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      
      console.log(`🧹 Admin ${user.email} triggered marketing dummy data cleanup`);
      
      const { clearMarketingDummyData } = await import("./data/dummy-backups/seed-marketing-data");
      const result = await clearMarketingDummyData();
      
      res.json({
        success: true,
        message: `Cleared ${result.backupsDeleted} conversation backups`,
        backupsDeleted: result.backupsDeleted,
      });
      
    } catch (error: any) {
      console.error("Clear dummy data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear dummy data",
        error: error.message,
      });
    }
  });
  
  console.log("📊 Marketing routes registered");
}

function capitalizeCompanyName(name: string): string {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
