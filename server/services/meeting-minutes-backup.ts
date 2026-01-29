import { db } from "../db";
import { 
  conversations, 
  messages, 
  users,
  conversationMinutesBackup,
  type ConversationMinutesBackup,
  type InsertConversationMinutesBackup
} from "@shared/schema";
import { eq, desc, and, isNull, sql } from "drizzle-orm";

interface BackupResult {
  success: boolean;
  backupId?: string;
  conversationId: string;
  error?: string;
}

interface BackupStats {
  totalConversations: number;
  successfulBackups: number;
  failedBackups: number;
  skippedBackups: number;
  results: BackupResult[];
}

export class MeetingMinutesBackupService {
  
  async backupSingleConversation(conversationId: string, source: string = "manual"): Promise<BackupResult> {
    try {
      const existingBackup = await db.select()
        .from(conversationMinutesBackup)
        .where(eq(conversationMinutesBackup.conversationId, conversationId))
        .limit(1);
      
      if (existingBackup.length > 0) {
        return {
          success: true,
          backupId: existingBackup[0].id,
          conversationId,
          error: "Already backed up"
        };
      }

      const [conversation] = await db.select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return { success: false, conversationId, error: "Conversation not found" };
      }

      const conversationMessages = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.timestamp);

      if (conversationMessages.length === 0) {
        return { success: false, conversationId, error: "No messages in conversation" };
      }

      let user = null;
      if (conversation.userId) {
        const [userData] = await db.select()
          .from(users)
          .where(eq(users.id, conversation.userId))
          .limit(1);
        user = userData;
      }

      const fullTranscript = conversationMessages
        .map(m => `[${m.speakerLabel || m.sender}]: ${m.content}`)
        .join("\n\n");

      const painPoints: string[] = [];
      const requirements: string[] = [];
      const solutions: string[] = [];
      const competitors: string[] = [];
      const objections: string[] = [];
      const actionItems: string[] = [];
      const nextStepsArr: string[] = [];
      const keyQuotes: string[] = [];
      const bestPractices: string[] = [];
      const challenges: string[] = [];

      for (const msg of conversationMessages) {
        if (msg.problemStatement) {
          painPoints.push(msg.problemStatement);
        }
        
        if (msg.discoveryQuestions && Array.isArray(msg.discoveryQuestions)) {
          requirements.push(...(msg.discoveryQuestions as string[]));
        }
        
        if (msg.solutionRecommendations && typeof msg.solutionRecommendations === 'object') {
          const solRecs = msg.solutionRecommendations as any;
          if (Array.isArray(solRecs)) {
            solutions.push(...solRecs.map((s: any) => typeof s === 'string' ? s : JSON.stringify(s)));
          }
        }
        
        if (msg.recommendedSolutions && Array.isArray(msg.recommendedSolutions)) {
          solutions.push(...(msg.recommendedSolutions as any[]).map((s: any) => 
            typeof s === 'string' ? s : s.solution || JSON.stringify(s)
          ));
        }
        
        if (msg.competitorAnalysis && typeof msg.competitorAnalysis === 'object') {
          const compAnalysis = msg.competitorAnalysis as any;
          if (compAnalysis.competitors && Array.isArray(compAnalysis.competitors)) {
            competitors.push(...compAnalysis.competitors);
          }
        }
        
        if (msg.nextSteps && Array.isArray(msg.nextSteps)) {
          nextStepsArr.push(...(msg.nextSteps as string[]));
        }
        
        if (msg.caseStudies && Array.isArray(msg.caseStudies)) {
          bestPractices.push(...(msg.caseStudies as any[]).map((cs: any) => 
            typeof cs === 'string' ? cs : cs.title || JSON.stringify(cs)
          ));
        }

        if (msg.content && msg.content.length > 50 && msg.content.length < 300) {
          if (msg.sender !== 'assistant' && !msg.content.startsWith('[')) {
            keyQuotes.push(msg.content);
          }
        }
      }

      const discoveryInsights = conversation.discoveryInsights as any || {};
      
