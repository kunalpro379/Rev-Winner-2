import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { z } from "zod";
import { verifyAccessToken } from "./utils/jwt";
import { storage } from "./storage";
import { authStorage } from "./storage-auth";
import { generateSalesResponse, generateCallSummary, generateCoachingSuggestions } from "./services/openai";
import { insertConversationSchema, insertMessageSchema, insertTeamsMeetingSchema, insertAudioSourceSchema, insertSessionUsageSchema, AUDIO_SOURCE_TYPES, subscriptions, pendingOrders, addonPurchases, sessionUsage, conversations } from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAuthRoutes } from "./routes-auth";
import { setupAdminRoutes } from "./routes-admin";
import { setupAdminPlansRoutes } from "./routes-admin-plans";
import { setupTranscriptionRoutes } from "./routes-transcription";
import { setupEnterpriseRoutes } from "./routes-enterprise";
import { setupBillingRoutes } from "./routes-billing";
import { setupSupportRoutes } from "./routes-support";
import { setupGameRoutes } from "./routes-game";
import { registerBackupRoutes } from "./routes-backup";

import { registerMarketingRoutes } from "./routes-marketing";
import { setupSalesIntelligenceRoutes } from "./routes-sales-intelligence";
import { registerBibleRoutes } from "./routes-bible";
import apiDocsRouter from "./routes-api-docs";
import recordingsRouter from "./routes-recordings";
import apiKeysRouter from "./routes-api-keys";
import { setupPublicApiRoutes } from "./routes-public-api";
import { authenticateToken } from "./middleware/auth";
import { checkEntitlement } from "./middleware/entitlement";
import { logSuperUserAccess } from "./utils/accessControl";
import crypto from "crypto";

