import { authStorage } from "../storage-auth";import { db } from '../db';
import { conversations } from '../../shared/schema';
import { eq } from 'drizzle-orm';import type { ConversationMemory, UserProfile } from "../../shared/schema";

export interface SalesFrameworkContext {
  // System brief with all methodologies
  systemBrief: string;
  
  // Current conversation insights
  conversationMemory: ConversationMemory | null;
  
  // User profile and preferences
  userProfile: UserProfile | null;
  
  // Sliding window of recent turns
  recentContext: string;
  
  // Prioritized knowledge snippets
  relevantKnowledge: string;
}

export async function buildSalesFrameworkContext(
  userId: string,
  conversationId: string,
  recentTranscript: string,
  conversationHistory: Array<{sender: string, content: string}>
): Promise<SalesFrameworkContext> {
  // Get existing memory and profile
  const [conversationMemory, userProfile] = await Promise.all([
    authStorage.getConversationMemory(conversationId),
    authStorage.getUserProfile(userId)
  ]);
  
  // Build sliding window context (last 5 exchanges)
  const recentContext = conversationHistory
    .slice(-5)
    .map(m => {
      const content = typeof m.content === 'string' ? m.content : String(m.content || '');
      return `${m.sender}: ${content.slice(0, 150)}`;
    })
    .join('\n');
  
  // System brief with ALL 6 methodologies integrated
  const systemBrief = generateSystemBrief(userProfile);
  
  // For now, relevant knowledge is limited to recent transcript
  // (This will be enhanced with knowledge base queries later)
  const relevantKnowledge = recentTranscript.slice(-1000);
  
  return {
    systemBrief,
    conversationMemory,
    userProfile,
    recentContext,
    relevantKnowledge
  };
}

function generateSystemBrief(userProfile: UserProfile | null): string {
  const style = userProfile?.conversationStyle || 'balanced';
  const methodology = userProfile?.preferredMethodology || 'hybrid';
  
  // OPTIMIZED: Condensed from 40+ lines to ~15 high-signal lines
  return `Sales coach using ${methodology} frameworks (SPIN, MEDDIC, BANT, Challenger). Style: ${style}

**CRITICAL CONTEXT** (NEVER VIOLATE):
- Prospect is EVALUATING our product - they do NOT own it yet
- BAD: "What challenges with your [product]?" (WRONG - they don't have it)
- GOOD: "What limitations with your current solution?"
- Extract ACTUAL BANT values: "$50K budget", "CTO decides", "by Q1"

FRAMEWORKS:
- SPIN: Ask about CURRENT situation, current problems, implications of inaction
- MEDDIC: Metrics, Economic Buyer, Decision Criteria/Process, Pain, Champion
- BANT: Budget amount, Authority name, Need specifics, Timeline date

Focus on their CURRENT tools and pain points to position our solution as the answer.`;
}

export async function updateConversationLearnings(
  userId: string,
  conversationId: string,
  transcript: string,
  analysis: any
): Promise<void> {
  try {
    // CRITICAL FIX: Verify conversation exists before creating memory
    // This prevents FK constraint violations
    const [conversationExists] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
      
    if (!conversationExists) {
      console.warn(`⚠️ Skipping conversation learnings: conversation ${conversationId} not found in database`);
      return;
    }
    
    const existing = await authStorage.getConversationMemory(conversationId);
    
    // Extract SPIN insights
    const spinProblems = extractProblems(transcript);
    const spinImplications = extractImplications(transcript);
    
    // Extract MEDDIC elements
    const meddicPain = extractPainPoints(analysis);
    const meddicMetrics = extractMetrics(transcript);
    
    // Extract BANT qualification
    const bantData = extractBANT(transcript, analysis);
    
    // Determine buyer stage
    const buyerStage = determineBuyerStage(transcript, analysis);
    
    // Calculate engagement score (0-100)
    const engagementScore = calculateEngagement(transcript);
    
    const updates = {
      conversationId,
      userId,
      spinProblems: spinProblems.length > 0 ? spinProblems : existing?.spinProblems || [],
      spinImplications: spinImplications.length > 0 ? spinImplications : existing?.spinImplications || [],
      meddicPain: meddicPain.length > 0 ? meddicPain : existing?.meddicPain || [],
      meddicMetrics: meddicMetrics || existing?.meddicMetrics || {},
      bantBudget: bantData.budget || existing?.bantBudget || null,
      bantAuthority: bantData.authority || existing?.bantAuthority || null,
      bantNeed: bantData.need || existing?.bantNeed || null,
      bantTimeline: bantData.timeline || existing?.bantTimeline || null,
      buyerStage: buyerStage || existing?.buyerStage || null,
      engagementScore: engagementScore || existing?.engagementScore || 0,
      keyInsights: analysis?.discoveryInsights?.painPoints || existing?.keyInsights || [],
    };
    
    if (existing) {
      await authStorage.updateConversationMemory(conversationId, updates);
    } else {
      await authStorage.createConversationMemory(updates);
    }
  } catch (error) {
    // Graceful error handling - don't break the main flow
    console.error('Error updating conversation learnings:', error);
  }
}