      const backupData: InsertConversationMinutesBackup = {
        conversationId: conversation.id,
        userId: conversation.userId || undefined,
        clientName: conversation.clientName || undefined,
        companyName: discoveryInsights.companyName || undefined,
        industry: discoveryInsights.industry || undefined,
        meetingDate: conversation.createdAt || undefined,
        meetingDuration: conversation.endedAt && conversation.createdAt 
          ? Math.round((new Date(conversation.endedAt).getTime() - new Date(conversation.createdAt).getTime()) / 60000)
          : undefined,
        executiveSummary: conversation.callSummary || undefined,
        keyTopicsDiscussed: discoveryInsights.topics || [],
        clientPainPoints: Array.from(new Set(painPoints)).slice(0, 10),
        clientRequirements: Array.from(new Set(requirements)).slice(0, 10),
        solutionsProposed: Array.from(new Set(solutions)).slice(0, 10),
        competitorsDiscussed: Array.from(new Set(competitors)).slice(0, 5),
        objections: Array.from(new Set(objections)).slice(0, 10),
        actionItems: Array.from(new Set(actionItems)).slice(0, 10),
        nextSteps: Array.from(new Set(nextStepsArr)).slice(0, 10),
        fullTranscript,
        messageCount: conversationMessages.length,
        keyQuotes: Array.from(new Set(keyQuotes)).slice(0, 5),
        marketingHooks: this.extractMarketingHooks(painPoints, solutions),
        bestPractices: Array.from(new Set(bestPractices)).slice(0, 5),
        challengesIdentified: Array.from(new Set(challenges)).slice(0, 5),
        successIndicators: this.extractSuccessIndicators(conversation, conversationMessages),
        rawMinutesData: {
          conversationStatus: conversation.status,
          totalMessages: conversationMessages.length,
          speakerCount: new Set(conversationMessages.map(m => m.speakerLabel || m.sender)).size,
        },
        discoveryInsights: discoveryInsights,
        backupStatus: "completed",
        backupSource: source,
      };

      const [insertedBackup] = await db.insert(conversationMinutesBackup)
        .values(backupData)
        .returning();

