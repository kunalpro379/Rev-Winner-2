import type { Express } from "express";
import { z } from "zod";
import { salesIntelligenceAgent } from "./services/sales-intelligence-agent";
import { authenticateToken } from "./middleware/auth";
import { SALES_INTENT_TYPES } from "@shared/schema";

export function setupSalesIntelligenceRoutes(app: Express) {
  // Process customer question passively (main endpoint for frontend hook)
  app.post("/api/sales-intelligence/process", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, customerQuestion, conversationContext, domainExpertise, domainExpertiseId } = req.body;
      const userId = req.jwtUser?.userId;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required", suggestion: null });
      }

      if (!customerQuestion || customerQuestion.trim().length < 10) {
        return res.json({ suggestion: null, reason: "question_too_short" });
      }

      const suggestion = await salesIntelligenceAgent.generateSuggestion(
        customerQuestion,
        sessionId,
        userId,
        { 
          industry: domainExpertise,
          conversationContext,
          domainExpertiseId
        }
      );

      res.json({ suggestion });
    } catch (error: any) {
      console.error("[SalesIntelligence] Process error:", error);
      res.status(500).json({ error: "Processing failed", suggestion: null });
    }
  });

  // Zod schema for feedback validation
  const feedbackSchema = z.object({
    suggestionId: z.string().min(1, "suggestionId is required"),
    wasUsed: z.boolean(),
    sessionId: z.string().min(1, "sessionId is required")
  });

  // Record feedback on a suggestion
  app.post("/api/sales-intelligence/feedback", authenticateToken, async (req: any, res) => {
    try {
      const validationResult = feedbackSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: validationResult.error.errors[0]?.message || "Invalid request data", 
          success: false 
        });
      }
      
      const { suggestionId, wasUsed } = validationResult.data;
      await salesIntelligenceAgent.updateSuggestionOutcome(suggestionId, wasUsed);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[SalesIntelligence] Feedback error:", error);
      res.status(500).json({ error: "Failed to record feedback", success: false });
    }
  });

  // Zod schema for learning log validation
  const learnSchema = z.object({
    sessionId: z.string().min(1, "sessionId is required"),
    customerQuestion: z.string().min(1, "customerQuestion is required"),
    repResponse: z.string().optional(),
    suggestedResponse: z.string().optional(),
    detectedIntent: z.string().optional(),
    usedSuggestion: z.boolean().optional(),
    domainExpertise: z.string().optional()
  });

  // Log learning data from conversation
  app.post("/api/sales-intelligence/learn", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      
      const validationResult = learnSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: validationResult.error.errors[0]?.message || "Invalid request data", 
          success: false 
        });
      }
      
      const { sessionId, customerQuestion, repResponse, suggestedResponse, detectedIntent, usedSuggestion, domainExpertise } = validationResult.data;
      
      await salesIntelligenceAgent.logLearning({
        sessionId,
        customerQuestion,
        repActualResponse: repResponse,
        suggestedResponse,
        detectedIntent,
        repUsedSuggestion: usedSuggestion,
        industry: domainExpertise,
        userId
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[SalesIntelligence] Learn error:", error);
      res.status(500).json({ error: "Failed to log learning data", success: false });
    }
  });

  // Get intent types
  app.get("/api/sales-intelligence/intent-types", authenticateToken, async (req: any, res) => {
    try {
      res.json({ intentTypes: Object.values(SALES_INTENT_TYPES) });
    } catch (error: any) {
      console.error("[SalesIntelligence] Intent types error:", error);
      res.status(500).json({ error: "Failed to fetch intent types" });
    }
  });

  // Get suggestion for customer question (passive, non-blocking)
  app.post("/api/sales-intelligence/suggest", authenticateToken, async (req: any, res) => {
    try {
      const { customerQuestion, conversationId, industry, persona, salesStage, product } = req.body;
      const userId = req.jwtUser?.userId;

      if (!customerQuestion || customerQuestion.trim().length < 10) {
        return res.json({ suggestion: null, reason: "question_too_short" });
      }

      const suggestion = await salesIntelligenceAgent.generateSuggestion(
        customerQuestion,
        conversationId,
        userId,
        { industry, persona, salesStage, product }
      );

      if (!suggestion) {
        return res.json({ suggestion: null, reason: "no_high_confidence_match" });
      }

      res.json({ suggestion });
    } catch (error: any) {
      console.error("[SalesIntelligence] Suggest error:", error);
      res.json({ suggestion: null, reason: "error" });
    }
  });

  // Update suggestion outcome (was it used or ignored)
  app.post("/api/sales-intelligence/suggestion/:id/outcome", authenticateToken, async (req: any, res) => {
    try {
      const { wasUsed } = req.body;
      await salesIntelligenceAgent.updateSuggestionOutcome(req.params.id, wasUsed);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[SalesIntelligence] Update outcome error:", error);
      res.status(500).json({ error: "Failed to update outcome" });
    }
  });

  // Log post-call learning data
  app.post("/api/sales-intelligence/learning-log", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      const data = {
        ...req.body,
        userId
      };
      await salesIntelligenceAgent.logLearning(data);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[SalesIntelligence] Learning log error:", error);
      res.status(500).json({ error: "Failed to log learning data" });
    }
  });

  // ==================== ADMIN/RESEARCH ENDPOINTS ====================

  // Get knowledge store entries
  app.get("/api/sales-intelligence/knowledge", authenticateToken, async (req: any, res) => {
    try {
      const { intentType, industry, isValidated, isActive, search } = req.query;
      
      const knowledge = await salesIntelligenceAgent.getKnowledgeStore({
        intentType: intentType as string,
        industry: industry as string,
        isValidated: isValidated === "true" ? true : isValidated === "false" ? false : undefined,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        search: search as string
      });

      res.json({ knowledge, intentTypes: Object.values(SALES_INTENT_TYPES) });
    } catch (error: any) {
      console.error("[SalesIntelligence] Get knowledge error:", error);
      res.status(500).json({ error: "Failed to fetch knowledge store" });
    }
  });

  // Add new knowledge entry
  app.post("/api/sales-intelligence/knowledge", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      const role = req.jwtUser?.role;

      if (role !== "admin" && role !== "super_admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const schema = z.object({
        intentType: z.string(),
        suggestedResponse: z.string().min(10),
        followUpPrompt: z.string().optional(),
        industry: z.string().optional(),
        persona: z.string().optional(),
        salesStage: z.string().optional(),
        triggerKeywords: z.array(z.string()).optional(),
        source: z.string().optional(),
        notes: z.string().optional()
      });

      const data = schema.parse(req.body);
      const knowledge = await salesIntelligenceAgent.addKnowledge(data);

      if (!knowledge) {
        return res.status(500).json({ error: "Failed to add knowledge" });
      }

      res.status(201).json({ knowledge });
    } catch (error: any) {
      console.error("[SalesIntelligence] Add knowledge error:", error);
      res.status(400).json({ error: error.message || "Failed to add knowledge" });
    }
  });

  // Validate knowledge entry
  app.post("/api/sales-intelligence/knowledge/:id/validate", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      const role = req.jwtUser?.role;

      if (role !== "admin" && role !== "super_admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const success = await salesIntelligenceAgent.validateKnowledge(req.params.id, userId);
      res.json({ success });
    } catch (error: any) {
      console.error("[SalesIntelligence] Validate knowledge error:", error);
      res.status(500).json({ error: "Failed to validate knowledge" });
    }
  });

  // Get analytics
  app.get("/api/sales-intelligence/analytics", authenticateToken, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateRange = startDate && endDate 
        ? { start: new Date(startDate as string), end: new Date(endDate as string) }
        : undefined;

      const analytics = await salesIntelligenceAgent.getAnalytics(dateRange);
      res.json(analytics);
    } catch (error: any) {
      console.error("[SalesIntelligence] Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get learning logs for research
  app.get("/api/sales-intelligence/learning-logs", authenticateToken, async (req: any, res) => {
    try {
      const role = req.jwtUser?.role;
      if (role !== "admin" && role !== "super_admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { processingStatus, canUseForMarketing, canUseForTraining, limit, offset } = req.query;

      const { logs, total } = await salesIntelligenceAgent.getLearningLogs({
        processingStatus: processingStatus as string,
        canUseForMarketing: canUseForMarketing === "true" ? true : canUseForMarketing === "false" ? false : undefined,
        canUseForTraining: canUseForTraining === "true" ? true : canUseForTraining === "false" ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({ logs, total });
    } catch (error: any) {
      console.error("[SalesIntelligence] Learning logs error:", error);
      res.status(500).json({ error: "Failed to fetch learning logs" });
    }
  });

  // Export data for research/marketing
  app.post("/api/sales-intelligence/export", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      const role = req.jwtUser?.role;

      if (role !== "admin" && role !== "super_admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const schema = z.object({
        exportName: z.string().min(1),
        exportType: z.enum(["knowledge", "suggestions", "learning_logs", "analytics"]),
        dateRangeStart: z.string().optional(),
        dateRangeEnd: z.string().optional(),
        intentFilter: z.string().optional(),
        industryFilter: z.string().optional(),
        purpose: z.string().min(1),
        notes: z.string().optional()
      });

      const data = schema.parse(req.body);
      
      const result = await salesIntelligenceAgent.exportData({
        ...data,
        dateRangeStart: data.dateRangeStart ? new Date(data.dateRangeStart) : undefined,
        dateRangeEnd: data.dateRangeEnd ? new Date(data.dateRangeEnd) : undefined,
        exportedBy: userId
      });

      res.json(result);
    } catch (error: any) {
      console.error("[SalesIntelligence] Export error:", error);
      res.status(400).json({ error: error.message || "Failed to export data" });
    }
  });

  // Get export history
  app.get("/api/sales-intelligence/exports", authenticateToken, async (req: any, res) => {
    try {
      const role = req.jwtUser?.role;
      if (role !== "admin" && role !== "super_admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const exports = await salesIntelligenceAgent.getExportHistory();
      res.json({ exports });
    } catch (error: any) {
      console.error("[SalesIntelligence] Export history error:", error);
      res.status(500).json({ error: "Failed to fetch export history" });
    }
  });

  // Get intent types for dropdown
  app.get("/api/sales-intelligence/intent-types", (_req, res) => {
    res.json({ intentTypes: Object.values(SALES_INTENT_TYPES) });
  });

  console.log("📊 Sales Intelligence routes registered");
}