export async function updateUserProfileLearnings(
  userId: string,
  conversationOutcome?: 'won' | 'lost' | 'ongoing'
): Promise<void> {
  const profile = await authStorage.getUserProfile(userId);
  
  const updates: Partial<UserProfile> = {
    totalConversations: (profile?.totalConversations || 0) + 1,
  };
  
  if (profile) {
    await authStorage.updateUserProfile(userId, updates);
  } else {
    await authStorage.upsertUserProfile({
      userId,
      totalConversations: 1,
    });
  }
}

function extractProblems(transcript: string): string[] {
  const problems: string[] = [];
  const problemKeywords = ['problem', 'issue', 'challenge', 'difficulty', 'struggle', 'pain', 'frustration'];
  
  const sentences = transcript.split(/[.!?]/);
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (problemKeywords.some(kw => lowerSentence.includes(kw))) {
      const cleaned = sentence.trim();
      if (cleaned.length > 20 && cleaned.length < 200) {
        problems.push(cleaned);
      }
    }
  });
  
  return problems.slice(0, 5);
}

function extractImplications(transcript: string): string[] {
  const implications: string[] = [];
  const implicationKeywords = ['impact', 'affect', 'consequence', 'result', 'lead to', 'cause', 'means that'];
  
  const sentences = transcript.split(/[.!?]/);
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (implicationKeywords.some(kw => lowerSentence.includes(kw))) {
      const cleaned = sentence.trim();
      if (cleaned.length > 20 && cleaned.length < 200) {
        implications.push(cleaned);
      }
    }
  });
  
  return implications.slice(0, 5);
}

function extractPainPoints(analysis: any): string[] {
  if (!analysis?.discoveryInsights?.painPoints) return [];
  return analysis.discoveryInsights.painPoints.slice(0, 5);
}

function extractMetrics(transcript: string): any {
  const metrics: any = {};
  
  // Look for numbers with common business metrics
  const metricPatterns = [
    /(\d+)%\s*(growth|increase|decrease|reduction)/gi,
    /\$(\d+[kmb]?)\s*(revenue|cost|savings|budget)/gi,
    /(\d+)\s*(users|customers|employees|hours|days)/gi,
  ];
  
  metricPatterns.forEach(pattern => {
    const matches = transcript.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const key = match.toLowerCase().split(/\s+/).pop() || 'metric';
        metrics[key] = match;
      });
    }
  });
  
  return Object.keys(metrics).length > 0 ? metrics : null;
}