      return {
        success: true,
        backupId: insertedBackup.id,
        conversationId,
      };
    } catch (error: any) {
      console.error(`Error backing up conversation ${conversationId}:`, error);
      return {
        success: false,
        conversationId,
        error: error.message || "Unknown error",
      };
    }
  }

  async backupAllConversations(source: string = "scheduled"): Promise<BackupStats> {
    const stats: BackupStats = {
      totalConversations: 0,
      successfulBackups: 0,
      failedBackups: 0,
      skippedBackups: 0,
      results: [],
    };

    try {
      const allConversations = await db.select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.status, "ended"));

      stats.totalConversations = allConversations.length;

      for (const conv of allConversations) {
        const result = await this.backupSingleConversation(conv.id, source);
        stats.results.push(result);
        
        if (result.success) {
          if (result.error === "Already backed up") {
            stats.skippedBackups++;
          } else {
            stats.successfulBackups++;
          }
        } else {
          stats.failedBackups++;
        }
      }

      console.log(`📦 Backup completed: ${stats.successfulBackups} new, ${stats.skippedBackups} skipped, ${stats.failedBackups} failed`);
      return stats;
    } catch (error: any) {
      console.error("Error in bulk backup:", error);
      throw error;
    }
  }

  async getBackupStats(): Promise<{
    totalBackups: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recentBackups: ConversationMinutesBackup[];
  }> {
    const allBackups = await db.select()
      .from(conversationMinutesBackup)
      .orderBy(desc(conversationMinutesBackup.createdAt));

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const backup of allBackups) {
      byStatus[backup.backupStatus || 'unknown'] = (byStatus[backup.backupStatus || 'unknown'] || 0) + 1;
      bySource[backup.backupSource || 'unknown'] = (bySource[backup.backupSource || 'unknown'] || 0) + 1;
    }

    return {
      totalBackups: allBackups.length,
      byStatus,
      bySource,
      recentBackups: allBackups.slice(0, 10),
    };
  }

  async getAllBackups(limit: number = 100, offset: number = 0): Promise<ConversationMinutesBackup[]> {
    return db.select()
      .from(conversationMinutesBackup)
      .orderBy(desc(conversationMinutesBackup.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBackupById(backupId: string): Promise<ConversationMinutesBackup | null> {
    const [backup] = await db.select()
      .from(conversationMinutesBackup)
      .where(eq(conversationMinutesBackup.id, backupId))
      .limit(1);
    return backup || null;
  }

  async exportToJSON(): Promise<{
    exportDate: string;
    totalRecords: number;
    backups: ConversationMinutesBackup[];
  }> {
    const allBackups = await db.select()
      .from(conversationMinutesBackup)
      .where(eq(conversationMinutesBackup.backupStatus, "completed"))
      .orderBy(desc(conversationMinutesBackup.createdAt));

    return {
      exportDate: new Date().toISOString(),
      totalRecords: allBackups.length,
      backups: allBackups,
    };
  }

  async getMarketingInsights(): Promise<{
    commonPainPoints: { painPoint: string; count: number }[];
    topSolutions: { solution: string; count: number }[];
    keyQuotes: string[];
    bestPractices: string[];
    competitorMentions: { competitor: string; count: number }[];
  }> {
    const allBackups = await db.select()
      .from(conversationMinutesBackup)
      .where(eq(conversationMinutesBackup.backupStatus, "completed"));

    const painPointCounts: Record<string, number> = {};
    const solutionCounts: Record<string, number> = {};
    const competitorCounts: Record<string, number> = {};
    const allQuotes: string[] = [];
    const allBestPractices: string[] = [];

    for (const backup of allBackups) {
      const painPoints = backup.clientPainPoints as string[] || [];
      for (const pp of painPoints) {
        painPointCounts[pp] = (painPointCounts[pp] || 0) + 1;
      }

      const solutions = backup.solutionsProposed as string[] || [];
      for (const sol of solutions) {
        solutionCounts[sol] = (solutionCounts[sol] || 0) + 1;
      }

      const competitors = backup.competitorsDiscussed as string[] || [];
      for (const comp of competitors) {
        competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
      }

      const quotes = backup.keyQuotes as string[] || [];
      allQuotes.push(...quotes);

      const practices = backup.bestPractices as string[] || [];
      allBestPractices.push(...practices);
    }

    return {
      commonPainPoints: Object.entries(painPointCounts)
        .map(([painPoint, count]) => ({ painPoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      topSolutions: Object.entries(solutionCounts)
        .map(([solution, count]) => ({ solution, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      keyQuotes: Array.from(new Set(allQuotes)).slice(0, 50),
      bestPractices: Array.from(new Set(allBestPractices)).slice(0, 20),
      competitorMentions: Object.entries(competitorCounts)
        .map(([competitor, count]) => ({ competitor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }

  private extractMarketingHooks(painPoints: string[], solutions: string[]): string[] {
    const hooks: string[] = [];
    
    for (let i = 0; i < Math.min(painPoints.length, solutions.length, 3); i++) {
      if (painPoints[i] && solutions[i]) {
        hooks.push(`Challenge: ${painPoints[i]} → Solution: ${solutions[i]}`);
      }
    }
    
    return hooks;
  }

  private extractSuccessIndicators(conversation: any, messages: any[]): string[] {
    const indicators: string[] = [];
    
    if (conversation.status === "ended" && conversation.callSummary) {
      indicators.push("Conversation completed with summary");
    }
    
    if (messages.length > 10) {
      indicators.push("Extended engagement (10+ messages)");
    }
    
    const hasNextSteps = messages.some(m => m.nextSteps && (m.nextSteps as any[]).length > 0);
    if (hasNextSteps) {
      indicators.push("Clear next steps identified");
    }
    
    return indicators;
  }
}

export const meetingMinutesBackupService = new MeetingMinutesBackupService();
