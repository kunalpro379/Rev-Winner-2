import type { Express, Request, Response } from "express";
import { authenticateApiKey } from "./routes-api-keys";
import { authStorage } from "./storage-auth";
import { db } from "./db";
import { authUsers, conversationMemories, callRecordings, sessionUsage } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

/**
 * Public API Routes
 * These endpoints are accessible via API keys for external integrations
 * All endpoints require X-API-Key header
 */
export function setupPublicApiRoutes(app: Express) {
  console.log("Setting up Public API routes at /api/v1/*");
  
  // Test endpoint to verify API key is working
  app.get("/api/v1/test", authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const apiKey = (req as any).apiKey;
      
      res.json({
        success: true,
        message: "API key is valid and working!",
        timestamp: new Date().toISOString(),
        apiKey: {
          name: apiKey.name,
          scopes: apiKey.scopes || ["read"],
          rateLimit: `${apiKey.rateLimit || 1000}/${apiKey.rateLimitWindow || "hour"}`,
        },
      });
    } catch (error: any) {
      console.error("Error in /api/v1/test:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });
  
  // Get user profile information
  app.get("/api/v1/user/profile", authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const apiKey = (req as any).apiKey;
      const userId = apiKey.createdBy;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID not found in API key" });
      }
      
      const user = await db
        .select({
          id: authUsers.id,
          email: authUsers.email,
          firstName: authUsers.firstName,
          lastName: authUsers.lastName,
          username: authUsers.username,
          createdAt: authUsers.createdAt,
        })
        .from(authUsers)
        .where(eq(authUsers.id, userId))
        .limit(1);
      
      if (!user || user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        success: true,
        data: user[0],
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });
  
  // Get AI token usage statistics
  app.get("/api/v1/usage/ai-tokens", authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const apiKey = (req as any).apiKey;
      const userId = apiKey.createdBy;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID not found in API key" });
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
      
      res.json({
        success: true,
        data: {
          usage,
          summary,
        },
      });
    } catch (error: any) {
      console.error("Error fetching AI token usage:", error);
      res.status(500).json({ error: "Failed to fetch AI token usage" });
    }
  });
  
  // Get session usage statistics
  app.get("/api/v1/usage/sessions", authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const apiKey = (req as any).apiKey;
      const userId = apiKey.createdBy;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID not found in API key" });
      }
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sessions = await db
        .select()
        .from(sessionUsage)
        .where(
          and(
            eq(sessionUsage.userId, userId),
            gte(sessionUsage.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(sessionUsage.createdAt));
      
      res.json({
        success: true,
        data: {
          totalSessions: sessions.length,
          sessions: sessions.map(s => ({
            id: s.id,
            sessionId: s.sessionId,
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
            durationSeconds: s.durationSeconds,
            createdAt: s.createdAt,
          })),
        },
      });
    } catch (error: any) {
      console.error("Error fetching session usage:", error);
      res.status(500).json({ error: "Failed to fetch session usage" });
    }
  });
  
  // Get conversation history
  app.get("/api/v1/conversations", authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const apiKey = (req as any).apiKey;
      const userId = apiKey.createdBy;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID not found in API key" });
      }
      
      const { limit = 10 } = req.query;
      
      const conversations = await db
        .select()
        .from(conversationMemories)
        .where(eq(conversationMemories.userId, userId))
        .orderBy(desc(conversationMemories.createdAt))
        .limit(Number(limit));
      
      res.json({
        success: true,
        data: {
          total: conversations.length,
          conversations: conversations.map(c => ({
            id: c.id,
            conversationId: c.conversationId,
            spinSituation: c.spinSituation,
            spinProblems: c.spinProblems,
            spinImplications: c.spinImplications,
            spinNeedPayoff: c.spinNeedPayoff,
            buyerStage: c.buyerStage,
            createdAt: c.createdAt,
          })),
        },
      });
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get call recordings
  app.get("/api/v1/recordings", authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const apiKey = (req as any).apiKey;
      const userId = apiKey.createdBy;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID not found in API key" });
      }
      
      const { limit = 10 } = req.query;
      
      const recordings = await db
        .select({
          id: callRecordings.id,
          userId: callRecordings.userId,
          duration: callRecordings.duration,
          status: callRecordings.status,
          createdAt: callRecordings.createdAt,
        })
        .from(callRecordings)
        .where(eq(callRecordings.userId, userId))
        .orderBy(desc(callRecordings.createdAt))
        .limit(Number(limit));
      
      res.json({
        success: true,
        data: {
          total: recordings.length,
          recordings,
        },
      });
    } catch (error: any) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });
  
  console.log(" Public API routes registered at /api/v1/*");
}