// Helper: Check if user has active enterprise license
async function hasActiveEnterpriseLicense(userId: string): Promise<boolean> {
  try {
    // Get user's active license assignment
    const assignment = await authStorage.getUserActiveLicenseAssignment(userId);
    if (!assignment) {
      return false;
    }
    
    // Verify the organization membership is active
    const membership = await authStorage.getUserMembership(userId);
    if (!membership || membership.status !== 'active') {
      return false;
    }
    
    // Get the active license package
    const licensePackage = await authStorage.getActiveLicensePackage(membership.organizationId);
    if (!licensePackage) {
      return false;
    }
    
    // Check if license package hasn't expired
    const now = new Date();
    if (new Date(licensePackage.endDate) < now) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking enterprise license:', error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Public API endpoints (require API key authentication) - MUST be first before catch-all routes
  setupPublicApiRoutes(app);
  
  // Health check endpoint for deployment
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Favicon endpoint - serve the logo as favicon to prevent 500 errors
  app.get("/favicon.ico", (_req, res) => {
    try {
      // In production, serve from dist/public/assets
      // In development, serve from client/public/assets
      const isProduction = process.env.NODE_ENV === "production";
      const faviconPath = isProduction 
        ? path.resolve(import.meta.dirname, "public", "assets", "rev-winner-logo.png")
        : path.resolve(import.meta.dirname, "..", "client", "public", "assets", "rev-winner-logo.png");
      
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
      res.sendFile(faviconPath);
    } catch (error) {
      console.error("Error serving favicon:", error);
      res.status(404).end();
    }
  });

  // Authentication disabled - open access
  // await setupAuth(app);

  // Start a new conversation session
  app.post("/api/conversations", async (req, res) => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Try to get authenticated user ID, but allow anonymous conversations
      let userId = null;
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          const decoded = verifyAccessToken(token);
          userId = decoded.userId;
          console.log(`✅ Authenticated user creating conversation: ${userId}`);
        }
      } catch (error) {
        // Continue with anonymous conversation if token is invalid
        console.log("Creating anonymous conversation - no valid token provided");
      }
      
      const conversationData = {
        sessionId,
        userId: userId,
        clientName: req.body.clientName || null
      };
      
      const validatedData = insertConversationSchema.parse(conversationData);
      const conversation = await storage.createConversation(validatedData);
      
      // Add initial assistant message
      const initialMessage = await storage.addMessage({
        conversationId: conversation.id,
        content: "Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?",
        sender: "assistant"
      });
      
      res.json({
        conversation,
        messages: [initialMessage]
      });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create conversation", error: error.message });
    }
  });

  // Get payment gateway configuration
  app.get("/api/payment/config", async (req, res) => {
    try {
      const gateway = process.env.PAYMENT_GATEWAY || 'razorpay';
      const environment = process.env.ENVIRONMENT || 'DEVELOPMENT';
      const isProduction = environment === 'PROD' || environment === 'PRODUCTION';
      
      let keyId = '';
      
      if (gateway === 'razorpay') {
        keyId = isProduction 
          ? process.env.RAZORPAY_LIVE_KEY_ID || ''
          : process.env.RAZORPAY_TEST_KEY_ID || '';
      } else if (gateway === 'cashfree') {
        keyId = isProduction 
          ? process.env.CASHFREE_APP_ID || ''
          : process.env.CASHFREE_SANDBOX_APP_ID || '';
      }
      
      res.json({
        gateway,
        keyId,
        environment: isProduction ? 'PRODUCTION' : 'TEST'
      });
    } catch (error: any) {
      console.error('Error getting payment config:', error);
      res.status(500).json({ 
        message: "Failed to get payment configuration",
        error: error.message 
      });
    }
  });

  // Get active terms and conditions (public endpoint)
  app.get("/api/terms", async (req, res) => {
    try {
      const activeTerms = await authStorage.getActiveTermsAndConditions();
      if (!activeTerms) {
        return res.status(404).json({ error: "Terms and conditions not found" });
      }
      
      res.json({
        title: activeTerms.title,
        content: activeTerms.content,
        version: activeTerms.version,
        lastUpdated: activeTerms.updatedAt
      });
    } catch (error) {
      console.error("Get terms error:", error);
      res.status(500).json({ error: "Failed to get terms and conditions" });
    }
  });

  // Get conversation and messages
  app.get("/api/conversations/:sessionId", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const messages = await storage.getMessages(conversation.id);
      
      res.json({
        conversation,
        messages
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch conversation", error: error.message });
    }
  });

  // Get all conversations for a user (for profile page)
  app.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      if (!req.jwtUser?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get conversations from database
      const userConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.userId, req.jwtUser.id))
        .orderBy(desc(conversations.createdAt))
        .limit(50); // Limit to last 50 conversations

      // Transform to session history format
      const sessionHistory = userConversations.map(conv => ({
        sessionId: conv.sessionId,
        startTime: conv.createdAt?.toISOString() || new Date().toISOString(),
        endTime: conv.endedAt ? conv.endedAt.toISOString() : new Date().toISOString(),
        durationMinutes: conv.endedAt && conv.createdAt
          ? Math.round((conv.endedAt.getTime() - conv.createdAt.getTime()) / (1000 * 60))
          : conv.createdAt
          ? Math.round((new Date().getTime() - conv.createdAt.getTime()) / (1000 * 60))
          : 0,
        summary: conv.callSummary || null
      }));

      res.json({ conversations: userConversations, sessionHistory });
    } catch (error: any) {
      console.error("Error fetching user conversations:", error);
      res.status(500).json({ message: "Failed to get conversations", error: error.message });
    }
  });

  // Get AI coaching suggestions
  app.post("/api/conversations/:sessionId/coaching", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const { conversationContext, transcriptEntries, currentInsights } = req.body;
      
      const coaching = await generateCoachingSuggestions(
        conversationContext || "",
        transcriptEntries || [],
        currentInsights || {},
        req.jwtUser?.userId
      );
      
      res.json(coaching);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate coaching suggestions", error: error.message });
    }
  });

  // Send message and get AI response
  app.post("/api/conversations/:sessionId/messages", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (conversation.status === "ended") {
        return res.status(400).json({ message: "Conversation has ended" });
      }

      // Get or create default audio source for this message
      const defaultAudioSource = await storage.getDefaultAudioSource(conversation.id);
      
      const messageData = {
        conversationId: conversation.id,
        content: req.body.content,
        sender: "user",
        speakerLabel: req.body.speakerLabel || null,
        audioSourceId: req.body.audioSourceId || defaultAudioSource.id
      };
      
      const validatedMessage = insertMessageSchema.parse(messageData);
      
      // Check for /end command
      if (req.body.content.trim() === "/end") {
        const messages = await storage.getMessages(conversation.id);
        const conversationHistory = messages.map(m => ({
          sender: m.sender,
          content: m.content
        }));
        
        const summary = await generateCallSummary(conversationHistory, conversation.discoveryInsights, req.jwtUser?.userId);
        const summarySections = [
          summary.keychallenges?.length ? `Key challenges: ${summary.keychallenges.join("; ")}.` : null,
          summary.discoveryInsights?.length ? `Discovery insights: ${summary.discoveryInsights.join("; ")}.` : null,
          summary.objections?.length ? `Objections & responses: ${summary.objections.join("; ")}.` : null,
          summary.nextSteps?.length ? `Next steps: ${summary.nextSteps.join("; ")}.` : null,
          summary.recommendedSolutions?.length ? `Recommended solutions: ${summary.recommendedSolutions.join("; ")}.` : null
        ].filter(Boolean);
        const summaryText = summarySections.join(" ");
        
        await storage.endConversation(req.params.sessionId, summaryText);
        
        return res.json({
          message: "Conversation ended",
          summary: summary
        });
      }
      
      // Add user message
      const userMessage = await storage.addMessage(validatedMessage);
      
      // Get conversation history for context (limit to recent messages for performance)
      const allMessages = await storage.getMessages(conversation.id);
      const conversationHistory = allMessages.slice(0, -1).slice(-10).map(m => ({
        sender: m.sender,
        content: m.content
      }));
      
      // Generate AI response with sales framework context
      const domainExpertise = req.body.domainExpertise || "Generic Product";
      const aiResponse = await generateSalesResponse(
        req.body.content,
        conversationHistory,
        conversation.discoveryInsights,
        domainExpertise,
        req.jwtUser?.userId,
        conversation.id
      );
      
      // Update conversation learnings in background (don't await to keep response fast)
      if (req.jwtUser?.userId) {
        const { updateConversationLearnings } = await import("./services/sales-methodology");
        const fullTranscript = allMessages.map(m => m.content).join(' ');
        updateConversationLearnings(
          req.jwtUser.userId,
          conversation.id,
          fullTranscript,
          aiResponse
        ).catch(err => console.error('Error updating conversation learnings:', err));
      }
      
      // Do not store AI message or AI analysis data in the database
      const assistantMessage = {
        id: crypto.randomUUID(),
        content: aiResponse.response,
        sender: "assistant",
        speakerLabel: "AI Assistant",
        timestamp: new Date().toISOString()
      };
      
      res.json({
        userMessage,
        assistantMessage
      });
      
    } catch (error: any) {
      res.status(500).json({ message: "Failed to process message", error: error.message });
    }
  });

  // Analyze transcript on-demand (OPTIMIZED for real-time speed)
  app.post("/api/conversations/:sessionId/analyze", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const { transcriptText, domainExpertise, multiProductEliteAI: rawMultiProductFlag } = req.body;
      
      if (!transcriptText || !transcriptText.trim()) {
        return res.status(400).json({ message: "Transcript text is required" });
      }

      // Validate and coerce multiProductEliteAI to boolean
      const multiProductEliteAI = typeof rawMultiProductFlag === 'boolean' 
        ? rawMultiProductFlag 
        : rawMultiProductFlag === 'true' || rawMultiProductFlag === true;

      // Get recent context for speed (last 5 messages only)
      const allMessages = await storage.getMessages(conversation.id);
      const recentMessages = allMessages.slice(-5);
      const conversationHistory = recentMessages.map(m => ({
        sender: m.sender,
        content: m.content
      }));

      // Use ULTRA-FAST combined analysis - ONE AI call instead of two
      const domain = domainExpertise || "Generic Product";
      const { generateCombinedAnalysis } = await import("./services/openai");
      
      const featureLabel = multiProductEliteAI ? " with Multi-Product Elite AI" : "";
      console.log(`🚀 ULTRA-FAST combined analysis started${featureLabel} - ${conversationHistory.length} messages context for ${domain}`);
      const startTime = Date.now();
      
      const result = await generateCombinedAnalysis(
        transcriptText,
        conversationHistory,
        domain,
        req.jwtUser?.userId,
        multiProductEliteAI || false
      );
      
      let { analysis, salesScript, multiProductIntelligence, products, _multiProduct } = result;
      
      // API-LEVEL VALIDATION: Re-validate products array before sending to frontend
      // This ensures contract guarantees even if generateCombinedAnalysis had errors
      if (_multiProduct && products && Array.isArray(products) && products.length > 0) {
        const { multiProductResponseSchema } = await import("@shared/schema");
        const apiValidation = multiProductResponseSchema.safeParse({ products });
        
        if (!apiValidation.success) {
          console.error(`❌ API-level multi-product validation failed:`, apiValidation.error.errors);
          console.log(`⚠️ Clearing products array and _multiProduct flag due to validation failure`);
          // Clear invalid data to prevent frontend crashes
          products = undefined;
          _multiProduct = false;
        } else {
          console.log(`✅ API-level multi-product validation passed: ${products.length} products`);
        }
      }
      
      const totalDuration = Date.now() - startTime;
      const multiProductLabel = multiProductIntelligence ? ` [Multi-Product: ${multiProductIntelligence.detectedProducts?.length || 0} products]` : "";
      const productsLabel = products ? ` [Products: ${products.length}]` : "";
      console.log(`🚀 ULTRA-FAST analysis completed in ${totalDuration}ms (single AI call)${multiProductLabel}${productsLabel}`);
      
      res.json({
        discoveryQuestions: analysis.discoveryQuestions || [],
        recommendedSolutions: analysis.recommendedModules || [],
        caseStudies: analysis.caseStudies || [],
        discoveryInsights: analysis.discoveryInsights || {},
        nextQuestions: analysis.nextQuestions || [],
        salesScript: salesScript,
        closingPitch: analysis.closingPitch || null,
        nextSteps: analysis.nextSteps || [],
        multiProductIntelligence: multiProductIntelligence || null,
        products: products || null,
        _multiProduct: _multiProduct || false,
        _performance: { 
          totalDuration,
          messageCount: conversationHistory.length,
          optimized: true,
          multiProductEliteAI: !!multiProductIntelligence,
          multiProduct: _multiProduct || false
        }
      });
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      // Return fallback analysis instead of 500 error for better UX
      const domain = req.body?.domainExpertise || "Generic Product";
      const fallbackAnalysis = {
        response: "",
        discoveryInsights: {
          painPoints: [`Explore ${domain} challenges`],
          currentEnvironment: `Discuss current ${domain} setup`,
          requirements: [`Identify ${domain} requirements`]
        },
        discoveryQuestions: [
          `What are your biggest ${domain} challenges right now?`,
          `How is your team currently handling ${domain} workflows?`,
          `What would success look like for your ${domain} initiative?`,
          `Who else is involved in this decision process?`,
          `What's your timeline for making a decision?`
        ],
        bantQualification: {
          budget: { asked: false },
          authority: { asked: false },
          need: { asked: false },
          timeline: { asked: false }
        },
        nextQuestions: [`What's your top priority for ${domain}?`],
        recommendedModules: [],
        caseStudies: [],
        closingPitch: {
          urgencyBuilder: `Acting now on your ${domain} needs means faster results.`,
          objectionHandling: [`We understand budget concerns - let's discuss ROI.`],
          finalValue: `Our ${domain} solution delivers measurable results.`,
          callToAction: `Let's schedule a demo to show you exactly how we can help.`
        },
        nextSteps: [
          `Schedule a technical demo this week`,
          `Review detailed proposal within 48 hours`,
          `Connect with stakeholders for alignment`
        ]
      };
      const fallbackScript = {
        solutions: [`${domain} solution tailored to your needs`],
        valueProposition: [`${domain} solution with proven results`],
        technicalAnswers: [`Our ${domain} platform handles your requirements`],
        caseStudies: [`Similar companies have achieved success with our solution`],
        competitorAnalysis: [`We offer comprehensive ${domain} capabilities`],
        whyBetter: [`Proven track record in ${domain}`]
      };
      res.json({ 
        analysis: fallbackAnalysis, 
        salesScript: fallbackScript,
        multiProductIntelligence: null,
        products: [],
        _multiProduct: false,
        _fallback: true
      });
    }
  });

  // Generate Shift Gears real-time tips for live conversation
  // CRITICAL: This endpoint must ALWAYS return 200 with tips, never error
  // Uses custom auth check that doesn't send error responses
  app.post("/api/conversations/:sessionId/shift-gears", async (req, res) => {
    const domain = req.body?.domainExpertise || "Generic Product";
    
    // Helper function to return fallback tips with 200 status
    const returnFallback = (reason?: string) => {
      console.log(`🔄 Shift Gears returning fallback tips (reason: ${reason || 'unknown'})`);
      const fallbackTips = [
        {
          type: "next_step",
          title: "Ask discovery questions",
          action: `Ask about their current ${domain} challenges and what success looks like for them.`,
          priority: "high"
        },
        {
          type: "psychological",
          title: "Build rapport first",
          action: "Listen actively and acknowledge their concerns before pitching solutions.",
          priority: "medium"
        },
        {
          type: "closure",
          title: "Propose next meeting",
          action: "Suggest a follow-up demo or technical call to show how your solution addresses their needs.",
          priority: "medium"
        }
      ];
      return res.status(200).json({ tips: fallbackTips, _fallback: true, _reason: reason });
    };
    
    try {
      // Custom silent auth check - doesn't send error response, just logs
      const authHeader = req.headers['authorization'];
      let token = authHeader && authHeader.split(' ')[1];
      if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }
      
      if (!token) {
        return returnFallback("no_auth_token");
      }
      
      // Verify token silently
      const { verifyAccessToken } = await import("./utils/jwt");
      const { authStorage } = await import("./storage-auth");
      
      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch (e: any) {
        return returnFallback("invalid_token");
      }
      
      const user = await authStorage.getUserById(payload.userId);
      if (!user) {
        return returnFallback("user_not_found");
      }
      
      // Attach user info to request
      req.jwtUser = payload;
      
      // Silent entitlement check - we don't need to block for shift gears
      // Just proceed with AI generation
      
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return returnFallback("conversation_not_found");
      }

      const { transcriptText, domainExpertise } = req.body;
      
      if (!transcriptText || !transcriptText.trim()) {
        return returnFallback("empty_transcript");
      }

      const { generateShiftGearsTips } = await import("./services/openai");
      const { validateDomainForSession } = await import("./services/ai-context-builder");
      
      const isUniversalMode = !domain || 
        domain === "Generic Product" || 
        domain === "Universal RV Mode" || 
        domain.toLowerCase().includes("universal");
      
      let enforcedDomain = domain;
      if (!isUniversalMode && req.jwtUser?.userId) {
        const domainValidation = await validateDomainForSession(req.jwtUser.userId, domain);
        console.log(`🔒 Shift Gears Domain Binding: "${domain}" - valid: ${domainValidation.valid}, id: ${domainValidation.domainId || 'N/A'}`);
        
        if (!domainValidation.valid) {
          console.log(`🚫 Shift Gears: Invalid domain "${domain}" - proceeding with strict empty context (no fallback)`);
        }
        enforcedDomain = domainValidation.valid ? domain : domain;
      }
      
      console.log(`🔄 Shift Gears: domain="${enforcedDomain}", strict=${!isUniversalMode}, userId=${req.jwtUser?.userId?.slice(0, 8)}...`);
      const startTime = Date.now();
      
      const tips = await generateShiftGearsTips(
        transcriptText,
        enforcedDomain,
        req.jwtUser?.userId
      );
      
      const duration = Date.now() - startTime;
      console.log(`🔄 Shift Gears completed in ${duration}ms - ${tips.length} tips (strict: ${!isUniversalMode})`);
      
      return res.status(200).json({
        tips,
        _performance: { duration }
      });
      
    } catch (error: any) {
      console.error('Shift Gears error (returning fallback):', error?.message || error);
      return returnFallback(error?.message || "unknown_error");
    }
  });

  // Generate Query Pitches - auto-analyze customer queries and generate pitch responses
  app.post("/api/conversations/:sessionId/query-pitches", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const { transcriptText, domainExpertise } = req.body;
      
      if (!transcriptText || !transcriptText.trim()) {
        return res.status(400).json({ message: "Transcript text is required" });
      }

      const domain = domainExpertise || "Generic Product";
      const { generateQueryPitches } = await import("./services/openai");
      const { validateDomainForSession } = await import("./services/ai-context-builder");
      
      const isUniversalMode = !domain || 
        domain === "Generic Product" || 
        domain === "Universal RV Mode" || 
        domain.toLowerCase().includes("universal");
      
      if (!isUniversalMode && req.jwtUser?.userId) {
        const domainValidation = await validateDomainForSession(req.jwtUser.userId, domain);
        console.log(`🔒 Query Pitches Domain Binding: "${domain}" - valid: ${domainValidation.valid}, id: ${domainValidation.domainId || 'N/A'}`);
        
        if (!domainValidation.valid) {
          console.log(`🚫 Query Pitches: Invalid domain "${domain}" - proceeding with strict empty context (no fallback)`);
        }
      }
      
      console.log(`💬 Query Pitches: domain="${domain}", strict=${!isUniversalMode}, userId=${req.jwtUser?.userId?.slice(0, 8)}...`);
      const startTime = Date.now();
      
      const pitches = await generateQueryPitches(
        transcriptText,
        domain,
        req.jwtUser?.userId
      );
      
      const duration = Date.now() - startTime;
      console.log(`💬 Query Pitches completed in ${duration}ms - ${pitches.length} pitches (strict: ${!isUniversalMode})`);
      
      res.json({
        pitches,
        _performance: { duration }
      });
      
    } catch (error: any) {
      console.error('Query Pitch error:', error);
      res.status(500).json({ message: "Failed to generate query pitches", error: error.message });
    }
  });

  // Answer questions about the conversation
  app.post("/api/conversations/:sessionId/ask", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const { question, conversationContext, domainExpertiseId } = req.body;
      
      if (!question || !question.trim()) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Get recent conversation history for context (last 15 messages instead of 30 - reduces memory)
      const allMessages = await storage.getMessages(conversation.id);
      const recentMessages = allMessages.slice(-15);
      const conversationHistory = recentMessages.map(m => ({
        sender: m.sender,
        content: m.content
      }));

      // Use provided context or build from history
      const context = conversationContext || conversationHistory.map(m => `${m.sender}: ${m.content}`).join('\n');
      
      const domain = req.body.domainExpertise || "Generic Product";
      const { answerConversationQuestion } = await import("./services/openai");
      const { validateDomainForSession } = await import("./services/ai-context-builder");
      
      const isUniversalMode = !domain || 
        domain === "Generic Product" || 
        domain === "Universal RV Mode" || 
        domain.toLowerCase().includes("universal");
      
      if (!isUniversalMode && req.jwtUser?.userId) {
        const domainValidation = await validateDomainForSession(req.jwtUser.userId, domain);
        console.log(`🔒 Ask Question Domain Binding: "${domain}" - valid: ${domainValidation.valid}, id: ${domainValidation.domainId || 'N/A'}`);
        
        if (!domainValidation.valid) {
          console.log(`🚫 Ask Question: Invalid domain "${domain}" - proceeding with strict empty context (no fallback)`);
        }
      }
      
      console.log(`❓ Ask Question: domain="${domain}", strict=${!isUniversalMode}, question="${question.slice(0, 50)}..."`);
      
      // Set response headers for faster initial response
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const answer = await answerConversationQuestion(
        question,
        context,
        domain,
        req.jwtUser?.userId,
        domainExpertiseId
      );
      
      res.json({ answer });
      
    } catch (error: any) {
      console.error('Q&A error:', error);
      // Return error without blocking UI
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to answer question", error: error.message });
      }
    }
  });

  // Present to Win - Generate sales materials (Multi-Product Support)
  app.post("/api/present-to-win/generate", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      if (!req.jwtUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { type, conversationContext, domainExpertise, sessionId, multiProductEliteAI: rawMultiProductFlag } = req.body;
      
      if (!type || !conversationContext) {
        return res.status(400).json({ message: "Type and conversation context are required" });
      }

      if (!['pitch-deck', 'case-study', 'battle-card'].includes(type)) {
        return res.status(400).json({ message: "Invalid content type" });
      }

      // Validate and coerce multiProductEliteAI to boolean
      const multiProductEliteAI = typeof rawMultiProductFlag === 'boolean' 
        ? rawMultiProductFlag 
        : rawMultiProductFlag === 'true' || rawMultiProductFlag === true;

      const domain = domainExpertise || "Generic Product";
      const featureLabel = multiProductEliteAI ? " with Multi-Product Elite AI" : "";
      console.log(`🎯 Generating ${type} for ${domain}${featureLabel}`);
      const startTime = Date.now();
      
      const { generatePresentToWin, generateMultiProductPresentToWin } = await import("./services/openai");
      
      let result: any;
      
      if (multiProductEliteAI) {
        // Multi-product generation
        result = await generateMultiProductPresentToWin(
          type,
          conversationContext,
          domain,
          req.jwtUser.userId
        );
        
        // Validate products array if multi-product
        if (result._multiProduct && result.products && Array.isArray(result.products) && result.products.length > 0) {
          // Basic validation: each product should have productName and content
          const validProducts = result.products.every((p: any) => 
            p.productName && 
            p.productCode && 
            p.content && 
            typeof p.content === 'object'
          );
          
          if (!validProducts) {
            console.error(`❌ Multi-product Present to Win validation failed`);
            console.log(`⚠️ Falling back to single-product mode`);
            // Generate single-product fallback and clear multi-product flags
            const singleContent = await generatePresentToWin(type, conversationContext, domain, req.jwtUser.userId);
            result = {
              ...singleContent,
              _multiProduct: false,
              products: undefined
            };
          } else {
            console.log(`✅ Multi-product Present to Win validation passed: ${result.products.length} products`);
          }
        } else if (!result._multiProduct) {
          // Ensure single-product format is clean
          result._multiProduct = false;
          result.products = undefined;
        }
      } else {
        // Single-product generation - ensure clean format
        const singleContent = await generatePresentToWin(type, conversationContext, domain, req.jwtUser.userId);
        result = {
          ...singleContent,
          _multiProduct: false,
          products: undefined
        };
      }
      
      const duration = Date.now() - startTime;
      const productLabel = result._multiProduct ? ` [${result.products?.length || 0} products]` : "";
      console.log(`🎯 ${type} generated in ${duration}ms${productLabel}`);
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Present to Win error:', error);
      res.status(500).json({ message: "Failed to generate content", error: error.message });
    }
  });

  // Get product reference data
  app.get("/api/product-reference", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const domainExpertise = req.query.domain as string || "Generic Product";
      console.log(`Generating product reference for domain: ${domainExpertise}`);
      
      const { generateProductReference } = await import("./services/openai");
      const products = await generateProductReference(domainExpertise, req.jwtUser?.userId);
      
      console.log(`Generated ${products.length} products for ${domainExpertise}`);
      res.json(products);
    } catch (error) {
      console.error('Error generating product reference:', error);
      // Fallback to static reference if AI fails
      const { productReference } = await import("@shared/schema");
      res.json(productReference);
    }
  });

  // Generate meeting minutes
  app.get("/api/conversations/:sessionId/meeting-minutes", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getMessages(conversation.id);
      const conversationHistory = messages.map(m => ({
        sender: m.sender,
        content: m.content,
        speakerLabel: m.speakerLabel
      }));

      const domainExpertise = req.query.domain as string || "Generic Product";
      const { generateMeetingMinutes } = await import("./services/openai");
      
      // Calculate actual duration from session start to now
      const sessionStart = conversation.createdAt ? new Date(conversation.createdAt) : new Date();
      const now = new Date();
      const durationMs = now.getTime() - sessionStart.getTime();
      const durationMinutes = Math.round(durationMs / 60000);
      const formattedDuration = durationMinutes >= 60 
        ? `${Math.floor(durationMinutes / 60)} hour${Math.floor(durationMinutes / 60) > 1 ? 's' : ''} ${durationMinutes % 60} minutes`
        : `${durationMinutes} minutes`;
      
      // Get user's profile name for rep name
      const { db } = await import("./db");
      const { authUsers } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      let repName = "Sales Representative";
      
      if (req.jwtUser?.userId) {
        const [user] = await db.select().from(authUsers).where(eq(authUsers.id, req.jwtUser.userId)).limit(1);
        if (user && (user.firstName || user.lastName)) {
          repName = [user.firstName, user.lastName].filter(Boolean).join(' ') || "Sales Representative";
        }
      }
      
      const meetingMinutes = await generateMeetingMinutes(
        conversationHistory,
        conversation.clientName || "Client",
        domainExpertise,
        req.jwtUser?.userId,
        sessionStart  // Pass actual session start time for accurate date/time
      );

      // Override duration with calculated value and add rep name
      meetingMinutes.duration = formattedDuration;
      (meetingMinutes as any).repName = repName;

      res.json(meetingMinutes);
    } catch (error: any) {
      console.error('Meeting minutes generation error:', error);
      
      // Handle validation errors (conversation too short) with 400 status
      if (error.message && error.message.includes('Conversation is too short')) {
        return res.status(400).json({ 
          success: false,
          message: "Not enough conversation content", 
          details: "Please have a longer conversation before generating meeting minutes. We need at least 3 messages with meaningful content.",
          error: error.message 
        });
      }
      
      // Handle other errors with 500 status
      res.status(500).json({ 
        success: false,
        message: "Failed to generate meeting minutes", 
        error: error.message 
      });
    }
  });

  // Save/update meeting minutes
  app.post("/api/conversations/:sessionId/meeting-minutes", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.jwtUser?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const meetingMinutesData = req.body;
      
      // Import the database client and table
      const { db } = await import("./db");
      const { callMeetingMinutes } = await import("@shared/schema");
      const { eq, and, sql } = await import("drizzle-orm");
      
      // Check if meeting minutes already exist for this session (using structuredMinutes.sessionId)
      // We use sessionId stored in metadata instead of foreign key to avoid auth_conversations vs conversations mismatch
      const existing = await db.select().from(callMeetingMinutes)
        .where(and(
          eq(callMeetingMinutes.userId, userId),
          eq(callMeetingMinutes.status, "active"),
          sql`${callMeetingMinutes.structuredMinutes}->>'sessionId' = ${sessionId}`
        ))
        .limit(1);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Auto-delete after 7 days
      
      // Add sessionId to the meeting minutes data for future lookups
      const dataWithSession = { ...meetingMinutesData, sessionId };
      
      if (existing.length > 0) {
        // Update existing meeting minutes
        await db.update(callMeetingMinutes)
          .set({
            structuredMinutes: dataWithSession,
            title: meetingMinutesData.opportunityName || "Meeting Minutes",
            summary: meetingMinutesData.discussionSummary,
            updatedAt: new Date()
          })
          .where(eq(callMeetingMinutes.id, existing[0].id));
        
        console.log(`✅ Updated meeting minutes for session ${sessionId}`);
        res.json({ message: "Meeting minutes updated successfully", id: existing[0].id });
      } else {
        // Create new meeting minutes (without conversationId foreign key to avoid mismatch)
        const [newMinutes] = await db.insert(callMeetingMinutes)
          .values({
            userId,
            conversationId: null, // Don't use foreign key - session ID is in structuredMinutes
            title: meetingMinutesData.opportunityName || "Meeting Minutes",
            summary: meetingMinutesData.discussionSummary,
            structuredMinutes: dataWithSession,
            expiresAt,
            status: "active"
          })
          .returning();
        
        console.log(`✅ Created meeting minutes for session ${sessionId}`);
        res.json({ message: "Meeting minutes saved successfully", id: newMinutes.id });
      }
    } catch (error: any) {
      console.error("Error saving meeting minutes:", error);
      res.status(500).json({ message: "Failed to save meeting minutes", error: error.message });
    }
  });

  // Generate Tech Environment Mind Map from transcript
  app.post("/api/conversations/:sessionId/mind-map", authenticateToken, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { transcript, domainExpertise } = req.body;
      const userId = req.jwtUser?.userId;

      console.log(`🗺️ Map/Flow: Request for session ${sessionId}, userId: ${userId}, transcript length: ${transcript?.length || 0}`);

      if (!transcript || transcript.trim().length < 50) {
        console.log('🗺️ Map/Flow: Insufficient transcript content');
        return res.status(400).json({
          success: false,
          message: "Insufficient transcript content",
          details: "Need more conversation content to generate a mind map"
        });
      }

      if (!userId) {
        console.log('🗺️ Map/Flow: No userId available');
        return res.status(400).json({
          success: false,
          message: "User authentication required",
          details: "Please log in to generate the Map/Flow visualization"
        });
      }

      const { extractTechEnvironment } = await import("./services/mind-map-extraction");
      console.log('🗺️ Map/Flow: Calling AI extraction...');
      const mindMapData = await extractTechEnvironment(sessionId, transcript, domainExpertise, userId);
      console.log(`🗺️ Map/Flow: Generated ${mindMapData.nodes?.length || 0} nodes, ${mindMapData.edges?.length || 0} edges`);

      if (mindMapData.nodes?.length === 0 && transcript.trim().length >= 200) {
        console.warn('⚠️ Map/Flow: 0 nodes extracted from substantial transcript. Consider investigating AI response.');
      }

      res.json({
        success: true,
        data: mindMapData
      });
    } catch (error: any) {
      console.error("🗺️ Map/Flow generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate mind map",
        error: error.message
      });
    }
  });

  // Get existing Mind Map for session
  app.get("/api/conversations/:sessionId/mind-map", authenticateToken, async (_req, res) => {
    try {
      // For now, return null as we don't persist mind maps
      res.json(null);
    } catch (error: any) {
      console.error("Mind map fetch error:", error);
      res.status(500).json({ message: "Failed to fetch mind map", error: error.message });
    }
  });

  // Helper function: Detect conversation phase based on content and signals
  const detectConversationPhase = (text: string, messageCount: number, insights: any): { phase: string; readinessScore: number; signals: string[] } => {
    const lowerText = text.toLowerCase();
    const signals: string[] = [];
    
    // Closing phase indicators (highest priority)
    const closingIndicators = [
      'contract', 'agreement', 'sign', 'when can we start', 'next steps',
      'implementation date', 'go live', 'procurement', 'purchase order',
      'finalize', 'move forward', 'ready to proceed', 'let\'s do it'
    ];
    const closingMatches = closingIndicators.filter(i => lowerText.includes(i));
    if (closingMatches.length >= 2 || (closingMatches.length >= 1 && messageCount > 15)) {
      signals.push(...closingMatches.map(m => `Closing signal: "${m}"`));
      return { phase: 'closing', readinessScore: 90, signals };
    }
    
    // Objection handling phase
    const objectionIndicators = [
      'concern', 'worried', 'hesitant', 'not sure', 'budget issue',
      'competitor', 'alternative', 'why should', 'convince', 'prove',
      'risk', 'guarantee', 'what if', 'too expensive', 'need approval'
    ];
    const objectionMatches = objectionIndicators.filter(i => lowerText.includes(i));
    if (objectionMatches.length >= 2) {
      signals.push(...objectionMatches.map(m => `Objection: "${m}"`));
      return { phase: 'objection_handling', readinessScore: 65, signals };
    }
    
    // Presentation/Demo phase indicators
    const presentationIndicators = [
      'demo', 'show me', 'walkthrough', 'how does', 'features',
      'capabilities', 'pricing', 'options', 'packages', 'comparison',
      'integration', 'implementation', 'training', 'support'
    ];
    const presentationMatches = presentationIndicators.filter(i => lowerText.includes(i));
    if (presentationMatches.length >= 2 || messageCount > 10) {
      signals.push(...presentationMatches.map(m => `Interest signal: "${m}"`));
      return { phase: 'presentation', readinessScore: 50, signals };
    }
    
    // Qualification phase (BANT signals)
    const qualificationIndicators = [
      'budget', 'timeline', 'decision', 'stakeholder', 'approval',
      'authority', 'team size', 'users', 'departments', 'priority'
    ];
    const qualificationMatches = qualificationIndicators.filter(i => lowerText.includes(i));
    if (qualificationMatches.length >= 1 || messageCount > 5) {
      signals.push(...qualificationMatches.map(m => `Qualification: "${m}"`));
      return { phase: 'qualification', readinessScore: 35, signals };
    }
    
    // Discovery phase (default for early conversations)
    signals.push('Early conversation - building rapport and understanding needs');
    return { phase: 'discovery', readinessScore: 15, signals };
  };

  // Relationship Building One-liners endpoint with conversation phase awareness
  app.get("/api/conversations/:sessionId/one-liners", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const refresh = req.query.refresh === 'true';
      
      // Get conversation data for analysis
      const conversation = await storage.getConversation(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Fetch actual messages for context
      const messages = await storage.getMessages(conversation.id);
      const conversationText = messages.length > 0 
        ? messages.map((m: any) => `${m.sender}: ${m.content}`).join('\n')
        : '';
      
      const painPoints = (conversation.discoveryInsights as any)?.painPoints || [];
      const requirements = (conversation.discoveryInsights as any)?.requirements || [];
      const clientName = conversation.clientName || "the client";

      // PERFORMANCE: Cache one-liners to avoid repeated AI calls for same conversation state
      const { aiCache } = await import("./services/ai-cache");
      const cacheKey = `oneliners:${sessionId}:${messages.length}`;
      
      // Skip cache if refresh is requested
      if (!refresh) {
        const cachedOneliners = aiCache.get(cacheKey);
        if (cachedOneliners) {
          console.log(`✅ One-liners from cache for session ${sessionId} (${messages.length} messages)`);
          return res.json(cachedOneliners);
        }
      } else {
        console.log(`🔄 Regenerating one-liners for session ${sessionId} (refresh requested)`);
      }
      
      // Detect conversation phase
      const phaseAnalysis = detectConversationPhase(conversationText, messages.length, conversation.discoveryInsights);
      console.log(`📊 Conversation phase: ${phaseAnalysis.phase} (readiness: ${phaseAnalysis.readinessScore}%)`);
      
      // Provide default phase-aware one-liners for early conversation
      if (messages.length < 3) {
        const defaultOneliners = [
          {
            id: "opener-1",
            category: "empathy",
            text: "I really appreciate you sharing that context. Understanding where you're coming from helps me ensure we focus on what matters most to your team.",
            situation: "Opening the conversation with genuine interest",
            tone: "supportive",
            phase: "discovery",
            strategicIntent: "Build trust and open communication"
          },
          {
            id: "rapport-1", 
            category: "insight",
            text: `Based on what I'm hearing, you're dealing with challenges that many successful organizations have overcome. Let me share what's worked for them.`,
            situation: "When connecting their situation to success stories",
            tone: "consultative",
            phase: "discovery",
            strategicIntent: "Position as trusted advisor"
          },
          {
            id: "discovery-1",
            category: "curiosity",
            text: "What would it mean for your team if we could solve this challenge in the next quarter? I'd love to understand the impact that would have.",
            situation: "To understand their vision and create urgency",
            tone: "curious",
            phase: "discovery",
            strategicIntent: "Create vision of success and timeline"
          },
          {
            id: "reassurance-1",
            category: "reassurance", 
            text: "You've clearly put a lot of thought into this. That kind of preparation makes the evaluation process much smoother for everyone.",
            situation: "Acknowledging their preparation and professionalism",
            tone: "reassuring",
            phase: "discovery",
            strategicIntent: "Validate their approach and build confidence"
          }
        ];
        return res.json({ oneliners: defaultOneliners, phase: phaseAnalysis.phase, readinessScore: phaseAnalysis.readinessScore });
      }

      // Phase-specific strategic guidance for the AI prompt
      const phaseGuidance: Record<string, string> = {
        discovery: `PHASE: Discovery - Focus on building rapport, understanding their world, and uncovering deep needs.
STRATEGIC GOAL: Earn the right to ask qualifying questions by showing genuine interest and expertise.
RAPPORT APPROACH: Be curious, empathetic, and position yourself as someone who truly wants to understand their situation.`,
        
        qualification: `PHASE: Qualification - Focus on understanding decision-making process, budget, and timeline.
STRATEGIC GOAL: Gently confirm this is a real opportunity while maintaining rapport and trust.
RAPPORT APPROACH: Be supportive of their process, acknowledge the complexity of decisions, and offer to help navigate.`,
        
        presentation: `PHASE: Presentation/Demo - Focus on connecting solutions to their specific needs.
STRATEGIC GOAL: Create "aha moments" by showing exactly how you solve their stated problems.
RAPPORT APPROACH: Reference their earlier comments, celebrate their insights, and paint a picture of success.`,
        
        objection_handling: `PHASE: Objection Handling - Focus on understanding and addressing concerns.
STRATEGIC GOAL: Turn objections into opportunities to demonstrate value and build trust.
RAPPORT APPROACH: Validate their concerns as smart questions, share relevant examples, and offer proof points.`,
        
        closing: `PHASE: Closing - Focus on confirming value and facilitating the decision.
STRATEGIC GOAL: Make it easy to move forward with confidence and clarity.
RAPPORT APPROACH: Reinforce their smart decision, summarize the value, and express excitement about partnering.`
      };

      // Generate AI-powered phase-aware one-liners
      const onelinerPrompt = `You are an elite sales coach. Analyze this conversation and generate 4 strategic rapport-building statements.

CONVERSATION CONTEXT:
${conversationText.slice(-3000)}

DETECTED PHASE: ${phaseAnalysis.phase.toUpperCase()}
READINESS TO CLOSE: ${phaseAnalysis.readinessScore}%
SIGNALS DETECTED: ${phaseAnalysis.signals.slice(0, 5).join(', ')}

PAIN POINTS IDENTIFIED: ${painPoints.join(', ') || 'Still discovering'}
REQUIREMENTS MENTIONED: ${requirements.join(', ') || 'Still gathering'}
CLIENT: ${clientName}

${phaseGuidance[phaseAnalysis.phase]}

CRITICAL INSTRUCTIONS:
1. Generate statements that SHOW SUPPORT to the prospect while STRATEGICALLY moving toward closing
2. Be SMART and IMPRESSIVE - not pushy or salesy
3. Each statement should feel like something a trusted advisor would say
4. Include a mix of emotional connection and logical progression
5. Reference SPECIFIC details from the conversation when possible

Generate 4 rapport statements in these categories:
- EMPATHY: Acknowledge their situation with genuine understanding (not sympathy)
- INSIGHT: Share valuable perspective that positions you as an expert
- CURIOSITY: Ask a question that advances the conversation strategically
- REASSURANCE: Build confidence in moving forward together

Return JSON format:
{
  "phase": "${phaseAnalysis.phase}",
  "readinessScore": ${phaseAnalysis.readinessScore},
  "oneliners": [
    {
      "id": "unique-id",
      "category": "empathy|insight|curiosity|reassurance",
      "text": "The rapport statement - conversational, supportive, and strategic",
      "situation": "Specific moment in conversation when to use this",
      "tone": "supportive|consultative|curious|confident",
      "strategicIntent": "How this moves the conversation toward closing"
    }
  ]
}`;

      const openaiService = await import("./services/openai");
      const response = await openaiService.generateResponse(onelinerPrompt, []);
      
      let oneliners;
      try {
        const cleanedResponse = response
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        
        oneliners = JSON.parse(cleanedResponse);
        // Ensure phase info is included
        oneliners.phase = oneliners.phase || phaseAnalysis.phase;
        oneliners.readinessScore = oneliners.readinessScore || phaseAnalysis.readinessScore;
        console.log(`Generated ${oneliners.oneliners?.length || 0} phase-aware rapport statements for ${phaseAnalysis.phase} phase`);
      } catch (parseError) {
        console.error('Failed to parse one-liners response:', parseError);
        // Phase-aware fallback one-liners
        const phaseFallbacks: Record<string, any[]> = {
          discovery: [
            { id: "discovery-empathy", category: "empathy", text: "I can tell you've been dealing with this challenge for a while. That kind of firsthand experience is invaluable for finding the right solution.", situation: "After they describe a frustrating situation", tone: "supportive", strategicIntent: "Build trust through validation" },
            { id: "discovery-insight", category: "insight", text: "What you're describing reminds me of several organizations that went on to become our most successful implementations. There's a pattern here.", situation: "When seeing familiar success indicators", tone: "consultative", strategicIntent: "Create optimism and credibility" },
            { id: "discovery-curiosity", category: "curiosity", text: "If we could wave a magic wand and fix this tomorrow, what would change most for your team?", situation: "To understand their vision of success", tone: "curious", strategicIntent: "Establish value criteria" },
            { id: "discovery-reassurance", category: "reassurance", text: "You're asking exactly the right questions. That kind of thoroughness is what separates successful projects from the rest.", situation: "After detailed questions from prospect", tone: "confident", strategicIntent: "Encourage engagement and questions" }
          ],
          qualification: [
            { id: "qual-empathy", category: "empathy", text: "I completely understand the need to bring others into this decision. Complex projects deserve that kind of careful consideration.", situation: "When discussing stakeholder involvement", tone: "supportive", strategicIntent: "Support their process while advancing" },
            { id: "qual-insight", category: "insight", text: "The organizations that see the fastest ROI usually have a champion like you who's done this level of homework upfront.", situation: "Recognizing their preparation", tone: "consultative", strategicIntent: "Position them as the internal champion" },
            { id: "qual-curiosity", category: "curiosity", text: "What would help you feel confident recommending this to your team? I'd love to help you build that case.", situation: "When sensing they need support for internal buy-in", tone: "curious", strategicIntent: "Offer partnership in the decision process" },
            { id: "qual-reassurance", category: "reassurance", text: "Based on what you've shared, I'm confident we can put together something that works within your parameters.", situation: "After discussing constraints", tone: "confident", strategicIntent: "Remove doubt about feasibility" }
          ],
          presentation: [
            { id: "pres-empathy", category: "empathy", text: "I know evaluating solutions takes a lot of mental energy. Let me focus on what matters most to you and skip what doesn't.", situation: "At the start of a demo or walkthrough", tone: "supportive", strategicIntent: "Respect their time and show you listened" },
            { id: "pres-insight", category: "insight", text: "This is exactly what I was hoping to show you - it maps directly to the challenge you mentioned earlier about [specific pain point].", situation: "When demonstrating relevant features", tone: "consultative", strategicIntent: "Connect solution to their stated needs" },
            { id: "pres-curiosity", category: "curiosity", text: "How would your team react if they could do this starting next month?", situation: "After showing impressive capability", tone: "curious", strategicIntent: "Create urgency and envision success" },
            { id: "pres-reassurance", category: "reassurance", text: "Everything you're seeing today is exactly what your team would have access to. No bait and switch here.", situation: "During feature showcase", tone: "confident", strategicIntent: "Build trust in the offering" }
          ],
          objection_handling: [
            { id: "obj-empathy", category: "empathy", text: "That's a really smart question to ask. I'd be concerned too if I were in your position without more context.", situation: "When they raise a concern", tone: "supportive", strategicIntent: "Validate concern as reasonable" },
            { id: "obj-insight", category: "insight", text: "Other clients had the same concern initially. Here's what they found after the first few weeks...", situation: "When addressing common objections", tone: "consultative", strategicIntent: "Provide social proof and resolution" },
            { id: "obj-curiosity", category: "curiosity", text: "If we could address that concern completely, what else would you need to feel good about moving forward?", situation: "After addressing an objection", tone: "curious", strategicIntent: "Uncover all objections at once" },
            { id: "obj-reassurance", category: "reassurance", text: "I'm glad you brought that up. It tells me you're thinking about this seriously, which is exactly what we want.", situation: "When concern is raised", tone: "confident", strategicIntent: "Frame objection as positive engagement" }
          ],
          closing: [
            { id: "close-empathy", category: "empathy", text: "I can tell you've put a lot of thought into this. It's clear you want to get it right for your team.", situation: "When sensing they're ready to decide", tone: "supportive", strategicIntent: "Acknowledge their careful consideration" },
            { id: "close-insight", category: "insight", text: "Based on everything we've discussed, I'm genuinely excited about what we can accomplish together.", situation: "Summarizing the partnership potential", tone: "consultative", strategicIntent: "Express authentic enthusiasm" },
            { id: "close-curiosity", category: "curiosity", text: "What would make the next step easiest for you - should I send over the proposal first, or schedule time with your team?", situation: "When facilitating the close", tone: "curious", strategicIntent: "Make it easy to say yes" },
            { id: "close-reassurance", category: "reassurance", text: "You're making a smart decision. I'm confident you'll be one of those success stories we reference with future clients.", situation: "After agreement to proceed", tone: "confident", strategicIntent: "Reinforce their decision" }
          ]
        };
        
        oneliners = {
          phase: phaseAnalysis.phase,
          readinessScore: phaseAnalysis.readinessScore,
          oneliners: phaseFallbacks[phaseAnalysis.phase] || phaseFallbacks.discovery
        };
      }

      // Cache the result for 2 minutes to avoid repeated calls
      aiCache.set(cacheKey, oneliners, 120000); // 120000ms = 2 minutes
      console.log(`💾 Cached one-liners for session ${sessionId} (${messages.length} messages)`);

      res.json(oneliners);
    } catch (error) {
      console.error('Error generating one-liners:', error);
      res.status(500).json({ error: 'Failed to generate one-liners' });
    }
  });

  // Partner Services Recommendations endpoint
  app.get("/api/conversations/:sessionId/partner-services", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const domainExpertise = req.query.domain as string || "Generic Product";
      
      // Get conversation data for analysis
      const conversation = await storage.getConversation(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Fetch actual messages and discovery insights  
      const messages = await storage.getMessages(conversation.id);
      const conversationText = messages.length > 0 
        ? messages.map((m: any) => `${m.sender}: ${m.content}`).join('\n')
        : 'No conversation content available';
      const painPoints = (conversation.discoveryInsights as any)?.painPoints || [];
      const requirements = (conversation.discoveryInsights as any)?.requirements || [];
      
      console.log(`Conversation analysis for ${sessionId} (id: ${conversation.id})`);
      console.log(`Messages found: ${messages.length}, Pain points: ${painPoints.length}, Requirements: ${requirements.length}`);
      console.log(`Domain Expertise: ${domainExpertise}`);
      console.log(`First few messages: ${messages.slice(0, 2).map(m => `${m.sender}: ${m.content}`).join(' | ')}`);
      
      console.log(`Analyzing conversation for partner services recommendations: ${sessionId}`);
      
      // Provide default recommendations if conversation is very limited (less than 2 messages)
      if (messages.length < 2) {
        console.log(`Limited conversation data (${messages.length} messages), providing default strategic recommendations for ${domainExpertise}`);
        const defaultRecommendations = {
          recommendations: [
            {
              service: {
                id: "discovery-1",
                name: `${domainExpertise} Discovery Workshop`,
                type: "consulting",
                description: `Collaborative workshop to map current workflows, identify optimization opportunities, and align ${domainExpertise} solutions with business objectives.`,
                provider: "Strategic Advisory",
                estimatedDuration: "1-2 weeks",
                complexity: "low",
                tags: ["discovery", "process-mapping", "strategy", domainExpertise.toLowerCase()]
              },
              relevanceScore: 95,
              reasoning: `Before investing in ${domainExpertise}, understanding your unique business processes ensures we recommend the right-fit products that deliver measurable ROI and align with your strategic goals.`,
              priority: "high"
            },
            {
              service: {
                id: "platform-1", 
                name: `${domainExpertise} Platform`,
                type: "product",
                description: `Comprehensive ${domainExpertise} platform combining workflow automation, analytics, and collaboration tools to streamline operations and drive efficiency.`,
                provider: domainExpertise,
                estimatedDuration: "2-4 months to full deployment",
                complexity: "medium",
                tags: ["automation", "analytics", "integration", "efficiency", domainExpertise.toLowerCase()]
              },
              relevanceScore: 88,
              reasoning: `${domainExpertise} provides a unified approach to consolidating disparate tools, reducing complexity, lowering costs, and improving cross-team collaboration.`,
              priority: "high"
            },
            {
              service: {
                id: "success-1",
                name: `${domainExpertise} Success Partnership`, 
                type: "service",
                description: `Ongoing strategic partnership with dedicated ${domainExpertise} success manager providing best practice guidance, optimization recommendations, and executive business reviews.`,
                provider: "Customer Success",
                estimatedDuration: "Ongoing relationship",
                complexity: "low",
                tags: ["success", "partnership", "optimization", "support", domainExpertise.toLowerCase()]
              },
              relevanceScore: 82,
              reasoning: `Maximizing your ${domainExpertise} investment requires ongoing optimization. A dedicated success partner ensures you continuously realize value and stay ahead of industry best practices.`,
              priority: "medium"
            }
          ]
        };
        return res.json(defaultRecommendations);
      }

      // Use AI analysis for conversations with meaningful content
      console.log(`Using AI analysis for conversation with ${messages.length} messages`);
      const analysisPrompt = `Act as an expert ${domainExpertise} business consultant analyzing a sales discovery conversation. Based on the conversation below, provide strategic ${domainExpertise} product and service recommendations that best address the customer's needs.

Domain Expertise: ${domainExpertise}

Conversation Context:
${conversationText}

Identified Pain Points: ${painPoints.join(', ') || 'Discovery in progress'}
Customer Requirements: ${requirements.join(', ') || 'Requirements being gathered'}

As a trusted ${domainExpertise} advisor, recommend 3 strategic products or services from the ${domainExpertise} ecosystem that would deliver the most value to this customer. Consider:
- Immediate pain points and how each ${domainExpertise} recommendation addresses them
- Long-term business value and ROI potential
- Implementation complexity and timeline fit
- Strategic alignment with customer's stated goals
- Specific ${domainExpertise} products, features, modules, or services

Provide consultant-quality ${domainExpertise} recommendations in JSON format:
{
  "recommendations": [
    {
      "service": {
        "id": "string",
        "name": "string (be specific and solution-oriented, mention ${domainExpertise} product/service names when applicable)",
        "type": "product|service|solution|platform|training|consulting", 
        "description": "string (clear, benefit-focused description of what this ${domainExpertise} solution delivers)",
        "provider": "${domainExpertise} or specific product name",
        "estimatedDuration": "string (realistic timeframe)",
        "complexity": "low|medium|high",
        "tags": ["string (relevant ${domainExpertise} capability tags)"]
      },
      "relevanceScore": 0-100,
      "reasoning": "string (consultant-style explanation of WHY this ${domainExpertise} solution is recommended and what value it brings)", 
      "priority": "low|medium|high|urgent"
    }
  ]
}`;

      const openaiService = await import("./services/openai");
      const response = await openaiService.generateResponse(analysisPrompt, []);
      
      let recommendations;
      try {
        // Clean the response by removing markdown code fences and extra whitespace
        const cleanedResponse = response
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        
        console.log(`AI response length: ${response.length}, cleaned length: ${cleanedResponse.length}`);
        recommendations = JSON.parse(cleanedResponse);
        console.log(`Partner services recommendations generated: ${recommendations.recommendations?.length || 0} services`);
      } catch (parseError) {
        console.error('Failed to parse partner services response:', parseError);
        console.error('Raw AI response:', response.substring(0, 500) + '...');
        // Fallback to default recommendations if AI parsing fails
        recommendations = {
          recommendations: [
            {
              service: {
                id: "consultation-fallback",
                name: "Strategic Solution Consultation",
                type: "consulting", 
                description: "Personalized consultation to analyze your specific needs and recommend the optimal combination of products and services for your business objectives.",
                provider: "Strategic Advisory",
                estimatedDuration: "1-2 weeks",
                complexity: "low",
                tags: ["consultation", "strategy", "needs-analysis"]
              },
              relevanceScore: 85,
              reasoning: "Based on our conversation, a deeper consultation will help us understand your unique requirements and craft a tailored solution that maximizes value and minimizes risk.",
              priority: "high"
            }
          ]
        };
      }

      res.json(recommendations);
    } catch (error) {
      console.error('Error generating partner services recommendations:', error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Teams Meeting Integration Routes
  
  // Create or join Teams meeting (idempotent)
  app.post("/api/conversations/:sessionId/teams-meeting", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if Teams meeting already exists for this conversation
      let teamsMeeting = await storage.getTeamsMeeting(conversation.id);
      let audioSource;
      
      if (teamsMeeting) {
        // Update existing meeting if new data provided
        if (req.body.meetingId || req.body.meetingTitle || req.body.participants) {
          const updates = {
            meetingId: req.body.meetingId || teamsMeeting.meetingId,
            meetingTitle: req.body.meetingTitle || teamsMeeting.meetingTitle,
            participants: req.body.participants || teamsMeeting.participants
          };
          teamsMeeting = await storage.updateTeamsMeeting(teamsMeeting.id, updates) || teamsMeeting;
        }
        
        // Find existing Teams audio source
        const audioSources = await storage.getAudioSources(conversation.id);
        audioSource = audioSources.find(s => s.teamsMeetingId === teamsMeeting?.id);
      } else {
        // Create new Teams meeting
        const meetingData = {
          conversationId: conversation.id,
          meetingId: req.body.meetingId,
          meetingTitle: req.body.meetingTitle,
          organizerId: req.body.organizerId,
          startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
          participants: req.body.participants || []
        };

        const validatedMeeting = insertTeamsMeetingSchema.parse(meetingData);
        teamsMeeting = await storage.createTeamsMeeting(validatedMeeting);
      }

      // Create Teams meeting audio source if doesn't exist
      if (!audioSource) {
        audioSource = await storage.createAudioSource({
          conversationId: conversation.id,
          sourceType: AUDIO_SOURCE_TYPES.TEAMS_MEETING,
          sourceId: teamsMeeting.meetingId || `meeting-${teamsMeeting.id}`,
          teamsMeetingId: teamsMeeting.id,
          metadata: {
            meetingTitle: teamsMeeting.meetingTitle,
            organizerId: teamsMeeting.organizerId
          }
        });
      }

      res.json({
        teamsMeeting,
        audioSource,
        isExisting: !!audioSource
      });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create/update Teams meeting", error: error.message });
    }
  });

  // Get Teams meeting for conversation
  app.get("/api/conversations/:sessionId/teams-meeting", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const teamsMeeting = await storage.getTeamsMeeting(conversation.id);
      const audioSources = await storage.getAudioSources(conversation.id);
      
      res.json({
        teamsMeeting,
        audioSources: audioSources.filter(s => s.teamsMeetingId === teamsMeeting?.id)
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch Teams meeting", error: error.message });
    }
  });

  // Audio Source Management Routes
  
  // Get all audio sources for conversation
  app.get("/api/conversations/:sessionId/audio-sources", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const audioSources = await storage.getAudioSources(conversation.id);
      res.json(audioSources);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch audio sources", error: error.message });
    }
  });

  // Create new audio source
  app.post("/api/conversations/:sessionId/audio-sources", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const sourceData = {
        conversationId: conversation.id,
        sourceType: req.body.sourceType,
        sourceId: req.body.sourceId,
        teamsMeetingId: req.body.teamsMeetingId,
        metadata: req.body.metadata || {}
      };

      const validatedSource = insertAudioSourceSchema.parse(sourceData);
      const audioSource = await storage.createAudioSource(validatedSource);

      res.json(audioSource);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create audio source", error: error.message });
    }
  });

  // Update audio source status and post-meeting data
  app.patch("/api/audio-sources/:audioSourceId", async (req, res) => {
    try {
      const updates: any = {};
      
      // Only include status if explicitly provided
      if (req.body.status !== undefined) {
        updates.status = req.body.status;
        if (req.body.status === "disconnected") {
          updates.disconnectedAt = new Date();
        }
      }

      // Build metadata updates incrementally
      const metadataUpdates: any = {};
      
      if (req.body.metadata) {
        Object.assign(metadataUpdates, req.body.metadata);
      }

      // Handle post-meeting recording data
      if (req.body.recordingUrl) {
        metadataUpdates.recordingUrl = req.body.recordingUrl;
        metadataUpdates.recordingAvailable = true;
      }

      if (req.body.transcriptUrl) {
        metadataUpdates.transcriptUrl = req.body.transcriptUrl;
        metadataUpdates.transcriptAvailable = true;
      }

      if (Object.keys(metadataUpdates).length > 0) {
        updates.metadataUpdates = metadataUpdates;
      }

      const audioSource = await storage.updateAudioSource(req.params.audioSourceId, updates);
      if (!audioSource) {
        return res.status(404).json({ message: "Audio source not found" });
      }

      res.json(audioSource);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update audio source", error: error.message });
    }
  });

  // Update Teams meeting status and post-meeting data
  app.patch("/api/conversations/:sessionId/teams-meeting", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const teamsMeeting = await storage.getTeamsMeeting(conversation.id);
      if (!teamsMeeting) {
        return res.status(404).json({ message: "Teams meeting not found" });
      }

      const updates: any = {};
      
      // Only include status if explicitly provided
      if (req.body.status !== undefined) {
        updates.status = req.body.status;
        if (req.body.status === "ended") {
          updates.endTime = new Date();
        }
      }
      
      // Only include endTime if explicitly provided
      if (req.body.endTime !== undefined) {
        updates.endTime = req.body.endTime;
      }

      // Handle post-meeting artifacts
      if (req.body.recordingUrl) {
        updates.recordingUrl = req.body.recordingUrl;
        // Only update status if not already set
        if (req.body.status === undefined) {
          updates.status = "recording-available";
        }
      }

      if (req.body.transcriptUrl) {
        updates.transcriptUrl = req.body.transcriptUrl;
      }

      const updatedMeeting = await storage.updateTeamsMeeting(teamsMeeting.id, updates);
      if (!updatedMeeting) {
        return res.status(500).json({ message: "Failed to update Teams meeting" });
      }

      // If meeting ended, update associated audio sources
      if (req.body.status === "ended") {
        const audioSources = await storage.getAudioSources(conversation.id);
        const meetingAudioSources = audioSources.filter(s => s.teamsMeetingId === teamsMeeting.id);
        
        for (const source of meetingAudioSources) {
          await storage.updateAudioSource(source.id, {
            status: "disconnected",
            disconnectedAt: new Date()
          });
        }
      }

      res.json(updatedMeeting);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update Teams meeting", error: error.message });
    }
  });

  // Teams connection status endpoint
  app.get("/api/conversations/:sessionId/teams-status", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const teamsMeeting = await storage.getTeamsMeeting(conversation.id);
      const audioSources = await storage.getAudioSources(conversation.id);
      
      const teamsAudioSources = audioSources.filter(s => 
        s.sourceType === AUDIO_SOURCE_TYPES.TEAMS_MEETING || 
        s.sourceType === AUDIO_SOURCE_TYPES.TEAMS_RECORDING
      );

      // Check if Teams integration is actually enabled
      const isIntegrationEnabled = !!(process.env.MICROSOFT_APP_ID && process.env.MICROSOFT_APP_PASSWORD);

      const status = {
        hasTeamsMeeting: !!teamsMeeting,
        meetingStatus: teamsMeeting?.status || null,
        audioSources: teamsAudioSources.length,
        activeAudioSources: teamsAudioSources.filter(s => s.status === "active").length,
        recordingAvailable: !!teamsMeeting?.recordingUrl,
        transcriptAvailable: !!teamsMeeting?.transcriptUrl,
        lastConnected: teamsAudioSources.length > 0 ? 
          Math.max(...teamsAudioSources.map(s => s.connectedAt?.getTime() || 0)) : null,
        isIntegrationEnabled,
        error: isIntegrationEnabled ? null : "Teams integration disabled - Microsoft credentials not configured"
      };

      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch Teams status", error: error.message });
    }
  });

  // ========================================
  // SESSION USAGE TRACKING ENDPOINTS
  // ========================================

  // Start a new session timer
  app.post("/api/session-usage/start", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      const userEmail = req.jwtUser!.email;
      
      // PRIORITY 1: Check if user has super user privileges or super_admin role (grants unlimited access to everything)
      const isSuperAdmin = req.jwtUser!.role === 'super_admin';
      if (req.jwtUser!.superUser || isSuperAdmin) {
        // Log super user/admin access for audit trail
        await logSuperUserAccess(userId, userEmail, 'unlimited_session_access', {
          route: '/api/session-usage/start',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          accessMethod: isSuperAdmin ? 'super_admin_role' : 'super_user_override'
        });
        
        const sessionId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const sessionUsageData = {
          userId,
          sessionId,
          startTime: new Date(),
          endTime: null,
          durationSeconds: null,
          status: "active"
        };

        const validatedData = insertSessionUsageSchema.parse(sessionUsageData);
        const sessionUsage = await storage.createSessionUsage(validatedData);

        return res.json({ 
          sessionUsage,
          accessType: isSuperAdmin ? 'super_admin' : 'super_user'
        });
      }
      
      // PRIORITY 2: Check if user has active enterprise license (bypass subscription checks)
      const hasEnterpriseLicense = await hasActiveEnterpriseLicense(userId);
      if (hasEnterpriseLicense) {
        // Enterprise license user - allow unlimited access
        const sessionId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const sessionUsageData = {
          userId,
          sessionId,
          startTime: new Date(),
          endTime: null,
          durationSeconds: null,
          status: "active"
        };

        const validatedData = insertSessionUsageSchema.parse(sessionUsageData);
        const sessionUsage = await storage.createSessionUsage(validatedData);

        return res.json({ 
          sessionUsage,
          accessType: 'enterprise_license'
        });
      }
      
      // Check subscription limits before starting session
      let subscription = await authStorage.getSubscriptionByUserId(userId);
      if (!subscription) {
        // Auto-create trial subscription for new users
        subscription = await authStorage.createSubscription({
          userId,
          status: 'trial',
          planType: 'free_trial'
        });
      }
      
      const sessionsUsed = parseInt(subscription.sessionsUsed || "0") || 0;
      const sessionsLimit = subscription.sessionsLimit ? parseInt(subscription.sessionsLimit) : null;
      const minutesUsed = parseInt(subscription.minutesUsed || "0") || 0;
      const minutesLimit = subscription.minutesLimit ? parseInt(subscription.minutesLimit) : null;
      
      // Check if user has exceeded session limit
      if (sessionsLimit !== null && sessionsUsed >= sessionsLimit) {
        return res.status(403).json({ 
          message: `Trial limit reached: You have used all ${sessionsLimit} free sessions. Please upgrade to continue.`,
          requiresUpgrade: true,
          limitType: 'sessions',
          used: sessionsUsed,
          limit: sessionsLimit
        });
      }
      
      // Check if user has exceeded minutes limit
      if (minutesLimit !== null && minutesUsed >= minutesLimit) {
        return res.status(403).json({ 
          message: `Trial limit reached: You have used all ${minutesLimit} free minutes. Please upgrade to continue.`,
          requiresUpgrade: true,
          limitType: 'minutes',
          used: minutesUsed,
          limit: minutesLimit
        });
      }
      
      const sessionId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const sessionUsageData = {
        userId,
        sessionId,
        startTime: new Date(),
        endTime: null,
        durationSeconds: null,
        status: "active"
      };

      const validatedData = insertSessionUsageSchema.parse(sessionUsageData);
      const sessionUsage = await storage.createSessionUsage(validatedData);

      // CRITICAL: Increment sessionsUsed immediately to prevent limit bypass
      // (users could start unlimited sessions by refreshing before stopping)
      // DEFENSIVE: Default to 0 to prevent NaN
      const currentSessionsUsed = parseInt(subscription.sessionsUsed || '0') || 0;
      await authStorage.updateSubscription(subscription.id, {
        sessionsUsed: (currentSessionsUsed + 1).toString()
      });

      res.json({ 
        sessionUsage,
        accessType: 'subscription'
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to start session timer", error: error.message });
    }
  });

  // Stop an active session timer
  app.put("/api/session-usage/:sessionId/stop", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      const { sessionId } = req.params;

      const sessionUsage = await storage.getSessionUsage(sessionId, userId);
      if (!sessionUsage) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (sessionUsage.status === "ended") {
        return res.status(400).json({ message: "Session already ended" });
      }

      const endTime = new Date();
      const startTime = new Date(sessionUsage.startTime);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const durationMinutes = Math.ceil(durationSeconds / 60);

      const updatedSession = await storage.updateSessionUsage(sessionId, userId, {
        endTime,
        durationSeconds: durationSeconds.toString(),
        status: "ended"
      });
      
      // Update subscription with minutes used and session history
      // Note: sessionsUsed was already incremented when session started
      const subscription = await authStorage.getSubscriptionByUserId(userId);
      if (subscription) {
        // DEFENSIVE: Default to 0 if minutesUsed is null/empty to prevent NaN
        const currentMinutesUsed = parseInt(subscription.minutesUsed || '0') || 0;
        const sessionHistory = Array.isArray(subscription.sessionHistory) 
          ? subscription.sessionHistory 
          : [];
        
        sessionHistory.push({
          sessionId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes
        });
        
        await authStorage.updateSubscription(subscription.id, {
          minutesUsed: (currentMinutesUsed + durationMinutes).toString(),
          sessionHistory
        });
      }

      res.json({ sessionUsage: updatedSession });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to stop session timer", error: error.message });
    }
  });

  // Get total usage time for the logged-in user
  app.get("/api/session-usage/total", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      const sessions = await db
        .select()
        .from(sessionUsage)
        .where(eq(sessionUsage.userId, userId))
        .orderBy(desc(sessionUsage.startTime));

      const now = new Date();
      let totalSeconds = 0;

      for (const session of sessions) {
        if (session.durationSeconds) {
          const parsed = parseInt(session.durationSeconds, 10);
          if (!Number.isNaN(parsed)) totalSeconds += parsed;
        } else if (session.startTime && session.status === "active") {
          const startTime = new Date(session.startTime);
          const diff = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000));
          totalSeconds += diff;
        }
      }

      const totalSessions = sessions.length;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalSeconds / 3600);

      return res.json({
        totalSessions,
        totalSeconds,
        totalMinutes,
        totalHours,
        sessions
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch usage data", error: error.message });
    }
  });

  // ========================================
  // PROFILE ROUTES
  // ========================================
  
  // Get user profile
  app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      const user = await authStorage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        username: user.username,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
  });
  
  // Get subscription details
  app.get("/api/profile/subscription", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      console.log(`[DEBUG] Fetching subscription for userId: ${userId}`);
      
      const subscription = await authStorage.getSubscriptionByUserId(userId);
      console.log(`[DEBUG] Subscription found:`, subscription ? {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        planId: subscription.planId,
      } : 'NULL');
      
      if (!subscription) {
        console.log(`[DEBUG] No subscription found for user ${userId}, returning free_trial`);
        return res.json({
          planType: "free_trial",
          status: "no_subscription",
          message: "No active subscription"
        });
      }
      
      // Get plan details if planId exists
      let planDetails = null;
      if (subscription.planId) {
        planDetails = await authStorage.getPlanById(subscription.planId);
        console.log(`[DEBUG] Plan details:`, planDetails ? {
          name: planDetails.name,
          price: planDetails.price,
        } : 'NULL');
      }

      // Get actual conversation history from database
      let sessionHistory = [];
      try {
        const userConversations = await db.select()
          .from(conversations)
          .where(eq(conversations.userId, userId))
          .orderBy(desc(conversations.createdAt))
          .limit(50);

        sessionHistory = userConversations.map(conv => ({
          sessionId: conv.sessionId,
          startTime: conv.createdAt?.toISOString() || new Date().toISOString(),
          endTime: conv.endedAt ? conv.endedAt.toISOString() : new Date().toISOString(),
          durationMinutes: conv.endedAt && conv.createdAt
            ? Math.round((conv.endedAt.getTime() - conv.createdAt.getTime()) / (1000 * 60))
            : conv.createdAt
            ? Math.round((new Date().getTime() - conv.createdAt.getTime()) / (1000 * 60))
            : 0,
          summary: conv.callSummary || null
        }));

        console.log(`[DEBUG] Found ${sessionHistory.length} conversations for user ${userId}`);
      } catch (error) {
        console.error(`[DEBUG] Error fetching conversations:`, error);
        // Fall back to subscription session history if database query fails
        sessionHistory = subscription.sessionHistory || [];
      }
      
      res.json({
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        sessionsUsed: subscription.sessionsUsed,
        sessionsLimit: subscription.sessionsLimit,
        minutesUsed: subscription.minutesUsed,
        minutesLimit: subscription.minutesLimit,
        sessionHistory: sessionHistory,
        canceledAt: subscription.canceledAt,
        createdAt: subscription.createdAt,
        plan: planDetails ? {
          name: planDetails.name,
          price: planDetails.price,
          currency: planDetails.currency,
          billingInterval: planDetails.billingInterval,
        } : null,
      });
    } catch (error: any) {
      console.error(`[DEBUG] Error fetching subscription:`, error);
      res.status(500).json({ message: "Failed to fetch subscription", error: error.message });
    }
  });
  
  // Debug endpoint to check subscription and payment status
  app.get("/api/debug/subscription-status", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      
      // Get user info
      const user = await authStorage.getUserById(userId);
      
      // Get all subscriptions for this user (not just the latest)
      const allSubscriptions = await db.select().from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt));
      
      // Get all payments for this user
      const payments = await authStorage.getPaymentsByUserId(userId);
      
      // Get all pending orders
      const orders = await db.select().from(pendingOrders)
        .where(eq(pendingOrders.userId, userId))
        .orderBy(desc(pendingOrders.createdAt));
      
      res.json({
        userId,
        userEmail: user?.email,
        userName: `${user?.firstName} ${user?.lastName}`,
        subscriptionsCount: allSubscriptions.length,
        subscriptions: allSubscriptions.map(sub => ({
          id: sub.id,
          planType: sub.planType,
          status: sub.status,
          planId: sub.planId,
          createdAt: sub.createdAt,
          currentPeriodEnd: sub.currentPeriodEnd,
        })),
        paymentsCount: payments.length,
        payments: payments.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          subscriptionId: p.subscriptionId,
          createdAt: p.createdAt,
          razorpayOrderId: p.razorpayOrderId,
        })),
        ordersCount: orders.length,
        orders: orders.map(order => ({
          id: order.id,
          status: order.status,
          amount: order.amount,
          gatewayOrderId: order.gatewayOrderId,
          createdAt: order.createdAt,
          completedAt: order.completedAt,
        })),
      });
    } catch (error: any) {
      console.error("[DEBUG] Error fetching debug info:", error);
      res.status(500).json({ message: "Failed to fetch debug info", error: error.message });
    }
  });

  // Get user session history
  app.get("/api/profile/session-history", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      console.log(`[DEBUG] Fetching session history for userId: ${userId}`);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Fetch conversations for this user
      const userConversations = await db
        .select({
          id: conversations.id,
          sessionId: conversations.sessionId,
          clientName: conversations.clientName,
          status: conversations.status,
          createdAt: conversations.createdAt,
          endedAt: conversations.endedAt,
        })
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(sql`${conversations.createdAt} DESC`)
        .limit(limit);

      // Calculate session details with null safety
      const sessionHistory = userConversations.map(conv => {
        const startTime = conv.createdAt || new Date();
        const endTime = conv.endedAt || new Date();
        const durationMs = Math.max(0, endTime.getTime() - startTime.getTime());
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        
        return {
          id: conv.id,
          sessionId: conv.sessionId || 'unknown',
          clientName: conv.clientName || "Unknown",
          status: conv.status || 'active',
          startTime: startTime.toISOString(),
          endTime: conv.endedAt?.toISOString() || null,
          durationMinutes,
          isActive: conv.status === "active",
        };
      });

      // Calculate total usage
      const totalSessions = sessionHistory.length;
      const completedSessions = sessionHistory.filter(s => s.status === "ended").length;
      const totalMinutes = sessionHistory.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      console.log(`[DEBUG] Session history loaded: ${totalSessions} total sessions, ${completedSessions} completed`);

      res.json({
        sessions: sessionHistory,
        summary: {
          totalSessions,
          completedSessions,
          activeSessions: totalSessions - completedSessions,
          totalMinutesUsed: totalMinutes,
        }
      });
    } catch (error: any) {
      console.error(`[ERROR] Failed to fetch session history for user:`, error);
      res.status(500).json({ 
        message: "Failed to fetch session history", 
        error: error.message || 'Unknown error',
        sessions: [],
        summary: {
          totalSessions: 0,
          completedSessions: 0,
          activeSessions: 0,
          totalMinutesUsed: 0,
        }
      });
    }
  });

  // Fetch session details with AI responses
  app.get("/api/session/:sessionId", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      const { sessionId } = req.params;
      
      console.log(`[DEBUG] Fetching session details for sessionId: ${sessionId}, userId: ${userId}`);
      
      // Fetch conversation for this session
      const conversation = await storage.getConversation(sessionId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Verify the conversation belongs to the user
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view this session" });
      }
      
      // Fetch all messages for this conversation
      const messages = await storage.getMessages(conversation.id);
      
      // Format messages with AI response data
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        speakerLabel: msg.speakerLabel,
        timestamp: msg.timestamp,
        // AI response data (only for assistant messages)
        ...(msg.sender === 'assistant' && {
          discoveryQuestions: msg.discoveryQuestions,
          discoveryInsights: msg.discoveryInsights,
          nextSteps: msg.nextSteps,
          caseStudies: msg.caseStudies,
          competitorAnalysis: msg.competitorAnalysis,
          solutionRecommendations: msg.solutionRecommendations,
          productFeatures: msg.productFeatures,
          bantQualification: msg.bantQualification,
          solutions: msg.solutions,
          problemStatement: msg.problemStatement,
          recommendedSolutions: msg.recommendedSolutions,
          suggestedNextPrompt: msg.suggestedNextPrompt,
          customerIdentification: msg.customerIdentification
        })
      }));
      
      res.json({
        session: {
          id: conversation.id,
          sessionId: conversation.sessionId,
          clientName: conversation.clientName,
          status: conversation.status,
          createdAt: conversation.createdAt,
          endedAt: conversation.endedAt,
          callSummary: conversation.callSummary,
          discoveryInsights: conversation.discoveryInsights,
        },
        messages: formattedMessages,
        messageCount: messages.length,
        aiResponseCount: messages.filter(m => m.sender === 'assistant').length,
      });
    } catch (error: any) {
      console.error(`[ERROR] Failed to fetch session details:`, error);
      res.status(500).json({ 
        message: "Failed to fetch session details", 
        error: error.message || 'Unknown error'
      });
    }
  });

  // Check subscription limits (for settings page)
  app.get("/api/subscriptions/check-limits", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      console.log(`[DEBUG] Checking subscription limits for userId: ${userId}`);
      
      // Check if user is super user (unlimited access)
      const user = await authStorage.getUserById(userId);
      const isSuperUser = user?.role === 'super_admin' || (req as any).jwtUser?.superUser === true;
      
      if (isSuperUser) {
        return res.json({
          canUseService: true,
          planType: "professional",
          status: "active",
          sessionsUsed: 0,
          sessionsLimit: null,
          sessionsRemaining: null,
          minutesUsed: 0,
          minutesLimit: null,
          minutesRemaining: null,
        });
      }

      const now = new Date();

      const hasPaymentReference = (purchase: any) => {
        const metadata = (purchase?.metadata as any) || {};
        const amount = (purchase?.purchaseAmount || '').toString();
        const isFree = amount === '0' || amount === '0.00';
        return Boolean(purchase?.gatewayTransactionId || metadata?.paymentId || isFree);
      };
      
      // NEW: Check addon_purchases table for actual purchases
      const platformPurchases = await db
        .select()
        .from(addonPurchases)
        .where(
          and(
            eq(addonPurchases.userId, userId),
            eq(addonPurchases.addonType, 'platform_access'),
            eq(addonPurchases.status, 'active')
          )
        );

      const sessionMinutesPurchases = await db
        .select()
        .from(addonPurchases)
        .where(
          and(
            eq(addonPurchases.userId, userId),
            eq(addonPurchases.addonType, 'session_minutes'),
            eq(addonPurchases.status, 'active')
          )
        );

      // Check for expired purchases + payment reference
      const activePlatform = platformPurchases
        .filter(p => !p.endDate || p.endDate > now)
        .filter(hasPaymentReference)
        .find(() => true);

      const activeMinutes = sessionMinutesPurchases
        .filter(p => !p.endDate || p.endDate > now)
        .filter(hasPaymentReference);

      // Calculate total remaining minutes
      const totalMinutesRemaining = activeMinutes.reduce((sum, p) => sum + (p.totalUnits - p.usedUnits), 0);

      console.log(`[DEBUG] Addon Purchases:`, {
        hasPlatformAccess: !!activePlatform,
        platformExpires: activePlatform?.endDate,
        hasSessionMinutes: activeMinutes.length > 0,
        totalMinutesRemaining
      });

      // KEY LOGIC: Users need BOTH platform access AND session minutes to use the service
      const hasPlatformAccess = !!activePlatform;
      const hasSessionMinutes = totalMinutesRemaining > 0;
      const canUseService = hasPlatformAccess && hasSessionMinutes;

      if (hasPlatformAccess || hasSessionMinutes) {
        const planType = hasPlatformAccess ? 'professional' : 'free_trial';
        const status = hasPlatformAccess ? 'active' : 'no_subscription';

        console.log(`[DEBUG] Final Check (paid flow):`, {
          planType,
          status,
          canUseService,
          hasPlatformAccess,
          hasSessionMinutes
        });

        return res.json({
          canUseService,
          planType,
          status,
          hasPlatformAccess,
          hasSessionMinutes,
          sessionsUsed: 0,
          sessionsLimit: null,
          sessionsRemaining: null,
          minutesUsed: 0,
          minutesLimit: null,
          minutesRemaining: totalMinutesRemaining > 0 ? totalMinutesRemaining : 0,
        });
      }

      const subscription = await authStorage.getSubscriptionByUserId(userId);
      if (!subscription) {
        console.log(`[DEBUG] No subscription found for user ${userId}, returning trial limits`);
        return res.json({
          canUseService: true,
          planType: "trial",
          status: "no_subscription",
          hasPlatformAccess: false,
          hasSessionMinutes: false,
          sessionsUsed: 0,
          sessionsLimit: 5,
          sessionsRemaining: 5,
          minutesUsed: 0,
          minutesLimit: 60,
          minutesRemaining: 60,
        });
      }

      const sessionsUsed = parseInt(subscription.sessionsUsed || '0');
      const sessionsLimit = subscription.sessionsLimit ? parseInt(subscription.sessionsLimit) : null;
      const minutesUsed = parseInt(subscription.minutesUsed || '0');
      const minutesLimit = subscription.minutesLimit ? parseInt(subscription.minutesLimit) : null;

      const sessionsRemaining = sessionsLimit ? Math.max(0, sessionsLimit - sessionsUsed) : null;
      const minutesRemaining = minutesLimit ? Math.max(0, minutesLimit - minutesUsed) : null;

      const isTrialUser = subscription.status === 'trial' || (sessionsLimit !== null && minutesLimit !== null);
      
      // Check if trial has expired (all sessions OR all minutes used)
      const trialExpired = isTrialUser && (
        (sessionsLimit !== null && sessionsRemaining !== null && sessionsRemaining <= 0) ||
        (minutesLimit !== null && minutesRemaining !== null && minutesRemaining <= 0)
      );
      
      const trialCanUse = (subscription.status === 'trial' || subscription.status === 'active') &&
        (sessionsLimit === null || (sessionsLimit !== null && sessionsRemaining !== null && sessionsRemaining > 0)) &&
        (minutesLimit === null || (minutesLimit !== null && minutesRemaining !== null && minutesRemaining > 0));

      console.log(`[DEBUG] Service access (trial flow):`, {
        status: subscription.status,
        isTrialUser,
        trialExpired,
        canUseService: trialCanUse,
        sessionsCheck: `${sessionsLimit === null} || ${sessionsRemaining !== null && sessionsRemaining > 0}`,
        minutesCheck: `${minutesLimit === null} || ${minutesRemaining !== null && minutesRemaining > 0}`
      });

      return res.json({
        canUseService: trialCanUse,
        planType: subscription.planType,
        status: trialExpired ? 'trial_expired' : subscription.status,
        hasPlatformAccess: false,
        hasSessionMinutes: false,
        trialExpired,
        sessionsUsed,
        sessionsLimit,
        sessionsRemaining,
        minutesUsed,
        minutesLimit,
        minutesRemaining,
      });
    } catch (error: any) {
      console.error(`[DEBUG] Error checking subscription limits:`, error);
      res.status(500).json({ message: "Failed to check subscription limits", error: error.message });
    }
  });
  
  // Debug endpoint to check subscription and payment status
  app.get("/api/debug/subscription-status", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      
      // Get user info
      const user = await authStorage.getUserById(userId);
      
      // Get all subscriptions for this user (not just the latest)
      const allSubscriptions = await db.select().from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt));
      
      // Get all payments for this user
      const payments = await authStorage.getPaymentsByUserId(userId);
      
      // Get all pending orders
      const orders = await db.select().from(pendingOrders)
        .where(eq(pendingOrders.userId, userId))
        .orderBy(desc(pendingOrders.createdAt));
      
      res.json({
        userId,
        userEmail: user?.email,
        userName: `${user?.firstName} ${user?.lastName}`,
        subscriptionsCount: allSubscriptions.length,
        subscriptions: allSubscriptions.map(sub => ({
          id: sub.id,
          planType: sub.planType,
          status: sub.status,
          planId: sub.planId,
          createdAt: sub.createdAt,
          currentPeriodEnd: sub.currentPeriodEnd,
        })),
        paymentsCount: payments.length,
        payments: payments.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          subscriptionId: p.subscriptionId,
          createdAt: p.createdAt,
          razorpayOrderId: p.razorpayOrderId,
        })),
        ordersCount: orders.length,
        orders: orders.map(order => ({
          id: order.id,
          status: order.status,
          amount: order.amount,
          gatewayOrderId: order.gatewayOrderId,
          createdAt: order.createdAt,
          completedAt: order.completedAt,
        })),
      });
    } catch (error: any) {
      console.error("[DEBUG] Error fetching debug info:", error);
      res.status(500).json({ message: "Failed to fetch debug info", error: error.message });
    }
  });
  
  // Get invoice/payment history
  app.get("/api/profile/invoices", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      
      // Import billing storage
      const { billingStorage } = await import("./storage-billing");
      
      // Get all addon purchases for this user
      const allPurchases = await billingStorage.getUserAddonPurchases(userId);
      
      // Build invoice list from all purchases
      const invoices: any[] = [];
      
      allPurchases.forEach((purchase: any) => {
        const metadata = purchase.metadata as any || {};
        
        // Check if this purchase has a purchaseHistory (for session_minutes that were merged)
        if (metadata.purchaseHistory && Array.isArray(metadata.purchaseHistory)) {
          // Create separate invoices for each purchase in the history
          metadata.purchaseHistory.forEach((historyItem: any) => {
            const amount = parseFloat(historyItem.amount || '0');
            const currency = historyItem.currency || 'USD';
            
            let displayAmount = amount;
            let displayCurrency = currency;
            let baseAmount: number;
            let gstAmount: number;
            
            // Proper GST calculation based on currency
            if (currency === 'INR') {
              // For INR, the amount includes GST, so calculate base amount
              baseAmount = displayAmount / 1.18;
              gstAmount = displayAmount - baseAmount;
            } else {
              // For USD and other currencies, no GST
              baseAmount = displayAmount;
              gstAmount = 0;
            }
            
            invoices.push({
              id: historyItem.orderId || historyItem.paymentId,
              orderId: historyItem.gatewayOrderId || historyItem.orderId,
              amount: displayAmount.toFixed(2),
              currency: displayCurrency,
              status: 'succeeded',
              paymentMethod: 'razorpay',
              razorpayOrderId: historyItem.gatewayOrderId,
              razorpayPaymentId: historyItem.paymentId,
              receiptUrl: `/api/billing/invoice?orderId=${historyItem.orderId}`,
              createdAt: historyItem.purchasedAt || purchase.createdAt,
              metadata: {
                itemCount: 1,
                subtotal: baseAmount.toFixed(2),
                gst: gstAmount.toFixed(2),
                total: displayAmount.toFixed(2),
                packageName: historyItem.packageName,
                minutesAdded: historyItem.minutesAdded,
                description: `${historyItem.packageName} - Session Minutes`,
                invoiceNumber: `INV-${historyItem.orderId?.substring(0, 8) || 'TEST'}`,
                customerName: 'Rev Winner Customer',
                customerEmail: 'customer@revwinner.com',
                companyName: 'Rev Winner',
                companyAddress: 'Digital Services Platform',
                gstNumber: 'TEST-GST-123456789',
                paymentMode: historyItem.paymentMethod || 'Online Payment',
                originalAmount: amount,
                originalCurrency: currency,
              },
            });
          });
        } else if (metadata.cartOrderId) {
          // Cart purchase - use the stored amount which should include proper GST
          const totalWithGst = parseFloat(purchase.purchaseAmount || '0');
          const currency = purchase.currency || 'INR';
          let baseAmount: number;
          let gstAmount: number;
          
          // Proper GST calculation based on currency
          if (currency === 'INR') {
            // For INR, the amount includes GST, so calculate base amount
            baseAmount = totalWithGst / 1.18;
            gstAmount = totalWithGst - baseAmount;
          } else {
            // For USD and other currencies, no GST
            baseAmount = totalWithGst;
            gstAmount = 0;
          }
          
          invoices.push({
            id: metadata.cartOrderId,
            orderId: metadata.cartOrderId,
            amount: totalWithGst.toFixed(2),
            currency: currency,
            status: 'succeeded',
            paymentMethod: 'online',
            razorpayOrderId: metadata.gatewayOrderId || metadata.cartOrderId,
            razorpayPaymentId: metadata.paymentId,
            receiptUrl: `/api/billing/invoice?orderId=${metadata.cartOrderId}`,
            createdAt: purchase.createdAt,
            metadata: {
              itemCount: 1,
              subtotal: baseAmount.toFixed(2),
              gst: gstAmount.toFixed(2),
              total: totalWithGst.toFixed(2),
              packageName: metadata.packageName || purchase.packageSku,
            },
          });
        } else {
          // Standalone purchase (old format or other addon types)
          const totalWithGst = parseFloat(purchase.purchaseAmount || '0');
          const currency = purchase.currency || 'INR';
          let baseAmount: number;
          let gstAmount: number;
          
          // Proper GST calculation based on currency
          if (currency === 'INR') {
            // For INR, the amount includes GST, so calculate base amount
            baseAmount = totalWithGst / 1.18;
            gstAmount = totalWithGst - baseAmount;
          } else {
            // For USD and other currencies, no GST
            baseAmount = totalWithGst;
            gstAmount = 0;
          }
          
          invoices.push({
            id: purchase.id,
            orderId: purchase.id,
            amount: totalWithGst.toFixed(2),
            currency: currency,
            status: 'succeeded',
            paymentMethod: 'online',
            razorpayOrderId: metadata.gatewayOrderId || purchase.id,
            razorpayPaymentId: metadata.paymentId,
            receiptUrl: null,
            createdAt: purchase.createdAt,
            metadata: {
              itemCount: 1,
              subtotal: baseAmount.toFixed(2),
              gst: gstAmount.toFixed(2),
              total: totalWithGst.toFixed(2),
              packageName: metadata.packageName || purchase.packageSku,
            },
          });
        }
      });
      
      // Sort by date (newest first)
      invoices.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      console.log(`[Invoice History] Returning ${invoices.length} invoices for user ${userId}`);
      
      res.json({ invoices });
    } catch (error: any) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to fetch invoices", error: error.message });
    }
  });


  // SEO: Sitemap.xml - Dynamic generation of all public routes
  app.get("/sitemap.xml", (req, res) => {
    // Always use production domain for SEO
    const baseUrl = 'https://revwinner.com';
    
    const urls = [
      { loc: '/', priority: '1.0', changefreq: 'weekly' },
      { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
      { loc: '/terms', priority: '0.6', changefreq: 'monthly' },
      { loc: '/login', priority: '0.7', changefreq: 'monthly' },
      { loc: '/register', priority: '0.9', changefreq: 'monthly' },
      { loc: '/forgot-password', priority: '0.5', changefreq: 'monthly' },
      { loc: '/reset-password', priority: '0.5', changefreq: 'monthly' },
      { loc: '/subscribe', priority: '0.9', changefreq: 'weekly' },
      { loc: '/subscription/success', priority: '0.3', changefreq: 'monthly' },
      { loc: '/subscription/cancel', priority: '0.3', changefreq: 'monthly' },
      { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // SEO: Robots.txt - Guide search engine crawlers
  app.get("/robots.txt", (req, res) => {
    // Always use production domain for SEO
    const baseUrl = 'https://revwinner.com';
    
    const robotsTxt = `# Rev Winner - Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /admin/login
Disallow: /profile
Disallow: /settings
Disallow: /sales-assistant
Disallow: /app

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Floating Assistant - Generate contextual advice for sales reps
  app.post("/api/assistant-advice", authenticateToken, async (req, res) => {
    try {
      const userId = req.jwtUser!.userId;
      const { conversationId, type } = req.body;

      if (!type || !['proverbs', 'humor', 'coaching'].includes(type)) {
        return res.status(400).json({ message: "Invalid advice type. Must be 'proverbs', 'humor', or 'coaching'" });
      }

      // Get conversation messages for context
      let conversationContext = "";
      if (conversationId) {
        const messages = await storage.getMessages(conversationId);
        conversationContext = messages
          .map(m => `${m.speakerLabel}: ${m.content}`)
          .join('\n');
      }

      // Get AI client for the user
      const { getAIClient } = await import("./services/ai-engine");
      const { client, model } = await getAIClient(userId);

      // Generate prompts based on advice type
      let systemPrompt = "";
      let userPrompt = "";

      if (type === 'proverbs') {
        systemPrompt = "You're a sales colleague listening to this call. Give brief, scannable wisdom (3-4 sentences max). Reference what the client actually said.";
        userPrompt = conversationContext 
          ? `Sales call:\n${conversationContext}\n\nBased on what the client just said, give me brief wisdom (3-4 sentences) about handling THIS situation. Reference specific things they mentioned. Keep it scannable for live reading.`
          : "Give brief sales wisdom in 3-4 sentences. Keep it actionable.";
      } else if (type === 'humor') {
        systemPrompt = "You're a witty colleague listening to this call. Give brief, natural humor (3-4 sentences max). Reference actual conversation details.";
        userPrompt = conversationContext
          ? `Sales call:\n${conversationContext}\n\nSuggest brief humor or ice-breaker (3-4 sentences) based on what they discussed. Reference their specific industry/product/concern. Keep it scannable for live reading.`
          : "Give brief professional humor in 3-4 sentences.";
      } else if (type === 'coaching') {
        systemPrompt = "You're a sales coach listening in real-time. Give brief, tactical advice (3-4 sentences max) on the NEXT move.";
        userPrompt = conversationContext
          ? `Sales call:\n${conversationContext}\n\nTell me in 3-4 brief sentences what to do NEXT. Be specific - suggest an exact question to ask or action to take based on what they said. Keep it scannable for live reading.`
          : "Give brief tactical coaching in 3-4 sentences.";
      }

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 120,
        temperature: 0.7,
      });

      const advice = response.choices[0]?.message?.content || "Unable to generate advice at this time.";

      res.json({ advice: advice.trim() });
    } catch (error: any) {
      console.error("Error generating assistant advice:", error);
      res.status(500).json({ message: error.message || "Failed to generate advice" });
    }
  });

  // Leads API - Demo requests and contact form submissions
  app.post("/api/leads/demo-request", async (req, res) => {
    try {
      const { name, email, company, phone, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are required" });
      }

      const leadData = {
        name,
        email,
        company: company || null,
        phone: phone || null,
        message,
        leadType: "demo_request" as const,
      };

      const lead = await storage.createLead(leadData);

      const { sendLeadNotificationEmail } = await import("./services/email");
      await sendLeadNotificationEmail("sales@revwinner.com", {
        ...leadData,
        leadType: "demo_request",
      });

      res.json({ success: true, lead });
    } catch (error: any) {
      console.error("Error handling demo request:", error);
      res.status(500).json({ message: "Failed to submit demo request", error: error.message });
    }
  });

  app.post("/api/leads/contact-form", async (req, res) => {
    try {
      const { name, email, message, department } = req.body;
      
      if (!name || !email || !message || !department) {
        return res.status(400).json({ message: "Name, email, message, and department are required" });
      }

      // Validate department enum
      const allowedDepartments = ["sales", "support"];
      if (!allowedDepartments.includes(department)) {
        return res.status(400).json({ message: "Invalid department. Must be 'sales' or 'support'" });
      }

      // Determine recipient email based on department
      const recipientEmail = department === "support" 
        ? "support@revwinner.com" 
        : "sales@revwinner.com";

      const leadData = {
        name,
        email,
        message,
        leadType: "contact_form" as const,
        department,
      };

      const lead = await storage.createLead(leadData);

      const { sendLeadNotificationEmail } = await import("./services/email");
      await sendLeadNotificationEmail(recipientEmail, {
        ...leadData,
        leadType: "contact_form",
      });

      res.json({ success: true, lead, department: recipientEmail });
    } catch (error: any) {
      console.error("Error handling contact form:", error);
      res.status(500).json({ message: "Failed to submit contact form", error: error.message });
    }
  });

  app.post("/api/leads/business-teams", async (req, res) => {
    try {
      console.log("[Business Teams] Received request:", {
        body: req.body,
        headers: { 'content-type': req.get('content-type') }
      });
      
      const { name, email, phone, totalSeats, estimatedTimeline, message } = req.body;
      
      // Validate required fields (phone is optional)
      if (!name || !email || !totalSeats || !estimatedTimeline) {
        console.log("[Business Teams] Validation failed - missing required fields");
        return res.status(400).json({ 
          message: "Name, email, total seats, and estimated timeline are required" 
        });
      }

      // Validate totalSeats is a positive number
      const seats = parseInt(totalSeats, 10);
      if (isNaN(seats) || seats < 1) {
        console.log("[Business Teams] Validation failed - invalid seats:", totalSeats);
        return res.status(400).json({ message: "Total seats must be a positive number" });
      }

      // Phone is optional - only include if provided and not empty
      const phoneValue = phone && phone.trim() !== "" ? phone : null;

      const leadData = {
        name,
        email,
        phone: phoneValue,
        totalSeats: seats,
        estimatedTimeline,
        message: message || null,
        leadType: "business_teams" as const,
      };

      console.log("[Business Teams] Creating lead with data:", leadData);
      const lead = await storage.createLead(leadData);
      console.log("[Business Teams] Lead created successfully:", lead.id);

      // Send email notification (wrapped in try-catch to prevent email errors from failing the request)
      try {
        const { sendLeadNotificationEmail } = await import("./services/email");
        await sendLeadNotificationEmail("sales@revwinner.com", {
          ...leadData,
          leadType: "business_teams",
        });
        console.log("[Business Teams] Email notification sent successfully");
      } catch (emailError: any) {
        console.error("[Business Teams] Error sending notification email:", emailError.message);
        // Don't fail the request if email fails - lead is already saved
      }

      res.json({ success: true, lead });
    } catch (error: any) {
      console.error("[Business Teams] Error handling lead:", error);
      console.error("[Business Teams] Error stack:", error.stack);
      res.status(500).json({ message: "Failed to submit business teams lead", error: error.message });
    }
  });

  // User Profile Management - Sales Framework Preferences
  app.get("/api/user/profile", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      if (!req.jwtUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const profile = await authStorage.getUserProfile(req.jwtUser.userId);
      
      res.json({ profile: profile || null });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
  });
  
  app.put("/api/user/profile", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      if (!req.jwtUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const {
        preferredMethodology,
        conversationStyle,
        primaryIndustries,
        coachingIntensity,
        focusAreas
      } = req.body;
      
      const updates: Partial<typeof req.body> = {};
      if (preferredMethodology) updates.preferredMethodology = preferredMethodology;
      if (conversationStyle) updates.conversationStyle = conversationStyle;
      if (primaryIndustries) updates.primaryIndustries = primaryIndustries;
      if (coachingIntensity) updates.coachingIntensity = coachingIntensity;
      if (focusAreas) updates.focusAreas = focusAreas;
      
      const profile = await authStorage.upsertUserProfile({
        userId: req.jwtUser.userId,
        ...updates
      });
      
      res.json({ profile });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
  });
  
  // Conversation Memory - View framework insights
  app.get("/api/conversations/:sessionId/memory", authenticateToken, checkEntitlement, async (req, res) => {
    try {
      if (!req.jwtUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Security check: ensure user owns this conversation
      if (conversation.userId !== req.jwtUser.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const memory = await authStorage.getConversationMemory(conversation.id);
      
      res.json({ memory: memory || null });
    } catch (error: any) {
      console.error("Error fetching conversation memory:", error);
      res.status(500).json({ message: "Failed to fetch memory", error: error.message });
    }
  });

  // Rev Winner Chatbot - AI Assistant for Rev Winner questions
  app.post("/api/chatbot/rev-winner", async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate input using Zod
      const ChatbotRequestSchema = z.object({
        message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string()
        })).optional().default([]),
        leadData: z.object({
          fullName: z.string(),
          email: z.string(),
          phone: z.string(),
          companyName: z.string().optional(),
          jobTitle: z.string().optional(),
        }).optional(),
        sessionId: z.string().optional()
      });
      
      const validation = ChatbotRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.error("🤖 Chatbot validation error:", validation.error.errors);
        return res.status(400).json({ 
          message: "Invalid request",
          response: "Please provide a valid message (1-1000 characters)."
        });
      }
      
      const { message, conversationHistory, leadData, sessionId } = validation.data;
      console.log(`🤖 Chatbot request: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
      
      // Import knowledge base and generate response
      const { REV_WINNER_KNOWLEDGE, CHATBOT_SYSTEM_PROMPT } = await import("@shared/rev-winner-knowledge");
      
      // Check DeepSeek API key
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      
      if (!deepseekApiKey) {
        console.error("🤖 DeepSeek API key not configured");
        return res.status(503).json({ 
          message: "Chatbot temporarily unavailable",
          response: "Our chatbot is currently offline. Please contact support@revwinner.com for help, or check back later." 
        });
      }
      
      // Create DeepSeek client
      const OpenAI = (await import("openai")).default;
      const deepseekClient = new OpenAI({
        apiKey: deepseekApiKey,
        baseURL: "https://api.deepseek.com/v1",
        timeout: 22000 // 22-second client timeout
      });
      
      // Build conversation context
      const recentMessages = conversationHistory
        .slice(-4) // Last 4 messages for context
        .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
        .join("\n");
      
      const systemPrompt = `${CHATBOT_SYSTEM_PROMPT}\n\nKNOWLEDGE BASE:\n${REV_WINNER_KNOWLEDGE}`;
      
      const aiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Recent conversation:\n${recentMessages}\n\nUser question: ${message}\n\nProvide a helpful, concise answer (2-4 paragraphs max).` }
      ];
      
      // Call AI with 20-second timeout (DeepSeek can be slow during high load)
      const aiResponse = await Promise.race([
        deepseekClient.chat.completions.create({
          model: "deepseek-chat",
          messages: aiMessages as any,
          max_tokens: 600,
          temperature: 0.7
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("AI response timeout")), 20000)
        )
      ]) as any;
      
      const duration = Date.now() - startTime;
      const answer = aiResponse.choices?.[0]?.message?.content;
      
      if (!answer) {
        console.error("🤖 No response from AI");
        return res.status(500).json({
          message: "AI response error",
          response: "I apologize, but I couldn't generate a response. Please try rephrasing your question or contact support@revwinner.com."
        });
      }
      
      console.log(`🤖 Chatbot response generated in ${duration}ms (${answer.length} chars)`);
      
      // Detect conversation intent and route email if meaningful conversation exists
      if (leadData && sessionId && conversationHistory.length >= 4) {
        // Classify conversation intent based on keywords
        const conversationText = conversationHistory
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content.toLowerCase())
          .join(' ');
        
        const salesKeywords = ['pricing', 'cost', 'buy', 'purchase', 'demo', 'upgrade', 'features', 'plan', 'subscription', 'payment', 'vs', 'comparison', 'better than', 'cheaper', 'expensive', 'trial'];
        const supportKeywords = ['help', 'issue', 'problem', 'error', 'not working', 'how to', 'setup', 'configure', 'install', 'broken', 'bug', 'support', 'technical', 'troubleshoot'];
        
        const salesScore = salesKeywords.filter(kw => conversationText.includes(kw)).length;
        const supportScore = supportKeywords.filter(kw => conversationText.includes(kw)).length;
        
        const intent: 'sales' | 'support' = salesScore > supportScore ? 'sales' : 'support';
        
        console.log(`💬 Conversation intent detected: ${intent} (sales: ${salesScore}, support: ${supportScore})`);
        
        // Send conversation summary email asynchronously (don't block response)
        import("./services/email").then(({ sendChatbotConversationEmail }) => {
          sendChatbotConversationEmail(leadData, conversationHistory, intent).catch((error: any) => {
            console.error("Failed to send conversation email:", error);
          });
        });
      }
      
      res.json({ response: answer });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`🤖 Chatbot error after ${duration}ms:`, error.message || error);
      
      // Provide specific error messages
      let userMessage = "I'm sorry, I'm having technical difficulties. Please try again in a moment.";
      
      if (error.message === "AI response timeout") {
        userMessage = "The chatbot is taking longer than expected to respond. Please try a shorter question or contact support@revwinner.com.";
      } else if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        userMessage = "Unable to reach the AI service. Please check your internet connection and try again.";
      }
      
      res.status(500).json({ 
        message: "Chatbot error",
        response: userMessage
      });
    }
  });

  // Save chatbot lead and send notification email
  app.post("/api/chatbot/lead", async (req, res) => {
    try {
      const LeadSchema = z.object({
        leadData: z.object({
          fullName: z.string().min(1, "Full name is required"),
          email: z.string().email("Invalid email address"),
          phone: z.string().min(1, "Phone number is required"),
          companyName: z.string().optional(),
          jobTitle: z.string().optional(),
        }),
        sessionId: z.string()
      });
      
      const validation = LeadSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid lead data",
          errors: validation.error.errors 
        });
      }
      
      const { leadData, sessionId } = validation.data;
      
      // Save lead to database with leadType = 'chatbot'
      const lead = await storage.createLead({
        name: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.companyName || null,
        department: leadData.jobTitle || null,
        leadType: 'chatbot',
        message: `Chatbot session: ${sessionId}`,
      });
      
      console.log(`💬 Chatbot lead created: ${leadData.email} (${leadData.fullName})`);
      
      // Send welcome email notification (async, don't wait)
      import("./services/email").then(({ sendChatbotLeadEmail }) => {
        sendChatbotLeadEmail(leadData).catch((error: any) => {
          console.error("Failed to send chatbot lead email:", error);
        });
      });
      
      res.json({ success: true, leadId: lead.id });
    } catch (error: any) {
      console.error("Error saving chatbot lead:", error);
      res.status(500).json({ 
        message: "Failed to save lead",
        error: error.message 
      });
    }
  });

  // ============================================
  // Train Me Feature Routes
  // ============================================
  
  // Get Train Me subscription status
  app.get("/api/train-me/status", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      const role = req.jwtUser?.role;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Admins and super_admins always have full Train Me access
      if (role === 'admin' || role === 'super_admin') {
        return res.json({
          active: true,
          purchaseDate: null,
          daysRemaining: 999,
          expiryDate: null,
          source: 'admin'
        });
      }

      // Check for active Train Me addon purchase
      const { billingStorage } = await import("./storage-billing");
      const trainMePurchase = await billingStorage.getActiveAddonPurchase(userId, 'train_me');
      
      if (trainMePurchase) {
        const now = new Date();
        const expiryDate = trainMePurchase.endDate;
        let daysRemaining = 999;
        
        if (expiryDate) {
          const diffTime = expiryDate.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
        
        return res.json({
          active: true,
          purchaseDate: trainMePurchase.startDate?.toISOString() || null,
          daysRemaining,
          expiryDate: expiryDate?.toISOString() || null,
          source: 'purchase'
        });
      }

      // Check for enterprise license with Train Me enabled
      const enterpriseAssignment = await billingStorage.getEnterpriseAssignmentByUser(userId);
      if (enterpriseAssignment?.trainMeEnabled) {
        return res.json({
          active: true,
          purchaseDate: null,
          daysRemaining: 999,
          expiryDate: null,
          source: 'enterprise'
        });
      }

      // Check for old-style train_me_subscription_date in auth_users
      const user = await authStorage.getUserById(userId);
      if (user && user.trainMeSubscriptionDate) {
        const subscriptionDate = new Date(user.trainMeSubscriptionDate);
        const expiryDate = new Date(subscriptionDate);
        expiryDate.setDate(expiryDate.getDate() + 30); // 30-day access
        
        const now = new Date();
        if (expiryDate > now) {
          const diffTime = expiryDate.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          
          return res.json({
            active: true,
            purchaseDate: subscriptionDate.toISOString(),
            daysRemaining,
            expiryDate: expiryDate.toISOString(),
            source: 'legacy'
          });
        }
      }

      // No active Train Me subscription
      return res.json({
        active: false,
        purchaseDate: null,
        daysRemaining: 0,
        expiryDate: null,
        source: 'none'
      });
    } catch (error: any) {
      console.error("Train Me status error:", error);
      res.status(500).json({ error: "Failed to check Train Me status" });
    }
  });

  // Get all domain expertise profiles for user
  app.get("/api/domain-expertise", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const domains = await storage.getUserDomainExpertises(userId);
      res.json(domains);
    } catch (error: any) {
      console.error("Get domain expertise error:", error);
      res.status(500).json({ error: "Failed to get domain expertise" });
    }
  });

  // Create new domain expertise profile
  app.post("/api/domain-expertise", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { name, description } = req.body;
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Check domain limit (5 domains per user)
      const existingDomains = await storage.getUserDomainExpertises(userId);
      if (existingDomains.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 domain expertise profiles allowed" });
      }

      const domain = await storage.createDomainExpertise({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      });

      res.status(201).json(domain);
    } catch (error: any) {
      console.error("Create domain expertise error:", error);
      res.status(500).json({ error: "Failed to create domain expertise" });
    }
  });

  // Get single domain expertise
  app.get("/api/domain-expertise/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const domain = await storage.getDomainExpertise(req.params.id, userId);
      if (!domain) {
        return res.status(404).json({ error: "Domain expertise not found" });
      }

      res.json(domain);
    } catch (error: any) {
      console.error("Get domain expertise error:", error);
      res.status(500).json({ error: "Failed to get domain expertise" });
    }
  });

  // Update domain expertise
  app.put("/api/domain-expertise/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { name, description } = req.body;
      const updated = await storage.updateDomainExpertise(req.params.id, userId, {
        name: name?.trim(),
        description: description?.trim() || null
      });

      if (!updated) {
        return res.status(404).json({ error: "Domain expertise not found" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Update domain expertise error:", error);
      res.status(500).json({ error: "Failed to update domain expertise" });
    }
  });

  // Delete domain expertise
  app.delete("/api/domain-expertise/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.deleteDomainExpertise(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete domain expertise error:", error);
      res.status(500).json({ error: "Failed to delete domain expertise" });
    }
  });

  // Get documents for a domain
  app.get("/api/domain-expertise/:id/documents", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const documents = await storage.getTrainingDocumentsByDomain(req.params.id, userId);
      res.json(documents);
    } catch (error: any) {
      console.error("Get documents error:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Upload documents to a domain
  app.post("/api/domain-expertise/:id/documents", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if domain exists and belongs to user
      const domain = await storage.getDomainExpertise(req.params.id, userId);
      if (!domain) {
        return res.status(404).json({ error: "Domain expertise not found" });
      }

      // Handle file upload with multer
      const multer = (await import("multer")).default;
      const upload = multer({ 
        storage: multer.memoryStorage(),
        limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit to support audio files
      });

      upload.array('files', 10)(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ error: err.message || "Upload failed" });
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files provided" });
        }

        // Check document limit (100 per domain)
        const existingDocs = await storage.getTrainingDocumentsByDomain(req.params.id, userId);
        if (existingDocs.length + files.length > 100) {
          return res.status(400).json({ error: "Maximum 100 documents per domain allowed" });
        }

        const results: any[] = [];
        const errors: any[] = [];
        // Support documents, images, AND audio files
        const supportedTypes = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac', 'wma'];
        
        // MIME type to extension mapping for files without proper extensions
        const mimeToExt: Record<string, string> = {
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'text/plain': 'txt',
          'application/vnd.ms-excel': 'xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'text/csv': 'csv',
          'application/vnd.ms-powerpoint': 'ppt',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
          // Image MIME types
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'image/bmp': 'bmp',
          // Audio MIME types
          'audio/mpeg': 'mp3',
          'audio/mp3': 'mp3',
          'audio/wav': 'wav',
          'audio/wave': 'wav',
          'audio/x-wav': 'wav',
          'audio/mp4': 'm4a',
          'audio/x-m4a': 'm4a',
          'audio/ogg': 'ogg',
          'audio/webm': 'webm',
          'audio/flac': 'flac',
          'audio/x-flac': 'flac',
          'audio/aac': 'aac',
          'audio/x-ms-wma': 'wma'
        };
        
        // file-type extension to our processor extension mapping
        const fileTypeToExt: Record<string, string> = {
          'pdf': 'pdf', 'docx': 'docx', 'doc': 'doc', 'xlsx': 'xlsx', 'xls': 'xls',
          'pptx': 'pptx', 'ppt': 'ppt', 'cfb': 'doc', // CFB is used for old Office formats
          // Image types
          'jpg': 'jpg', 'jpeg': 'jpg', 'png': 'png', 'gif': 'gif', 'webp': 'webp', 'bmp': 'bmp',
          // Audio types
          'mp3': 'mp3', 'wav': 'wav', 'm4a': 'm4a', 'ogg': 'ogg', 'webm': 'webm', 'flac': 'flac', 'aac': 'aac', 'wma': 'wma'
        };
        
        for (const file of files) {
          try {
            // Robust file type detection: extension -> MIME -> buffer magic bytes
            let ext = file.originalname.split('.').pop()?.toLowerCase() || '';
            
            // If extension not recognized, try MIME mapping
            if (!supportedTypes.includes(ext) && file.mimetype) {
              ext = mimeToExt[file.mimetype] || ext;
            }
            
            // If still not recognized, try file-type detection from buffer
            if (!supportedTypes.includes(ext)) {
              try {
                const { fileTypeFromBuffer } = await import('file-type');
                const detected = await fileTypeFromBuffer(file.buffer);
                if (detected && fileTypeToExt[detected.ext]) {
                  ext = fileTypeToExt[detected.ext];
                }
              } catch (ftErr) {
                console.warn('file-type detection failed:', ftErr);
              }
            }
            
            let extractedContent = '';
            
            if (supportedTypes.includes(ext)) {
              // Save buffer to temp file for processing with sanitized filename
              const fs = await import('fs/promises');
              const os = await import('os');
              const path = await import('path');
              const crypto = await import('crypto');
              const safeId = crypto.randomUUID();
              const tempPath = path.join(os.tmpdir(), `doc_${safeId}.${ext}`);
              
              await fs.writeFile(tempPath, file.buffer);
              
              let processedMetadata: Record<string, any> = { size: file.size, extractedFrom: ext };
              
              try {
                // Use document processor for proper text extraction (including audio transcription)
                const { processDocument } = await import("./services/documentProcessor");
                const processed = await processDocument(tempPath, ext, false);
                extractedContent = processed.content || '';
                
                // Capture audio-specific metadata if present
                if (processed.metadata) {
                  processedMetadata = { ...processedMetadata, ...processed.metadata };
                }
              } finally {
                // Clean up temp file
                await fs.unlink(tempPath).catch(() => {});
              }
              
              // Determine content source based on file type
              const audioTypes = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac', 'wma'];
              const isAudioFile = audioTypes.includes(ext.toLowerCase());
              
              const doc = await storage.createTrainingDocument({
                domainExpertiseId: req.params.id,
                userId,
                fileName: file.originalname,
                fileType: ext,
                fileUrl: '',
                content: extractedContent.substring(0, 500000),
                contentSource: isAudioFile ? 'transcription' : 'extraction',
                audioDuration: processedMetadata.audioDuration || null,
                processingStatus: 'completed',
                metadata: processedMetadata
              });
              results.push(doc);
            } else {
              // Unsupported type - mark as failed instead of corrupting with UTF-8 decode
              const doc = await storage.createTrainingDocument({
                domainExpertiseId: req.params.id,
                userId,
                fileName: file.originalname,
                fileType: ext || file.mimetype || 'unknown',
                fileUrl: '',
                content: '',
                processingStatus: 'failed',
                processingError: `Unsupported file type: ${ext || file.mimetype}. Supported: PDF, DOC, DOCX, TXT, XLS, XLSX, CSV, PPT, PPTX, JPG, PNG, GIF, WEBP, MP3, WAV, M4A, OGG, FLAC`,
                metadata: { size: file.size }
              });
              errors.push({ fileName: file.originalname, error: `Unsupported file type: ${ext || file.mimetype}` });
              continue;
            }
          } catch (processError: any) {
            console.error(`Failed to process ${file.originalname}:`, processError);
            errors.push({ fileName: file.originalname, error: processError.message });
          }
        }

        // Invalidate training context cache for immediate effect
        const { invalidateTrainingContextCache } = await import("./services/openai");
        invalidateTrainingContextCache(userId);

        // Trigger async knowledge extraction for uploaded documents
        if (results.length > 0) {
          setImmediate(async () => {
            try {
              const { processDocumentForKnowledge } = await import("./services/knowledgeExtraction");
              for (const doc of results) {
                await processDocumentForKnowledge(doc, req.params.id, userId);
              }
              console.log(`📚 Knowledge extraction completed for ${results.length} documents`);
            } catch (error: any) {
              console.error("Knowledge extraction error:", error.message);
            }
          });
        }

        res.status(201).json({ 
          success: results.length > 0,
          uploaded: results,
          errors: errors,
          message: errors.length > 0 
            ? `${results.length} document(s) uploaded, ${errors.length} failed`
            : `${results.length} document(s) uploaded successfully`
        });
      });
    } catch (error: any) {
      console.error("Upload documents error:", error);
      res.status(500).json({ error: "Failed to upload documents" });
    }
  });

  // Add document from URL (with cache invalidation)
  app.post("/api/domain-expertise/:id/documents/url", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "Valid URL is required" });
      }

      // Check if domain exists and belongs to user
      const domain = await storage.getDomainExpertise(req.params.id, userId);
      if (!domain) {
        return res.status(404).json({ error: "Domain expertise not found" });
      }

      // Check document limit (100 per domain)
      const existingDocs = await storage.getTrainingDocumentsByDomain(req.params.id, userId);
      if (existingDocs.length >= 100) {
        return res.status(400).json({ error: "Maximum 100 documents per domain allowed" });
      }

      // Create document with processing status first
      const doc = await storage.createTrainingDocument({
        domainExpertiseId: req.params.id,
        userId,
        fileName: url,
        fileType: 'url',
        fileUrl: url,
        content: '',
        processingStatus: 'processing',
        metadata: { sourceUrl: url }
      });

      // Fetch and process URL content in background with timeout
      (async () => {
        const startTime = Date.now();
        const FETCH_TIMEOUT = 15000; // 15 second timeout for fetch
        const OVERALL_TIMEOUT = 30000; // 30 second overall timeout
        
        try {
          const cheerio = await import('cheerio');
          
          // Create AbortController for fetch timeout
          const controller = new AbortController();
          const fetchTimeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
          
          // Overall timeout promise
          const overallTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('URL processing timed out after 30 seconds')), OVERALL_TIMEOUT)
          );
          
          const fetchPromise = (async () => {
            try {
              const response = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: controller.signal
              });
              clearTimeout(fetchTimeoutId);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
              }
              
              const html = await response.text();
              const $ = cheerio.load(html);
              
              // Remove scripts, styles, and other non-content elements
              $('script, style, nav, footer, header, aside, iframe, noscript, svg, form, button').remove();
              
              // Extract main content - try multiple selectors
              let content = $('main, article, .content, #content, .post, .article, [role="main"]').first().text();
              if (!content || content.length < 100) {
                content = $('body').text();
              }
              
              // Clean up whitespace
              content = content.replace(/\s+/g, ' ').trim().substring(0, 100000); // Reduced from 500k
              
              if (content.length < 50) {
                throw new Error('Could not extract meaningful content from URL');
              }
              
              return content;
            } catch (err: any) {
              clearTimeout(fetchTimeoutId);
              if (err.name === 'AbortError') {
                throw new Error('URL fetch timed out after 15 seconds');
              }
              throw err;
            }
          })();
          
          // Race between fetch and overall timeout
          const content = await Promise.race([fetchPromise, overallTimeoutPromise]) as string;
          
          // Update document with extracted content
          await storage.updateTrainingDocument(doc.id, userId, {
            content,
            processingStatus: 'completed',
            metadata: { 
              sourceUrl: url, 
              extractedAt: new Date().toISOString(),
              processingTimeMs: Date.now() - startTime,
              contentLength: content.length
            }
          });
          
          console.log(`✅ URL processed in ${Date.now() - startTime}ms: ${url.substring(0, 50)}...`);
          
          // Invalidate training context cache
          const { invalidateTrainingContextCache } = await import("./services/openai");
          invalidateTrainingContextCache(userId);
        } catch (error: any) {
          const errorMsg = error.message || 'Failed to extract content from URL';
          console.error(`❌ Failed to process URL ${url} after ${Date.now() - startTime}ms:`, errorMsg);
          await storage.updateTrainingDocument(doc.id, userId, {
            processingStatus: 'failed',
            processingError: errorMsg
          });
        }
      })();

      res.status(201).json({ 
        success: true, 
        document: doc,
        message: "URL added. Content is being extracted..." 
      });
    } catch (error: any) {
      console.error("Add URL document error:", error);
      res.status(500).json({ error: "Failed to add URL document" });
    }
  });

  // Delete a document (with cache invalidation)
  app.delete("/api/domain-expertise/:domainId/documents/:docId", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.deleteTrainingDocument(req.params.docId, userId);
      
      // Invalidate training context cache for immediate effect
      const { invalidateTrainingContextCache } = await import("./services/openai");
      invalidateTrainingContextCache(userId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Update/Replace a document (allows updating content when user uploads new version)
  app.put("/api/domain-expertise/:domainId/documents/:docId", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { content, fileName, metadata } = req.body;
      
      // Verify document belongs to user
      const existingDoc = await storage.getTrainingDocument(req.params.docId, userId);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const updates: any = { updatedAt: new Date() };
      if (content !== undefined) updates.content = content;
      if (fileName !== undefined) updates.fileName = fileName;
      if (metadata !== undefined) updates.metadata = metadata;
      updates.processingStatus = 'completed';

      const updated = await storage.updateTrainingDocument(req.params.docId, userId, updates);
      
      // Invalidate training context cache for immediate effect
      const { invalidateTrainingContextCache } = await import("./services/openai");
      invalidateTrainingContextCache(userId);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Update document error:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // Replace document by uploading new file (for Train Me document replacement)
  app.post("/api/domain-expertise/:domainId/documents/:docId/replace", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify document belongs to user
      const existingDoc = await storage.getTrainingDocument(req.params.docId, userId);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Handle file upload with multer
      const multer = (await import("multer")).default;
      const upload = multer({ 
        storage: multer.memoryStorage(),
        limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit to support audio files
      });

      upload.single('file')(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ error: err.message || "Upload failed" });
        }

        const file = req.file as Express.Multer.File;
        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }

        try {
          // MIME type to extension mapping for files without proper extensions
          const mimeToExt: Record<string, string> = {
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'text/plain': 'txt',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'text/csv': 'csv',
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
          };
          
          // file-type extension to our processor extension mapping
          const fileTypeToExt: Record<string, string> = {
            'pdf': 'pdf', 'docx': 'docx', 'doc': 'doc', 'xlsx': 'xlsx', 'xls': 'xls',
            'pptx': 'pptx', 'ppt': 'ppt', 'cfb': 'doc'
          };
          
          const supportedTypes = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'];
          
          // Robust file type detection: extension -> MIME -> buffer magic bytes
          let ext = file.originalname.split('.').pop()?.toLowerCase() || '';
          
          // If extension not recognized, try MIME mapping
          if (!supportedTypes.includes(ext) && file.mimetype) {
            ext = mimeToExt[file.mimetype] || ext;
          }
          
          // If still not recognized, try file-type detection from buffer
          if (!supportedTypes.includes(ext)) {
            try {
              const { fileTypeFromBuffer } = await import('file-type');
              const detected = await fileTypeFromBuffer(file.buffer);
              if (detected && fileTypeToExt[detected.ext]) {
                ext = fileTypeToExt[detected.ext];
              }
            } catch (ftErr) {
              console.warn('file-type detection failed:', ftErr);
            }
          }
          
          let extractedContent = '';
          
          if (supportedTypes.includes(ext)) {
            // Save buffer to temp file for processing with sanitized filename
            const fs = await import('fs/promises');
            const os = await import('os');
            const path = await import('path');
            const crypto = await import('crypto');
            const safeId = crypto.randomUUID();
            const tempPath = path.join(os.tmpdir(), `doc_${safeId}.${ext}`);
            
            await fs.writeFile(tempPath, file.buffer);
            
            try {
              // Use document processor for proper text extraction
              const { processDocument } = await import("./services/documentProcessor");
              const processed = await processDocument(tempPath, ext, false);
              extractedContent = processed.content || '';
            } finally {
              // Clean up temp file
              await fs.unlink(tempPath).catch(() => {});
            }
          } else {
            // Unsupported type - return error instead of corrupting with UTF-8 decode
            return res.status(400).json({ 
              error: `Unsupported file type: ${ext || file.mimetype}. Supported: PDF, DOC, DOCX, TXT, XLS, XLSX, CSV, PPT, PPTX` 
            });
          }

          // Update the document with properly extracted content
          const updated = await storage.updateTrainingDocument(req.params.docId, userId, {
            fileName: file.originalname,
            fileType: ext,
            content: extractedContent.substring(0, 500000),
            processingStatus: 'completed',
            metadata: { size: file.size, replacedAt: new Date().toISOString(), extractedFrom: ext },
            updatedAt: new Date()
          });

          // Invalidate training context cache for immediate effect
          const { invalidateTrainingContextCache } = await import("./services/openai");
          invalidateTrainingContextCache(userId);

          res.json({ 
            success: true, 
            document: updated,
            message: "Document replaced successfully"
          });
        } catch (processError: any) {
          console.error("Document processing error:", processError);
          res.status(500).json({ error: `Failed to process document: ${processError.message}` });
        }
      });
    } catch (error: any) {
      console.error("Replace document error:", error);
      res.status(500).json({ error: "Failed to replace document" });
    }
  });

  // ========================================
  // KNOWLEDGE BASE API ROUTES
  // ========================================

  // Get all knowledge entries for a domain
  app.get("/api/domain-expertise/:id/knowledge", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const entries = await storage.getKnowledgeEntriesByDomain(req.params.id, userId);
      res.json(entries);
    } catch (error: any) {
      console.error("Get knowledge entries error:", error);
      res.status(500).json({ error: "Failed to get knowledge entries" });
    }
  });

  // Get all knowledge entries for user (across all domains)
  app.get("/api/knowledge-entries", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const entries = await storage.getAllUserKnowledgeEntries(userId);
      res.json(entries);
    } catch (error: any) {
      console.error("Get all knowledge entries error:", error);
      res.status(500).json({ error: "Failed to get knowledge entries" });
    }
  });

  // Rebuild knowledge base for a domain (re-extract from all documents)
  // By default, this is INCREMENTAL - only processes new documents
  // Pass ?force=true to force a full rebuild that clears existing entries
  app.post("/api/domain-expertise/:id/knowledge/rebuild", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const domain = await storage.getDomainExpertise(req.params.id, userId);
      if (!domain) {
        return res.status(404).json({ error: "Domain expertise not found" });
      }

      // Check if full rebuild requested via query param or body
      const forceFullRebuild = req.query.force === 'true' || req.body?.force === true;

      // Run async - don't block the response
      res.json({ 
        success: true, 
        message: forceFullRebuild 
          ? "Full knowledge base rebuild started. This may take a few moments."
          : "Incremental knowledge update started. Only new documents will be processed."
      });

      // Process in background
      setImmediate(async () => {
        try {
          const { rebuildKnowledgeBase } = await import("./services/knowledgeExtraction");
          const result = await rebuildKnowledgeBase(req.params.id, userId, forceFullRebuild);
          console.log(`📚 Knowledge base updated: ${result.newEntriesAdded} new entries created`);
          
          // Invalidate cache
          const { invalidateTrainingContextCache } = await import("./services/openai");
          invalidateTrainingContextCache(userId);
        } catch (error: any) {
          console.error("Knowledge base rebuild error:", error.message);
        }
      });
    } catch (error: any) {
      console.error("Rebuild knowledge base error:", error);
      res.status(500).json({ error: "Failed to start knowledge base rebuild" });
    }
  });

  // Delete a knowledge entry
  app.delete("/api/knowledge-entries/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.deleteKnowledgeEntry(req.params.id, userId);
      
      // Invalidate cache
      const { invalidateTrainingContextCache } = await import("./services/openai");
      invalidateTrainingContextCache(userId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete knowledge entry error:", error);
      res.status(500).json({ error: "Failed to delete knowledge entry" });
    }
  });

  // Update a knowledge entry (edit content, verify, etc.)
  app.patch("/api/knowledge-entries/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, content, category, isVerified, details, keywords } = req.body;
      const updates: any = {};
      
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (category !== undefined) updates.category = category;
      if (isVerified !== undefined) updates.isVerified = isVerified;
      if (details !== undefined) updates.details = details;
      if (keywords !== undefined) updates.keywords = keywords;

      const updated = await storage.updateKnowledgeEntry(req.params.id, userId, updates);
      
      if (!updated) {
        return res.status(404).json({ error: "Knowledge entry not found" });
      }

      // Invalidate cache
      const { invalidateTrainingContextCache } = await import("./services/openai");
      invalidateTrainingContextCache(userId);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Update knowledge entry error:", error);
      res.status(500).json({ error: "Failed to update knowledge entry" });
    }
  });

  // Search knowledge entries
  app.get("/api/knowledge-entries/search", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.jwtUser?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { q, category } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }

      const entries = await storage.searchKnowledgeEntries(userId, q, category as string | undefined);
      res.json(entries);
    } catch (error: any) {
      console.error("Search knowledge entries error:", error);
      res.status(500).json({ error: "Failed to search knowledge entries" });
    }
  });

  // Setup new authentication, admin, Stripe, billing, and enterprise routes
  setupAuthRoutes(app);
  setupAdminRoutes(app);
  setupAdminPlansRoutes(app);
  setupBillingRoutes(app); // Enterprise billing routes
  setupEnterpriseRoutes(app);
  setupSupportRoutes(app); // Support ticket system
  setupGameRoutes(app); // Sales challenge game
  registerBackupRoutes(app); // Conversation backup for marketing and analysis
  registerMarketingRoutes(app); // Marketing insights and discovery
  
  // API Keys management routes
  app.use("/api/api-keys", apiKeysRouter);
  console.log("🔑 API Keys routes registered");
  
  setupSalesIntelligenceRoutes(app); // Sales Intelligence Agent for real-time suggestions
  registerBibleRoutes(app); // Rev Winner Bible PDF download
  app.use("/api/download", apiDocsRouter); // API Documentation PDF download
  app.use(recordingsRouter); // Call recordings and meeting minutes (7-day retention)

  const httpServer = createServer(app);
  
  // Setup transcription WebSocket routes
  setupTranscriptionRoutes(httpServer);
  
  return httpServer;
}
