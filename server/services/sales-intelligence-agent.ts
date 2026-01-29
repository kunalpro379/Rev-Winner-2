import { db } from "../db";
import { 
  salesIntelligenceKnowledge, 
  salesIntelligenceSuggestions,
  salesIntelligenceLearningLogs,
  salesIntelligenceExports,
  SALES_INTENT_TYPES,
  type SalesIntentType,
  type SalesIntelligenceKnowledge,
  type InsertSalesIntelligenceSuggestion,
  type InsertSalesIntelligenceLearningLog,
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql, ilike, or } from "drizzle-orm";

const CONFIDENCE_THRESHOLD = 70;
const MAX_LATENCY_MS = 500;

interface DetectedIntent {
  type: SalesIntentType;
  confidence: number;
  matchedKeywords: string[];
}

interface AssembledContext {
  industry?: string;
  persona?: string;
  salesStage?: string;
  product?: string;
  customerQuestion: string;
}

interface SuggestionResult {
  suggestedResponse: string;
  followUpPrompt?: string;
  intentType: string;
  intentConfidence: number;
  retrievalConfidence: number;
  knowledgeId?: string;
}

const INTENT_PATTERNS: Record<SalesIntentType, { keywords: string[], patterns: RegExp[] }> = {
  [SALES_INTENT_TYPES.DISCOVERY_QUESTION]: {
    keywords: ["tell me", "what do you", "how does", "can you explain", "what is", "describe", "walk me through"],
    patterns: [/what\s+(do|does|is|are)/i, /can you\s+(tell|explain|describe)/i, /how\s+(do|does|can)/i]
  },
  [SALES_INTENT_TYPES.OBJECTION_HANDLING]: {
    keywords: ["concerned", "worry", "issue", "problem", "not sure", "hesitant", "risk", "but", "however", "challenge"],
    patterns: [/i('m|\s+am)\s+(not\s+sure|concerned|worried)/i, /what\s+if/i, /our\s+concern/i]
  },
  [SALES_INTENT_TYPES.PRICING_BUDGET]: {
    keywords: ["price", "cost", "budget", "expensive", "afford", "investment", "roi", "payment", "discount", "pricing"],
    patterns: [/how\s+much/i, /what('s|\s+is)\s+the\s+(price|cost)/i, /budget\s+(is|for)/i]
  },
  [SALES_INTENT_TYPES.COMPETITOR_COMPARISON]: {
    keywords: ["competitor", "alternative", "vs", "versus", "compared to", "different from", "better than", "gong", "chorus", "salesforce"],
    patterns: [/how\s+(do|does)\s+you\s+compare/i, /what\s+makes\s+you\s+different/i, /vs\s+\w+/i]
  },
  [SALES_INTENT_TYPES.SECURITY_COMPLIANCE]: {
    keywords: ["security", "compliance", "gdpr", "soc2", "hipaa", "encryption", "data protection", "privacy", "audit"],
    patterns: [/(is|are)\s+(your|the)\s+data\s+(secure|protected)/i, /compliance\s+(with|requirements)/i]
  },
  [SALES_INTENT_TYPES.VALUE_JUSTIFICATION]: {
    keywords: ["why should", "benefits", "value", "worth", "justify", "prove", "results", "outcomes", "success"],
    patterns: [/why\s+should\s+(we|i)/i, /what('s|\s+is)\s+the\s+(benefit|value)/i, /prove\s+(it|the\s+value)/i]
  },
  [SALES_INTENT_TYPES.CLOSING_NEXT_STEPS]: {
    keywords: ["next steps", "move forward", "get started", "timeline", "implementation", "contract", "sign", "decision"],
    patterns: [/what('s|\s+are)\s+(the\s+)?next\s+steps/i, /how\s+do\s+we\s+(start|proceed)/i, /ready\s+to/i]
  }
};

export class SalesIntelligenceAgent {
  private startTime: number = 0;

  detectIntent(customerQuestion: string): DetectedIntent | null {
    this.startTime = Date.now();
    
    if (!customerQuestion || customerQuestion.trim().length < 10) {
      return null;
    }

    const normalizedQuestion = customerQuestion.toLowerCase().trim();
    let bestMatch: DetectedIntent | null = null;
    let highestConfidence = 0;

    for (const [intentType, config] of Object.entries(INTENT_PATTERNS)) {
      let confidence = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of config.keywords) {
        if (normalizedQuestion.includes(keyword)) {
          matchedKeywords.push(keyword);
          confidence += 15;
        }
      }

      for (const pattern of config.patterns) {
        if (pattern.test(normalizedQuestion)) {
          confidence += 25;
        }
      }

      confidence = Math.min(confidence, 100);

      if (confidence > highestConfidence && confidence >= CONFIDENCE_THRESHOLD) {
        highestConfidence = confidence;
        bestMatch = {
          type: intentType as SalesIntentType,
          confidence,
          matchedKeywords
        };
      }
    }

    return bestMatch;
  }

  assembleContext(
    customerQuestion: string,
    industry?: string,
    persona?: string,
    salesStage?: string,
    product?: string
  ): AssembledContext {
    return {
      industry: industry || undefined,
      persona: persona || undefined,
      salesStage: salesStage || undefined,
      product: product || undefined,
      customerQuestion
    };
  }

  async retrieveKnowledge(
    intent: DetectedIntent,
    context: AssembledContext
  ): Promise<SalesIntelligenceKnowledge | null> {
    if (this.checkLatencyRisk()) {
      return null;
    }

    try {
      const conditions = [
        eq(salesIntelligenceKnowledge.intentType, intent.type),
        eq(salesIntelligenceKnowledge.isActive, true)
      ];

      const results = await db
        .select()
        .from(salesIntelligenceKnowledge)
        .where(and(...conditions))
        .orderBy(desc(salesIntelligenceKnowledge.performanceScore))
        .limit(10);

      if (results.length === 0) {
        return null;
      }

      let bestMatch: SalesIntelligenceKnowledge | null = null;
      let highestScore = 0;

      for (const knowledge of results) {
        let score = knowledge.performanceScore || 50;

        if (context.industry && knowledge.industry === context.industry) {
          score += 15;
        }
        if (context.persona && knowledge.persona === context.persona) {
          score += 10;
        }
        if (context.salesStage && knowledge.salesStage === context.salesStage) {
          score += 10;
        }

        const triggerKeywords = knowledge.triggerKeywords as string[] || [];
        for (const keyword of triggerKeywords) {
          if (context.customerQuestion.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5;
          }
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = knowledge;
        }
      }

      return bestMatch;
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Knowledge retrieval error:", error);
      return null;
    }
  }

  async generateSuggestion(
    customerQuestion: string,
    conversationId?: string,
    userId?: string,
    context?: Partial<AssembledContext>
  ): Promise<SuggestionResult | null> {
    this.startTime = Date.now();

    const intent = this.detectIntent(customerQuestion);
    if (!intent) {
      return null;
    }

    const assembledContext = this.assembleContext(
      customerQuestion,
      context?.industry,
      context?.persona,
      context?.salesStage,
      context?.product
    );

    const knowledge = await this.retrieveKnowledge(intent, assembledContext);
    if (!knowledge) {
      return null;
    }

    const retrievalConfidence = Math.min(
      (knowledge.performanceScore || 50) + 
      (intent.matchedKeywords.length * 5),
      100
    );

    if (retrievalConfidence < CONFIDENCE_THRESHOLD) {
      return null;
    }

    if (conversationId && userId) {
      await this.logSuggestion({
        conversationId,
        userId,
        knowledgeId: knowledge.id,
        detectedIntent: intent.type,
        intentConfidence: intent.confidence,
        customerQuestion,
        assembledContext: assembledContext as any,
        suggestedResponse: knowledge.suggestedResponse,
        followUpPrompt: knowledge.followUpPrompt || undefined,
        retrievalConfidence,
        wasDisplayed: true,
        responseLatencyMs: Date.now() - this.startTime
      });
    }

    return {
      suggestedResponse: knowledge.suggestedResponse,
      followUpPrompt: knowledge.followUpPrompt || undefined,
      intentType: intent.type,
      intentConfidence: intent.confidence,
      retrievalConfidence,
      knowledgeId: knowledge.id
    };
  }

  private checkLatencyRisk(): boolean {
    return Date.now() - this.startTime > MAX_LATENCY_MS;
  }

  async logSuggestion(data: InsertSalesIntelligenceSuggestion): Promise<void> {
    try {
      await db.insert(salesIntelligenceSuggestions).values(data);
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to log suggestion:", error);
    }
  }

  async logLearning(data: InsertSalesIntelligenceLearningLog): Promise<void> {
    try {
      await db.insert(salesIntelligenceLearningLogs).values(data);
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to log learning:", error);
    }
  }

  async updateSuggestionOutcome(
    suggestionId: string,
    wasUsed: boolean
  ): Promise<void> {
    try {
      await db
        .update(salesIntelligenceSuggestions)
        .set({ wasUsed })
        .where(eq(salesIntelligenceSuggestions.id, suggestionId));

      const suggestion = await db
        .select()
        .from(salesIntelligenceSuggestions)
        .where(eq(salesIntelligenceSuggestions.id, suggestionId))
        .limit(1);

      if (suggestion.length > 0 && suggestion[0].knowledgeId) {
        const field = wasUsed ? "acceptanceCount" : "rejectionCount";
        await db
          .update(salesIntelligenceKnowledge)
          .set({
            [field]: sql`${salesIntelligenceKnowledge[field as keyof typeof salesIntelligenceKnowledge]} + 1`,
            usageCount: sql`${salesIntelligenceKnowledge.usageCount} + 1`
          })
          .where(eq(salesIntelligenceKnowledge.id, suggestion[0].knowledgeId));
      }
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to update outcome:", error);
    }
  }

  async getKnowledgeStore(filters?: {
    intentType?: string;
    industry?: string;
    isValidated?: boolean;
    isActive?: boolean;
    search?: string;
  }): Promise<SalesIntelligenceKnowledge[]> {
    try {
      const conditions = [];
      
      if (filters?.intentType) {
        conditions.push(eq(salesIntelligenceKnowledge.intentType, filters.intentType));
      }
      if (filters?.industry) {
        conditions.push(eq(salesIntelligenceKnowledge.industry, filters.industry));
      }
      if (filters?.isValidated !== undefined) {
        conditions.push(eq(salesIntelligenceKnowledge.isValidated, filters.isValidated));
      }
      if (filters?.isActive !== undefined) {
        conditions.push(eq(salesIntelligenceKnowledge.isActive, filters.isActive));
      }
      if (filters?.search) {
        conditions.push(
          or(
            ilike(salesIntelligenceKnowledge.suggestedResponse, `%${filters.search}%`),
            ilike(salesIntelligenceKnowledge.followUpPrompt, `%${filters.search}%`)
          )
        );
      }

      const query = conditions.length > 0
        ? db.select().from(salesIntelligenceKnowledge).where(and(...conditions))
        : db.select().from(salesIntelligenceKnowledge);

      return await query.orderBy(desc(salesIntelligenceKnowledge.performanceScore));
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to get knowledge store:", error);
      return [];
    }
  }

  async addKnowledge(data: {
    intentType: string;
    suggestedResponse: string;
    followUpPrompt?: string;
    industry?: string;
    persona?: string;
    salesStage?: string;
    triggerKeywords?: string[];
    source?: string;
    notes?: string;
  }): Promise<SalesIntelligenceKnowledge | null> {
    try {
      const [result] = await db
        .insert(salesIntelligenceKnowledge)
        .values({
          ...data,
          triggerKeywords: data.triggerKeywords || [],
          triggerPatterns: [],
          isValidated: false,
          isActive: true
        })
        .returning();
      return result;
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to add knowledge:", error);
      return null;
    }
  }

  async validateKnowledge(
    knowledgeId: string,
    validatedBy: string
  ): Promise<boolean> {
    try {
      await db
        .update(salesIntelligenceKnowledge)
        .set({
          isValidated: true,
          validatedBy,
          validatedAt: new Date()
        })
        .where(eq(salesIntelligenceKnowledge.id, knowledgeId));
      return true;
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to validate knowledge:", error);
      return false;
    }
  }

  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalSuggestions: number;
    acceptanceRate: number;
    topIntents: { intent: string; count: number }[];
    avgConfidence: number;
    avgLatency: number;
  }> {
    try {
      const conditions = [];
      if (dateRange) {
        conditions.push(gte(salesIntelligenceSuggestions.createdAt, dateRange.start));
        conditions.push(lte(salesIntelligenceSuggestions.createdAt, dateRange.end));
      }

      const suggestions = conditions.length > 0
        ? await db.select().from(salesIntelligenceSuggestions).where(and(...conditions))
        : await db.select().from(salesIntelligenceSuggestions);

      const totalSuggestions = suggestions.length;
      const usedCount = suggestions.filter(s => s.wasUsed === true).length;
      const knownOutcomeCount = suggestions.filter(s => s.wasUsed !== null).length;
      const acceptanceRate = knownOutcomeCount > 0 ? (usedCount / knownOutcomeCount) * 100 : 0;

      const intentCounts: Record<string, number> = {};
      let totalConfidence = 0;
      let totalLatency = 0;
      let latencyCount = 0;

      for (const s of suggestions) {
        intentCounts[s.detectedIntent] = (intentCounts[s.detectedIntent] || 0) + 1;
        totalConfidence += s.intentConfidence;
        if (s.responseLatencyMs) {
          totalLatency += s.responseLatencyMs;
          latencyCount++;
        }
      }

      const topIntents = Object.entries(intentCounts)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalSuggestions,
        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
        topIntents,
        avgConfidence: totalSuggestions > 0 ? Math.round(totalConfidence / totalSuggestions) : 0,
        avgLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0
      };
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to get analytics:", error);
      return {
        totalSuggestions: 0,
        acceptanceRate: 0,
        topIntents: [],
        avgConfidence: 0,
        avgLatency: 0
      };
    }
  }

  async getLearningLogs(filters?: {
    processingStatus?: string;
    canUseForMarketing?: boolean;
    canUseForTraining?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    try {
      const conditions = [];
      
      if (filters?.processingStatus) {
        conditions.push(eq(salesIntelligenceLearningLogs.processingStatus, filters.processingStatus));
      }
      if (filters?.canUseForMarketing !== undefined) {
        conditions.push(eq(salesIntelligenceLearningLogs.canUseForMarketing, filters.canUseForMarketing));
      }
      if (filters?.canUseForTraining !== undefined) {
        conditions.push(eq(salesIntelligenceLearningLogs.canUseForTraining, filters.canUseForTraining));
      }

      const baseQuery = conditions.length > 0
        ? db.select().from(salesIntelligenceLearningLogs).where(and(...conditions))
        : db.select().from(salesIntelligenceLearningLogs);

      const logs = await baseQuery
        .orderBy(desc(salesIntelligenceLearningLogs.createdAt))
        .limit(filters?.limit || 100)
        .offset(filters?.offset || 0);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(salesIntelligenceLearningLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs,
        total: Number(countResult?.count || 0)
      };
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to get learning logs:", error);
      return { logs: [], total: 0 };
    }
  }

  async exportData(params: {
    exportName: string;
    exportType: "knowledge" | "suggestions" | "learning_logs" | "analytics";
    dateRangeStart?: Date;
    dateRangeEnd?: Date;
    intentFilter?: string;
    industryFilter?: string;
    exportedBy: string;
    purpose: string;
    notes?: string;
  }): Promise<{ exportId: string; recordCount: number; data: any[] }> {
    try {
      let data: any[] = [];
      
      switch (params.exportType) {
        case "knowledge":
          data = await this.getKnowledgeStore({
            intentType: params.intentFilter,
            industry: params.industryFilter
          });
          break;
        case "suggestions":
          const conditions = [];
          if (params.dateRangeStart) {
            conditions.push(gte(salesIntelligenceSuggestions.createdAt, params.dateRangeStart));
          }
          if (params.dateRangeEnd) {
            conditions.push(lte(salesIntelligenceSuggestions.createdAt, params.dateRangeEnd));
          }
          if (params.intentFilter) {
            conditions.push(eq(salesIntelligenceSuggestions.detectedIntent, params.intentFilter));
          }
          data = conditions.length > 0
            ? await db.select().from(salesIntelligenceSuggestions).where(and(...conditions))
            : await db.select().from(salesIntelligenceSuggestions);
          break;
        case "learning_logs":
          const { logs } = await this.getLearningLogs({
            canUseForMarketing: true,
            limit: 10000
          });
          data = logs;
          break;
        case "analytics":
          const analytics = await this.getAnalytics(
            params.dateRangeStart && params.dateRangeEnd
              ? { start: params.dateRangeStart, end: params.dateRangeEnd }
              : undefined
          );
          data = [analytics];
          break;
      }

      const [exportRecord] = await db
        .insert(salesIntelligenceExports)
        .values({
          exportName: params.exportName,
          exportType: params.exportType,
          dateRangeStart: params.dateRangeStart,
          dateRangeEnd: params.dateRangeEnd,
          intentFilter: params.intentFilter,
          industryFilter: params.industryFilter,
          recordCount: data.length,
          exportData: data,
          exportedBy: params.exportedBy,
          purpose: params.purpose,
          notes: params.notes
        })
        .returning();

      return {
        exportId: exportRecord.id,
        recordCount: data.length,
        data
      };
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to export data:", error);
      throw error;
    }
  }

  async getExportHistory(userId?: string): Promise<any[]> {
    try {
      const query = userId
        ? db.select().from(salesIntelligenceExports).where(eq(salesIntelligenceExports.exportedBy, userId))
        : db.select().from(salesIntelligenceExports);
      
      return await query.orderBy(desc(salesIntelligenceExports.createdAt)).limit(50);
    } catch (error) {
      console.error("[SalesIntelligenceAgent] Failed to get export history:", error);
      return [];
    }
  }
}

export const salesIntelligenceAgent = new SalesIntelligenceAgent();