function extractBANT(transcript: string, analysis: any): {
  budget: string | null;
  authority: string | null;
  need: string | null;
  timeline: string | null;
} {
  // Extract ACTUAL budget value
  const budgetPatterns = [
    /\$[\d,]+(?:k|K|m|M)?/g, // $50,000 or $50K
    /(\d+(?:,\d+)?)\s*(?:dollars?|USD)/gi,
    /budget\s*(?:is|of|around|about)?\s*\$?(\d+(?:,\d+)?(?:k|K|m|M)?)/gi,
    /(\d+(?:,\d+)?(?:k|K|m|M)?)\s*(?:budget|range)/gi
  ];
  let budget: string | null = null;
  for (const pattern of budgetPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      budget = `✓ ${match[0].trim()}`;
      break;
    }
  }
  
  // Extract ACTUAL authority/decision maker
  // CRITICAL: Only match first-person statements indicating THEY have authority
  // Avoid matching rep questions like "Who is the key decision maker?"
  const authorityPatterns = [
    // Titles indicating authority (when stated by prospect, not asked about)
    /(?:I\s+am|I'm)\s+(?:the\s+)?(?:CTO|CEO|CFO|VP|Director|Manager|Head of|owner)/gi,
    // First-person decision-making statements
    /(?:I|we)\s+(?:make|approve|sign off on)\s+(?:the\s+)?(?:final\s+)?decision/gi,
    /(?:I\s+am|I'm)\s+(?:the\s+)?(?:key\s+)?decision\s*maker/gi,
    /(?:I\s+am|I'm)\s+(?:the\s+)?(?:primary|main|sole)\s+decision\s*maker/gi,
    /(?:I|we)\s+(?:will\s+)?(?:make|sign off on|approve)\s+(?:the\s+)?(?:final\s+)?(?:decision|call|choice)/gi,
    /(?:final\s+)?(?:decision|authority)\s+(?:rests|lies)\s+with\s+me/gi,
    /(?:I\s+have|I've got)\s+(?:the\s+)?(?:final\s+)?authority/gi,
    // "decision is mine" type statements
    /(?:the\s+)?decision\s+is\s+(?:mine|up to me|my call)/gi
  ];
  let authority: string | null = null;
  for (const pattern of authorityPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      authority = `✓ ${match[0].trim()}`;
      break;
    }
  }
  
  // Need - check if pain points are confirmed
  const need = analysis?.discoveryInsights?.painPoints?.length > 0
    ? '✓ Identified'
    : null;
  
  // Extract ACTUAL timeline
  const timelinePatterns = [
    /(?:by|before|within)\s+(?:Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December|\d+\s*(?:days?|weeks?|months?|quarters?))/gi,
    /(?:Q[1-4])\s*(?:20\d{2})?/gi,
    /(?:next|this)\s+(?:week|month|quarter|year)/gi,
    /(?:ASAP|immediately|urgent|as soon as possible)/gi,
    /(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:days?|weeks?|months?)/gi,
    /(?:looking\s+to|want\s+to|need\s+to|plan\s+to|planning\s+to)\s+(?:move|switch|migrate|transition|change|implement|roll\s*out)\s+(?:in|within|by)\s+(\d+)\s*(?:days?|weeks?|months?)/gi,
    /(?:move|switch|migrate|transition)\s+(?:to\s+a\s+new\s+solution\s+)?(?:in|within)\s+(\d+)\s*(?:days?|weeks?|months?)/gi,
    /(?:in|within)\s+(?:the\s+next\s+)?(\d+)\s*(?:days?|weeks?|months?)/gi,
    /(?:timeline|timeframe)\s+(?:is|of)\s+(\d+)\s*(?:days?|weeks?|months?)/gi
  ];
  let timeline: string | null = null;
  for (const pattern of timelinePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      timeline = `✓ ${match[0].trim()}`;
      break;
    }
  }
  
  return { budget, authority, need, timeline };
}

function determineBuyerStage(transcript: string, analysis: any): string | null {
  const lowerTranscript = transcript.toLowerCase();
  
  // Decision stage indicators
  if (lowerTranscript.includes('contract') || 
      lowerTranscript.includes('pricing') ||
      lowerTranscript.includes('when can we start')) {
    return 'decision';
  }
  
  // Consideration stage indicators
  if (lowerTranscript.includes('compare') || 
      lowerTranscript.includes('alternative') ||
      lowerTranscript.includes('how does it work')) {
    return 'consideration';
  }
  
  // Awareness stage (default for early conversations)
  return 'awareness';
}

function calculateEngagement(transcript: string): number {
  // Simple heuristic: longer responses = higher engagement
  const words = transcript.split(/\s+/).length;
  
  if (words > 500) return 80;
  if (words > 200) return 60;
  if (words > 100) return 40;
  return 20;
}
