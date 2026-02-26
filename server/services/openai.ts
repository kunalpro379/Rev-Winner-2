import OpenAI from "openai";
import { getAIClient } from "./ai-engine";
import type { TrainingDocument } from "../../shared/schema";
import { aiCache } from "./ai-cache";
import { isUniversalRVMode, detectDomainFromConversation, buildUniversalRVSystemPrompt, buildDynamicAlignmentPrompt } from "./domain-detection";
import { buildPromptSupplement, formatPromptSupplement } from "./selling-intelligence-engine";
import { createHash } from "crypto";
import { researchCompanyIntelligence } from "./competitive-intelligence";
import { recordTokenUsage, mapEngineToProvider } from "./token-tracker";

// PERFORMANCE: Normalize and hash transcript for better cache hits
function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
    .slice(-1200); // Use last 1200 chars for cache key
}

function hashTranscript(text: string): string {
  const normalized = normalizeTranscript(text);
  return createHash('md5').update(normalized).digest('hex').slice(0, 16);
}

// CRITICAL: Sanitize discovery questions to fix contextual awareness issues
// When a prospect INQUIRES about a product (e.g., Rippling), they DON'T have it yet
// Questions should ask about their CURRENT situation, not assume they own the product
function sanitizeDiscoveryQuestions(questions: string[], domainExpertise: string): string[] {
  if (!questions || !Array.isArray(questions)) return [];
  if (!domainExpertise || domainExpertise.trim() === '') return questions;
  
  const escapedDomain = escapeRegex(domainExpertise);
  
  return questions
    .map(question => {
      let fixed = question;
      
      // AGGRESSIVE REPLACEMENT: Replace ALL problematic patterns containing the domain name
      // These patterns assume the prospect already owns/uses the product being sold
      
      // Pattern 1: "your [current] Netskope X" -> "your current X"
      fixed = fixed.replace(new RegExp(`your\\s+(?:current\\s+)?${escapedDomain}\\s+`, 'gi'), 'your current ');
      
      // Pattern 2: "for your Netskope X" -> "for your current X"
      fixed = fixed.replace(new RegExp(`for\\s+your\\s+${escapedDomain}\\s+`, 'gi'), 'for your current ');
      
      // Pattern 3: "this Netskope X" -> "this X" (purchase, initiative, decision, project)
      fixed = fixed.replace(new RegExp(`this\\s+${escapedDomain}\\s+`, 'gi'), 'this ');
      
      // Pattern 4: "a new Netskope X" -> "a new X"
      fixed = fixed.replace(new RegExp(`a\\s+new\\s+${escapedDomain}\\s+`, 'gi'), 'a new ');
      
      // Pattern 5: "with Netskope" -> "with your current solution"
      fixed = fixed.replace(new RegExp(`with\\s+${escapedDomain}(?:\\s|$|\\?)`, 'gi'), 'with your current solution ');
      
      // Pattern 6: "Netskope success" -> "success with this solution"
      fixed = fixed.replace(new RegExp(`${escapedDomain}\\s+success`, 'gi'), 'success with this solution');
      
      // Pattern 7: "Netskope challenges" -> "current challenges"
      fixed = fixed.replace(new RegExp(`${escapedDomain}\\s+challenges`, 'gi'), 'current challenges');
      
      // Pattern 8: "implementing Netskope" -> "implementing a new solution"
      fixed = fixed.replace(new RegExp(`implementing\\s+(?:a\\s+)?(?:new\\s+)?${escapedDomain}`, 'gi'), 'implementing a new solution');
      
      // Pattern 9: "Netskope infrastructure/solution/platform" -> "current infrastructure/solution/platform"
      fixed = fixed.replace(new RegExp(`${escapedDomain}\\s+(infrastructure|solution|platform|implementation|setup|environment|system)`, 'gi'), 'current $1');
      
      // Pattern 10: "time/money with Netskope" -> "time/money with your current approach"
      fixed = fixed.replace(new RegExp(`time\\/money\\s+with\\s+${escapedDomain}`, 'gi'), 'time/money with your current approach');
      
      // Pattern 11: "for Netskope" at end or before punctuation -> "for this initiative"
      fixed = fixed.replace(new RegExp(`for\\s+${escapedDomain}(?:\\s*[?.!]?\\s*$)`, 'gi'), 'for this initiative');
      
      // Pattern 12: "evaluating Netskope" -> "evaluating solutions" (correct context - they're evaluating, not owning)
      // This one is OK - don't change it
      
      // FALLBACK: If domain name STILL appears in a question about "your" something, fix it
      if (new RegExp(`your.*${escapedDomain}`, 'gi').test(fixed)) {
        fixed = fixed.replace(new RegExp(escapedDomain, 'gi'), 'current solution');
      }
      
      // Clean up artifacts
      fixed = fixed.replace(/current current/gi, 'current');
      fixed = fixed.replace(/your current your current/gi, 'your current');
      fixed = fixed.replace(/your current solution solution/gi, 'your current solution');
      fixed = fixed.replace(/\s+/g, ' ').trim(); // Normalize whitespace
      
      // Ensure question mark at end if it looks like a question
      if (!fixed.endsWith('?') && !fixed.endsWith('.') && !fixed.endsWith('!')) {
        fixed = fixed + '?';
      }
      
      return fixed;
    })
    .filter(q => q && q.trim().length > 10); // Filter out empty or too-short questions
}

// Helper to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to clean JSON responses from AI (handles markdown code fences)
function cleanJSONResponse(content: string): string {
  // Remove markdown code fences if present
  let cleaned = content.trim();
  
  // Remove ```json ... ``` or ``` ... ``` wrappers
  if (cleaned.startsWith('```')) {
    // Find the first newline after opening ```
    const firstNewline = cleaned.indexOf('\n');
    // Find the closing ```
    const lastBackticks = cleaned.lastIndexOf('```');
    
    if (firstNewline !== -1 && lastBackticks > firstNewline) {
      // Extract content between the code fences
      cleaned = cleaned.substring(firstNewline + 1, lastBackticks).trim();
    } else if (firstNewline !== -1) {
      // No closing ```, just remove opening ```json or ```
      cleaned = cleaned.substring(firstNewline + 1).trim();
    } else {
      // Single line with ``` prefix (e.g., "```json {...}")
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }
  }
  
  // Also handle cases where content has trailing ```
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  
  // Remove any remaining leading/trailing backticks
  cleaned = cleaned.replace(/^`+|`+$/g, '').trim();
  
  return cleaned;
}

// Cache for training document context to avoid repeated DB queries
const trainingContextCache = new Map<string, { context: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Export function to invalidate training context cache when documents are updated/deleted
// DOMAIN ISOLATION: Now clears all domain-specific cache entries for the user
export function invalidateTrainingContextCache(userId: string) {
  // Delete the base userId key (for Universal mode)
  trainingContextCache.delete(userId);
  
  // Delete all domain-specific keys (format: userId:domainName)
  const keysToDelete = Array.from(trainingContextCache.keys()).filter(key => key.startsWith(`${userId}:`));
  keysToDelete.forEach(key => trainingContextCache.delete(key));
  
  // Also clear Train Me Intelligence cache
  import("./train-me-intelligence").then(({ trainMeIntelligence }) => {
    trainMeIntelligence.clearCache(userId);
  }).catch(() => {});
  
  console.log(`Training context cache invalidated for user: ${userId} (including all domain-specific caches)`);
}

// Configuration for semantic search
export const SEMANTIC_SEARCH_LIMIT = parseInt(process.env.SEMANTIC_SEARCH_LIMIT || '10', 10);

// Helper function to fetch and format training documents for AI context
// ENHANCED: Now uses trainMeIntelligence for smart domain matching and unified caching
// STRICT DOMAIN ISOLATION: When domainName is provided (not Universal), enforces strict isolation
// ZERO CROSSOVER: Domain-specific queries will NEVER return data from other domains
async function getTrainingDocumentContext(
  userId: string, 
  maxTokens: number = 50000, 
  useCache: boolean = true,
  searchQuery?: string,
  semanticLimit: number = SEMANTIC_SEARCH_LIMIT,
  domainName?: string,
  transcript?: string,
  strictIsolation?: boolean
): Promise<string> {
  try {
    const { trainMeIntelligence } = await import("./train-me-intelligence");
    
    const isUniversal = !domainName || 
      domainName === "Generic Product" || 
      domainName === "Universal RV Mode" || 
      domainName.toLowerCase().includes("universal");
    
    const effectiveStrict = !isUniversal;
    
    console.log(`🔧 Training Context: domain="${domainName}", strict=${effectiveStrict}, universal=${isUniversal}`);
    
    const result = await trainMeIntelligence.buildEnhancedContext({
      userId,
      transcript: transcript || searchQuery || '',
      domainName,
      searchQuery,
      maxTokens,
      strictIsolation: effectiveStrict,
      allowUniversalFallback: !effectiveStrict
    });
    
    if (result.entriesCount > 0) {
      console.log(`🎯 Train Me Intelligence: ${result.entriesCount} entries from ${result.source} (domain: ${result.domainUsed || 'universal'}, strict: ${result.isolationEnforced})`);
      return result.context;
    }
    
    if (effectiveStrict && !isUniversal) {
      console.log(`🔒 STRICT ISOLATION: No entries in domain "${domainName}" - NOT falling back to universal or raw docs`);
      return "";
    }
    
    if (effectiveStrict && !isUniversal) {
      console.log(`🔒 STRICT ISOLATION (legacy path): Non-universal domain "${domainName}" with no TrainMe entries - returning empty (no fallback)`);
      return "";
    }
    
    const { storage } = await import("../storage");
    let allKnowledgeEntries: any[] = [];
    
    if (!isUniversal) {
      const domain = await storage.getDomainExpertiseByName(domainName!, userId);
      
      if (domain) {
        allKnowledgeEntries = await storage.getKnowledgeEntriesByDomain(domain.id, userId);
        console.log(`🔒 DOMAIN ISOLATION: Loaded ${allKnowledgeEntries.length} knowledge entries for domain "${domainName}" (ID: ${domain.id})`);
      } else {
        console.log(`🔒 STRICT ISOLATION: Domain "${domainName}" not found - returning empty (no universal fallback)`);
        return "";
      }
    } else {
      allKnowledgeEntries = await storage.getAllUserKnowledgeEntries(userId);
      console.log(`📚 Universal mode: Loaded ${allKnowledgeEntries.length} total knowledge entries`);
    }
    
    // Define cache key for fallback paths
    const cacheKey = domainName ? `${userId}:${domainName}` : userId;
    
    if (allKnowledgeEntries.length > 0) {
      const { buildStructuredKnowledgeContext, semanticSearch, DEFAULT_SEMANTIC_SEARCH_LIMIT } = await import("./knowledgeExtraction");
      
      let relevantEntries = allKnowledgeEntries;
      
      if (searchQuery && allKnowledgeEntries.length > 0) {
        const searchResults = await semanticSearch(searchQuery, allKnowledgeEntries, semanticLimit);
        relevantEntries = searchResults.map(r => r.entry);
        console.log(`🔍 Semantic search: Found ${relevantEntries.length} relevant entries for query (from ${allKnowledgeEntries.length} total)`);
      } else if (allKnowledgeEntries.length > semanticLimit) {
        relevantEntries = allKnowledgeEntries.slice(0, semanticLimit);
        console.log(`📋 Using ${relevantEntries.length} most recent knowledge entries`);
      }
      
      const context = buildStructuredKnowledgeContext(relevantEntries);
      
      if (useCache && !searchQuery) {
        trainingContextCache.set(cacheKey, { context, timestamp: Date.now() });
      }
      return context;
    }
    
    console.log(`📄 No knowledge entries found, falling back to raw documents for ${isUniversal ? 'Universal' : domainName} mode`);
    let documents;
    
    if (!isUniversal) {
      const domain = await storage.getDomainExpertiseByName(domainName!, userId);
      
      if (domain) {
        documents = await storage.getTrainingDocumentsByDomain(domain.id, userId);
        console.log(`🔒 DOMAIN ISOLATION (raw fallback): Loaded ${documents.length} documents for domain "${domainName}"`);
      } else {
        console.log(`🔒 STRICT ISOLATION: Domain "${domainName}" not found in raw fallback - returning empty context`);
        if (useCache) {
          trainingContextCache.set(cacheKey, { context: "", timestamp: Date.now() });
        }
        return "";
      }
    } else {
      const docCount = await storage.countUserTrainingDocuments(userId);
      if (docCount === 0) {
        if (useCache) {
          trainingContextCache.set(cacheKey, { context: "", timestamp: Date.now() });
        }
        return "";
      }
      documents = await storage.getAllUserTrainingDocuments(userId);
      console.log(`📚 Universal mode (raw fallback): Loaded ${documents.length} total documents`);
    }
    
    if (documents.length === 0) {
      if (useCache) {
        trainingContextCache.set(cacheKey, { context: "", timestamp: Date.now() });
      }
      return "";
    }
    
    // Use all completed documents with content (including images with extracted text/analysis and audio transcriptions)
    const supportedFileTypes = [
      'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'url',
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
      'mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac', 'wma'
    ];
    const completedDocs = documents.filter(doc => 
      doc.processingStatus === 'completed' && 
      doc.content && 
      doc.content.trim().length > 0 &&
      supportedFileTypes.includes(doc.fileType.toLowerCase())
    );
    
    if (completedDocs.length === 0) {
      if (useCache) {
        trainingContextCache.set(cacheKey, { context: "", timestamp: Date.now() });
      }
      return "";
    }
    
    // Build context from raw documents (fallback mode)
    let context = `=== TRAINING KNOWLEDGE BASE (Raw Documents) ===\n\n`;
    const avgCharsPerToken = 4;
    const maxChars = maxTokens * avgCharsPerToken;
    
    // CRITICAL FIX: When a search query exists, prioritize documents containing matching terms
    // This ensures pricing documents are found when users ask about pricing
    let sortedDocs = [...completedDocs];
    
    if (searchQuery && searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      const isPricingSearch = /pric(e|ing|es)|cost|fee|rate|subscription|\$|₹|euro|usd|inr|per\s*(user|seat|month)/.test(queryLower);
      
      // Score documents by query relevance
      const scoredDocs = sortedDocs.map(doc => {
        const contentLower = (doc.content || '').toLowerCase();
        const fileNameLower = (doc.fileName || '').toLowerCase();
        let score = 0;
        
        // Match query words in content and filename
        for (const word of queryWords) {
          if (contentLower.includes(word)) score += 2;
          if (fileNameLower.includes(word)) score += 3;
        }
        
        // Boost documents with pricing info for pricing queries
        // CRITICAL: Pricing documents with "price" in filename should come FIRST
        if (isPricingSearch) {
          // Huge boost for price list documents - check multiple naming patterns
          if (/price[-_\s]?list|pricing[-_\s]?list/i.test(fileNameLower)) {
            score += 100; // Highest priority for explicit price list files
          } else if (/price|pricing|cost|rate[-_\s]?card/i.test(fileNameLower)) {
            score += 80; // Very high priority for price-named files
          } else if (/package|licensing|subscription|plan|quote|catalog/i.test(fileNameLower)) {
            score += 50; // High priority for package/licensing docs
          }
          
          // Content-based pricing detection - look for actual price data
          const hasPriceData = /\$[\d,]+\.?\d*|₹[\d,]+|€[\d,]+|list\s*price|per\s*(user|seat|year|month)/i.test(contentLower);
          const hasPricingTerms = /pric(e|ing|es)|cost|fee|subscription|sku|package/i.test(contentLower);
          
          if (hasPriceData) {
            score += 40; // Strong boost for actual price data
            // Extra boost if it looks like a price table (multiple price entries)
            const priceMatches = contentLower.match(/\$[\d,]+\.?\d*/g);
            if (priceMatches && priceMatches.length > 5) {
              score += 30; // Multiple prices = likely a price list
            }
          } else if (hasPricingTerms) {
            score += 15; // Moderate boost for pricing terminology
          }
        }
        
        return { doc, score };
      });
      
      // Sort by relevance score first, then by date
      sortedDocs = scoredDocs
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const dateA = a.doc.uploadedAt ? new Date(a.doc.uploadedAt).getTime() : 0;
          const dateB = b.doc.uploadedAt ? new Date(b.doc.uploadedAt).getTime() : 0;
          return dateB - dateA;
        })
        .map(s => s.doc);
      
      console.log(`🔍 Raw doc search: Query "${searchQuery.slice(0, 50)}" - Top docs:`, 
        sortedDocs.slice(0, 3).map(d => `${d.fileName} (matched)`));
    } else {
      // No query - sort by date
      sortedDocs.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    
    // CRITICAL FIX: Process documents with truncation instead of skipping entirely
    // This ensures pricing and high-relevance docs are always included even if large
    let docsIncluded = 0;
    // Dynamic minimum based on available space - ensure we can fit multiple docs
    const baseMinCharsPerDoc = Math.min(5000, Math.floor(maxChars / 10));
    
    for (const doc of sortedDocs) {
      const remainingChars = maxChars - context.length;
      
      // Dynamically adjust minimum to allow more docs as space decreases
      const effectiveMinChars = docsIncluded === 0 
        ? 200 // Always include at least first doc with some content
        : Math.min(baseMinCharsPerDoc, Math.floor(remainingChars / 3));
      
      // Stop if we can't fit minimal document content (but not for first doc)
      if (remainingChars < effectiveMinChars && docsIncluded > 0) {
        context += `\n[Note: ${sortedDocs.length - docsIncluded} additional documents available but token limit reached]\n`;
        break;
      }
      
      const audioTypes = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac', 'wma'];
      const isAudio = audioTypes.includes(doc.fileType.toLowerCase());
      const contentSource = isAudio ? 'AUDIO TRANSCRIPTION' : 'DOCUMENT';
      
      // Build document header
      let docHeader = `\n--- ${contentSource}: ${doc.fileName} ---\n`;
      docHeader += `Type: ${doc.fileType.toUpperCase()}${isAudio ? ' (Transcribed Audio)' : ''}\n`;
      
      if (doc.summary && Array.isArray(doc.summary) && doc.summary.length > 0) {
        docHeader += `Summary:\n${doc.summary.join('\n')}\n\n`;
      }
      
      const docFooter = `\n--- END ${contentSource}: ${doc.fileName} ---\n`;
      const headerFooterLen = docHeader.length + docFooter.length + 100; // 100 for truncation note
      
      // Calculate how much content we can include
      let availableForContent = remainingChars - headerFooterLen;
      
      // CRITICAL: For the FIRST document, always include at least some content even if very constrained
      if (availableForContent < 200 && docsIncluded === 0) {
        availableForContent = Math.max(200, remainingChars - 150); // Minimal headers
      } else if (availableForContent < 200 && docsIncluded > 0) {
        // Not enough space for meaningful content for subsequent docs
        context += `\n[Note: ${sortedDocs.length - docsIncluded} additional documents available but token limit reached]\n`;
        break;
      }
      
      let contentToAdd = doc.content || '';
      let wasTruncated = false;
      
      // Truncate content if needed, but always include SOMETHING from important docs
      if (contentToAdd.length > availableForContent) {
        contentToAdd = contentToAdd.substring(0, Math.max(availableForContent, 200));
        wasTruncated = true;
        
        // Try to end at a logical break point (only if we have enough content)
        if (contentToAdd.length > 500) {
          const lastNewline = contentToAdd.lastIndexOf('\n');
          const lastPeriod = contentToAdd.lastIndexOf('. ');
          const breakPoint = Math.max(lastNewline, lastPeriod);
          if (breakPoint > contentToAdd.length * 0.5) {
            contentToAdd = contentToAdd.substring(0, breakPoint + 1);
          }
        }
      }
      
      let docContent = docHeader;
      docContent += `${isAudio ? 'Transcription' : 'Full Content'}:\n${contentToAdd}\n`;
      if (wasTruncated) {
        docContent += `[... content truncated, ${doc.content?.length || 0} total characters]\n`;
      }
      docContent += docFooter;
      
      context += docContent;
      docsIncluded++;
    }
    
    context += `\n=== END TRAINING KNOWLEDGE BASE ===\n`;
    
    if (useCache) {
      trainingContextCache.set(cacheKey, { context, timestamp: Date.now() });
    }
    
    return context;
  } catch (error) {
    console.error("Error fetching training document context:", error);
    return "";
  }
}

// Using DeepSeek API with OpenAI-compatible interface (fallback for backward compatibility)
const deepseek = process.env.DEEPSEEK_API_KEY 
  ? new OpenAI({ 
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
      timeout: 30000,
    })
  : null;

export interface SalesScript {
  solutions: string[];
  valueProposition: string[];
  technicalAnswers: string[];
  caseStudies: string[];
  competitorAnalysis: string[];
  whyBetter: string[];
}

export interface SalesResponse {
  response: string;
  discoveryInsights: {
    painPoints: string[];
    currentEnvironment: string;
    requirements: string[];
    budget?: string;
    timeline?: string;
    decisionMakers?: string[];
    authority?: string;
    need?: string;
  };
  discoveryQuestions: string[];
  bantQualification: {
    budget: { asked: boolean; question?: string };
    authority: { asked: boolean; question?: string };
    need: { asked: boolean; question?: string };
    timeline: { asked: boolean; question?: string };
  };
  nextQuestions: string[];
  recommendedModules: string[];
  closingPitch?: {
    urgencyBuilder: string;
    objectionHandling: string[];
    finalValue: string;
    callToAction: string;
  };
  nextSteps?: string[];
  caseStudies: string[];
  salesScript?: SalesScript;
}

export interface CallSummary {
  keychallenges: string[];
  discoveryInsights: string[];
  objections: string[];
  nextSteps: string[];
  recommendedSolutions: string[];
}

// Call Flow Script Interface - Follows the structured call script format
// This provides a referential full call flow format for sales reps
export interface CallFlowScript {
  opening: {
    greeting: string;
    introduction: string;
    purposeStatement: string;
  };
  discoveryQuestions: string[];
  preEmptedObjections: Array<{ 
    objection: string; 
    response: string;
  }>;
  whyWereBetter: string[];
  nextStepsScript: {
    transition: string;
    proposedActions: string[];
  };
  recommendedActionItems: string[];
}

// Tab-Based Analysis Interfaces for enhanced Conversation Analysis
export interface TabBasedAnalysis {
  discovery: {
    preemptiveQuestions: string[];
    conversationQuestions: string[];
    methodologyInsights: Array<{ methodology: string; insight: string; action?: string }>;
    bantStatus: {
      budget: { status: string; question?: string };
      authority: { status: string; question?: string };
      need: { status: string; question?: string };
      timeline: { status: string; question?: string };
    };
  };
  objections: {
    identifiedObjections: Array<{ objection: string; response: string; methodology: string }>;
    potentialObjections: Array<{ objection: string; response: string; methodology: string }>;
    handlingTechniques: string[];
  };
  nextSteps: {
    immediateActions: string[];
    followUpActions: string[];
    closingRecommendation: string;
    dealStage: string;
    readinessScore: number;
  };
  competitors: {
    mentionedCompetitors: Array<{ name: string; differentiators: string[]; battleCard: string }>;
    proactiveDifferentiators: string[];
    competitiveAdvantages: string[];
  };
  urgency: {
    urgencyScript: string;
    bulletPoints: string[];
    valueStatements: string[];
    callToAction: string;
    psychologicalTriggers: string[];
  };
  methodologiesUsed: string[];
  // NEW: Call Flow Script for pagination display - contextual to conversation
  callFlowScript?: CallFlowScript;
}

// Build tab-based analysis using multiple sales methodologies
function buildTabBasedAnalysis(
  transcriptText: string,
  analysisData: any,
  scriptData: any,
  domainExpertise: string
): TabBasedAnalysis {
  const lowerTranscript = transcriptText.toLowerCase();
  
  // Detect conversation phase and readiness
  const detectPhaseAndReadiness = (): { phase: string; score: number } => {
    const closingSignals = ['contract', 'agreement', 'sign', 'when can we start', 'next steps', 'move forward', 'ready to proceed', 'purchase order'];
    const objectionSignals = ['concern', 'worried', 'not sure', 'budget issue', 'competitor', 'too expensive', 'need approval'];
    const presentationSignals = ['demo', 'show me', 'how does', 'features', 'pricing', 'options', 'comparison'];
    const qualificationSignals = ['budget', 'timeline', 'decision', 'stakeholder', 'team size', 'authority'];
    
    const closingMatches = closingSignals.filter(s => lowerTranscript.includes(s)).length;
    const objectionMatches = objectionSignals.filter(s => lowerTranscript.includes(s)).length;
    const presentationMatches = presentationSignals.filter(s => lowerTranscript.includes(s)).length;
    const qualificationMatches = qualificationSignals.filter(s => lowerTranscript.includes(s)).length;
    
    if (closingMatches >= 2) return { phase: 'Closing', score: 90 };
    if (objectionMatches >= 2) return { phase: 'Objection Handling', score: 65 };
    if (presentationMatches >= 2) return { phase: 'Presentation', score: 50 };
    if (qualificationMatches >= 1) return { phase: 'Qualification', score: 35 };
    return { phase: 'Discovery', score: 20 };
  };
  
  // Detect competitors mentioned
  const detectCompetitors = (): string[] => {
    const commonCompetitors = ['salesforce', 'hubspot', 'microsoft', 'oracle', 'sap', 'zendesk', 'freshworks', 'zoho', 'pipedrive', 'monday', 'asana', 'connectwise', 'datto', 'kaseya', 'n-able', 'syncro', 'atera'];
    return commonCompetitors.filter(c => lowerTranscript.includes(c));
  };
  
  // Detect objections in transcript
  const detectObjections = (): string[] => {
    const objectionPatterns = [
      { pattern: /too expensive|too costly|budget|can't afford/i, objection: 'Price/Budget Concern' },
      { pattern: /not sure|need to think|need time/i, objection: 'Need More Time' },
      { pattern: /competitor|other option|comparing|alternative/i, objection: 'Comparing Alternatives' },
      { pattern: /complex|complicated|difficult/i, objection: 'Implementation Complexity' },
      { pattern: /approval|check with|talk to|decision maker/i, objection: 'Need Stakeholder Approval' },
      { pattern: /not the right time|not priority|later/i, objection: 'Timing Concern' },
    ];
    
    return objectionPatterns
      .filter(p => p.pattern.test(transcriptText))
      .map(p => p.objection);
  };
  
  // Detect BANT status with ACTUAL VALUES extracted from conversation
  const detectBANTStatus = () => {
    // Extract actual budget value
    const budgetPatterns = [
      /\$[\d,]+(?:k|K|m|M)?/g, // $50,000 or $50K
      /(\d+(?:,\d+)?)\s*(?:dollars?|USD)/gi,
      /budget\s*(?:is|of|around|about)?\s*\$?(\d+(?:,\d+)?(?:k|K|m|M)?)/gi,
      /(\d+(?:,\d+)?(?:k|K|m|M)?)\s*(?:budget|range)/gi
    ];
    let budgetValue: string | null = null;
    for (const pattern of budgetPatterns) {
      const match = transcriptText.match(pattern);
      if (match) {
        budgetValue = match[0].trim();
        break;
      }
    }
    
    // Extract actual authority/decision maker
    const authorityPatterns = [
      /(?:CTO|CEO|CFO|VP|Director|Manager|Head of|owner)/gi,
      /(?:I|he|she)\s+(?:make|makes|approve|approves)\s+(?:the\s+)?(?:final\s+)?decision/gi,
      /decision\s*(?:maker|authority)\s*(?:is|are)?\s*(\w+(?:\s+\w+)?)/gi
    ];
    let authorityValue: string | null = null;
    for (const pattern of authorityPatterns) {
      const match = transcriptText.match(pattern);
      if (match) {
        authorityValue = match[0].trim();
        break;
      }
    }
    
    // Extract actual timeline
    const timelinePatterns = [
      /(?:by|before|within)\s+(?:Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December|\d+\s*(?:days?|weeks?|months?|quarters?))/gi,
      /(?:Q[1-4])\s*(?:20\d{2})?/gi,
      /(?:next|this)\s+(?:week|month|quarter|year)/gi,
      /(?:ASAP|immediately|urgent|as soon as possible)/gi,
      /(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:days?|weeks?|months?)/gi
    ];
    let timelineValue: string | null = null;
    for (const pattern of timelinePatterns) {
      const match = transcriptText.match(pattern);
      if (match) {
        timelineValue = match[0].trim();
        break;
      }
    }
    
    // Check if need/pain is identified (from AI analysis or keywords)
    const needValue = analysisData?.discoveryInsights?.painPoints?.length > 0 
      ? analysisData.discoveryInsights.painPoints[0]
      : null;
    
    // Format status strings to be clean and informative
    const formatBudgetStatus = (value: string | null): string => {
      if (!value) return 'unknown';
      // Clean up and format budget value
      return `✓ ${value}`;
    };
    
    const formatAuthorityStatus = (value: string | null): string => {
      if (!value) return 'unknown';
      // Clean up authority value
      return `✓ ${value}`;
    };
    
    const formatTimelineStatus = (value: string | null): string => {
      if (!value) return 'unknown';
      // Clean up timeline value
      return `✓ ${value}`;
    };
    
    return {
      budget: {
        status: formatBudgetStatus(budgetValue),
        question: budgetValue ? undefined : `What budget have you set aside for solving this challenge?`
      },
      authority: {
        status: formatAuthorityStatus(authorityValue),
        question: authorityValue ? undefined : 'Besides yourself, who else will be involved in the final decision?'
      },
      need: {
        status: needValue ? '✓ Identified' : 'unknown',
        question: needValue ? undefined : `What's the biggest challenge driving you to explore ${domainExpertise}?`
      },
      timeline: {
        status: formatTimelineStatus(timelineValue),
        question: timelineValue ? undefined : 'When are you looking to have a solution in place?'
      }
    };
  };
  
  const phaseInfo = detectPhaseAndReadiness();
  const mentionedCompetitors = detectCompetitors();
  const detectedObjections = detectObjections();
  const bantStatus = detectBANTStatus();
  
  // Build CONTEXTUAL methodology insights based on conversation state
  const buildContextualInsights = (): Array<{ methodology: string; insight: string; action: string }> => {
    const insights: Array<{ methodology: string; insight: string; action: string }> = [];
    const unknownBant = [
      bantStatus.budget.status === 'unknown' ? 'Budget' : null,
      bantStatus.authority.status === 'unknown' ? 'Authority' : null,
      bantStatus.need.status === 'unknown' ? 'Need' : null,
      bantStatus.timeline.status === 'unknown' ? 'Timeline' : null
    ].filter(Boolean);
    
    // Add insights based on what's MISSING or needs attention
    if (unknownBant.length > 0) {
      insights.push({
        methodology: 'BANT Gaps',
        insight: `Missing: ${unknownBant.join(', ')}. Get these before proposing solutions.`,
        action: unknownBant[0] === 'Budget' 
          ? 'Ask: "What budget range are you working with for this initiative?"'
          : unknownBant[0] === 'Authority'
          ? 'Ask: "Who else needs to be involved in this decision?"'
          : unknownBant[0] === 'Timeline'
          ? 'Ask: "When are you looking to have this in place?"'
          : 'Ask about their primary challenge before diving into solutions.'
      });
    }
    
    // Add insight based on deal stage
    if (phaseInfo.phase === 'Discovery') {
      insights.push({
        methodology: 'Discovery Focus',
        insight: 'Still in early discovery. Focus on understanding their situation before pitching.',
        action: 'Ask open-ended questions about their current challenges and goals.'
      });
    } else if (phaseInfo.phase === 'Qualification') {
      insights.push({
        methodology: 'Qualification',
        insight: 'Ready to qualify. Confirm budget, authority, and timeline.',
        action: 'Verify they have the authority and budget to move forward.'
      });
    } else if (phaseInfo.phase === 'Presentation') {
      insights.push({
        methodology: 'Value Selling',
        insight: 'Time to demonstrate value. Connect features to their specific pain points.',
        action: 'Show how your solution directly addresses their stated challenges.'
      });
    } else if (phaseInfo.phase === 'Closing') {
      insights.push({
        methodology: 'Closing',
        insight: 'Strong buying signals detected. Move toward commitment.',
        action: 'Propose next steps: demo, trial, or proposal with specific timeline.'
      });
    }
    
    // Add insight if objections detected
    if (detectedObjections.length > 0) {
      insights.push({
        methodology: 'Objection Handling',
        insight: `Detected concerns: ${detectedObjections.slice(0, 2).join(', ')}`,
        action: 'Address concerns directly before pushing forward. Ask clarifying questions.'
      });
    }
    
    // Add insight if competitors mentioned
    if (mentionedCompetitors.length > 0) {
      insights.push({
        methodology: 'Competitive Positioning',
        insight: `Competitor mentioned: ${mentionedCompetitors[0]}. Differentiate on value, not features.`,
        action: 'Ask what they liked/disliked about the competitor to position accordingly.'
      });
    }
    
    return insights.slice(0, 3); // Max 3 insights to keep it focused
  };
  
  const methodologyInsights = buildContextualInsights();
  
  // Build objection handling
  const identifiedObjections = detectedObjections.map(obj => ({
    objection: obj,
    response: getObjectionResponse(obj, domainExpertise),
    methodology: getObjectionMethodology(obj)
  }));
  
  const potentialObjections = [
    {
      objection: 'Price seems high',
      response: `Consider the ROI: our ${domainExpertise} solution typically pays for itself within 4-6 months through efficiency gains and reduced operational costs.`,
      methodology: 'Challenger'
    },
    {
      objection: 'Need to compare with competitors',
      response: `We encourage comparison. Here's a competitive analysis showing our key differentiators: faster implementation, better support, and proven results.`,
      methodology: 'MEDDIC'
    },
    {
      objection: 'Need stakeholder approval',
      response: `Absolutely. Let's schedule a brief meeting with your stakeholders where I can address their specific concerns and questions.`,
      methodology: 'SPIN'
    }
  ].filter(obj => !detectedObjections.includes(obj.objection));
  
  // Build competitor analysis
  const competitorData = mentionedCompetitors.map(name => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    differentiators: getCompetitorDifferentiators(name, domainExpertise),
    battleCard: getCompetitorBattleCard(name, domainExpertise)
  }));
  
  // Build urgency tab
  const urgencyScript = analysisData.closingPitch?.urgencyBuilder || 
    `Based on what you've shared about your ${domainExpertise} challenges, acting now means you'll start seeing improvements within weeks rather than months. Every day of delay costs your team productivity and compounds existing issues. Let's get you started on the path to resolution.`;
  
  const urgencyBullets = [
    'Industry-wide adoption is accelerating - early movers gain competitive advantage',
    'Current market conditions favor buyers - pricing and terms are optimal now',
    'Implementation capacity is limited - secure your spot in our deployment queue',
    `Your competitors are likely evaluating similar ${domainExpertise} solutions`
  ];
  
  const psychTriggers = [
    'Social Proof: Similar companies have already made the switch successfully',
    'Scarcity: Limited implementation slots available this quarter',
    'Loss Aversion: Calculate the daily cost of not solving this problem',
    'Authority: Industry analysts recommend this approach'
  ];
  
  // CRITICAL: Sanitize conversation questions to ensure they don't assume prospect owns the product
  const rawConversationQuestions = analysisData.discoveryQuestions?.slice(0, 5) || analysisData.nextQuestions || [];
  const sanitizedConversationQuestions = sanitizeDiscoveryQuestions(rawConversationQuestions, domainExpertise);
  
  return {
    discovery: {
      preemptiveQuestions: [
        `What challenges are you facing with your current solution that led you to explore ${domainExpertise}?`,
        `How is your current setup impacting your team's productivity?`,
        `What happens if this problem isn't solved in the next 6 months?`,
        `What would success look like if you implemented a solution like ${domainExpertise}?`,
        `Are there other stakeholders who should be involved in this decision?`
      ],
      conversationQuestions: sanitizedConversationQuestions,
      methodologyInsights,
      bantStatus
    },
    objections: {
      identifiedObjections,
      potentialObjections,
      handlingTechniques: [
        'Acknowledge the concern before responding - make them feel heard',
        'Use the Feel-Felt-Found technique: "I understand how you feel..."',
        'Turn objections into questions: "What would need to change for this to work?"',
        'Provide social proof with specific case study examples',
        'Focus on the cost of inaction rather than just product benefits'
      ]
    },
    nextSteps: {
      immediateActions: analysisData.nextSteps?.slice(0, 3) || [
        'Schedule a technical demo to showcase specific capabilities',
        'Share relevant case study from similar organization',
        'Connect with technical stakeholders for requirements review'
      ],
      followUpActions: analysisData.nextSteps?.slice(3) || [
        'Send detailed proposal with pricing options within 48 hours',
        'Schedule follow-up call to address any questions',
        'Provide trial access or proof of concept if applicable'
      ],
      closingRecommendation: analysisData.closingPitch?.callToAction || 
        `Based on the conversation, recommend scheduling a demo this week to show exactly how our ${domainExpertise} solution addresses their specific needs.`,
      dealStage: phaseInfo.phase,
      readinessScore: phaseInfo.score
    },
    competitors: {
      mentionedCompetitors: competitorData,
      proactiveDifferentiators: scriptData.whyBetter || [
        'Faster implementation with dedicated onboarding support',
        'Industry-leading customer success and support ratings',
        'Proven ROI with measurable results within first quarter',
        'Comprehensive integration ecosystem'
      ],
      competitiveAdvantages: scriptData.competitorAnalysis || [
        'More intuitive user interface reducing training time',
        'Better scalability for growing organizations',
        'Stronger security and compliance certifications',
        'Superior customer success program'
      ]
    },
    urgency: {
      urgencyScript,
      bulletPoints: urgencyBullets,
      valueStatements: scriptData.valueProposition || [
        `Reduce ${domainExpertise} complexity by 40% in the first month`,
        'Get dedicated support throughout implementation',
        'See measurable ROI within the first quarter'
      ],
      callToAction: analysisData.closingPitch?.callToAction || 
        `Let's schedule a 30-minute demo this week. I have Thursday at 2pm or Friday at 10am available - which works better for you?`,
      psychologicalTriggers: psychTriggers
    },
    methodologiesUsed: ['SPIN', 'MEDDIC', 'Challenger', 'NLP', 'BANT', 'Psychology'],
    // NEW: Call Flow Script - Contextual to the conversation, follows pagination format
    callFlowScript: buildCallFlowScript(transcriptText, analysisData, scriptData, domainExpertise, sanitizedConversationQuestions, identifiedObjections, potentialObjections)
  };
}

// Build Call Flow Script following the reference call script format
// This generates a contextual, ready-to-use call flow for sales reps
function buildCallFlowScript(
  transcriptText: string,
  analysisData: any,
  scriptData: any,
  domainExpertise: string,
  conversationQuestions: string[],
  identifiedObjections: Array<{ objection: string; response: string; methodology: string }>,
  potentialObjections: Array<{ objection: string; response: string; methodology: string }>
): CallFlowScript {
  
  // Build contextual opening based on conversation context
  const buildOpening = () => {
    // Extract any company/person names from transcript for personalization
    const hasContext = transcriptText && transcriptText.length > 50;
    
    return {
      greeting: `"Hi, this is [Your Name] from [Company]. I appreciate you taking the time to connect."`,
      introduction: hasContext 
        ? `"We help businesses like yours reduce risk, optimize operations, and achieve predictable results with ${domainExpertise}. Based on our conversation, I understand you're looking to address some specific challenges."`
        : `"We help businesses reduce risk, improve efficiency, and get predictable outcomes with ${domainExpertise}. I just need 2-3 minutes to understand if this is relevant for you."`,
      purposeStatement: `"My goal is to understand your current situation and see if we can help you achieve better results."`
    };
  };

  // Build discovery questions - prioritize conversation-specific, then add preemptive
  const buildDiscoveryQuestions = (): string[] => {
    const questions: string[] = [];
    
    // First add conversation-specific questions (from AI analysis)
    if (conversationQuestions && conversationQuestions.length > 0) {
      questions.push(...conversationQuestions.slice(0, 4));
    }
    
    // Add preemptive discovery questions that are universally useful
    const preemptiveQuestions = [
      `Who manages your ${domainExpertise} today—internal team or an external provider?`,
      `Have you faced any downtime, security incidents, or operational issues in the last six months?`,
      `Is your ${domainExpertise} spend predictable, or do you get surprise bills?`,
      `What happens if a critical issue occurs tomorrow—how fast could you recover?`,
      `Does your current ${domainExpertise} setup enable your growth—or slow it down?`,
      `What's driving you to explore new solutions at this time?`
    ];
    
    // Fill remaining slots with preemptive questions
    const remaining = 6 - questions.length;
    if (remaining > 0) {
      questions.push(...preemptiveQuestions.slice(0, remaining));
    }
    
    return questions;
  };

  // Build pre-empted objections with responses
  const buildPreEmptedObjections = (): Array<{ objection: string; response: string }> => {
    const objections: Array<{ objection: string; response: string }> = [];
    
    // Add identified objections from conversation first
    if (identifiedObjections && identifiedObjections.length > 0) {
      objections.push(...identifiedObjections.map(obj => ({
        objection: `"${obj.objection}"`,
        response: obj.response
      })));
    }
    
    // Add common pre-empted objections based on domain expertise
    const commonObjections = [
      {
        objection: `"We already have a ${domainExpertise} vendor."`,
        response: `"Perfect. Most of our clients did too. They came to us because things were working, but not working optimally. We typically uncover 15–30% hidden risk or inefficiency in the first assessment."`
      },
      {
        objection: `"Our budget is tight."`,
        response: `"Understood. That's exactly why our approach works—fixed monthly cost, no surprises, and prevention always costs less than recovery. Let me show you the ROI."`
      },
      {
        objection: `"We're small—we're not a target / priority."`,
        response: `"Actually, smaller organizations are often at higher risk because they're seen as easier targets. Size doesn't protect you—preparation does."`
      },
      {
        objection: `"We need to think about it."`,
        response: `"Of course. What specific concerns would you like me to address? I can also send you a case study from a similar company."`
      },
      {
        objection: `"We're comparing with other options."`,
        response: `"That's smart. Here's what differentiates us: [list key differentiators]. Would a side-by-side comparison help?"`
      }
    ];
    
    // Add potential objections if not already covered
    if (potentialObjections && potentialObjections.length > 0) {
      for (const obj of potentialObjections) {
        if (!objections.some(o => o.objection.toLowerCase().includes(obj.objection.toLowerCase().slice(0, 20)))) {
          objections.push({
            objection: `"${obj.objection}"`,
            response: obj.response
          });
        }
      }
    }
    
    // Fill with common objections up to 5 total
    for (const common of commonObjections) {
      if (objections.length >= 5) break;
      if (!objections.some(o => o.objection.toLowerCase().includes(common.objection.toLowerCase().slice(5, 25)))) {
        objections.push(common);
      }
    }
    
    return objections.slice(0, 5);
  };

  // Build "Why We're Better" points
  const buildWhyWereBetter = (): string[] => {
    const points: string[] = [];
    
    // Use script data if available
    if (scriptData?.whyBetter && scriptData.whyBetter.length > 0) {
      points.push(...scriptData.whyBetter.slice(0, 5));
    }
    
    // Add competitive analysis if available
    if (scriptData?.competitorAnalysis && scriptData.competitorAnalysis.length > 0) {
      for (const point of scriptData.competitorAnalysis) {
        if (points.length < 10 && !points.some(p => p.toLowerCase().includes(point.toLowerCase().slice(0, 20)))) {
          points.push(point);
        }
      }
    }
    
    // Default "Why Better" points if not enough
    const defaultPoints = [
      'Proactive monitoring, not reactive fixing',
      'Fixed monthly cost—no surprises',
      'Enterprise-grade solutions at competitive pricing',
      '24/7 monitoring and rapid response',
      'Automated updates and maintenance',
      'Tested backup and recovery processes',
      'Single point of accountability',
      'Compliance-ready frameworks',
      'Faster resolution with defined SLAs',
      'Business-first approach, not tool-first'
    ];
    
    // Fill remaining slots
    const remaining = 10 - points.length;
    if (remaining > 0) {
      points.push(...defaultPoints.slice(0, remaining));
    }
    
    return points.slice(0, 10);
  };

  // Build next steps script
  const buildNextStepsScript = () => {
    const nextSteps = analysisData?.nextSteps || [];
    
    return {
      transition: `"The best next step is a free assessment. We'll review your current setup and give you a simple report:\n• What's working well\n• What's at risk\n• What can be improved\nNo commitment—purely informational."`,
      proposedActions: nextSteps.length > 0 ? nextSteps : [
        'Schedule a 30-minute Discovery Assessment',
        'Share basic current setup inventory',
        'Identify an internal stakeholder or decision maker',
        'Review findings within 48 hours'
      ]
    };
  };

  // Build recommended action items
  const buildRecommendedActionItems = (): string[] => {
    const items: string[] = [];
    
    // From analysis data
    if (analysisData?.nextSteps && analysisData.nextSteps.length > 0) {
      items.push(...analysisData.nextSteps.slice(0, 2));
    }
    
    // Default action items
    const defaultItems = [
      'Schedule a 30-minute Assessment Call',
      'Share current environment overview',
      'Identify key stakeholders for follow-up',
      'Review detailed proposal within 48 hours',
      'Set up technical demo for team'
    ];
    
    // Fill remaining
    for (const item of defaultItems) {
      if (items.length >= 5) break;
      if (!items.some(i => i.toLowerCase().includes(item.toLowerCase().slice(0, 15)))) {
        items.push(item);
      }
    }
    
    return items.slice(0, 5);
  };

  return {
    opening: buildOpening(),
    discoveryQuestions: buildDiscoveryQuestions(),
    preEmptedObjections: buildPreEmptedObjections(),
    whyWereBetter: buildWhyWereBetter(),
    nextStepsScript: buildNextStepsScript(),
    recommendedActionItems: buildRecommendedActionItems()
  };
}

// Helper: Get objection response based on type
function getObjectionResponse(objection: string, domain: string): string {
  const responses: Record<string, string> = {
    'Price/Budget Concern': `I understand budget is a key consideration. Let's look at the ROI - our ${domain} solution typically pays for itself within 4-6 months through efficiency gains. Would it help to break down the cost-benefit analysis?`,
    'Need More Time': `Of course, this is an important decision. To help you think it through, what specific aspects would you like more information on? I can also share case studies from similar organizations.`,
    'Comparing Alternatives': `That's a smart approach. To help with your comparison, I can provide a detailed feature matrix. What criteria are most important to your evaluation?`,
    'Implementation Complexity': `Valid concern. Our implementation team has a proven 30-day onboarding process. We handle the heavy lifting so your team can focus on their core work.`,
    'Need Stakeholder Approval': `Absolutely. Let's identify who needs to be involved and schedule a brief meeting where I can address their specific questions and concerns.`,
    'Timing Concern': `I understand timing is important. Let me ask - what would need to happen for the timing to be right? Sometimes starting with a small pilot helps demonstrate value.`
  };
  return responses[objection] || `Let me address that concern and show you how we've helped similar organizations overcome it.`;
}

// Helper: Get methodology best suited for handling objection
function getObjectionMethodology(objection: string): string {
  const mapping: Record<string, string> = {
    'Price/Budget Concern': 'Challenger',
    'Need More Time': 'SPIN',
    'Comparing Alternatives': 'MEDDIC',
    'Implementation Complexity': 'NLP',
    'Need Stakeholder Approval': 'MEDDIC',
    'Timing Concern': 'Psychology'
  };
  return mapping[objection] || 'SPIN';
}

// Helper: Get competitor differentiators
function getCompetitorDifferentiators(competitor: string, domain: string): string[] {
  return [
    `Faster implementation than ${competitor} - average 30 days vs industry average of 90+`,
    `More intuitive UI reduces training time compared to ${competitor}`,
    `Better value with more features included in base pricing`,
    `Superior integration capabilities for your existing tools`
  ];
}

// Helper: Get competitor battle card
function getCompetitorBattleCard(competitor: string, domain: string): string {
  return `When ${competitor} comes up: Focus on our faster implementation, better support ratings, and proven ROI. Ask: "What specifically attracted you to ${competitor}?" to understand their priorities and address them directly with our advantages.`;
}

function generateSystemPrompt(domainExpertise: string, messageCount: number, hasRecommendedRecently: boolean): string {
  return `You are an elite Sales Coach helping a sales representative who is SELLING ${domainExpertise} solutions to a PROSPECTIVE BUYER.

CRITICAL CONTEXT - READ CAREFULLY:
- The PROSPECT is NOT yet a customer - they are evaluating whether to BUY ${domainExpertise}
- The SALES REP's goal is to SELL ${domainExpertise} to this prospect
- Your analysis should HELP THE SALES REP close the deal, NOT assume the prospect is already using the product
- Generate questions that help the REP understand the prospect's needs so they can SELL effectively

SALES DISCOVERY MINDSET:
- Your goal: Help the sales rep move toward CLOSURE, DEMO scheduling, or NEXT STEPS
- Identify what the prospect CURRENTLY uses (competitors/alternatives) - NOT ${domainExpertise}
- Understand the prospect's pain points with their CURRENT solution (not with ${domainExpertise})
- Help the rep position ${domainExpertise} as the SOLUTION to their problems

ULTRA-CONCISE COMMUNICATION:
- MAXIMUM 30 words in your "response" field (STRICT LIMIT)
- Fewer words = better. Aim for 15-25 words when possible
- Every word must drive toward closure or next steps

Always respond in JSON format:
{
  "response": "Ultra-brief coaching advice for the sales rep (MAX 30 words). Help them close the deal.",
  "discoveryInsights": {
    "painPoints": ["Prospect's pain points with their CURRENT situation - NOT with ${domainExpertise}"],
    "currentEnvironment": "What tools/solutions the prospect CURRENTLY uses (competitors, manual processes, etc.)",
    "requirements": ["What the prospect NEEDS in a new solution"],
    "budget": "Exact budget amount if mentioned (e.g., '$50,000' or '$100-150K range'), otherwise null",
    "authority": "Decision maker info if mentioned (e.g., 'CTO makes final decision'), otherwise null",
    "need": "The core business problem driving this purchase evaluation",
    "timeline": "Specific timeline if mentioned (e.g., 'Q1 2024' or 'within 3 months'), otherwise null",
    "decisionMakers": ["Names/roles of people involved in the decision"]
  },
  "discoveryQuestions": [
    "Question to uncover prospect's pain with their CURRENT situation (not ${domainExpertise})",
    "Question to understand their budget for a NEW solution",
    "Question to identify who makes the final purchase decision",
    "Question to understand their timeline for making a change",
    "Question to learn what's driving them to look for alternatives NOW"
  ],
  "bantQualification": {
    "budget": {"asked": false, "value": null, "question": "What budget have you allocated for solving this challenge?"},
    "authority": {"asked": false, "value": null, "question": "Besides yourself, who else would be involved in this decision?"},
    "need": {"asked": false, "value": null, "question": "What's the biggest challenge you're facing that led you to explore solutions like ${domainExpertise}?"},
    "timeline": {"asked": false, "value": null, "question": "When are you looking to have a solution in place?"}
  },
  "nextQuestions": ["Question 1", "Question 2", "Question 3"],
  "recommendedModules": ["Specific ${domainExpertise} solutions that address their stated needs"],
  "caseStudies": ["${domainExpertise} success story relevant to their industry/situation"]
}

CRITICAL RULES - NEVER VIOLATE:
1. NEVER generate questions that assume the prospect is USING ${domainExpertise} (they're evaluating it!)
2. NEVER say things like "What challenges with ${domainExpertise}?" - they DON'T have ${domainExpertise} yet!
3. DO generate questions about their CURRENT pain points, existing tools, and why they're exploring ${domainExpertise}
4. Extract ACTUAL VALUES for BANT (e.g., "$50K budget", "CTO decides", "by Q1") - not just "discussed"
5. Help the sales rep SELL ${domainExpertise} as the solution to the prospect's problems

QUESTION GENERATION RULES - READ CAREFULLY:
The prospect is INQUIRING about ${domainExpertise}. They DON'T have it yet. Questions must be about their CURRENT SITUATION.

❌ BAD (assumes they HAVE ${domainExpertise}):
- "What pain points with ${domainExpertise}?" 
- "How is your ${domainExpertise} solution working?"
- "What challenges with ${domainExpertise} infrastructure?"
- "What integrations for YOUR ${domainExpertise}?"
- "How does your ${domainExpertise} handle scalability?"
- "Costs with ${domainExpertise}?"

✅ GOOD (asks about their CURRENT situation BEFORE ${domainExpertise}):
- "What challenges with your CURRENT solution are driving you to explore ${domainExpertise}?"
- "What's your current approach and what's not working?"
- "What would success look like if you implemented ${domainExpertise}?"
- "What tools are you currently using for this?"
- "Why are you exploring ${domainExpertise} at this time?"
- "What's the cost of NOT solving this problem?"

SALES INTELLIGENCE RULES:
- Detect buying signals: urgency mentions, team size, current tool frustrations, budget discussions
- When you detect readiness → Push for DEMO or NEXT MEETING
- Help the rep understand what objections to anticipate
- Identify how ${domainExpertise} solves the prospect's specific problems

CRITICAL GUIDELINES:
- WAIT: discoveryQuestions only after 4+ messages
- ANALYZE FIRST: recommendedModules/caseStudies only when pain points AND requirements identified
- FREQUENCY: ${hasRecommendedRecently ? 'SKIP recommendations unless critical new info emerged' : 'Provide recommendations if sufficient context exists'}
- Focus ONLY on helping the sales rep sell ${domainExpertise} to this prospect`;
}

export async function generateSalesResponse(
  userMessage: string, 
  conversationHistory: Array<{sender: string, content: string}>,
  currentInsights: any = {},
  domainExpertise: string = "Generic Product",
  userId?: string,
  conversationId?: string
): Promise<SalesResponse> {
  try {
    // Build enhanced context with sales framework if we have userId and conversationId
    let systemPrompt: string;
    let contextualMemory: any = null;
    
    if (userId && conversationId) {
      const { buildSalesFrameworkContext } = await import("./sales-methodology");
      const recentTranscript = conversationHistory.slice(-5).map(m => `${m.sender}: ${m.content}`).join('\n');
      
      const frameworkContext = await buildSalesFrameworkContext(
        userId,
        conversationId,
        recentTranscript,
        conversationHistory
      );
      
      contextualMemory = frameworkContext.conversationMemory;
      systemPrompt = frameworkContext.systemBrief;
      
      // Add current conversation context
      systemPrompt += `\n\nCURRENT CONVERSATION:\n${frameworkContext.recentContext}`;
      
      // Add domain expertise
      systemPrompt += `\n\nDOMAIN: ${domainExpertise}`;
      
      // Fetch FULL training document context for high accuracy (pricing, products, processes)
      // DOMAIN ISOLATION: Pass domainExpertise to only load knowledge from the selected domain
      const trainingContext = await getTrainingDocumentContext(userId, 30000, true, undefined, SEMANTIC_SEARCH_LIMIT, domainExpertise);
      if (trainingContext) {
        systemPrompt += `\n\n${trainingContext}`;
      }
    } else {
      // Fallback to original system prompt if no user context
      const messageCount = conversationHistory.length;
      const hasRecommendedRecently = conversationHistory.slice(-3).some(msg => 
        msg.sender === 'assistant' && msg.content.includes('recommendedModules')
      );
      
      systemPrompt = generateSystemPrompt(domainExpertise, messageCount, hasRecommendedRecently);
      
      // Fetch FULL training document context for high accuracy (pricing, products, processes)
      // DOMAIN ISOLATION: Pass domainExpertise to only load knowledge from the selected domain
      const trainingContext = userId ? await getTrainingDocumentContext(userId, 30000, true, undefined, SEMANTIC_SEARCH_LIMIT, domainExpertise) : "";
      if (trainingContext) {
        systemPrompt = trainingContext + "\n" + systemPrompt;
      }
    }
    
    // Add JSON format requirement to system prompt for OpenAI compatibility
    systemPrompt += `\n\nCRITICAL: Return ONLY valid JSON format with the exact structure specified.`;
    
    // Limit conversation history to last 5 messages for faster processing
    const recentHistory = conversationHistory.slice(-5);
    
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map(msg => ({
        role: msg.sender === "assistant" ? "assistant" : "user",
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      })),
      { role: "user", content: userMessage }
    ];

    // Get user's AI client - NO SILENT FALLBACK
    let client;
    let model;
    let engine = "deepseek";
    
    if (userId) {
      const aiConfig = await getAIClient(userId);
      client = aiConfig.client;
      model = aiConfig.model;
      engine = aiConfig.engine;
      console.log(`✅ Using ${engine} (${model}) for user ${userId}`);
    } else {
      if (!deepseek) {
        throw new Error("Default AI engine not configured");
      }
      client = deepseek;
      model = "deepseek-chat";
      console.log(`⚠️  Using default DeepSeek (no user ID provided)`);
    }

    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      response_format: { type: "json_object" },
      max_tokens: 600, // Increased from 400 to accommodate 5-10 discovery questions
      temperature: 0.5,
    });
    console.log(`${engine} API response received successfully`);

    // Track token usage
    if (userId) {
      await recordTokenUsage(userId, mapEngineToProvider(engine), response, 'shift_gears');
    }

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in DeepSeek API response");
    }
    
    let result;
    try {
      const cleanedContent = cleanJSONResponse(messageContent);
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response content (first 500 chars):", messageContent.substring(0, 500));
      console.error("Raw response content (last 500 chars):", messageContent.substring(Math.max(0, messageContent.length - 500)));
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    // CRITICAL: Sanitize discovery questions to ensure contextual awareness
    // Questions should NOT assume prospect owns the product - they're EVALUATING it
    const rawQuestions = result.discoveryQuestions || [];
    const rawNextQuestions = result.nextQuestions || [];
    const sanitizedDiscoveryQuestions = sanitizeDiscoveryQuestions(rawQuestions, domainExpertise);
    const sanitizedNextQuestions = sanitizeDiscoveryQuestions(rawNextQuestions, domainExpertise);
    
    return {
      response: result.response || "I understand. Could you tell me more about your current challenges?",
      discoveryInsights: {
        painPoints: result.discoveryInsights?.painPoints || [],
        currentEnvironment: result.discoveryInsights?.currentEnvironment || "",
        requirements: result.discoveryInsights?.requirements || [],
        budget: result.discoveryInsights?.budget,
        authority: result.discoveryInsights?.authority,
        need: result.discoveryInsights?.need,
        timeline: result.discoveryInsights?.timeline,
        decisionMakers: result.discoveryInsights?.decisionMakers || []
      },
      discoveryQuestions: sanitizedDiscoveryQuestions,
      bantQualification: result.bantQualification || {
        budget: { asked: false, question: "What is your budget range for this project?" },
        authority: { asked: false, question: "Who will be involved in the final decision-making process?" },
        need: { asked: false, question: "What is the primary business challenge you're looking to solve?" },
        timeline: { asked: false, question: "What is your expected timeline for implementation?" }
      },
      nextQuestions: sanitizedNextQuestions,
      recommendedModules: result.recommendedModules || [],
      caseStudies: result.caseStudies || []
    };
  } catch (error: any) {
    console.error("❌ AI API error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    
    // Check if this is an authentication/API key error
    const isAuthError = error?.status === 401 || 
                       error?.status === 403 || 
                       error?.message?.toLowerCase().includes('unauthorized') ||
                       error?.message?.toLowerCase().includes('invalid api key') ||
                       error?.message?.toLowerCase().includes('authentication');
    
    // Return structured response with error information
    const errorMessage = isAuthError 
      ? "Your AI API key is invalid or has expired. Please update your API key in Settings > AI Engine Configuration."
      : "I apologize, but I'm having trouble processing that right now. Please try again.";
    
    return {
      response: errorMessage,
      discoveryInsights: {
        painPoints: [],
        currentEnvironment: "",
        requirements: []
      },
      discoveryQuestions: [],
      bantQualification: {
        budget: { asked: false, question: "What is your budget range for this project?" },
        authority: { asked: false, question: "Who will be involved in the final decision-making process?" },
        need: { asked: false, question: "What is the primary business challenge you're looking to solve?" },
        timeline: { asked: false, question: "What is your expected timeline for implementation?" }
      },
      nextQuestions: [],
      recommendedModules: [],
      caseStudies: []
    };
  }
}

// OPTIMIZED COMBINED ANALYSIS - ULTRA-FAST for real-time use
// Uses fast provider (DeepSeek) to meet <10 second requirement for live calls
export async function generateCombinedAnalysis(
  transcriptText: string,
  conversationHistory: Array<{sender: string, content: string}>,
  domainExpertise: string = "Generic Product",
  userId?: string,
  multiProductEliteAI: boolean = false
): Promise<{
  analysis: SalesResponse;
  salesScript: SalesScript;
  multiProductIntelligence?: any;
  products?: any[];
  _multiProduct?: boolean;
  tabBasedAnalysis?: TabBasedAnalysis;
}> {
  try {
    // PERFORMANCE OPTIMIZATION: Prefer fast provider, fall back to user's choice
    // DeepSeek is fast (2-4s) and ideal for real-time, but respect user config if unavailable
    let aiConfig;
    
    if (deepseek) {
      // Use DeepSeek for speed if available
      aiConfig = { 
        client: deepseek, 
        model: "deepseek-chat", 
        engine: "deepseek" 
      };
      console.log(`⚡ Using FAST provider (DeepSeek) for real-time sales script`);
    } else if (userId) {
      // Fall back to user's configured AI provider
      aiConfig = await getAIClient(userId);
      console.log(`⚡ Using user's configured AI provider (${aiConfig.engine}) - DeepSeek unavailable`);
    } else {
      throw new Error("No AI provider configured");
    }
    
    // SPEED OPTIMIZATION: Aggressive caching with simplified key
    // v6: Optimized prompts for <10s response
    const PROMPT_VERSION = 'v6-speed';
    // Use longer transcript slice (last 2000 chars) for cache key stability
    const transcriptHash = hashTranscript(transcriptText.slice(-2000));
    const cacheKey = `analysis:${PROMPT_VERSION}:${domainExpertise}:${transcriptHash}`;
    const cached = aiCache.get<{ analysis: SalesResponse; salesScript: SalesScript; multiProductIntelligence?: any }>(cacheKey);
    if (cached) {
      console.log(`⚡ CACHE HIT - returning in <100ms (hash: ${transcriptHash})`);
      return cached;
    }
    
    // PERFORMANCE: Parallelize ALL async operations for speed
    const knowledgeServiceModule = await import("./knowledge-service");
    const knowledgeService = knowledgeServiceModule.knowledgeService;
    const keywords = knowledgeService.extractKeywordsFromTranscript(transcriptText);
    
    // Run all async fetches in PARALLEL
    const [knowledgeContext, trainingContext] = await Promise.all([
      // 1. Knowledge context (products, case studies)
      (async () => {
        const knowledgeCacheKey = `knowledge:${userId}:${keywords.problemKeywords.slice(0, 3).join(',')}:${keywords.productKeywords.slice(0, 3).join(',')}`;
        let cached = aiCache.get<{ products: string; caseStudies: string }>(knowledgeCacheKey);
        if (cached) {
          console.log(`📚 Using cached knowledge context`);
          return cached;
        }
        
        const knowledge = await knowledgeService.buildKnowledgeContext({
          problemKeywords: keywords.problemKeywords,
          productKeywords: keywords.productKeywords,
          industries: keywords.industries,
          includePlaybooks: true, // Include playbooks for better preemptive insights
        });
        
        const ctx = {
          products: knowledgeService.formatProductsForPrompt(knowledge.relevantProducts),
          caseStudies: knowledgeService.formatCaseStudiesForPrompt(knowledge.relevantCaseStudies),
        };
        aiCache.set(knowledgeCacheKey, ctx, 300);
        console.log(`📚 Retrieved ${knowledge.relevantProducts.length} products, ${knowledge.relevantCaseStudies.length} case studies`);
        return ctx;
      })(),
      
      // 2. Training documents - PRIORITY: Domain-specific Train Me knowledge first, then universal
      // This ensures contextual responses from the same domain as the web app
      (async () => {
        if (!userId) return { content: "", hasTraining: false, isDomainSpecific: false };
        try {
          // DOMAIN ISOLATION: First try to get domain-specific training context
          // This prioritizes Train Me documents from the same domain as the conversation
          const domainTrainingContext = await getTrainingDocumentContext(
            userId, 
            8000, // Increased token limit for better context
            true, 
            transcriptText.slice(-500), // Use transcript as search query for relevance
            15, // Higher semantic search limit for better coverage
            domainExpertise // Pass domain for domain-specific isolation
          );
          
          if (domainTrainingContext && domainTrainingContext.trim().length > 100) {
            console.log(`🎯 DOMAIN-FIRST: Loaded Train Me knowledge for "${domainExpertise}" (${domainTrainingContext.length} chars)`);
            return { 
              content: `\n=== DOMAIN-SPECIFIC TRAINING (PRIORITY - Use this first for accurate responses) ===\n${domainTrainingContext.slice(0, 3000)}\n=== END DOMAIN TRAINING ===\n`, 
              hasTraining: true,
              isDomainSpecific: true
            };
          }
          
          // FALLBACK: If no domain-specific training, try universal knowledge
          console.log(`⚠️ No domain-specific Train Me for "${domainExpertise}" - falling back to universal knowledge`);
          const universalContext = await getTrainingDocumentContext(
            userId,
            5000,
            true,
            transcriptText.slice(-300),
            10,
            undefined // No domain filter = universal
          );
          
          if (universalContext && universalContext.trim().length > 100) {
            console.log(`📚 UNIVERSAL FALLBACK: Using general training documents (${universalContext.length} chars)`);
            return { 
              content: `\n=== UNIVERSAL TRAINING KNOWLEDGE (Fallback - domain-specific not available) ===\n${universalContext.slice(0, 2000)}\n=== END UNIVERSAL TRAINING ===\n`, 
              hasTraining: true,
              isDomainSpecific: false
            };
          }
          
          return { content: "", hasTraining: false, isDomainSpecific: false };
        } catch (error: any) {
          console.error("Error fetching training documents:", error.message);
          return { content: "", hasTraining: false, isDomainSpecific: false };
        }
      })(),
    ]);
    
    // Multi-product intelligence with timeout guard (2s max, non-blocking for speed)
    let multiProductIntelligence = null;
    if (multiProductEliteAI && userId) {
      const multiProductTimeout = 2000;
      try {
        const multiProductPromise = knowledgeService.getMultiProductRecommendations({
          transcript: transcriptText,
          conversationHistory,
          currentInsights: keywords,
          buyerContext: { industry: keywords.industries?.[0] }
        });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Multi-product timeout')), multiProductTimeout)
        );
        multiProductIntelligence = await Promise.race([multiProductPromise, timeoutPromise]) as any;
        if (multiProductIntelligence) {
          console.log(`🎯 Multi-Product Elite AI: ${multiProductIntelligence.detectedProducts?.length || 0} products detected`);
        }
      } catch (error: any) {
        console.log(`⚡ Multi-product skipped (${error.message}) - continuing with standard analysis`);
        multiProductIntelligence = null;
      }
    }
    
    // Build comprehensive prompt with domain knowledge
    // Defensive: Handle content as string or object (some DBs return JSONB differently)
    const recentMessages = conversationHistory.slice(-5).map(m => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${m.sender}: ${content.slice(0, 200)}`;
    }).join('\n');
    const painPoints = keywords.problemKeywords.join(', ') || 'general needs';
    
    // ENHANCED: Detect if customer already has the product or is evaluating
    // CONSERVATIVE: Default to NEW PROSPECT unless there's strong evidence of ownership
    const detectCustomerOwnership = (transcript: string, domain: string): { hasProduct: boolean; confidence: 'high' | 'low' | 'none'; signals: string[] } => {
      const lowerTranscript = transcript.toLowerCase();
      const lowerDomain = domain.toLowerCase();
      
      // Strong signals (weighted 2 points) - explicit ownership statements
      const strongSignals = [
        `we use ${lowerDomain}`,
        `we have ${lowerDomain}`,
        `our ${lowerDomain}`,
        `we're using ${lowerDomain}`,
        `we already use`,
        `we already have`,
        `our current ${lowerDomain}`,
      ];
      
      // Moderate signals (weighted 1 point) - implied ownership
      const moderateSignals = [
        `upgrade`,
        `renewal`,
        `add more seats`,
        `additional licenses`,
        `expand our usage`,
      ];
      
      let score = 0;
      const matchedSignals: string[] = [];
      
      for (const signal of strongSignals) {
        if (lowerTranscript.includes(signal)) {
          score += 2;
          matchedSignals.push(`[strong] ${signal}`);
        }
      }
      
      for (const signal of moderateSignals) {
        if (lowerTranscript.includes(signal)) {
          score += 1;
          matchedSignals.push(`[moderate] ${signal}`);
        }
      }
      
      // CONSERVATIVE: Only confirm ownership with high confidence (score >= 4)
      // Otherwise, default to treating as new prospect
      return {
        hasProduct: score >= 4,
        confidence: score >= 4 ? 'high' : score >= 2 ? 'low' : 'none',
        signals: matchedSignals
      };
    };
    
    const ownershipStatus = detectCustomerOwnership(transcriptText, domainExpertise);
    console.log(`🔍 Customer ownership detection: ${ownershipStatus.hasProduct ? 'EXISTING CUSTOMER' : 'NEW PROSPECT'} (confidence: ${ownershipStatus.confidence}, signals: ${ownershipStatus.signals.join(', ') || 'none'})`);
    
    // Build multi-product intelligence section if enabled
    const multiProductSection = multiProductIntelligence 
      ? `\n\n${knowledgeService.formatMultiProductIntelligenceForPrompt(multiProductIntelligence)}`
      : '';
    
    // Handle Universal RV mode with dynamic domain detection
    // CRITICAL: Only use dynamic detection when Universal RV is active, otherwise preserve user-selected domain
    const isUniversal = isUniversalRVMode(domainExpertise);
    let dynamicDomainSection = '';
    let effectiveDomain = domainExpertise; // Preserve user-selected domain by default
    let universalPrefix = '';
    
    if (isUniversal) {
      // Only detect and override domain when in Universal RV mode
      const domainContext = detectDomainFromConversation(transcriptText, domainExpertise);
      dynamicDomainSection = buildDynamicAlignmentPrompt(domainContext);
      effectiveDomain = domainContext.dynamicAlignment || 'any product or service';
      universalPrefix = buildUniversalRVSystemPrompt() + '\n\n';
    }
    
    // SPEED OPTIMIZED: Condensed ownership context
    const ownershipContext = (ownershipStatus.hasProduct && ownershipStatus.confidence === 'high')
      ? `STATUS: Existing ${effectiveDomain} customer - focus on upgrades/expansions.`
      : `STATUS: NEW PROSPECT evaluating ${effectiveDomain}. Ask about their CURRENT tools/challenges, NOT about ${effectiveDomain} (they don't have it yet). Never say "your ${effectiveDomain}".`;
    
    // Build training context section if available - with domain-first priority indicator
    const trainingSection = trainingContext.hasTraining 
      ? `${trainingContext.content}\nCRITICAL: ${trainingContext.isDomainSpecific 
          ? 'Use DOMAIN-SPECIFIC training above as PRIMARY source for responses. Generate contextual answers from this knowledge first.' 
          : 'Use training knowledge above for context. For domain-specific details, rely on universal knowledge base for higher accuracy.'}`
      : '';
    
    // SPEED OPTIMIZED: Minimal system prompt for fast AI response
    const systemPrompt = `Sales expert for ${effectiveDomain}. ${ownershipContext}
${isUniversal ? dynamicDomainSection : ''}
${trainingSection ? trainingSection.slice(0, 500) : ''}
Products: ${knowledgeContext.products.slice(0, 300)}
Conversation: ${transcriptText.slice(-800)}`;

    // SPEED OPTIMIZED: Concise prompt with explicit JSON schema
    const userPrompt = `Generate sales analysis for ${effectiveDomain}. Prospect is EVALUATING (doesn't own ${effectiveDomain} yet).
RULES: Discovery questions must ask about their CURRENT tools/challenges, NOT about ${effectiveDomain}.
Return VALID JSON:
{"products":[{"productId":"1","productName":"${effectiveDomain}","confidence":1.0,"analysis":{"discoveryQuestions":["5 questions about CURRENT tools/pain points"],"painPoints":["key challenges"],"currentEnvironment":"","requirements":[],"closingPitch":{"urgencyBuilder":"","objectionHandling":[],"finalValue":"","callToAction":""},"nextSteps":["3 actions"]},"salesScript":{"solutions":[],"valueProposition":[],"technicalAnswers":[],"caseStudies":[],"competitorAnalysis":[],"whyBetter":[]}}]}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
    const { client, model, engine } = aiConfig;
    
    if (!client) {
      throw new Error("AI client not configured");
    }

    console.log(`⚡ ULTRA-FAST analysis starting (${engine})`);
    const startTime = Date.now();
    
    // Helper function to make AI call with timeout
    const callAIWithTimeout = async (client: any, model: string, timeoutMs: number) => {
      const aiCallPromise = client.chat.completions.create({
        model,
        messages: messages as any,
        response_format: { type: "json_object" },
        max_tokens: 500, // SPEED OPTIMIZED: Minimal for <10s response
        temperature: 0.2, // Lower for faster, deterministic output
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI timeout')), timeoutMs);
      });
      
      return await Promise.race([aiCallPromise, timeoutPromise]);
    };
    
    let response: any = null;
    let primaryFailed = false;
    
    // Try primary provider (DeepSeek or user's) with timeout
    // BALANCED: Fast but reliable timeouts for <10s total response time
    // Primary: 6s standard, 8s multi-product. Fallback: 6s. Total max: ~12s (acceptable)
    const primaryTimeout = multiProductEliteAI ? 8000 : 6000;
    try {
      response = await callAIWithTimeout(client, model, primaryTimeout);
      const duration = Date.now() - startTime;
      console.log(`✅ Primary provider (${engine}) succeeded in ${duration}ms`);
      
      // Track token usage for primary provider
      if (userId && response) {
        await recordTokenUsage(userId, mapEngineToProvider(engine), response, 'combined_analysis');
      }
    } catch (primaryError: any) {
      primaryFailed = true;
      const duration = Date.now() - startTime;
      console.log(`❌ Primary provider (${engine}) failed after ${duration}ms: ${primaryError.message}`);
      
      // If DeepSeek was primary and user has a different provider, try fallback
      if (engine === 'deepseek' && userId) {
        console.log(`🔄 Attempting fallback to user's configured provider...`);
        const fallbackStartTime = Date.now();
        
        try {
          const userAiConfig = await getAIClient(userId);
          console.log(`🔄 Fallback provider: ${userAiConfig.engine}`);
          
          // Try user's provider with reasonable timeout (6s) to stay under 12s total
          const fallbackTimeout = 6000;
          const fallbackResponse = await callAIWithTimeout(userAiConfig.client, userAiConfig.model, fallbackTimeout);
          response = fallbackResponse; // Explicitly assign
          
          const fallbackDuration = Date.now() - fallbackStartTime;
          const totalDuration = Date.now() - startTime;
          console.log(`✅ Fallback provider (${userAiConfig.engine}) succeeded in ${fallbackDuration}ms (total: ${totalDuration}ms)`);
          
          // Track token usage for fallback provider
          if (userId && response) {
            await recordTokenUsage(userId, mapEngineToProvider(userAiConfig.engine), response, 'combined_analysis');
          }
        } catch (fallbackError: any) {
          const totalDuration = Date.now() - startTime;
          console.log(`❌ Fallback provider also failed after ${totalDuration}ms: ${fallbackError.message} - using default content`);
          response = null; // Explicitly set to null for fallback content
        }
      }
    }
    
    // If both providers failed, use empty response for fallback content
    if (!response) {
      const totalDuration = Date.now() - startTime;
      console.log(`📝 Using fallback content after ${totalDuration}ms`);
      response = { choices: [{ message: { content: '{}' } }] };
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`⚡ Analysis completed in ${totalDuration}ms (primary failed: ${primaryFailed})`);

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.error("❌ No content in AI response - using fallback analysis");
      // Instead of throwing, return a complete fallback analysis
      const fallbackAnalysis: SalesResponse = {
        response: "",
        discoveryInsights: {
          painPoints: [`Explore ${domainExpertise} challenges`],
          currentEnvironment: `Discuss current ${domainExpertise} setup`,
          requirements: [`Identify ${domainExpertise} requirements`]
        },
        discoveryQuestions: [
          `What are your biggest ${domainExpertise} challenges right now?`,
          `How is your team currently handling ${domainExpertise} workflows?`,
          `What would success look like for your ${domainExpertise} initiative?`,
          `Who else is involved in this decision process?`,
          `What's your timeline for making a decision?`
        ],
        bantQualification: {
          budget: { asked: false },
          authority: { asked: false },
          need: { asked: false },
          timeline: { asked: false }
        },
        nextQuestions: [`What's your top priority for ${domainExpertise}?`],
        recommendedModules: [],
        caseStudies: [],
        closingPitch: {
          urgencyBuilder: `Acting now on your ${domainExpertise} needs means faster results.`,
          objectionHandling: [`We understand budget concerns - let's discuss ROI.`],
          finalValue: `Our ${domainExpertise} solution delivers measurable results.`,
          callToAction: `Let's schedule a demo to show you exactly how we can help.`
        },
        nextSteps: [
          `Schedule a technical demo this week`,
          `Review detailed proposal within 48 hours`,
          `Connect with stakeholders for alignment`
        ]
      };
      
      const fallbackScript: SalesScript = {
        solutions: [`${domainExpertise} solution tailored to your needs`],
        valueProposition: [`${domainExpertise} solution with proven results`],
        technicalAnswers: [`Our ${domainExpertise} platform handles your requirements`],
        caseStudies: [`Similar companies have achieved success with our solution`],
        competitorAnalysis: [`We offer comprehensive ${domainExpertise} capabilities`],
        whyBetter: [`Proven track record in ${domainExpertise}`]
      };
      
      const tabBasedAnalysis = buildTabBasedAnalysis(transcriptText, fallbackAnalysis, fallbackScript, domainExpertise);
      
      return {
        analysis: fallbackAnalysis,
        salesScript: fallbackScript,
        multiProductIntelligence: null,
        products: [],
        _multiProduct: false,
        tabBasedAnalysis
      };
    }
    
    console.log(`📦 AI Response received (${messageContent.length} chars)`);
    
    // Try to parse JSON with error handling
    let result: any;
    let analysisData: any = {};
    let scriptData: any = {};
    let products: any[] = [];
    let isMultiProduct = false;
    
    try {
      const cleanedContent = cleanJSONResponse(messageContent);
      result = JSON.parse(cleanedContent);
      
      // Check if AI returned multi-product format
      if (result.products && Array.isArray(result.products) && result.products.length > 0) {
        console.log(`🎯 Multi-product response detected: ${result.products.length} products`);
        
        // Validate multi-product response using Zod schema
        const { multiProductResponseSchema } = await import("@shared/schema");
        const validationResult = multiProductResponseSchema.safeParse(result);
        
        if (validationResult.success) {
          isMultiProduct = true;
          products = validationResult.data.products;
          console.log(`✅ Multi-product response validated: ${products.length} products`);
          
          // For backward compatibility, use first product as default
          const firstProduct = products[0];
          analysisData = firstProduct.analysis || {};
          scriptData = firstProduct.salesScript || {};
        } else {
          console.error(`❌ Multi-product validation failed:`, validationResult.error.errors);
          console.log(`⚠️ Falling back to single-product mode`);
          // Fall back to single-product parsing
          analysisData = result.analysis || {};
          scriptData = result.salesScript || {};
        }
      } else {
        // Legacy single-product format
        analysisData = result.analysis || {};
        scriptData = result.salesScript || {};
      }
    } catch (parseError: any) {
      console.error(`❌ JSON parse failed: ${parseError?.message || 'Unknown error'}`);
      console.log(`Raw AI response (first 500): ${messageContent.slice(0, 500)}`);
      console.log(`Raw AI response (last 500): ${messageContent.slice(-500)}`);
      // Leave analysisData and scriptData as empty objects - fallback will populate
    }
    
    // Helper function to ensure non-empty arrays with fallback content
    const ensureArray = (arr: any, fallbacks: string[]): string[] => {
      if (!Array.isArray(arr) || arr.length === 0) return fallbacks;
      // Filter out placeholder strings
      const filtered = arr.filter((item: any) => 
        typeof item === 'string' && 
        item.length > 3 && 
        !item.toLowerCase().includes('else') &&
        !item.toLowerCase().includes('n/a')
      );
      return filtered.length > 0 ? filtered : fallbacks;
    };
    
    // VALIDATION: Ensure comprehensive discovery questions (minimum 8-10 questions)
    let discoveryQuestions = ensureArray(analysisData.discoveryQuestions, []);
    
    // If AI didn't provide enough questions, add category-based fallbacks
    // CRITICAL: These fallbacks ask about CURRENT solutions, NOT the product being sold
    // The prospect doesn't own the domain expertise product yet - they're evaluating it
    if (discoveryQuestions.length < 8) {
      console.log(`⚠️  AI provided only ${discoveryQuestions.length} discovery questions, adding fallbacks to reach 10`);
      const fallbackQuestions = [
        `What are the key technical integrations required with your current solution?`,
        `How does your current infrastructure handle scalability?`,
        `What's your budget range and expected ROI timeline for this initiative?`,
        `Who are the decision-makers involved in this purchase decision?`,
        `What business metrics will you use to measure success?`,
        `What pain points are costing your team the most time/money with your current approach?`,
        `What's the urgency for implementing a new solution?`,
        `Are there other stakeholders or departments that need to be involved in this decision?`,
        `What happens if you don't solve these challenges in the next 6 months?`,
        `What size team will be using this solution?`
      ];
      
      discoveryQuestions = [...discoveryQuestions, ...fallbackQuestions].slice(0, 10);
    }
    
    // VALIDATION: Ensure closingPitch has all 4 required fields
    const closingPitch = analysisData.closingPitch || {};
    const validatedClosingPitch = {
      urgencyBuilder: closingPitch.urgencyBuilder || 
        `With ${domainExpertise} challenges impacting your team daily, delaying this decision means continued inefficiency and lost opportunities. Acting now ensures you're operational before peak season.`,
      objectionHandling: ensureArray(closingPitch.objectionHandling, [
        `"Price concern" → Break down ROI: this ${domainExpertise} solution typically pays for itself within 4-6 months through efficiency gains.`,
        `"Need to compare options" → We understand. Our ${domainExpertise} solution offers a 30-day trial to prove value before full commitment.`
      ]),
      finalValue: closingPitch.finalValue || 
        `Our ${domainExpertise} solution delivers measurable ROI through reduced operational costs, faster deployment, and proven results from companies like yours. This is an investment in sustainable growth.`,
      callToAction: closingPitch.callToAction || 
        `Let's schedule a 30-minute technical demo this week to show exactly how our ${domainExpertise} solution addresses your specific challenges. Does Thursday or Friday work better?`
    };
    
    // VALIDATION: Ensure nextSteps has at least 3 concrete actions
    let nextSteps = ensureArray(analysisData.nextSteps, []);
    
    if (nextSteps.length < 3) {
      console.log(`⚠️  AI provided only ${nextSteps.length} next steps, adding fallbacks to reach 3`);
      const fallbackSteps = [
        `Immediate: Schedule technical demo for this week (Thursday 2pm or Friday 10am) to showcase ${domainExpertise} solution`,
        `Short-term: Provide detailed proposal with pricing and implementation timeline within 48 hours`,
        `Follow-up: Schedule decision-maker meeting next week to finalize ${domainExpertise} partnership details`
      ];
      
      nextSteps = [...nextSteps, ...fallbackSteps].slice(0, 3);
    }
    
    console.log(`✅ VALIDATION: ${discoveryQuestions.length} discovery questions, closingPitch complete, ${nextSteps.length} next steps`);
    
    // Build analysis result with validated, comprehensive content
    const analysisResult = {
      analysis: {
        response: "",
        discoveryInsights: {
          painPoints: ensureArray(analysisData.painPoints, [`Explore the prospect's current challenges and pain points`]),
          currentEnvironment: analysisData.currentEnvironment || `Discuss prospect's current setup and tools`,
          requirements: ensureArray(analysisData.requirements, [`Identify the prospect's requirements and goals`])
        },
        discoveryQuestions: discoveryQuestions,
        bantQualification: {
          budget: { asked: false },
          authority: { asked: false },
          need: { asked: false },
          timeline: { asked: false }
        },
        nextQuestions: ensureArray(analysisData.nextQuestions, [
          `What would success look like for this initiative?`
        ]),
        recommendedModules: ensureArray(analysisData.recommendedSolutions, [`${domainExpertise} solution package`]),
        caseStudies: Array.isArray(analysisData.caseStudies) ? analysisData.caseStudies : [],
        closingPitch: validatedClosingPitch,
        nextSteps: nextSteps
      },
      salesScript: {
        solutions: ensureArray(scriptData.solutions, [
          `Our ${domainExpertise} solution addresses your key challenges`,
          `Streamlined ${domainExpertise} implementation with proven results`
        ]),
        valueProposition: ensureArray(scriptData.valueProposition, [
          `Reduce ${domainExpertise} complexity and increase efficiency`,
          `Get results faster with our ${domainExpertise} expertise`
        ]),
        technicalAnswers: ensureArray(scriptData.technicalAnswers, [
          `Technical implementation tailored to your ${domainExpertise} needs`
        ]),
        caseStudies: ensureArray(scriptData.caseStudies, [
          `Success story: Similar ${domainExpertise} transformation delivered 40% efficiency gain`
        ]),
        competitorAnalysis: ensureArray(scriptData.competitorAnalysis, [
          `Faster implementation and better ${domainExpertise} ROI than alternatives`
        ]),
        whyBetter: ensureArray(scriptData.whyBetter, [
          `Proven ${domainExpertise} expertise with industry-leading results`,
          `Comprehensive support and rapid deployment`
        ])
      }
    };

    console.log(`✅ Analysis result prepared - Script: ${analysisResult.salesScript.solutions.length} solutions, ${analysisResult.salesScript.valueProposition.length} values, ${analysisResult.salesScript.technicalAnswers.length} technical`);

    // Build tab-based analysis using multiple sales methodologies
    const tabBasedAnalysis = buildTabBasedAnalysis(
      transcriptText,
      analysisData,
      scriptData,
      domainExpertise
    );
    console.log(`📊 Tab-based analysis built with ${tabBasedAnalysis.methodologiesUsed.length} methodologies`);

    // Attach multi-product intelligence and tab-based analysis if available
    let resultWithMultiProduct: any = {
      ...analysisResult,
      tabBasedAnalysis,
      ...(multiProductIntelligence ? { multiProductIntelligence } : {})
    };
    
    // Attach multi-product responses if detected and validated
    // CRITICAL: Only set _multiProduct flag if products array is non-empty and validated
    if (isMultiProduct && products.length > 0) {
      resultWithMultiProduct = {
        ...resultWithMultiProduct,
        products: products,
        _multiProduct: true
      };
      console.log(`🎯 Multi-product results attached: ${products.length} validated products`);
    } else if (isMultiProduct && products.length === 0) {
      // Safety check: If isMultiProduct was set but products array is empty, log warning
      console.warn(`⚠️ Multi-product flag was set but products array is empty - using single-product mode`);
    }

    // Cache result for 90 seconds
    aiCache.set(cacheKey, resultWithMultiProduct, 90000);
    
    return resultWithMultiProduct;
  } catch (error) {
    console.error("Combined analysis error:", error);
    // Return comprehensive fallback results with all required fields
    return {
      analysis: {
        response: "",
        discoveryInsights: { painPoints: [], currentEnvironment: "", requirements: [] },
        discoveryQuestions: [
          "What are your main challenges with your current solution?",
          "What goals are you looking to achieve?",
          "What's your timeline for making a decision?",
          "Who else is involved in this decision?",
          "What's your budget range for this initiative?",
          "What metrics will you use to measure success?",
          "What happens if you don't solve this problem?",
          "Are there any technical integrations required?"
        ],
        bantQualification: {
          budget: { asked: false },
          authority: { asked: false },
          need: { asked: false },
          timeline: { asked: false }
        },
        nextQuestions: ["What would success look like for you?"],
        recommendedModules: [],
        caseStudies: [],
        closingPitch: {
          urgencyBuilder: "Acting now ensures you can start seeing results sooner and avoid continued inefficiency costs.",
          objectionHandling: [
            "Price concern → Focus on ROI: this typically pays for itself within 4-6 months.",
            "Need to think about it → Offer a proof of concept or trial to demonstrate value first."
          ],
          finalValue: "Our solution delivers measurable ROI through proven results and comprehensive support.",
          callToAction: "Let's schedule a 30-minute demo this week to show how we can help. Does Thursday or Friday work better?"
        },
        nextSteps: [
          "Immediate: Schedule technical demo for this week",
          "Short-term: Provide detailed proposal within 48 hours",
          "Follow-up: Schedule decision-maker meeting next week"
        ]
      },
      salesScript: {
        solutions: [],
        valueProposition: [],
        technicalAnswers: [],
        caseStudies: [],
        competitorAnalysis: [],
        whyBetter: []
      },
      tabBasedAnalysis: {
        discovery: {
          preemptiveQuestions: [
            "What's the biggest challenge keeping you up at night?",
            "How is the current situation impacting your team's productivity?",
            "What happens if this problem isn't solved in the next 6 months?",
            "What does success look like for your initiative?",
            "Are there other stakeholders who should be involved in this decision?"
          ],
          conversationQuestions: [],
          methodologyInsights: [
            { methodology: 'SPIN', insight: 'Focus on Situation → Problem → Implication → Need-Payoff progression', action: 'Ask about consequences of not solving the problem' },
            { methodology: 'MEDDIC', insight: 'Qualify Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion', action: 'Identify who the economic buyer is' },
            { methodology: 'Challenger', insight: 'Teach something new, Tailor your message, Take control', action: 'Share an industry insight they may not have considered' }
          ],
          bantStatus: {
            budget: { status: 'unknown', question: 'What budget range are you considering?' },
            authority: { status: 'unknown', question: 'Who else will be involved in the final decision?' },
            need: { status: 'unknown', question: "What's the primary challenge you're looking to solve?" },
            timeline: { status: 'unknown', question: 'What timeline are you working with for implementation?' }
          }
        },
        objections: {
          identifiedObjections: [],
          potentialObjections: [
            { objection: 'Price seems high', response: 'Consider the ROI - this typically pays for itself within 4-6 months.', methodology: 'Challenger' },
            { objection: 'Need to compare', response: "We encourage comparison. Here's our competitive analysis.", methodology: 'MEDDIC' },
            { objection: 'Need stakeholder approval', response: "Let's schedule a meeting with your stakeholders.", methodology: 'SPIN' }
          ],
          handlingTechniques: [
            'Acknowledge the concern before responding',
            'Use the Feel-Felt-Found technique',
            'Turn objections into questions'
          ]
        },
        nextSteps: {
          immediateActions: ['Schedule a technical demo', 'Share relevant case study', 'Connect with technical stakeholders'],
          followUpActions: ['Send detailed proposal within 48 hours', 'Schedule follow-up call'],
          closingRecommendation: 'Recommend scheduling a demo this week to show exactly how our solution addresses their specific needs.',
          dealStage: 'Discovery',
          readinessScore: 20
        },
        competitors: {
          mentionedCompetitors: [],
          proactiveDifferentiators: ['Faster implementation', 'Better support ratings', 'Proven ROI'],
          competitiveAdvantages: ['More intuitive UI', 'Better scalability', 'Stronger security']
        },
        urgency: {
          urgencyScript: 'Acting now means you can start seeing improvements within weeks rather than months. Every day of delay costs productivity.',
          bulletPoints: ['Industry adoption is accelerating', 'Current market conditions favor buyers', 'Implementation capacity is limited'],
          valueStatements: ['Reduce complexity by 40% in the first month', 'Get dedicated support throughout implementation'],
          callToAction: "Let's schedule a 30-minute demo this week. Does Thursday or Friday work better?",
          psychologicalTriggers: ['Social Proof', 'Scarcity', 'Loss Aversion']
        },
        methodologiesUsed: ['SPIN', 'MEDDIC', 'Challenger', 'NLP', 'BANT', 'Psychology']
      }
    };
  }
}

// FAST ANALYSIS for real-time customer calls (OPTIMIZED for speed)
export async function generateFastAnalysis(
  transcriptText: string,
  conversationHistory: Array<{sender: string, content: string}>,
  domainExpertise: string = "Generic Product",
  userId?: string
): Promise<SalesResponse> {
  try {
    // Ultra-short prompt optimized for speed
    const fastPrompt = `You are a sales analyst for ${domainExpertise}. Analyze the conversation transcript FAST and return ONLY key insights in JSON.

FAST ANALYSIS RULES:
- Analyze the provided transcript focusing on recent exchanges
- Focus on ${domainExpertise} topics ONLY
- Skip pleasantries and off-topic content
- Be concise and actionable

Return JSON:
{
  "discoveryQuestions": ["2 smart ${domainExpertise} follow-up questions"],
  "recommendedSolutions": ["1-2 ${domainExpertise} products/features mentioned or implied"],
  "caseStudies": ["1 brief ${domainExpertise} success story if highly relevant, else empty"],
  "discoveryInsights": {
    "painPoints": ["${domainExpertise} pain points ONLY"],
    "currentEnvironment": "brief ${domainExpertise} situation",
    "requirements": ["${domainExpertise} requirements ONLY"],
    "budget": "budget info if mentioned",
    "authority": "decision maker info if mentioned",
    "need": "core ${domainExpertise} need",
    "timeline": "timeline if mentioned"
  },
  "nextQuestions": ["2-3 strategic ${domainExpertise} questions"]
}`;

    // Include recent context (last 5 messages) plus the transcript to analyze
    const recentHistory = conversationHistory.slice(-5);
    
    const messages = [
      { role: "system", content: fastPrompt },
      ...recentHistory.map(msg => ({
        role: msg.sender === "assistant" ? "assistant" : "user",
        content: msg.content
      })),
      { role: "user", content: `Analyze this transcript:\n\n${transcriptText}` }
    ];

    // Get user's AI client - NO SILENT FALLBACK
    let client;
    let model;
    let engine = "deepseek";
    
    if (userId) {
      const aiConfig = await getAIClient(userId);
      client = aiConfig.client;
      model = aiConfig.model;
      engine = aiConfig.engine;
      console.log(`✅ FAST analysis using ${engine} (${model}) for user ${userId}`);
    } else {
      if (!deepseek) {
        throw new Error("Default AI engine not configured");
      }
      client = deepseek;
      model = "deepseek-chat";
      console.log(`⚠️  Using default DeepSeek for fast analysis (no user ID)`);
    }

    // Optimized for speed: fewer tokens, lower temperature
    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      response_format: { type: "json_object" },
      max_tokens: 500, // Reduced from 700 for faster response
      temperature: 0.4, // Lower temperature for faster, more focused responses
    });
    console.log(`FAST ${engine} analysis completed`);

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in AI response");
    }
    
    let result;
    try {
      const cleanedContent = cleanJSONResponse(messageContent);
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("JSON parse error in fast analysis:", parseError);
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    // CRITICAL: Sanitize discovery questions to ensure contextual awareness
    const rawQuestions = result.discoveryQuestions || [];
    const rawNextQuestions = result.nextQuestions || [];
    const sanitizedDiscoveryQuestions = sanitizeDiscoveryQuestions(rawQuestions, domainExpertise);
    const sanitizedNextQuestions = sanitizeDiscoveryQuestions(rawNextQuestions, domainExpertise);
    
    return {
      response: "", // Not used in analysis
      discoveryInsights: {
        painPoints: result.discoveryInsights?.painPoints || [],
        currentEnvironment: result.discoveryInsights?.currentEnvironment || "",
        requirements: result.discoveryInsights?.requirements || [],
        budget: result.discoveryInsights?.budget,
        authority: result.discoveryInsights?.authority,
        need: result.discoveryInsights?.need,
        timeline: result.discoveryInsights?.timeline,
        decisionMakers: result.discoveryInsights?.decisionMakers || []
      },
      discoveryQuestions: sanitizedDiscoveryQuestions,
      bantQualification: {
        budget: { asked: false },
        authority: { asked: false },
        need: { asked: false },
        timeline: { asked: false }
      },
      nextQuestions: sanitizedNextQuestions,
      recommendedModules: result.recommendedSolutions || [],
      caseStudies: result.caseStudies || []
    };
  } catch (error) {
    console.error("Fast analysis error:", error);
    // Fail gracefully with empty results
    return {
      response: "",
      discoveryInsights: {
        painPoints: [],
        currentEnvironment: "",
        requirements: []
      },
      discoveryQuestions: [],
      bantQualification: {
        budget: { asked: false },
        authority: { asked: false },
        need: { asked: false },
        timeline: { asked: false }
      },
      nextQuestions: [],
      recommendedModules: [],
      caseStudies: []
    };
  }
}

// Generate sales script with solutions, value prop, technical answers, case studies, competitor analysis
export async function generateSalesScript(
  transcriptText: string,
  analysisResults: {
    recommendedSolutions?: string[];
    caseStudies?: string[];
    discoveryInsights?: any;
  },
  domainExpertise: string = "Generic Product",
  userId?: string
): Promise<SalesScript> {
  try {
    const scriptPrompt = `You are a sales script writer for ${domainExpertise}. Create a concise, ready-to-use sales script based on the conversation and analysis.

CONVERSATION TRANSCRIPT:
${transcriptText}

ANALYSIS INSIGHTS:
- Recommended Solutions: ${JSON.stringify(analysisResults.recommendedSolutions || [])}
- Case Studies: ${JSON.stringify(analysisResults.caseStudies || [])}
- Pain Points: ${JSON.stringify(analysisResults.discoveryInsights?.painPoints || [])}
- Requirements: ${JSON.stringify(analysisResults.discoveryInsights?.requirements || [])}

IMPORTANT RULES:
- Each section: MAX 5 concise lines (1-2 sentences per line)
- Use bullet points for clarity
- Be specific to ${domainExpertise}
- Keep language simple and conversational
- Focus on customer benefits

Return JSON with these sections:
{
  "solutions": ["List of 3-5 solution points specific to their needs"],
  "valueProposition": ["3-5 value statements showing ROI and benefits"],
  "technicalAnswers": ["3-5 technical points addressing their requirements - if technical discussion happened, else empty"],
  "caseStudies": ["1-3 brief success stories relevant to their situation - if applicable, else empty"],
  "competitorAnalysis": ["2-4 points comparing to competitors - if mentioned, else empty"],
  "whyBetter": ["3-5 differentiation points explaining why this solution is superior"]
}`;

    // Get user's AI client - NO SILENT FALLBACK
    let client;
    let model;
    let engine = "deepseek";
    
    if (userId) {
      const aiConfig = await getAIClient(userId);
      client = aiConfig.client;
      model = aiConfig.model;
      engine = aiConfig.engine;
      console.log(`✅ Script generation using ${engine} (${model}) for user ${userId}`);
    } else {
      if (!deepseek) {
        throw new Error("Default AI engine not configured");
      }
      client = deepseek;
      model = "deepseek-chat";
      console.log(`⚠️  Using default DeepSeek for script generation (no user ID)`);
    }

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: scriptPrompt },
        { role: "user", content: "Generate the sales script based on the conversation and analysis provided." }
      ] as any,
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.6,
    });

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in AI response for sales script");
    }
    
    const cleanedContent = cleanJSONResponse(messageContent);
    const result = JSON.parse(cleanedContent);
    
    return {
      solutions: result.solutions || [],
      valueProposition: result.valueProposition || [],
      technicalAnswers: result.technicalAnswers || [],
      caseStudies: result.caseStudies || [],
      competitorAnalysis: result.competitorAnalysis || [],
      whyBetter: result.whyBetter || []
    };
  } catch (error) {
    console.error("Sales script generation error:", error);
    // Return empty script on error
    return {
      solutions: [],
      valueProposition: [],
      technicalAnswers: [],
      caseStudies: [],
      competitorAnalysis: [],
      whyBetter: []
    };
  }
}

export async function generateCoachingSuggestions(
  conversationContext: string,
  transcriptEntries: any[],
  currentInsights: any = {},
  userId?: string
): Promise<{
  suggestions: Array<{
    type: 'question' | 'objection' | 'next-step' | 'discovery' | 'closing';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    content: string;
    context?: string;
  }>;
  insights: Array<{
    category: 'pain-point' | 'requirement' | 'budget' | 'timeline' | 'decision-maker' | 'objection';
    content: string;
    confidence: number;
  }>;
  roles?: {
    salesRep: string[];
    customers: string[];
  };
}> {
  try {
    // Get user's AI client - NO SILENT FALLBACK
    let client;
    let model;
    
    if (userId) {
      const aiConfig = await getAIClient(userId);
      client = aiConfig.client;
      model = aiConfig.model;
      console.log(`✅ Coaching suggestions using ${aiConfig.engine} (${model}) for user ${userId}`);
    } else {
      if (!deepseek) throw new Error("Default AI engine not configured");
      client = deepseek;
      model = "deepseek-chat";
      console.log(`⚠️  Using default DeepSeek for coaching (no user ID)`);
    }
    // Ensure conversationContext is a clean string
    const cleanContext = String(conversationContext || "").trim();
    console.log('Coaching request - Context length:', cleanContext.length, 'Transcript entries:', transcriptEntries.length);
    
    // Build speaker analysis from transcript
    const speakerAnalysis = transcriptEntries.map((entry: any, index: number) => 
      `${index + 1}. ${entry.speaker || 'Unknown'}: "${entry.text || ''}"`
    ).join('\n');
    
    const coachingPrompt = `You are a professional sales coach providing real-time guidance during a discovery call. 

CRITICAL TASK: First, analyze the conversation to identify who is the SALES REP and who are the CUSTOMERS.

Conversation Transcript:
${speakerAnalysis || cleanContext}

Conversation progress: ${transcriptEntries.length} messages exchanged

Current insights: ${JSON.stringify(currentInsights)}

YOUR ROLE: 
1. Identify which speakers are CUSTOMERS (asking questions, describing problems, expressing needs)
2. Identify which speaker is the SALES REP (answering questions, offering solutions, conducting discovery)
3. Provide coaching ONLY for the SALES REP to use when responding to CUSTOMERS
4. Suggest questions and solutions the SALES REP should use to engage customers

Provide coaching in JSON format:

{
  "roles": {
    "salesRep": ["speaker names identified as sales representatives"],
    "customers": ["speaker names identified as customers/prospects"]
  },
  "suggestions": [
    {
      "type": "question|objection|next-step|discovery|closing",
      "priority": "low|medium|high|urgent", 
      "title": "Brief suggestion title for sales rep",
      "content": "Specific question or solution the SALES REP should use to respond to customers",
      "context": "Why the sales rep should use this now based on what customers said"
    }
  ],
  "insights": [
    {
      "category": "pain-point|requirement|budget|timeline|decision-maker|objection",
      "content": "What was discovered from CUSTOMER statements",
      "confidence": 0.0-1.0
    }
  ]
}

IMPORTANT: All suggestions must be for the SALES REP to use when responding to CUSTOMERS. Focus on what the sales rep should ask or recommend next.`;

    console.log('Sending coaching request to AI...');
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: coachingPrompt },
        { role: "user", content: cleanContext || "No specific conversation context provided" }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.4,
    });
    console.log('AI coaching response received successfully');

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in coaching response");
    }

    const cleanedContent = cleanJSONResponse(messageContent);
    const result = JSON.parse(cleanedContent);
    console.log('Coaching suggestions generated:', result.suggestions?.length || 0, 'insights:', result.insights?.length || 0);
    
    if (result.roles) {
      console.log('Roles identified - Sales Rep:', result.roles.salesRep, 'Customers:', result.roles.customers);
    }
    
    return {
      suggestions: result.suggestions || [],
      insights: result.insights || [],
      roles: result.roles
    };
  } catch (error) {
    console.error("Coaching generation error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return {
      suggestions: [],
      insights: []
    };
  }
}

export async function generateResponse(prompt: string, conversationHistory: any[] = [], userId?: string): Promise<string> {
  try {
    let client;
    let model;
    
    if (userId) {
      try {
        const aiConfig = await getAIClient(userId);
        client = aiConfig.client;
        model = aiConfig.model;
      } catch (error) {
        if (!deepseek) throw new Error("AI engine not configured");
        client = deepseek;
        model = "deepseek-chat";
      }
    } else {
      if (!deepseek) throw new Error("Default AI engine not configured");
      client = deepseek;
      model = "deepseek-chat";
    }

    const messages = [
      { role: "system", content: "You are a helpful AI assistant. Provide clear, accurate responses." },
      ...conversationHistory,
      { role: "user", content: prompt }
    ];

    const completion = await client.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: 2000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "No response generated";
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function generateCallSummary(
  conversationHistory: Array<{sender: string, content: string}>,
  discoveryInsights: any,
  userId?: string
): Promise<CallSummary> {
  try {
    let client;
    let model;
    
    if (userId) {
      try {
        const aiConfig = await getAIClient(userId);
        client = aiConfig.client;
        model = aiConfig.model;
      } catch (error) {
        if (!deepseek) throw new Error("AI engine not configured");
        client = deepseek;
        model = "deepseek-chat";
      }
    } else {
      if (!deepseek) throw new Error("Default AI engine not configured");
      client = deepseek;
      model = "deepseek-chat";
    }
    const summaryPrompt = `Based on this sales conversation, generate a comprehensive call summary. 

Conversation History:
${conversationHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

Current Discovery Insights:
${JSON.stringify(discoveryInsights, null, 2)}

Provide a structured summary in JSON format:
{
  "keychallenges": ["main business challenges identified"],
  "discoveryInsights": ["key insights gathered about client needs"],
  "objections": ["objections raised and how they were addressed"],
  "nextSteps": ["recommended follow-up actions"],
  "recommendedSolutions": ["products/solutions to propose"]
}`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an expert sales analyst. Create comprehensive call summaries." },
        { role: "user", content: summaryPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in DeepSeek API response");
    }
    const cleanedContent = cleanJSONResponse(messageContent);
    const result = JSON.parse(cleanedContent);
    
    return {
      keychallenges: result.keychallenges || [],
      discoveryInsights: result.discoveryInsights || [],
      objections: result.objections || [],
      nextSteps: result.nextSteps || [],
      recommendedSolutions: result.recommendedSolutions || []
    };
  } catch (error) {
    console.error("Call summary generation error:", error);
    return {
      keychallenges: ["Error generating summary"],
      discoveryInsights: [],
      objections: [],
      nextSteps: ["Follow up with client"],
      recommendedSolutions: []
    };
  }
}

export interface MeetingMinutes {
  date: string;
  time: string;
  duration: string;
  attendees: string[];
  companyName: string;
  opportunityName: string;
  meetingType: string;
  discussionSummary: string;
  discoveryQA: Array<{ question: string; answer: string }>;
  bant: {
    budget: string;
    authority: string;
    need: string;
    timeline: string;
  };
  challenges: string[];
  keyInsights: string[];
  actionItems: Array<{ action: string; owner: string; deadline: string }>;
  followUpPlan: {
    nextMeetingDate: string;
    documentsToShare: string[];
    internalAlignment: string[];
  };
  notes: string;
}

export async function generateMeetingMinutes(
  conversationHistory: Array<{sender: string, content: string, speakerLabel?: string | null}>,
  clientName: string = "Client",
  domainExpertise: string = "Generic Product",
  userId?: string,
  meetingStartTime?: Date  // Actual conversation start time from session metadata
): Promise<MeetingMinutes> {
  try {
    // VALIDATION: Check if conversation has sufficient content
    // Filter out very short messages (like "hi", "ok", etc.) for meaningful content check
    const meaningfulMessages = conversationHistory.filter(msg => {
      const trimmed = msg.content.trim();
      const words = trimmed.split(/\s+/).filter(w => w.length > 0);
      return words.length >= 3; // Message must have at least 3 words to be meaningful
    });
    
    const conversationText = conversationHistory.map(msg => msg.content).join(' ').trim();
    const words = conversationText.split(/\s+/).filter(w => w.length > 0); // Filter empty strings
    const wordCount = words.length;
    
    console.log(`📝 Meeting Minutes: Conversation has ${wordCount} words, ${conversationHistory.length} messages (${meaningfulMessages.length} meaningful)`);
    
    // FIXED: Check for meaningful messages, not just any messages
    if (meaningfulMessages.length < 3 || wordCount < 50) {
      console.warn(`⚠️ Insufficient conversation content for meeting minutes (${meaningfulMessages.length} meaningful messages, ${wordCount} words)`);
      throw new Error(`Please have a longer conversation before generating meeting minutes. We need at least 3 messages with meaningful content.`);
    }
    
    let client;
    let model;
    
    if (userId) {
      try {
        const aiConfig = await getAIClient(userId);
        client = aiConfig.client;
        model = aiConfig.model;
      } catch (error) {
        if (!deepseek) throw new Error("AI engine not configured");
        client = deepseek;
        model = "deepseek-chat";
      }
    } else {
      if (!deepseek) throw new Error("Default AI engine not configured");
      client = deepseek;
      model = "deepseek-chat";
    }
    
    // Extract unique participants from conversation - ONLY use actual speaker labels from conversation
    // DO NOT add synthetic labels like 'Sales Representative'
    const participants = new Set<string>();
    const participantContext: { [key: string]: string[] } = {};
    
    conversationHistory.forEach(msg => {
      // CRITICAL: Only use speakerLabel if explicitly provided in conversation
      // Do NOT use msg.sender ("user", "ai", etc.) as these are synthetic system labels
      if (msg.speakerLabel) {
        participants.add(msg.speakerLabel);
        
        if (!participantContext[msg.speakerLabel]) {
          participantContext[msg.speakerLabel] = [];
        }
        participantContext[msg.speakerLabel].push(msg.content);
      }
    });
    
    console.log(`👥 Detected ${participants.size} participants (from speaker labels only):`, Array.from(participants));

    const minutesPrompt = `Based on this ${domainExpertise} sales/discovery call conversation, generate professional Minutes of Meeting STRICTLY EXTRACTED FROM THE ACTUAL CONVERSATION.

🚨 CRITICAL EXTRACTION RULES - READ CAREFULLY:
1. ONLY use information EXPLICITLY mentioned in the conversation below
2. DO NOT invent, assume, or make up ANY names, companies, or details
3. If information is NOT in the conversation, use "Not mentioned" or leave blank
4. DO NOT use generic examples like "John, Tech Ventures" or placeholder names
5. Extract VERBATIM from conversation - preserve exact wording when possible

Complete Conversation Transcript:
${conversationHistory.map((msg, idx) => {
  // Only use speakerLabel if available, otherwise use line number to avoid synthetic labels
  const speaker = msg.speakerLabel || `Line ${idx + 1}`;
  return `${speaker}: ${msg.content}`;
}).join('\n')}

🚨 IMPORTANT: The above conversation may include labels like "Line 1", "Line 2", "Speaker 1", etc. These are FORMATTING LABELS, NOT real names.
DO NOT copy these labels as attendee names. Only extract ACTUAL names/titles if people introduce themselves in the conversation (e.g., "Hi, I'm Sarah", "I'm the CTO").
If no real names/titles are mentioned in the actual spoken words, return EMPTY attendees array [].

Generate professional meeting minutes in JSON format following this exact structure:
{
  "date": "Extract if mentioned in conversation (e.g., 'meeting on March 15th'). If NOT mentioned, leave BLANK or use empty string.",
  "time": "Extract if mentioned in conversation (e.g., 'let's meet at 2pm'). If NOT mentioned, leave BLANK or use empty string.",
  "duration": "Extract if mentioned in conversation (e.g., 'we have 30 minutes'). If NOT mentioned, leave BLANK or use empty string.",
  "attendees": [
    "CRITICAL: Extract ONLY from conversation. Look for:
     - Speaker introductions (e.g., 'Hi, I'm Sarah from Acme Corp')
     - Names mentioned during discussion (e.g., 'My name is Mike')
     - Titles/roles explicitly stated (e.g., 'I'm the CTO here', 'I'm David the procurement manager')
     - NEVER use placeholder names like 'John Smith', 'Tech Ventures', 'Sales Representative' unless ACTUALLY said
     - If NO names or titles are mentioned in conversation, return EMPTY ARRAY []
     - DO NOT use generic speaker labels like 'Speaker 1', 'Speaker 2' - these are NOT from conversation"
  ],
  "companyName": "STRICT: Extract ONLY from conversation. Look for phrases like:
   - 'I work at...'
   - 'We're from...'
   - 'Our company is...'
   - Company name in email signature or introduction
   - If NOT mentioned in conversation, use 'Not mentioned' (DO NOT make up a name)",
  "opportunityName": "Extract ONLY from conversation. Look for phrases like:
   - 'We're working on...'
   - 'This project is called...'
   - 'The initiative is...'
   - If NOT mentioned, use 'Not mentioned' (DO NOT make up project names)",
  "meetingType": "One of: Intro / Discovery / Demo / Proposal / Negotiation / Follow-up",
  "discussionSummary": "COMPREHENSIVE summary capturing ALL conversation details. Include: (1) Main topics discussed, (2) ALL technical questions asked with EXACT wording - preserve acronyms/protocols/versions, (3) Specific solutions/products mentioned, (4) Technical requirements or constraints discussed. DO NOT summarize or paraphrase technical details - capture them verbatim. This should be detailed and thorough, not brief. IMPORTANT: Attribute all explanations/responses to 'the sales representative' - NEVER use 'AI Assistant'.",
  "discoveryQA": [
    {
      "question": "What are your current tools or processes?",
      "answer": "Customer's actual response or 'Not discussed'"
    },
    {
      "question": "What's driving this initiative now?",
      "answer": "Customer's actual response or 'Not discussed'"
    },
    {
      "question": "What challenges are you facing with the current setup?",
      "answer": "Customer's actual response or 'Not discussed'"
    },
    {
      "question": "What would success look like for your team?",
      "answer": "Customer's actual response or 'Not discussed'"
    },
    {
      "question": "Who will be involved in the decision-making process?",
      "answer": "Customer's actual response or 'Not discussed'"
    }
  ],
  "bant": {
    "budget": "Budget information if discussed, otherwise 'Not discussed'",
    "authority": "Decision maker(s) identified, otherwise 'Not discussed'",
    "need": "Clear business need identified, otherwise 'Not discussed'",
    "timeline": "Implementation timeline if discussed, otherwise 'Not discussed'"
  },
  "challenges": [
    "Specific pain point or challenge discussed - preserve EXACT technical details, acronyms, protocols, version numbers if mentioned. Example: 'Issues with cross-tenant differential delta replication causing checksum drift' NOT 'Performance issues'"
  ],
  "keyInsights": [
    "Key insights including: (1) Buying signals (urgency, budget, decision criteria), (2) Technical requirements mentioned (preserve verbatim), (3) Implied needs you can infer from questions asked, (4) Risk factors or concerns raised"
  ],
  "actionItems": [
    {
      "action": "Specific action item description",
      "owner": "Person responsible (e.g., 'Sales Rep', 'Client', 'John Smith')",
      "deadline": "Deadline if mentioned, otherwise 'TBD'"
    }
  ],
  "followUpPlan": {
    "nextMeetingDate": "Date of next meeting/demo if scheduled, otherwise 'To be scheduled'",
    "documentsToShare": ["List of documents/decks to be shared, or empty array"],
    "internalAlignment": ["Internal team members to involve (e.g., 'Pre-sales', 'Delivery', 'Partner AE'), or empty array"]
  },
  "notes": "Additional context, tone of conversation, personality insights, or other observations worth noting. IMPORTANT: These notes are for the sales rep to add to their CRM, so attribute ALL explanations and responses to 'the sales representative' or the rep's name - NEVER use 'AI Assistant' or 'the assistant'. Example: 'The sales representative explained...' NOT 'The AI Assistant explained...'"
}

CRITICAL FIDELITY RULES - PRESERVE ALL TECHNICAL DETAIL:

1. **Discussion Summary** - Capture EVERYTHING in detail:
   - Include ALL technical questions asked - use EXACT wording with ALL acronyms, protocols, version numbers
   - Example GOOD: "Asked about cross-tenant differential delta replication, checksum drift prevention, and policy-driven configuration changes across hybrid environments with mixed OS versions, restricted subnets, and intermittent LAN links"
   - Example BAD: "Asked about performance and hybrid environment management"
   - This should be a COMPREHENSIVE summary (3-5 paragraphs if needed), NOT a brief overview

2. **Challenges** - Preserve verbatim technical pain points:
   - NEVER paraphrase or simplify technical language
   - Keep ALL acronyms (RMM, API, SaaS, LAN, SSH, HTTPS, etc.)
   - Keep ALL protocols and version numbers
   - Keep ALL technical terms (differential delta, checksum drift, partial block corruption, etc.)
   - Example GOOD: "Cross-tenant differential delta replication causing checksum drift and partial block corruption when pushing policy-driven configuration changes"
   - Example BAD: "Performance issues with updates"

3. **Key Insights** - Capture business AND technical signals:
   - Include buying signals (urgency, budget mentions, decision criteria)
   - Include implied needs (if they ask about scalability → growth plans, if they ask about security → compliance concerns)
   - Include technical requirements mentioned (preserve exact technical terms)
   - Include any risk factors or concerns raised

4. **Discovery Q&A** - Use actual responses:
   - Fill in answers based on what was ACTUALLY said
   - If a question wasn't discussed, use 'Not discussed'
   - Preserve technical details in answers

5. **Quality Checklist** (verify before responding):
   ✓ Every technical term from transcript appears somewhere in the output
   ✓ No acronyms were expanded (keep "RMM" not "Remote Monitoring and Management")
   ✓ No version numbers dropped
   ✓ No protocols simplified
   ✓ Discussion Summary is detailed and comprehensive, not brief`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { 
          role: "system", 
          content: `You are an expert business analyst creating formal meeting minutes for enterprise sales calls.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. EXTRACT ONLY from the actual conversation transcript provided - DO NOT invent or assume ANY information
2. If names, companies, or details are NOT mentioned in the conversation, return EMPTY ARRAY for attendees (backend will handle with "Not mentioned")
3. NEVER use placeholder names like "John Smith", "Tech Ventures", "Acme Corp", "Sales Representative" unless those EXACT names/titles are explicitly stated in the conversation
4. Preserve technical detail with 100% fidelity - never paraphrase technical questions, never drop acronyms, never simplify protocols or version numbers
5. DO NOT use generic speaker labels (Speaker 1, Speaker 2, Sales Rep) - if no names found in conversation, return EMPTY attendees array
6. Extract company names ONLY if explicitly stated in the conversation - if not mentioned, leave blank or use "Not mentioned"
7. Your output must be VERIFIABLE against the conversation transcript - every detail should be traceable to something actually said
8. IMPORTANT FOR CRM: These meeting minutes are for the sales rep to add to their CRM. In ALL text fields (discussionSummary, notes, etc.), attribute explanations and responses to "the sales representative" - NEVER use "AI Assistant", "the assistant", or "AI". Example: Write "The sales representative explained..." NOT "The AI Assistant explained..."`
        },
        { role: "user", content: minutesPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,  // Lower temperature for more precise extraction
      top_p: 0.2,         // More focused sampling
      presence_penalty: 0.1,  // Reduce tendency to add novel information
      max_tokens: 1500,   // Increased for detailed extraction
    });

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in AI response");
    }
    const cleanedContent = cleanJSONResponse(messageContent);
    const result = JSON.parse(cleanedContent);
    
    // Use actual meeting start time from session metadata (not current time)
    const meetingTime = meetingStartTime || new Date();
    const defaultDate = meetingTime.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const defaultTime = meetingTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    console.log(`📅 Meeting metadata: ${defaultDate} at ${defaultTime} (from ${meetingStartTime ? 'session start' : 'current time'})`);
    
    // STRICT: If AI didn't extract attendees, it means they're NOT in the conversation
    let finalAttendees = result.attendees || [];
    if (finalAttendees.length === 0 || !Array.isArray(finalAttendees)) {
      console.warn(`⚠️ AI did not extract attendees from conversation - none mentioned`);
      finalAttendees = ["Not mentioned in conversation"];
    }
    
    // Validate extracted data to ensure obvious placeholders are caught
    // Only filter out entries that are clearly generic labels/examples
    const isObviousPlaceholder = (attendee: string): boolean => {
      const normalized = attendee.toLowerCase().trim();
      
      // Exact matches for obvious example names and labels
      const obviousPlaceholders = [
        // Example placeholder names
        'john', 'jane', 'john smith', 'jane doe', 'john doe',
        // Example companies
        'tech ventures', 'acme corp', 'acme', 'example',
        // System labels
        'user', 'ai', 'assistant', 'system',
        // Numbered labels (Speaker 1, Participant 2, etc.)
        'speaker 1', 'speaker 2', 'speaker 3', 'speaker 4',
        'participant 1', 'participant 2', 'participant 3',
        'attendee 1', 'attendee 2', 'attendee 3'
      ];
      
      if (obviousPlaceholders.includes(normalized)) {
        return true;
      }
      
      // Pattern matches for numbered labels only
      if (/^(speaker|participant|attendee)\s*\d+$/i.test(normalized)) {
        return true;
      }
      
      return false;
    };
    
    const filteredAttendees = finalAttendees.filter((a: string) => !isObviousPlaceholder(a));
    
    if (filteredAttendees.length < finalAttendees.length) {
      const removed = finalAttendees.filter((a: string) => isObviousPlaceholder(a));
      console.warn(`🚨 OBVIOUS PLACEHOLDERS REMOVED: ${removed.join(', ')}`);
      console.warn(`   Kept attendees: ${filteredAttendees.join(', ') || 'None'}`);
      console.warn(`   NOTE: Generic titles without names (e.g., "Sales Representative") are preserved if AI extracted them from conversation`);
      finalAttendees = filteredAttendees.length > 0 ? filteredAttendees : ["Not mentioned in conversation"];
    }
    
    // Log extraction results for debugging
    console.log(`📊 Meeting Minutes Extraction Results:`);
    console.log(`   - Attendees: ${finalAttendees.join(', ')}`);
    console.log(`   - Company: ${result.companyName || 'Not mentioned'}`);
    console.log(`   - Opportunity: ${result.opportunityName || 'Not mentioned'}`);
    
    return {
      date: result.date || defaultDate,
      time: result.time || defaultTime,
      duration: result.duration || 'Not specified',
      attendees: finalAttendees,
      companyName: result.companyName || 'Not mentioned',
      opportunityName: result.opportunityName || 'Not mentioned',
      meetingType: result.meetingType || 'Not mentioned',  // Changed from 'Discovery'
      discussionSummary: result.discussionSummary || 'Not mentioned',
      discoveryQA: result.discoveryQA || [],
      bant: {
        budget: result.bant?.budget || 'Not discussed',
        authority: result.bant?.authority || 'Not discussed',
        need: result.bant?.need || 'Not discussed',
        timeline: result.bant?.timeline || 'Not discussed'
      },
      challenges: result.challenges || [],
      keyInsights: result.keyInsights || [],
      actionItems: result.actionItems || [],
      followUpPlan: {
        nextMeetingDate: result.followUpPlan?.nextMeetingDate || 'Not mentioned',  // Changed from 'To be scheduled'
        documentsToShare: result.followUpPlan?.documentsToShare || [],
        internalAlignment: result.followUpPlan?.internalAlignment || []
      },
      notes: result.notes || ''
    };
  } catch (error: any) {
    console.error("Meeting minutes generation error:", error);
    
    // ALWAYS re-throw errors - never return synthetic data
    // This ensures frontend gets clear error message instead of fake data
    throw new Error(
      error.message?.includes('too short') || error.message?.includes('Insufficient')
        ? error.message
        : `Failed to generate meeting minutes: ${error.message || 'Unknown error'}. Please ensure the conversation has sufficient content and try again.`
    );
  }
}

export async function generateProductReference(domainExpertise: string = "Generic Product", userId?: string): Promise<any[]> {
  // SPEED OPTIMIZATION: Cache product reference for 10 minutes per domain
  const cacheKey = `product-ref:${domainExpertise}`;
  const cached = aiCache.get<any[]>(cacheKey);
  if (cached) {
    console.log(`⚡ Product reference from cache for ${domainExpertise}`);
    return cached;
  }
  
  try {
    let client;
    let model;
    
    // Prefer DeepSeek for speed
    if (deepseek) {
      client = deepseek;
      model = "deepseek-chat";
    } else if (userId) {
      const aiConfig = await getAIClient(userId);
      client = aiConfig.client;
      model = aiConfig.model;
    } else {
      throw new Error("AI engine not configured");
    }
    
    // SPEED: Simplified prompt, fewer products
    const productPrompt = `List 8 key ${domainExpertise} products/features as JSON array:
[{"code":"CODE","name":"Name","description":"Brief description"}]
Cover: core platform, enterprise, analytics, automation, integrations, mobile, AI, security.`;

    const startTime = Date.now();
    
    // Add timeout for product reference
    const aiCallPromise = client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: `${domainExpertise} product expert.` },
        { role: "user", content: productPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 600, // Reduced from 2000
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Product reference timeout')), 5000)
    );
    
    const response = await Promise.race([aiCallPromise, timeoutPromise]) as any;
    console.log(`⚡ Product reference generated in ${Date.now() - startTime}ms`);

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in DeepSeek API response");
    }
    
    const cleanedContent = cleanJSONResponse(messageContent);
    const result = JSON.parse(cleanedContent);
    
    // Handle both array and object with array property
    const products = Array.isArray(result) ? result : (result.products || result.items || []);
    const finalProducts = products.length > 0 ? products : getDefaultProductReference(domainExpertise);
    
    // Cache for 10 minutes
    aiCache.set(cacheKey, finalProducts, 600);
    return finalProducts;
  } catch (error) {
    console.error("Product reference generation error:", error);
    return getDefaultProductReference(domainExpertise);
  }
}

function getDefaultProductReference(domainExpertise: string): any[] {
  return [
    {
      code: "CORE",
      name: `${domainExpertise} Core Platform`,
      description: `Foundation features including workflow automation, data management, and basic integrations for ${domainExpertise}`
    },
    {
      code: "ENTERPRISE",
      name: `${domainExpertise} Enterprise Edition`,
      description: "Advanced capabilities with enhanced security, scalability, and enterprise-grade support"
    },
    {
      code: "ANALYTICS",
      name: "Analytics & Reporting",
      description: "Business intelligence, dashboards, custom reports, and data visualization tools"
    },
    {
      code: "AUTOMATION",
      name: "Automation Suite",
      description: "Workflow automation, process orchestration, and business rule engines"
    },
    {
      code: "API",
      name: "API & Integration Platform",
      description: "RESTful APIs, webhooks, pre-built connectors, and custom integration tools"
    },
    {
      code: "CRM",
      name: "Customer Management",
      description: "Contact management, sales pipeline, opportunity tracking, and customer insights"
    },
    {
      code: "MOBILE",
      name: "Mobile Edition",
      description: "Native mobile apps, offline access, push notifications, mobile workflows"
    },
    {
      code: "AI",
      name: "AI Assistant",
      description: "AI-powered virtual assistant, intelligent search, automated workflows"
    },
    {
      code: "SECURITY",
      name: "Security & Compliance",
      description: "Access control, audit logs, compliance reporting, data protection"
    },
    {
      code: "SUPPORT",
      name: "Premium Support",
      description: "Priority support, dedicated account manager, SLA guarantees, 24/7 assistance"
    }
  ];
}

export async function answerConversationQuestion(
  question: string,
  conversationContext: string,
  domainExpertise: string = "Generic Product",
  userId?: string,
  domainExpertiseId?: string
): Promise<string> {
  const isUniversal = !domainExpertise || 
    domainExpertise === "Generic Product" || 
    domainExpertise === "Universal RV Mode" || 
    domainExpertise.toLowerCase().includes("universal");
  
  console.log(`❓ Answer Question: domain="${domainExpertise}", strict=${!isUniversal}, question="${question.slice(0, 50)}..."`);
  
  let trainingDocumentsContext = "";
  if (userId) {
    try {
      trainingDocumentsContext = await getTrainingDocumentContext(
        userId, 
        12000, 
        true, 
        question, 
        15, 
        domainExpertise,
        conversationContext,
        !isUniversal
      );
      
      if (trainingDocumentsContext) {
        console.log(`🎯 Answer Question: Found ${trainingDocumentsContext.length} chars of domain knowledge (strict: ${!isUniversal})`);
        trainingDocumentsContext = `\n\n=== DOMAIN-SPECIFIC KNOWLEDGE (${domainExpertise})${!isUniversal ? ' - STRICT ISOLATION' : ''} ===
${trainingDocumentsContext}
=== END OF DOMAIN KNOWLEDGE ===

${!isUniversal ? 'CRITICAL: Use ONLY the domain knowledge above. Do not reference any other domains or external knowledge.' : 'Use this knowledge to prioritize domain-specific information over general knowledge.'}

`;
      }
    } catch (error) {
      console.error("Error fetching training context for Q&A:", error);
    }
  }
  
  const context = conversationContext || "No conversation context available";
  const prompt = `You are an expert sales assistant specializing in ${domainExpertise}. 
${trainingDocumentsContext}
Conversation Context:
${context}

Question: ${question}

RESPONSE RULES - BE CONCISE AND ACTIONABLE:

1. BREVITY IS KEY: Keep responses short and scannable (50-150 words ideal)
2. NO FLUFF: Skip introductions like "Great question!" or "I'd be happy to help"
3. ACTIONABLE: Every point should be something the rep can use immediately
4. EASY TO READ: Use bullet points (•) for quick scanning during a live call

RESPONSE FORMAT:

For sales strategy questions:
• Point 1 - actionable insight
• Point 2 - specific recommendation
• Point 3 - suggested question or approach
(Maximum 4-5 points)

For customer-facing answers:
**Quick Answer:** [1-2 sentence summary the rep can read directly]

**Key Points:**
• Main benefit 1
• Main benefit 2

**Suggest:** [One concrete next step]

CRITICAL: This answer will be read during a LIVE CALL. Keep it short, clear, and immediately useful. No lengthy explanations.`;

  try {
    // Try to get user-specific AI client, fallback to DeepSeek if no userId
    let aiClient;
    if (userId) {
      aiClient = await getAIClient(userId);
    }
    
    if (!aiClient && deepseek) {
      // Fallback to DeepSeek if user doesn't have custom engine
      aiClient = {
        client: deepseek,
        model: "deepseek-chat",
        engine: "deepseek"
      };
    }
    
    if (!aiClient) {
      throw new Error("No AI client available");
    }

    const response = await aiClient.client.chat.completions.create({
      model: aiClient.model,
      messages: [
        {
          role: "system",
          content: `You are a CONCISE sales assistant for ${domainExpertise}. Your answers are read during LIVE calls.

STRICT RULES:
- Maximum 150 words per response
- Use bullet points (•) for easy scanning
- No filler phrases or lengthy explanations
- Every sentence must be actionable
- Write as if the rep will read this aloud to a customer`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    const answer = response.choices[0]?.message?.content?.trim() || "I couldn't generate an answer. Please try rephrasing your question.";
    return answer;

  } catch (error: any) {
    console.error("Error in answerConversationQuestion:", error);
    return "Unable to answer the question at this time. Please try again.";
  }
}

export interface ShiftGearsTip {
  type: "rebuttal" | "objection" | "next_step" | "technical" | "psychological" | "closure" | "competitive" | "discovery" | "qualification" | "trust_building" | "risk_alert";
  title: string;
  action: string;
  priority: "high" | "medium" | "low";
  expected_reaction?: string;
}

export async function generateShiftGearsTips(
  conversationText: string,
  domainExpertise: string = "Generic Product",
  userId?: string
): Promise<ShiftGearsTip[]> {
  try {
    const startTime = Date.now();
    
    // CRITICAL FIX: Detect pricing queries and enhance semantic search
    const lowerText = conversationText.toLowerCase();
    const isPricingQuery = /pric(e|ing|es)|cost|fee|rate|subscription|per\s*(user|seat|month|year)|how\s*much|budget|quote|₹|\$|euro|inr|usd/.test(lowerText);
    
    // PERFORMANCE: Run training context and knowledge imports in parallel
    // ENHANCED: Use SEMANTIC SEARCH for contextually relevant knowledge
    // DOMAIN ISOLATION: Pass domainExpertise to only load knowledge from the selected domain
    // SPEED OPTIMIZATION: Use last 800 chars of conversation for semantic search relevance
    const recentConversation = conversationText.slice(-800);
    
    // Build enhanced semantic query for pricing questions
    let semanticQuery = recentConversation;
    if (isPricingQuery) {
      semanticQuery = `pricing price cost fee subscription rate per user per seat ${recentConversation}`;
      console.log('💰 ShiftGears: PRICING QUERY DETECTED - Searching for pricing data in training materials');
    }
    
    const [trainingContext, knowledgeModule] = await Promise.all([
      userId ? getTrainingDocumentContext(userId, 3000, false, semanticQuery, 5, domainExpertise) : Promise.resolve(""),
      import("./knowledge-service")
    ]);
    
    // DOMAIN-FIRST STRATEGY: If domain-specific training exists, prioritize it heavily
    const hasDomainTraining = trainingContext && trainingContext.trim().length > 100;
    
    // BALANCED: Lightweight knowledge without playbooks for speed, but keep full keyword context
    const { knowledgeService } = knowledgeModule;
    const keywords = knowledgeService.extractKeywordsFromTranscript(conversationText);
    
    // CRITICAL FIX: Include domain expertise in keyword extraction for better context
    const enhancedProductKeywords = [
      ...keywords.productKeywords,
      ...(domainExpertise ? domainExpertise.toLowerCase().split(/\s+/).filter(w => w.length > 2) : [])
    ];
    
    // SPEED: Only fetch universal knowledge if no domain training exists
    const knowledge = hasDomainTraining 
      ? { relevantProducts: [], relevantCaseStudies: [], relevantPlaybooks: [] }
      : await knowledgeService.buildKnowledgeContext({
          problemKeywords: keywords.problemKeywords,
          productKeywords: enhancedProductKeywords,
          industries: keywords.industries,
          includePlaybooks: false // SPEED: Skip playbooks (biggest bottleneck)
        });
    
    console.log(`⚡ ShiftGears prep: ${Date.now() - startTime}ms | Domain: ${domainExpertise} | HasTraining: ${hasDomainTraining}`);
    
    // Get structured prompt from registry (pass conversationText for dynamic domain detection)
    const { promptRegistry } = await import("./prompt-registry");
    const systemPrompt = promptRegistry.buildShiftGearsPrompt(knowledge, domainExpertise, trainingContext, conversationText);
    
    let client;
    let model;
    
    if (userId) {
      try {
        const aiConfig = await getAIClient(userId);
        client = aiConfig.client;
        model = aiConfig.model;
      } catch (error) {
        if (!deepseek) throw new Error("AI engine not configured");
        client = deepseek;
        model = "deepseek-chat";
      }
    } else {
      if (!deepseek) throw new Error("Default AI engine not configured");
      client = deepseek;
      model = "deepseek-chat";
    }

    // CRITICAL FIX: Extract last 10 conversation turns for contextual grounding
    const conversationLines = conversationText.trim().split('\n').filter(line => line.trim());
    const recentTurns = conversationLines.slice(-10).join('\n');
    const conversationKeywords = conversationLines
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 30)
      .join(', ');

    const userPrompt = `LIVE CALL (last turns):
${recentTurns}
${domainExpertise ? `Domain: ${domainExpertise}` : ''}

STEP 1: Detect customer intent - Is customer: asking question? objecting? comparing competitor? signaling disinterest? walking away? negotiating? deflecting? requesting technical clarification? escalating to procurement? delaying?
STEP 2: Analyze conversation state. Auto-detect best framework. Detect stage, buyer intent, emotional signals, deal risk.
STEP 3: Generate exactly 3 coaching tips for the rep RIGHT NOW based on detected intent.
Each tip: exact words to say (seller-ready, no fluff), expected prospect reaction, next likely branch. Respond to what was JUST said. JSON only:
{"lrm_reasoning":{"stage":"opening|discovery|pain_identification|qualification|positioning|objection_handling|decision|closing","buyer_intent":"1 sentence","our_goal":"1 sentence","strategy":"1 sentence","framework":"auto-detected","deal_risk":"low|medium|high","emotional_signal":"dominant signal","detected_intent":"question|objection|disinterest|walking_away|negotiation|deflection|technical_clarification|procurement_escalation|delay|normal"},"tips":[{"type":"next_step|objection|rebuttal|technical|psychological|closure|competitive|discovery|qualification|trust_building|risk_alert|walking_away_recovery|negotiation|re_alignment","title":"10 words max","action":"exact words to say (30-50 words)","priority":"high|medium|low","expected_reaction":"what prospect will likely do"}]}`;

    // STRUCTURED LOGGING: Verify knowledge retrieval and context
    console.log('📊 Shift Gears Context:', {
      domain: domainExpertise,
      transcriptLength: conversationText.length,
      recentConversationLines: conversationLines.slice(-10).length,
      extractedKeywords: {
        problem: keywords.problemKeywords.slice(0, 5),
        product: keywords.productKeywords.slice(0, 5),
        industries: keywords.industries
      },
      knowledge: {
        products: knowledge.relevantProducts.map(p => `${p.name} (${p.code})`),
        caseStudies: knowledge.relevantCaseStudies.map(c => `${c.title} - ${c.industry}`),
        playbooks: knowledge.relevantPlaybooks.map(p => p.title)
      }
    });

    const fastModel = model.includes('gpt-4') ? 'gpt-4o-mini' 
                    : model.includes('claude') ? 'claude-3-5-haiku-latest'
                    : model.includes('gemini') ? 'gemini-2.0-flash'
                    : model;
    
    const aiStartTime = Date.now();
    let response;
    const modelsToTry = fastModel !== model ? [fastModel, model] : [model];
    
    for (const tryModel of modelsToTry) {
      try {
        console.log(`⚡ ShiftGears: Trying model ${tryModel}...`);
        response = await client.chat.completions.create({
          model: tryModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.12,
          max_tokens: 600,
        });
        console.log(`⚡ ShiftGears AI call: ${Date.now() - aiStartTime}ms | Model: ${tryModel}`);
        break;
      } catch (modelError: any) {
        console.warn(`⚠️ ShiftGears: Model ${tryModel} failed: ${modelError.message}`);
        if (tryModel === modelsToTry[modelsToTry.length - 1]) throw modelError;
      }
    }
    
    if (!response) throw new Error("All models failed");

    // Track token usage for Shift Gears - use engine from initial config, don't re-call getAIClient
    if (userId) {
      try {
        const aiConfig = await getAIClient(userId);
        await recordTokenUsage(userId, mapEngineToProvider(aiConfig.engine), response, 'shift_gears');
      } catch {
        // If user API key is corrupted, still track usage as deepseek
        if (client === deepseek) {
          await recordTokenUsage(userId, 'deepseek', response, 'shift_gears');
        }
      }
    }

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in AI response");
    }
    
    const cleanedContent = cleanJSONResponse(messageContent);
    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch (parseErr: any) {
      console.warn(`⚠️ Shift Gears JSON parse failed: ${parseErr.message}, attempting repair`);
      let repaired = cleanedContent;
      const lastComplete = repaired.lastIndexOf('}');
      if (lastComplete > 0) {
        repaired = repaired.substring(0, lastComplete + 1);
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;
        for (let i = closeBrackets; i < openBrackets; i++) repaired += ']';
        for (let i = closeBraces; i < openBraces; i++) repaired += '}';
      }
      try {
        result = JSON.parse(repaired);
        console.log(`✅ Shift Gears JSON repaired successfully`);
      } catch {
        throw parseErr;
      }
    }
    const tips = result.tips || [];
    
    // LOG: Verify AI response is contextual with total timing
    console.log(`✅ Shift Gears Response (Total: ${Date.now() - startTime}ms):`, {
      tipsCount: tips.length,
      tipTypes: tips.map((t: ShiftGearsTip) => t.type),
      tipTitles: tips.map((t: ShiftGearsTip) => t.title)
    });
    
    // Ensure exactly 3 tips
    if (tips.length > 3) {
      return tips.slice(0, 3);
    } else if (tips.length === 0) {
      return getDefaultShiftGearsTips(domainExpertise);
    }
    
    return tips;
  } catch (error) {
    console.error("Shift Gears tips generation error:", error);
    return getDefaultShiftGearsTips(domainExpertise);
  }
}

function getDefaultShiftGearsTips(domainExpertise: string): ShiftGearsTip[] {
  return [
    {
      type: "discovery",
      title: "Start with a SPIN question",
      action: `Say: 'Tell me about your current ${domainExpertise} setup - what's working well and what could be better?' This opens up pain points naturally.`,
      priority: "high"
    },
    {
      type: "psychological",
      title: "Listen and acknowledge first",
      action: "Before pitching, say: 'That makes sense - I hear that a lot.' This builds trust and shows you understand their world.",
      priority: "medium"
    },
    {
      type: "next_step",
      title: "Propose a clear next step",
      action: "Say: 'Would it be helpful if I showed you how we've solved this for similar companies? I could do a quick 20-minute demo this week.'",
      priority: "medium"
    }
  ];
}

export interface QueryPitch {
  query: string;
  queryType: "technical" | "pricing" | "features" | "integration" | "support" | "general" | "comparison" | "challenge";
  pitch: string;
  keyPoints: string[];
}

export async function generateQueryPitches(
  conversationText: string,
  domainExpertise: string = "Generic Product",
  userId?: string
): Promise<QueryPitch[]> {
  try {
    // CRITICAL FIX: Detect pricing queries and use semantic search with pricing keywords
    const lowerText = conversationText.toLowerCase();
    const isPricingQuery = /pric(e|ing|es)|cost|fee|rate|subscription|per\s*(user|seat|month|year)|how\s*much|budget|quote|₹|\$|euro|inr|usd/.test(lowerText);
    
    // Extract the last 2 turns to understand what's being asked RIGHT NOW
    const lines = conversationText.trim().split('\n').filter(line => line.trim());
    const recentQuery = lines.slice(-3).join(' ');
    
    // Build semantic search query - prioritize pricing terms if it's a pricing question
    let semanticQuery = recentQuery;
    if (isPricingQuery) {
      semanticQuery = `pricing price cost fee subscription rate ${recentQuery}`;
      console.log('💰 PRICING QUERY DETECTED - Using enhanced semantic search for pricing data');
    }
    
    // Fetch training context with SEMANTIC SEARCH using the actual query for high accuracy
    // DOMAIN ISOLATION: Pass domainExpertise to only load knowledge from the selected domain
    const [trainingContext, knowledgeModule] = await Promise.all([
      userId ? getTrainingDocumentContext(userId, 3000, false, semanticQuery, 5, domainExpertise) : Promise.resolve(""),
      import("./knowledge-service")
    ]);
    
    // Retrieve knowledge base context for enhanced responses (optimized - no playbooks for speed)
    const { knowledgeService } = knowledgeModule;
    const keywords = knowledgeService.extractKeywordsFromTranscript(conversationText);
    const knowledge = await knowledgeService.buildKnowledgeContext({
      problemKeywords: keywords.problemKeywords,
      productKeywords: keywords.productKeywords,
      industries: keywords.industries,
      includePlaybooks: false // PERFORMANCE: Skip playbooks for faster response (not critical for query pitches)
    });
    
    // STRUCTURED LOGGING: Verify knowledge retrieval and context
    console.log('📊 Customer Query Pitches Context:', {
      domain: domainExpertise,
      transcriptLength: conversationText.length,
      trainingContextLength: trainingContext.length,
      trainingContextPreview: trainingContext.slice(0, 500),
      hasTrainingContext: trainingContext.length > 100,
      extractedKeywords: {
        problem: keywords.problemKeywords.slice(0, 5),
        product: keywords.productKeywords.slice(0, 5),
        industries: keywords.industries
      },
      knowledge: {
        products: knowledge.relevantProducts.map(p => `${p.name} (${p.code})`),
        caseStudies: knowledge.relevantCaseStudies.map(c => `${c.title} - ${c.industry}`),
        playbooks: knowledge.relevantPlaybooks.map(p => p.title)
      }
    });
    
    // Get structured prompt from registry (pass conversationText for dynamic domain detection)
    const { promptRegistry } = await import("./prompt-registry");
    const systemPrompt = promptRegistry.buildCustomerQueryPitchesPrompt(knowledge, domainExpertise, trainingContext, conversationText);
    
    let client;
    let model;
    
    let originalModel = "";
    
    if (userId) {
      try {
        const aiConfig = await getAIClient(userId);
        client = aiConfig.client;
        model = aiConfig.model;
        originalModel = model;
        
        const fastModel = model.includes('gpt-4') ? 'gpt-4o-mini'
                        : model.includes('claude') ? 'claude-3-5-haiku-latest'
                        : model.includes('gemini') ? 'gemini-2.0-flash'
                        : model;
        model = fastModel;
      } catch (error) {
        if (!deepseek) throw new Error("AI engine not configured");
        client = deepseek;
        model = "deepseek-chat";
      }
    } else {
      if (!deepseek) throw new Error("Default AI engine not configured");
      client = deepseek;
      model = "deepseek-chat";
    }

    const userPrompt = `TRANSCRIPT (recent):
${conversationText.slice(-1200)}
Focus: ${domainExpertise}

DETECT AND EXTRACT every customer query, concern, objection, and challenge from the transcript above. Include:
- Direct questions ("what is", "how does", "can you", "tell me about")
- Indirect questions ("I want to know", "we're looking at", "what are the offerings")
- Objections disguised as questions ("isn't that expensive?", "why switch?")
- Walking-away signals ("we'll think about it", "send proposal", "not interested")
- Pricing inquiries, technical queries, comparison requests

Auto-detect buyer persona and conversation stage. Select best framework.
For each detected query generate a pitch (40-80 words): direct answer + business value translation + risk reduction + confidence positioning.
If objection hidden in question: address surface question AND underlying concern.
For pricing: use EXACT values from training docs only. Never guess.
End each pitch with a micro-close or leverage follow-up question.

JSON: {"queries":[{"query":"exact question/concern","queryType":"technical|pricing|features|integration|support|general|comparison|challenge|objection|walking_away","pitch":"40-80 words: direct answer + value + risk reduction","keyPoints":["point1","point2","point3"],"followUpQuestion":"micro-close or leverage question"}]}`;

    let response;
    const modelsToTry = (originalModel && originalModel !== model) ? [model, originalModel] : [model];
    
    for (const tryModel of modelsToTry) {
      try {
        console.log(`💬 QueryPitches: Trying model ${tryModel}...`);
        response = await client.chat.completions.create({
          model: tryModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.15,
          max_tokens: 1500,
        });
        console.log(`💬 QueryPitches: Model ${tryModel} succeeded`);
        break;
      } catch (modelError: any) {
        console.warn(`⚠️ QueryPitches: Model ${tryModel} failed: ${modelError.message}`);
        if (tryModel === modelsToTry[modelsToTry.length - 1]) throw modelError;
      }
    }
    
    if (!response) throw new Error("All models failed");

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in AI response");
    }
    
    const cleanedContent = cleanJSONResponse(messageContent);
    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      console.warn(`⚠️ QueryPitches: JSON parse failed (${parseError.message}), attempting repair...`);
      let repaired = cleanedContent;
      if (!repaired.endsWith('}')) {
        const lastComplete = repaired.lastIndexOf('},');
        if (lastComplete > 0) {
          repaired = repaired.substring(0, lastComplete + 1) + ']}';
        } else {
          const lastBrace = repaired.lastIndexOf('}');
          if (lastBrace > 0) {
            repaired = repaired.substring(0, lastBrace + 1) + ']}';
          }
        }
      }
      try {
        result = JSON.parse(repaired);
        console.log('✅ QueryPitches: JSON repair succeeded');
      } catch {
        console.error('❌ QueryPitches: JSON repair also failed');
        return [];
      }
    }
    const queries = result.queries || [];
    
    console.log('✅ Customer Query Pitches Response:', {
      queriesCount: queries.length,
      queryTypes: queries.map((q: QueryPitch) => q.queryType),
      queries: queries.map((q: QueryPitch) => q.query)
    });
    
    return queries.slice(0, 5);
  } catch (error) {
    console.error("Query pitch generation error:", error);
    return [];
  }
}

/**
 * Generate Present to Win sales materials based on conversation
 */
export async function generatePresentToWin(
  type: string,
  conversationContext: string,
  domainExpertise: string,
  userId: string
): Promise<any> {
  try {
    console.log(`🎯 Starting Present to Win generation for user ${userId}, type: ${type}, domain: ${domainExpertise}`);
    let client: any;
    let model: string;
    let engine: string;
    
    try {
      const aiConfig = await getAIClient(userId);
      client = aiConfig.client;
      model = aiConfig.model;
      engine = aiConfig.engine;
    } catch (aiError: any) {
      console.warn(`⚠️ Present to Win: User AI key failed (${aiError.message}), falling back to DeepSeek`);
      if (!deepseek) {
        throw new Error("AI engine not available - please configure your API key in Settings");
      }
      client = deepseek;
      model = "deepseek-chat";
      engine = "deepseek";
    }
    console.log(`🎯 Using AI engine: ${engine}, model: ${model}`);

    // CACHE KEY: provider + model + type + domain + last 300 chars
    // NOTE: Battle cards are NEVER cached because they must be fully contextual to the entire conversation
    const cacheKey = `present:${engine}:${model}:${type}:${domainExpertise}:${conversationContext.slice(-300)}`;
    
    if (type !== 'battle-card') {
      const cached = aiCache.get<any>(cacheKey);
      if (cached) {
        console.log(`⚡ ${type} from CACHE`);
        return cached;
      }
    } else {
      console.log(`🔄 Battle card caching DISABLED for contextual accuracy`);
    }

    // Optimize: Limit context to last 4000 characters for faster generation
    const optimizedContext = conversationContext.length > 4000
      ? "..." + conversationContext.slice(-4000)
      : conversationContext;
    console.log(`🎯 Context length: ${conversationContext.length}, optimized: ${optimizedContext.length}`);

    if (type === 'pitch-deck') {
      console.log(`⚡ ULTRA-FAST pitch deck`);
      
      // PRIORITY 1: Fetch Train Me documents (reduced for speed)
      // DOMAIN ISOLATION: Pass domainExpertise to only load knowledge from the selected domain
      const trainingContext = await getTrainingDocumentContext(userId, 4000, true, undefined, SEMANTIC_SEARCH_LIMIT, domainExpertise);
      console.log(`📚 Pitch Deck - Training documents loaded: ${trainingContext ? trainingContext.length : 0} chars`);
      
      // Ultra-optimized: last 1000 chars only for speed
      const ultraContext = conversationContext.length > 1000
        ? conversationContext.slice(-1000)
        : conversationContext;
      
      // Inject intelligence engine supplement
      const supplement = buildPromptSupplement(conversationContext, domainExpertise, 'pitch_deck');
      const supplementText = formatPromptSupplement(supplement);
      
      // Build compact training context section
      const trainingSection = trainingContext && trainingContext.trim().length > 0
        ? `\n=== TRAINING DOCS ===\n${trainingContext.slice(0, 2000)}\n===\n`
        : '';
      
      const prompt = `${supplementText}${trainingSection}
${domainExpertise} pitch (5 slides). Context: ${ultraContext}

JSON:
{
  "slides": [
    {"title": "Hook", "highlight": "stat", "content": ["pt1", "pt2", "pt3"]},
    {"title": "Problem", "highlight": "", "content": ["p1", "p2", "p3"]},
    {"title": "Solution", "highlight": "", "content": ["s1", "s2", "s3"]},
    {"title": "Benefits", "highlight": "stat", "content": ["b1", "b2", "b3"]},
    {"title": "Next Steps", "highlight": "", "content": ["step1", "step2"]}
  ]
}`;

      const response = await client.chat.completions.create({
        model: model.includes('gpt-4') && !model.includes('mini') ? 'gpt-4o-mini' : model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 500,
      });

      // Track token usage for pitch deck
      if (userId) {
        await recordTokenUsage(userId, mapEngineToProvider(engine), response, 'present_to_win_pitch_deck');
      }

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in AI response");
      const cleanedContent = cleanJSONResponse(content);
      const result = JSON.parse(cleanedContent);
      
      // Inject intelligence metadata into result
      result._meta = {
        domain: supplement.domainBadge,
        compliance: supplement.complianceBanner || null,
        claimGuardrails: supplement.claimGuardrails,
        differentiationHints: supplement.differentiationHints
      };
      
      // Cache result
      aiCache.set(cacheKey, result, 120000);
      
      return result;

    } else if (type === 'case-study') {
      console.log(`⚡ Generating contextual case study for domain: ${domainExpertise}`);
      
      // PRIORITY 1: Fetch Train Me documents for contextual accuracy (reduced for speed)
      // DOMAIN ISOLATION: Pass domainExpertise to only load knowledge from the selected domain
      const trainingContext = await getTrainingDocumentContext(userId, 6000, true, undefined, SEMANTIC_SEARCH_LIMIT, domainExpertise);
      const hasTrainingDocs = trainingContext && trainingContext.trim().length > 100;
      console.log(`📚 Case Study - Training documents loaded: ${trainingContext ? trainingContext.length : 0} chars`);
      
      // Use optimized conversation context for speed
      const conversationSummary = conversationContext.length > 1500
        ? conversationContext.slice(-1500)
        : conversationContext;
      
      // Inject intelligence engine supplement with case study tagging
      const supplement = buildPromptSupplement(conversationContext, domainExpertise, 'case_study');
      const supplementText = formatPromptSupplement(supplement);
      
      // Determine source priority
      const sourceType = hasTrainingDocs ? 'train_me' : 'knowledge_base';
      
      // Build compact training context section for speed
      const trainingSection = hasTrainingDocs
        ? `
=== PRIORITY KNOWLEDGE SOURCE: TRAINING DOCUMENTS ===
${trainingContext.slice(0, 4000)}
=== END TRAINING DOCUMENTS ===

CRITICAL INSTRUCTIONS FOR CASE STUDY GENERATION:
1. SEARCH the training documents above for ANY real case studies, customer success stories, testimonials, or documented results
2. If you find real case study data (company names, actual metrics, real outcomes), EXTRACT and use that data directly
3. Use actual customer names, real statistics, and documented results from the training materials
4. Set verificationType to "real" and verificationLabel to "Verified Case Study" if using documented data
5. If the training docs contain general product info but NO specific case studies, generate a realistic example and set verificationType to "illustrative"
6. DO NOT invent metrics that aren't in the documents - use actual data or clearly mark as illustrative
7. Citation should be "Source: Training Documents - [Document Name]" if from real case study data
`
        : `Generate an illustrative ${domainExpertise} case study. This is HYPOTHETICAL for demonstration purposes.
Set verificationType to "illustrative" and verificationLabel to "Illustrative Example".
Citation: "Source: Illustrative Example"
`;
      
      const prompt = `${supplementText}${trainingSection}

=== CURRENT CONVERSATION CONTEXT ===
The seller is having a conversation with a customer. Analyze this to understand:
- What product/service is being discussed?
- What are the customer's pain points and challenges?
- What industry/company type is the customer from?
- What outcomes does the customer want?

CONVERSATION:
${conversationSummary}
=== END CONVERSATION ===

TASK: Generate a CONTEXTUAL case study that:
1. FIRST: Check if training documents contain real case studies that match the customer's industry/situation
2. If real data exists: Use ACTUAL company names, real metrics, documented outcomes from training docs
3. Is RELEVANT to the customer's specific situation discussed in the conversation
4. Addresses the SAME pain points the customer mentioned
5. Shows outcomes that match what the customer is looking for

DOMAIN: ${domainExpertise}

Generate a single-page case study with:
- A title that references the industry/use case from the conversation
- The challenge should mirror the customer's stated pain points
- The solution should show how your product addressed those specific issues
- Metrics should be realistic and from training documents if available
- Include a proper source citation and verification type

JSON format:
{
  "title": "How [Company/Company Type] Achieved [Specific Outcome]",
  "customer": "The actual customer name from docs OR 'A [industry] company'",
  "industry": "Industry from training docs or detected from conversation",
  "challenge": "The specific challenge (2-3 sentences - use actual documented challenges if available)",
  "solution": "How the product solved this (use documented solution details if available)",
  "outcomes": [
    {"metric": "Metric Name", "value": "X%", "confidence": "high/medium", "source": "documented/estimated"},
    {"metric": "Metric Name", "value": "Y", "confidence": "high/medium", "source": "documented/estimated"},
    {"metric": "Metric Name", "value": "Z", "confidence": "high/medium", "source": "documented/estimated"}
  ],
  "verificationType": "real|anonymized|illustrative",
  "verificationLabel": "Verified Case Study|Real Case (Anonymized)|Illustrative Example",
  "citation": "Source: [Training Documents - Document Name] OR [Illustrative Example]",
  "storySource": "${sourceType}"
}`;

      const response = await client.chat.completions.create({
        model: model.includes('gpt-4') && !model.includes('mini') ? 'gpt-4o-mini' : model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 500,
      });

      // Track token usage for case study
      if (userId) {
        await recordTokenUsage(userId, mapEngineToProvider(engine), response, 'present_to_win_case_study');
      }

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in AI response");
      const cleanedContent = cleanJSONResponse(content);
      const result = JSON.parse(cleanedContent);
      
      // Inject intelligence metadata into result - respect AI's determination of verification type
      const isVerified = result.verificationType === 'real' || result.verificationType === 'anonymized';
      result._meta = {
        domain: supplement.domainBadge,
        compliance: supplement.complianceBanner || null,
        verificationType: result.verificationLabel || (hasTrainingDocs && isVerified ? 'Verified Case Study' : 'Illustrative Example'),
        confidenceLevel: isVerified ? 'High - Based on Training Data' : 'Illustrative'
      };
      
      // Ensure citation is set - use AI's citation if provided
      if (!result.citation) {
        result.citation = hasTrainingDocs ? 'Source: Training Documents' : 'Source: Illustrative Example';
      }
      if (!result.storySource) {
        result.storySource = sourceType;
      }
      // Ensure verificationLabel is set for frontend display
      if (!result.verificationLabel) {
        result.verificationLabel = isVerified ? 'Verified Case Study' : 'Illustrative Example';
      }
      
      // Cache result
      aiCache.set(cacheKey, result, 120000);
      
      return result;

    } else if (type === 'battle-card') {
      console.log(`🎯 Generating battle card for domain: ${domainExpertise}`);
      
      // PRIORITY 1: Fetch Train Me documents (reduced for speed)
      // DOMAIN ISOLATION: Pass domainExpertise to only load knowledge from the selected domain
      const trainingContext = await getTrainingDocumentContext(userId, 2000, true, undefined, 3, domainExpertise);
      console.log(`📚 Battle Card - Training: ${trainingContext ? trainingContext.length : 0} chars`);
      
      const fullContext = conversationContext.length > 1000
        ? conversationContext.slice(-1000)
        : conversationContext;
      
      const supplement = buildPromptSupplement(conversationContext, domainExpertise, 'battle_card');
      const supplementText = formatPromptSupplement(supplement);
      
      // LIGHTWEIGHT COMPETITOR EXTRACTION - scan conversation for known competitors
      const extractCompetitorsFromConversation = (text: string): string[] => {
        const competitors: string[] = [];
        const normalizedText = text.toLowerCase();
        
        console.log(`🔍 Extraction - Testing text length: ${text.length}, normalized length: ${normalizedText.length}`);
        console.log(`🔍 Extraction - Normalized sample (first 300 chars): ${normalizedText.substring(0, 300)}`);
        
        // Comprehensive competitor dictionary (case-insensitive patterns)
        const competitorPatterns = [
          // RMM/MSP
          { pattern: /ninja\s*(one|rmm)|ninjarmm/i, name: "NinjaOne" },
          { pattern: /datto\s*rmm|datto/i, name: "Datto RMM" },
          { pattern: /connectwise\s*(automate|manage)|cwcontrol/i, name: "ConnectWise" },
          { pattern: /kaseya\s*vsa|kaseya/i, name: "Kaseya VSA" },
          { pattern: /solarwinds?\s*(rmm)?/i, name: "SolarWinds RMM" },
          { pattern: /syncro/i, name: "Syncro" },
          { pattern: /atera/i, name: "Atera" },
          
          // AI Sales Assistants
          { pattern: /\bgong\b/i, name: "Gong" },
          { pattern: /\bclari\s*copilot\b/i, name: "Clari Copilot" },
          { pattern: /\bavoma\b/i, name: "Avoma" },
          { pattern: /\bfireflies\b/i, name: "Fireflies" },
          { pattern: /salesforce\s*einstein|einstein/i, name: "Salesforce Einstein" },
          
          // PSA
          { pattern: /autotask/i, name: "Autotask PSA" },
          { pattern: /halopsa|halo\s*psa/i, name: "HaloPSA" },
          
          // Security
          { pattern: /crowdstrike/i, name: "CrowdStrike Falcon" },
          { pattern: /sentinelone|sentinel\s*one/i, name: "SentinelOne" },
          { pattern: /microsoft\s*defender|defender\s*(for\s*)?endpoint/i, name: "Microsoft Defender" },
          { pattern: /sophos/i, name: "Sophos" },
          
          // Backup
          { pattern: /veeam/i, name: "Veeam Backup" },
          { pattern: /acronis/i, name: "Acronis Cyber Protect" },
          { pattern: /barracuda\s*backup/i, name: "Barracuda Backup" },
          
          // Cloud Platforms - CRITICAL for contextual accuracy
          { pattern: /\b(google\s*cloud|gcp|google\s*cloud\s*platform)\b/i, name: "Google Cloud Platform (GCP)" },
          { pattern: /\b(aws|amazon\s*web\s*services)\b/i, name: "Amazon Web Services (AWS)" },
          { pattern: /\b(azure|microsoft\s*azure)\b/i, name: "Microsoft Azure" },
          { pattern: /\b(oracle\s*cloud)\b/i, name: "Oracle Cloud" },
          { pattern: /\b(ibm\s*cloud)\b/i, name: "IBM Cloud" },
          { pattern: /\b(alibaba\s*cloud)\b/i, name: "Alibaba Cloud" },
        ];
        
        for (const { pattern, name } of competitorPatterns) {
          if (pattern.test(normalizedText)) {
            if (!competitors.includes(name)) {
              competitors.push(name);
              console.log(`🔍 Detected competitor in conversation: "${name}"`);
            }
          }
        }
        
        return competitors;
      };
      
      // Extract competitors mentioned in the conversation
      const conversationCompetitors = extractCompetitorsFromConversation(conversationContext);
      console.log(`🔍 Competitors extracted from conversation: [${conversationCompetitors.join(', ') || 'None'}]`);
      
      // DETERMINISTIC COMPETITOR MAPPING - maps domains to their actual competitors
      interface CompetitorSet {
        yourProduct: string;
        competitors: string[];
        category: string;
      }
      
      const competitorRegistry: Record<string, CompetitorSet> = {
        // AI Sales Assistants (Rev Winner's category)
        "rev winner": {
          yourProduct: "Rev Winner",
          competitors: ["Gong", "Clari Copilot", "Avoma", "Fireflies", "Salesforce Einstein"],
          category: "AI Sales Assistant"
        },
        "generic product": {
          yourProduct: "Rev Winner",
          competitors: ["Gong", "Clari Copilot"],
          category: "AI Sales Assistant"
        },
        
        // Cloud Platforms - CRITICAL: Must come before other categories
        "azure": {
          yourProduct: "Microsoft Azure",
          competitors: ["Google Cloud Platform (GCP)", "Amazon Web Services (AWS)", "Oracle Cloud"],
          category: "Cloud Computing Platform"
        },
        "aws": {
          yourProduct: "Amazon Web Services (AWS)",
          competitors: ["Microsoft Azure", "Google Cloud Platform (GCP)", "Oracle Cloud"],
          category: "Cloud Computing Platform"
        },
        "google cloud": {
          yourProduct: "Google Cloud Platform (GCP)",
          competitors: ["Microsoft Azure", "Amazon Web Services (AWS)", "Oracle Cloud"],
          category: "Cloud Computing Platform"
        },
        "gcp": {
          yourProduct: "Google Cloud Platform (GCP)",
          competitors: ["Microsoft Azure", "Amazon Web Services (AWS)", "Oracle Cloud"],
          category: "Cloud Computing Platform"
        },
        "oracle cloud": {
          yourProduct: "Oracle Cloud",
          competitors: ["Microsoft Azure", "AWS", "Google Cloud Platform"],
          category: "Cloud Computing Platform"
        },
        
        // RMM/MSP Tools
        "datto": {
          yourProduct: "Datto RMM",
          competitors: ["ConnectWise Automate", "Kaseya VSA", "NinjaRMM", "Syncro"],
          category: "RMM/MSP Platform"
        },
        "connectwise": {
          yourProduct: "ConnectWise Automate",
          competitors: ["Datto RMM", "Kaseya VSA", "NinjaRMM"],
          category: "RMM/MSP Platform"
        },
        "kaseya": {
          yourProduct: "Kaseya VSA",
          competitors: ["Datto RMM", "ConnectWise Automate", "NinjaRMM"],
          category: "RMM/MSP Platform"
        },
        "ninja": {
          yourProduct: "NinjaRMM",
          competitors: ["Datto RMM", "ConnectWise Automate", "Kaseya VSA"],
          category: "RMM/MSP Platform"
        },
        
        // PSA Tools
        "autotask": {
          yourProduct: "Autotask PSA",
          competitors: ["ConnectWise Manage", "HaloPSA", "Syncro"],
          category: "PSA Platform"
        },
        "halopsa": {
          yourProduct: "HaloPSA",
          competitors: ["ConnectWise Manage", "Autotask", "Syncro"],
          category: "PSA Platform"
        },
        
        // MSP Service Providers (Managed IT Services Companies)
        "integris": {
          yourProduct: "Integris",
          competitors: ["CompassMSP", "Thrive", "Abacus Group", "S4 Integration", "Bluecube", "True North Networks"],
          category: "Managed IT Services Provider"
        },
        "integrisit": {
          yourProduct: "Integris",
          competitors: ["CompassMSP", "Thrive", "Abacus Group", "S4 Integration", "Bluecube", "True North Networks"],
          category: "Managed IT Services Provider"
        },
        "compassmsp": {
          yourProduct: "CompassMSP",
          competitors: ["Integris", "Thrive", "Abacus Group", "S4 Integration", "Bluecube", "True North Networks"],
          category: "Managed IT Services Provider"
        },
        "thrive": {
          yourProduct: "Thrive",
          competitors: ["Integris", "CompassMSP", "Abacus Group", "S4 Integration", "Bluecube", "True North Networks"],
          category: "Managed IT Services Provider"
        },
        "abacus group": {
          yourProduct: "Abacus Group",
          competitors: ["Integris", "CompassMSP", "Thrive", "S4 Integration", "Bluecube", "True North Networks"],
          category: "Managed IT Services Provider"
        },
        
        // Cybersecurity
        "crowdstrike": {
          yourProduct: "CrowdStrike Falcon",
          competitors: ["SentinelOne", "Microsoft Defender for Endpoint", "Sophos"],
          category: "Endpoint Security"
        },
        "sentinelone": {
          yourProduct: "SentinelOne",
          competitors: ["CrowdStrike Falcon", "Microsoft Defender", "Sophos"],
          category: "Endpoint Security"
        },
        
        // Backup Solutions
        "veeam": {
          yourProduct: "Veeam Backup",
          competitors: ["Acronis Cyber Protect", "Datto BCDR", "Barracuda Backup"],
          category: "Backup & Disaster Recovery"
        },
        "acronis": {
          yourProduct: "Acronis Cyber Protect",
          competitors: ["Veeam Backup", "Datto BCDR", "Barracuda Backup"],
          category: "Backup & Disaster Recovery"
        },
        
        // ServiceNow Products
        "servicenow": {
          yourProduct: "ServiceNow",
          competitors: ["BMC Helix", "Jira Service Management", "Ivanti (Cherwell)"],
          category: "Enterprise Service Management"
        },
        "itsm": {
          yourProduct: "ServiceNow ITSM",
          competitors: ["BMC Remedy", "Jira Service Management", "ManageEngine ServiceDesk Plus"],
          category: "IT Service Management"
        },
        "csm": {
          yourProduct: "ServiceNow CSM",
          competitors: ["Salesforce Service Cloud", "Zendesk", "Microsoft Dynamics 365"],
          category: "Customer Service Management"
        },
        "irm": {
          yourProduct: "ServiceNow IRM",
          competitors: ["RSA Archer", "MetricStream", "ServiceNow GRC"],
          category: "Integrated Risk Management"
        },
        
        // HR/Payroll/HRIS/Workforce Management Platforms
        "rippling": {
          yourProduct: "Rippling",
          competitors: ["Workday", "ADP Workforce Now", "Gusto", "BambooHR", "Paylocity"],
          category: "HR/Payroll Platform"
        },
        "workday": {
          yourProduct: "Workday",
          competitors: ["Rippling", "ADP Workforce Now", "SAP SuccessFactors", "Oracle HCM"],
          category: "HR/Payroll Platform"
        },
        "adp": {
          yourProduct: "ADP Workforce Now",
          competitors: ["Rippling", "Workday", "Paychex", "Paylocity"],
          category: "HR/Payroll Platform"
        },
        "gusto": {
          yourProduct: "Gusto",
          competitors: ["Rippling", "ADP", "Paychex", "QuickBooks Payroll"],
          category: "HR/Payroll Platform"
        },
        "bamboohr": {
          yourProduct: "BambooHR",
          competitors: ["Rippling", "Workday", "Gusto", "Namely"],
          category: "HR/Payroll Platform"
        },
        "paylocity": {
          yourProduct: "Paylocity",
          competitors: ["ADP Workforce Now", "Rippling", "Paychex", "Workday"],
          category: "HR/Payroll Platform"
        },
        "paychex": {
          yourProduct: "Paychex",
          competitors: ["ADP Workforce Now", "Rippling", "Gusto", "Paylocity"],
          category: "HR/Payroll Platform"
        },
        "successfactors": {
          yourProduct: "SAP SuccessFactors",
          competitors: ["Workday", "Oracle HCM", "Rippling", "ADP"],
          category: "HR/Payroll Platform"
        },
        "oracle hcm": {
          yourProduct: "Oracle HCM Cloud",
          competitors: ["Workday", "SAP SuccessFactors", "ADP", "Rippling"],
          category: "HR/Payroll Platform"
        },
        "zenefits": {
          yourProduct: "Zenefits",
          competitors: ["Rippling", "Gusto", "BambooHR", "Justworks"],
          category: "HR/Payroll Platform"
        },
        "namely": {
          yourProduct: "Namely",
          competitors: ["Rippling", "BambooHR", "Zenefits", "Gusto"],
          category: "HR/Payroll Platform"
        },
        "justworks": {
          yourProduct: "Justworks",
          competitors: ["Rippling", "Gusto", "Zenefits", "TriNet"],
          category: "HR/Payroll Platform"
        },
        
        // ERP Systems
        "sap": {
          yourProduct: "SAP S/4HANA",
          competitors: ["Oracle ERP", "Microsoft Dynamics 365", "NetSuite", "Workday"],
          category: "ERP System"
        },
        "netsuite": {
          yourProduct: "Oracle NetSuite",
          competitors: ["SAP Business One", "Microsoft Dynamics 365", "Sage Intacct", "Acumatica"],
          category: "ERP System"
        },
        
        // Project Management
        "asana": {
          yourProduct: "Asana",
          competitors: ["Monday.com", "Jira", "Trello", "Wrike", "ClickUp"],
          category: "Project Management"
        },
        "monday": {
          yourProduct: "Monday.com",
          competitors: ["Asana", "Jira", "Trello", "Wrike", "ClickUp"],
          category: "Project Management"
        },
        "jira": {
          yourProduct: "Jira",
          competitors: ["Asana", "Monday.com", "Linear", "Azure DevOps"],
          category: "Project Management"
        },
        
        // Communication/Collaboration
        "slack": {
          yourProduct: "Slack",
          competitors: ["Microsoft Teams", "Google Chat", "Discord", "Zoom Team Chat"],
          category: "Team Communication"
        },
        "teams": {
          yourProduct: "Microsoft Teams",
          competitors: ["Slack", "Zoom", "Google Meet", "Webex"],
          category: "Team Communication"
        },
        "zoom": {
          yourProduct: "Zoom",
          competitors: ["Microsoft Teams", "Google Meet", "Webex", "GoTo Meeting"],
          category: "Video Conferencing"
        },
        
        // Marketing Automation
        "hubspot": {
          yourProduct: "HubSpot",
          competitors: ["Salesforce Marketing Cloud", "Marketo", "Pardot", "ActiveCampaign"],
          category: "Marketing Automation"
        },
        "marketo": {
          yourProduct: "Marketo",
          competitors: ["HubSpot", "Pardot", "Salesforce Marketing Cloud", "Eloqua"],
          category: "Marketing Automation"
        },
        
        // Accounting/Finance
        "quickbooks": {
          yourProduct: "QuickBooks",
          competitors: ["Xero", "FreshBooks", "Sage", "Wave"],
          category: "Accounting Software"
        },
        "xero": {
          yourProduct: "Xero",
          competitors: ["QuickBooks", "FreshBooks", "Sage", "Wave"],
          category: "Accounting Software"
        }
      };
      
      // STEP 1A: PRE-NORMALIZATION SYNONYM MAPPING - Map cloud providers to canonical registry keys
      // This ensures "Amazon Web Services" → "AWS" BEFORE normalization strips critical tokens
      let preMappedDomain = (domainExpertise || "generic product").toLowerCase().trim();
      
      // Cloud provider synonym mapping (order matters - most specific first)
      const providerSynonyms: Array<{ pattern: RegExp; canonical: string }> = [
        { pattern: /amazon\s*web\s*services?/i, canonical: "AWS" },
        { pattern: /google\s*cloud\s*platform/i, canonical: "Google Cloud" },
        { pattern: /microsoft\s*azure/i, canonical: "Azure" },
        { pattern: /oracle\s*cloud/i, canonical: "Oracle Cloud" },
        { pattern: /ibm\s*cloud/i, canonical: "IBM Cloud" },
        { pattern: /alibaba\s*cloud/i, canonical: "Alibaba Cloud" },
      ];
      
      for (const { pattern, canonical } of providerSynonyms) {
        if (pattern.test(preMappedDomain)) {
          preMappedDomain = canonical.toLowerCase();
          console.log(`🔄 Pre-mapping: "${domainExpertise}" → "${canonical}"`);
          break;
        }
      }
      
      // STEP 1B: AGGRESSIVE DOMAIN NORMALIZATION - Strip extra descriptors to match registry keys
      const normalizedDomain = preMappedDomain
        // Remove parenthetical descriptors: "Azure (Cloud Migration)" → "azure"
        .replace(/\s*\([^)]*\)/g, '')
        // Remove common business descriptors: "AWS Migration Factory" → "aws"
        .replace(/\s+(migration|consulting|solutions?|practice|program|factory|services?|implementation|deployment|integration)\s*/gi, ' ')
        // Remove common technology suffixes: "Azure Cloud Platform" → "azure"
        .replace(/\s+(cloud|platform|tool|software|system|stack|suite|product)s?\s*/gi, ' ')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`🔍 Domain normalization: "${domainExpertise}" → "${normalizedDomain}"`);
      
      // STEP 2: Find matching competitor set (check if any registry key is contained in the domain)
      let competitorSet: CompetitorSet | null = null;
      for (const [key, value] of Object.entries(competitorRegistry)) {
        if (normalizedDomain.includes(key) || key.includes(normalizedDomain)) {
          competitorSet = value;
          console.log(`✅ Direct match found: "${domainExpertise}" → ${value.category}`);
          break;
        }
      }
      
      // FALLBACK: Category-based detection if no direct match
      if (!competitorSet) {
        console.log(`⚠️  No direct competitor mapping for "${domainExpertise}", trying category detection...`);
        
        // Detect category from domain name keywords - CLOUD PLATFORMS FIRST (highest priority)
        if (/(azure|aws|amazon|google|gcp|oracle|ibm|alibaba|cloud\s*(platform|computing|migration|infrastructure|provider)|iaas|paas)/i.test(normalizedDomain)) {
          // CRITICAL: Map to CANONICAL cloud product based on STRONGEST keyword match (not default)
          let canonicalProduct: string;
          let competitors: string[];
          
          // Priority order: Specific provider keywords take precedence
          // NOTE: Normalization strips "services", so match "amazon web" OR "amazon" OR "aws"
          if (/\b(aws|amazon(\s*web)?)\b/i.test(normalizedDomain)) {
            canonicalProduct = "Amazon Web Services (AWS)";
            competitors = ["Microsoft Azure", "Google Cloud Platform (GCP)", "Oracle Cloud"];
            console.log(`📊 Cloud detected: AWS keywords found`);
          } else if (/\b(google\s*cloud|gcp|google)\b/i.test(normalizedDomain)) {
            canonicalProduct = "Google Cloud Platform (GCP)";
            competitors = ["Microsoft Azure", "Amazon Web Services (AWS)", "Oracle Cloud"];
            console.log(`📊 Cloud detected: Google Cloud keywords found`);
          } else if (/\bazure\b/i.test(normalizedDomain)) {
            canonicalProduct = "Microsoft Azure";
            competitors = ["Google Cloud Platform (GCP)", "Amazon Web Services (AWS)", "Oracle Cloud"];
            console.log(`📊 Cloud detected: Azure keywords found`);
          } else if (/\boracle\s*cloud\b/i.test(normalizedDomain)) {
            canonicalProduct = "Oracle Cloud";
            competitors = ["Microsoft Azure", "AWS", "Google Cloud Platform"];
            console.log(`📊 Cloud detected: Oracle Cloud keywords found`);
          } else if (/\bibm\s*cloud\b/i.test(normalizedDomain)) {
            canonicalProduct = "IBM Cloud";
            competitors = ["Microsoft Azure", "AWS", "Google Cloud Platform"];
            console.log(`📊 Cloud detected: IBM Cloud keywords found`);
          } else {
            // Generic cloud keywords without specific provider → use conversation context or default to Azure
            canonicalProduct = "Microsoft Azure"; // Last resort default
            competitors = ["Google Cloud Platform (GCP)", "Amazon Web Services (AWS)", "Oracle Cloud"];
            console.log(`📊 Cloud detected: Generic cloud keywords, defaulting to Azure`);
          }
          
          competitorSet = {
            yourProduct: canonicalProduct,
            competitors: competitors,
            category: "Cloud Computing Platform"
          };
          console.log(`✅ Cloud category: "${canonicalProduct}" vs [${competitors.slice(0, 2).join(", ")}]`);
        } else if (/(rmm|remote monitoring|endpoint management|patch|msp|managed service)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise, // Keep original for non-cloud
            competitors: ["ConnectWise Automate", "Kaseya VSA", "NinjaRMM", "Datto RMM"],
            category: "RMM/MSP Platform"
          };
          console.log(`📊 Category detected: RMM/MSP`);
        } else if (/(psa|professional service|ticketing|help desk|service desk)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["ConnectWise Manage", "Autotask", "HaloPSA"],
            category: "PSA Platform"
          };
          console.log(`📊 Category detected: PSA`);
        } else if (/(crm|customer relationship|salesforce|hubspot)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["Salesforce", "HubSpot", "Microsoft Dynamics"],
            category: "CRM Platform"
          };
          console.log(`📊 Category detected: CRM`);
        } else if (/(security|endpoint protection|antivirus|edr|threat)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["CrowdStrike", "SentinelOne", "Microsoft Defender"],
            category: "Endpoint Security"
          };
          console.log(`📊 Category detected: Security`);
        } else if (/(backup|disaster recovery|bcdr|data protection)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["Veeam", "Acronis", "Datto BCDR"],
            category: "Backup & DR"
          };
          console.log(`📊 Category detected: Backup`);
        } else if (/(itsm|it service|incident|change management|service desk)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["BMC Remedy", "Jira Service Management", "ManageEngine ServiceDesk Plus"],
            category: "IT Service Management"
          };
          console.log(`📊 Category detected: ITSM`);
        } else if (/(csm|customer service|case management|customer support)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["Salesforce Service Cloud", "Zendesk", "Microsoft Dynamics 365"],
            category: "Customer Service Management"
          };
          console.log(`📊 Category detected: CSM`);
        } else if (/(irm|grc|risk management|compliance|governance)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["RSA Archer", "MetricStream", "LogicGate"],
            category: "Integrated Risk Management"
          };
          console.log(`📊 Category detected: IRM/GRC`);
        } else if (/(hr|hris|hcm|payroll|workforce|employee|talent|recruiting|onboarding|benefits|compensation|people\s*management|human\s*capital|human\s*resource)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["Workday", "ADP Workforce Now", "Rippling", "Gusto", "BambooHR"],
            category: "HR/Payroll Platform"
          };
          console.log(`📊 Category detected: HR/Payroll`);
        } else if (/(erp|enterprise\s*resource|business\s*planning)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["SAP S/4HANA", "Oracle ERP", "Microsoft Dynamics 365", "NetSuite"],
            category: "ERP System"
          };
          console.log(`📊 Category detected: ERP`);
        } else if (/(project\s*management|task\s*management|agile|scrum|kanban|sprint|workflow\s*management)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["Asana", "Monday.com", "Jira", "Trello", "ClickUp"],
            category: "Project Management"
          };
          console.log(`📊 Category detected: Project Management`);
        } else if (/(communication|collaboration|messaging|chat|video\s*conference|meeting)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["Slack", "Microsoft Teams", "Zoom", "Google Meet"],
            category: "Communication/Collaboration"
          };
          console.log(`📊 Category detected: Communication/Collaboration`);
        } else if (/(marketing|email\s*marketing|automation|campaign|lead\s*gen)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["HubSpot", "Marketo", "Pardot", "Mailchimp", "ActiveCampaign"],
            category: "Marketing Automation"
          };
          console.log(`📊 Category detected: Marketing Automation`);
        } else if (/(accounting|finance|bookkeeping|invoicing|billing|expense)/i.test(normalizedDomain)) {
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: ["QuickBooks", "Xero", "FreshBooks", "Sage", "NetSuite"],
            category: "Accounting/Finance"
          };
          console.log(`📊 Category detected: Accounting/Finance`);
        }
      }
      
      // ANTI-FALLBACK GUARD: If conversation mentions competitors, use domain expertise as product
      // This prevents Rev Winner battle cards for unrelated domains (e.g., Azure, cloud platforms)
      if (!competitorSet && conversationCompetitors.length > 0) {
        console.log(`🛡️ ANTI-FALLBACK GUARD: Conversation mentions competitors but no registry match`);
        console.log(`🛡️ Using domain expertise "${domainExpertise}" as product with conversation competitors`);
        
        // CRITICAL: Ensure at least 2 competitors by merging conversation + canonical defaults
        let mergedCompetitors = [...conversationCompetitors];
        
        // If only 1 conversation competitor, add canonical defaults based on detected domain
        if (mergedCompetitors.length < 2) {
          console.log(`⚠️ Only ${mergedCompetitors.length} conversation competitor(s) - adding canonical defaults`);
          
          // Add domain-specific defaults
          if (/(cloud|azure|aws|gcp|google cloud)/i.test(normalizedDomain)) {
            // Cloud platforms
            const cloudDefaults = ["Google Cloud Platform (GCP)", "Amazon Web Services (AWS)", "Oracle Cloud"];
            for (const competitor of cloudDefaults) {
              if (!mergedCompetitors.includes(competitor) && mergedCompetitors.length < 3) {
                mergedCompetitors.push(competitor);
              }
            }
          } else if (/(rmm|msp)/i.test(normalizedDomain)) {
            // RMM defaults
            const rmmDefaults = ["ConnectWise Automate", "Kaseya VSA", "NinjaRMM"];
            for (const competitor of rmmDefaults) {
              if (!mergedCompetitors.includes(competitor) && mergedCompetitors.length < 3) {
                mergedCompetitors.push(competitor);
              }
            }
          } else {
            // Use domain detection to find contextually relevant competitors
            const domainContextForGuard = detectDomainFromConversation(conversationContext, normalizedDomain);
            if (domainContextForGuard.suggestedCompetitors.length > 0) {
              console.log(`📊 Anti-fallback guard: Found domain competitors from conversation: [${domainContextForGuard.suggestedCompetitors.join(', ')}]`);
              for (const competitor of domainContextForGuard.suggestedCompetitors) {
                if (!mergedCompetitors.includes(competitor) && mergedCompetitors.length < 3) {
                  mergedCompetitors.push(competitor);
                }
              }
            } else if (mergedCompetitors.length === 0) {
              // Only use generic placeholders as absolute last resort
              console.log(`⚠️ Anti-fallback guard: No domain competitors found, using generic placeholders`);
              mergedCompetitors = ["Alternative Solution A", "Alternative Solution B"];
            } else if (mergedCompetitors.length === 1) {
              mergedCompetitors.push("Alternative Solution");
            }
          }
        }
        
        competitorSet = {
          yourProduct: domainExpertise,
          competitors: mergedCompetitors.slice(0, 3), // Maximum 3 competitors
          category: "Domain-Specific Solution"
        };
        console.log(`✅ Guard activated: ${competitorSet.yourProduct} vs [${competitorSet.competitors.join(", ")}]`);
      }
      
      // FINAL ANTI-FALLBACK GUARD: Prevent Rev Winner for cloud-related domains/conversations
      if (!competitorSet) {
        // Check if domain OR conversation has ANY cloud indicators
        const hasCloudIndicators = 
          /(azure|aws|amazon\s*web|google\s*cloud|gcp|oracle\s*cloud|ibm\s*cloud|alibaba\s*cloud|cloud\s*platform|cloud\s*computing|cloud\s*migration|cloud\s*infrastructure|iaas|paas|saas)/i.test(normalizedDomain) ||
          /(azure|aws|amazon\s*web|google\s*cloud|gcp|oracle\s*cloud|ibm\s*cloud|cloud\s*platform)/i.test(conversationContext.toLowerCase());
        
        if (hasCloudIndicators) {
          console.log(`🛡️ FINAL CLOUD GUARD: Domain/conversation has cloud indicators but no match`);
          console.log(`🛡️ Preventing Rev Winner fallback - creating generic cloud battle card`);
          
          competitorSet = {
            yourProduct: domainExpertise || "Cloud Platform",
            competitors: ["Microsoft Azure", "Amazon Web Services (AWS)", "Google Cloud Platform (GCP)"],
            category: "Cloud Computing Platform"
          };
          console.log(`✅ Cloud guard activated: "${competitorSet.yourProduct}" vs [${competitorSet.competitors.slice(0, 2).join(", ")}]`);
        } else {
          // INTELLIGENT FALLBACK: Use domain detection from conversation to find contextually relevant competitors
          console.log(`🔄 INTELLIGENT FALLBACK: Using conversation-aware domain detection for "${domainExpertise}"`);
          
          // Use the domain-detection module to analyze conversation context for better competitor suggestions
          const conversationDomainContext = detectDomainFromConversation(conversationContext, domainExpertise);
          console.log(`📊 Domain detection result: detected="${conversationDomainContext.detectedDomain}", confidence=${conversationDomainContext.confidenceScore}%`);
          console.log(`📊 Suggested competitors from domain detection: [${conversationDomainContext.suggestedCompetitors.join(', ') || 'None'}]`);
          
          let contextualCompetitors: string[] = [];
          let detectedCategory = "Custom Solution";
          
          // Use detected competitors if available
          if (conversationDomainContext.suggestedCompetitors.length > 0) {
            contextualCompetitors = conversationDomainContext.suggestedCompetitors.slice(0, 3);
            detectedCategory = conversationDomainContext.detectedDomain 
              ? `${conversationDomainContext.detectedDomain} Solution`
              : "Custom Solution";
          } else {
            // AI-POWERED RESEARCH FALLBACK: Use competitive intelligence to dynamically research the company
            console.log(`🔬 AI RESEARCH FALLBACK: No static mapping found, researching "${domainExpertise}" dynamically...`);
            let aiResearchSucceeded = false;
            try {
              const intelligence = await researchCompanyIntelligence(domainExpertise, conversationContext);
              if (intelligence.competitors.length > 0) {
                contextualCompetitors = intelligence.competitors.map(c => c.name).slice(0, 3);
                detectedCategory = intelligence.industry || "Industry Solution";
                aiResearchSucceeded = true;
                console.log(`✅ AI Research found ${intelligence.competitors.length} competitors: [${contextualCompetitors.join(', ')}]`);
                console.log(`📊 Industry: ${intelligence.industry}, Source: ${intelligence.source}`);
              } else {
                console.log(`⚠️ AI Research returned no competitors - falling back to generic competitors`);
              }
            } catch (researchError) {
              console.error(`❌ AI Research failed:`, researchError);
            }
            
            // If AI research didn't provide competitors, use sensible generic defaults
            if (!aiResearchSucceeded) {
              console.log(`🔄 Using generic competitor fallback for unknown domain`);
              // Provide generic industry competitors so the prompt has something to work with
              contextualCompetitors = ["Industry Leader A", "Industry Leader B", "Industry Leader C"];
              detectedCategory = "Industry Solution";
              console.log(`📊 Generic fallback: Will ask AI to identify specific competitors for "${domainExpertise}"`);
            }
          }
          
          competitorSet = {
            yourProduct: domainExpertise,
            competitors: contextualCompetitors,
            category: detectedCategory
          };
          
          if (contextualCompetitors.length > 0) {
            console.log(`✅ Dynamic fallback: "${competitorSet.yourProduct}" vs [${competitorSet.competitors.join(", ")}]`);
          } else {
            console.log(`⚠️ No competitors found - AI will identify appropriate competitors`);
          }
        }
      }
      
      console.log(`✅ Battle Card: ${competitorSet.yourProduct} vs [${competitorSet.competitors.slice(0, 2).join(", ")}]`);
      
      // Build deterministic prompt that ENFORCES conversation-mentioned competitors
      const competitorSection = conversationCompetitors.length > 0
        ? `
🔴 COMPETITORS EXPLICITLY MENTIONED IN CONVERSATION (MUST USE THESE):
${conversationCompetitors.map((c, i) => `${i + 1}. ${c} ⭐ (MENTIONED BY CUSTOMER)`).join('\n')}

SUGGESTED COMPETITORS (use only if needed for competitor2):
${competitorSet.competitors.length > 0 ? competitorSet.competitors.map((c, i) => `${i + 1}. ${c}`).join('\n') : '(Use your knowledge to identify relevant competitors in the same market)'}`
        : competitorSet.competitors.length > 0 
          ? `
SUGGESTED COMPETITORS FOR ${competitorSet.yourProduct}:
${competitorSet.competitors.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
          : `
🔍 COMPETITOR IDENTIFICATION REQUIRED:
Based on your knowledge of ${competitorSet.yourProduct}, identify the 2 most relevant competitors in the same market.
Research and use REAL competitor products that compete directly with "${competitorSet.yourProduct}".
Examples: If this is an HR platform, competitors might include Workday, ADP, Rippling, Gusto, etc.
          If this is a CRM, competitors might include Salesforce, HubSpot, Pipedrive, etc.
          
IMPORTANT: NEVER use "Gong", "Clari Copilot", or other sales intelligence tools as competitors 
UNLESS "${competitorSet.yourProduct}" is specifically a sales/conversation intelligence product.`;

      // Build compact training context section for speed
      const trainingSection = trainingContext && trainingContext.trim().length > 0
        ? `
=== TRAINING DOCS (USE FIRST) ===
${trainingContext.slice(0, 2000)}
===
`
        : '';

      let prompt = `${supplementText}
Battle card: ${competitorSet.yourProduct} (${competitorSet.category}).
${trainingSection}CONVERSATION:
${fullContext}
${competitorSection}
RULES:
- ${conversationCompetitors.length > 0 ? `MUST use conversation-mentioned competitors as competitor1/competitor2` : `Use suggested competitors`}
- competitor1/competitor2 MUST be real product names, NOT generic terms
- Training docs priority: use EXACT prices from docs, NEVER guess pricing
- 5-6 features relevant to THIS customer. Show technical superiority
- keyDifferentiators: unique capabilities competitors lack
- technicalAdvantages: architecture/performance edges

JSON:{"yourProduct":"${competitorSet.yourProduct}","competitor1":"name","competitor2":"name","buyerContext":"who+situation","whenFitsWell":["scenario1","scenario2"],"whenMayNotFit":["limitation1"],"keyDifferentiators":["unique1","unique2","unique3"],"technicalAdvantages":["edge1","edge2","edge3"],"competitorStrengths":{"competitor1":"strengths","competitor2":"strengths"},"whyChooseUs":"2-3 sentence summary","slides":[{"title":"Features","comparison":[{"feature":"name","yourProduct":"superior","competitor1":"limited","competitor2":"basic"}]}]}`;

      let result;
      let retryCount = 0;
      const MAX_RETRIES = 2;
      
      while (retryCount <= MAX_RETRIES) {
        try {
          const response = await client.chat.completions.create({
            model: model.includes('gpt-4') && !model.includes('mini') ? 'gpt-4o-mini' : model,
            messages: [
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 1000,
          });

          const content = response.choices?.[0]?.message?.content;
          if (!content) throw new Error("No content in AI response");
          
          console.log(`📝 Battle Card - Attempt ${retryCount + 1}/${MAX_RETRIES + 1} - Raw AI response length: ${content.length}`);
          console.log(`📝 Battle Card - First 300 chars: ${content.substring(0, 300)}`);
          console.log(`📝 Battle Card - Last 300 chars: ${content.substring(Math.max(0, content.length - 300))}`);
          
          const cleanedContent = cleanJSONResponse(content);
          console.log(`📝 Battle Card - Cleaned length: ${cleanedContent.length}`);
          
          // Enhanced JSON sanitization for malformed responses
          let sanitizedContent = cleanedContent;
          
          // Fix unterminated strings by ensuring closing quotes
          if (sanitizedContent.includes('"') && !sanitizedContent.trim().endsWith('}')) {
            console.warn(`⚠️ Detected potentially truncated response - attempting auto-fix`);
            // Count open/close braces and quotes to detect truncation
            const openBraces = (sanitizedContent.match(/\{/g) || []).length;
            const closeBraces = (sanitizedContent.match(/\}/g) || []).length;
            const openQuotes = (sanitizedContent.match(/"/g) || []).length;
            
            // If odd number of quotes, likely unterminated string
            if (openQuotes % 2 !== 0) {
              sanitizedContent = sanitizedContent + '"';
              console.log(`🔧 Added closing quote`);
            }
            
            // Close any missing braces
            for (let i = closeBraces; i < openBraces; i++) {
              sanitizedContent = sanitizedContent + '}';
              console.log(`🔧 Added closing brace ${i + 1}`);
            }
          }
          
          result = JSON.parse(sanitizedContent);
          console.log(`✅ Battle Card JSON parsed successfully on attempt ${retryCount + 1}`);
          break; // Success - exit retry loop
          
        } catch (parseError: any) {
          console.error(`❌ Battle Card JSON parse failed (Attempt ${retryCount + 1}/${MAX_RETRIES + 1}): ${parseError.message}`);
          
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying with simplified prompt...`);
            retryCount++;
            
            // Simplify prompt for retry - focus on core content
            prompt = `Generate a competitive battle card comparing ${competitorSet.yourProduct} against competitors.

CONVERSATION CONTEXT:
${conversationContext}

COMPETITORS TO COMPARE:
${competitorSet.competitors.slice(0, 2).join(', ')}

Generate a JSON response with this EXACT structure (keep it concise to avoid truncation):
{
  "yourProduct": "${competitorSet.yourProduct}",
  "competitor1": "Primary competitor name",
  "competitor2": "Secondary competitor name",
  "keyDifferentiators": ["Unique feature 1", "Unique feature 2", "Unique feature 3"],
  "technicalAdvantages": ["Technical edge 1", "Technical edge 2", "Technical edge 3"],
  "whyChooseUs": "Brief 2-sentence summary of why to choose ${competitorSet.yourProduct}",
  "slides": [{"title": "Features", "comparison": [{"feature": "Key feature", "yourProduct": "Superior capability", "competitor1": "Limited", "competitor2": "Basic"}]}]
}`;
            
            continue; // Retry with simplified prompt
          } else {
            console.error(`❌ All retries exhausted - using fallback battle card`);
            // Fallback to minimal valid structure with intelligence metadata
            result = {
              _meta: {
                domain: supplement.domainBadge,
                compliance: supplement.complianceBanner || null,
                claimGuardrails: supplement.claimGuardrails,
                differentiationHints: supplement.differentiationHints
              },
              yourProduct: competitorSet.yourProduct,
              competitor1: competitorSet.competitors[0] || "Competitor A",
              competitor2: competitorSet.competitors[1] || "Competitor B",
              buyerContext: `Organizations evaluating ${competitorSet.yourProduct} solutions`,
              whenFitsWell: [`When comprehensive ${competitorSet.category} capabilities are needed`],
              whenMayNotFit: ['When budget is the primary decision factor'],
              competitorStrengths: {},
              keyDifferentiators: [
                `${competitorSet.yourProduct} delivers superior performance and reliability`,
                "Comprehensive feature set designed for modern enterprise needs",
                "Industry-leading customer support and ongoing innovation"
              ],
              technicalAdvantages: [
                "Advanced architecture optimized for scalability",
                "Seamless integrations with enterprise platforms",
                "Real-time analytics and automated workflows"
              ],
              whyChooseUs: `${competitorSet.yourProduct} combines cutting-edge technology with proven results, delivering the capabilities you need to succeed.`,
              slides: [{
                title: "Feature Comparison",
                comparison: [
                  { feature: "Core Capabilities", yourProduct: "Comprehensive", competitor1: "Limited", competitor2: "Basic" },
                  { feature: "Integration", yourProduct: true, competitor1: "Partial", competitor2: false }
                ]
              }]
            };
            console.log(`⚠️ Using fallback battle card structure`);
            break;
          }
        }
      }
      
      // SERVER-SIDE VALIDATION: Ensure critical sections are populated with intelligent fallbacks
      let validationWarnings = 0;
      
      if (!result.keyDifferentiators || result.keyDifferentiators.length === 0) {
        console.warn(`⚠️  AI did not return keyDifferentiators - using intelligent fallbacks`);
        result.keyDifferentiators = [
          `${competitorSet.yourProduct} delivers superior performance and reliability`,
          "Comprehensive feature set designed for modern enterprise needs",
          "Industry-leading customer support and ongoing innovation"
        ];
        validationWarnings++;
      }
      
      if (!result.technicalAdvantages || result.technicalAdvantages.length === 0) {
        console.warn(`⚠️  AI did not return technicalAdvantages - using intelligent fallbacks`);
        result.technicalAdvantages = [
          "Advanced architecture optimized for scalability and performance",
          "Seamless integrations with leading enterprise platforms",
          "Real-time analytics and automated workflows"
        ];
        validationWarnings++;
      }
      
      if (!result.whyChooseUs || result.whyChooseUs.trim().length === 0) {
        console.warn(`⚠️  AI did not return whyChooseUs - using intelligent fallback`);
        result.whyChooseUs = `${competitorSet.yourProduct} combines cutting-edge technology with proven results, delivering the capabilities you need to succeed in today's competitive market.`;
        validationWarnings++;
      }
      
      if (validationWarnings > 0) {
        console.warn(`⚠️  Battle Card validation: ${validationWarnings} section(s) used fallback content`);
      } else {
        console.log(`✅ Battle Card validation: All sections populated by AI`);
      }
      
      // Inject intelligence metadata into result
      result._meta = {
        domain: supplement.domainBadge,
        compliance: supplement.complianceBanner || null,
        claimGuardrails: supplement.claimGuardrails,
        differentiationHints: supplement.differentiationHints
      };
      
      // Ensure new honest positioning fields have fallbacks if AI didn't provide them
      if (!result.buyerContext) {
        result.buyerContext = `Organizations evaluating ${competitorSet.yourProduct} solutions`;
      }
      if (!result.whenFitsWell || result.whenFitsWell.length === 0) {
        result.whenFitsWell = [`When comprehensive ${competitorSet.category} capabilities are needed`];
      }
      if (!result.whenMayNotFit || result.whenMayNotFit.length === 0) {
        result.whenMayNotFit = ['When budget is the primary decision factor'];
      }
      if (!result.competitorStrengths) {
        result.competitorStrengths = {};
      }
      
      // Battle cards are NOT cached to ensure contextual accuracy
      // (Pitch decks and case studies are cached)
      
      return result;
    }

    throw new Error(`Invalid type: ${type}`);
  } catch (error: any) {
    console.error("🚨 Present to Win generation error:", error);
    
    // Log detailed error information for diagnostics
    const errorDetails = {
      name: error?.name,
      message: error?.message,
      status: error?.status || error?.response?.status,
      code: error?.code,
      type: error?.type,
      responseStatus: error?.response?.status,
      responseStatusText: error?.response?.statusText,
      responseData: error?.response?.data
    };
    console.error("Error details:", JSON.stringify(errorDetails, null, 2));
    
    // Try to extract provider-specific error message
    let providerErrorMessage = "";
    if (error?.response?.data) {
      try {
        const data = typeof error.response.data === 'string' 
          ? JSON.parse(error.response.data) 
          : error.response.data;
        providerErrorMessage = data?.error?.message || data?.message || data?.detail || "";
        if (providerErrorMessage) {
          console.error("Provider error message:", providerErrorMessage);
        }
      } catch (parseError) {
        console.error("Could not parse provider error response");
      }
    }
    
    const statusCode = error?.status || error?.response?.status;
    
    // Handle authentication errors specifically
    if (statusCode === 401 || statusCode === 403 || error?.message?.includes('Invalid Authentication') || error?.message?.includes('Incorrect API key')) {
      console.error("🔑 Authentication error detected - API key issue");
      throw new Error("AI API key authentication failed. Please check your AI engine settings and ensure your API key is valid.");
    }
    
    // Handle missing AI config
    if (error?.message?.includes('AI engine not configured')) {
      console.error("⚙️ AI engine not configured");
      throw new Error("Please configure your AI engine in Settings before using Present to Win features.");
    }
    
    // Handle Moonshot/Kimi specific errors for unsupported parameters
    if (statusCode === 400 && (providerErrorMessage.includes('response_format') || providerErrorMessage.includes('json_object') || error?.message?.includes('response_format'))) {
      console.error("📝 JSON format error - provider does not support response_format parameter");
      throw new Error("Your AI provider (Kimi/Moonshot) does not support structured JSON responses required for Present to Win. Please switch to OpenAI, Anthropic, Google AI, or DeepSeek in Settings.");
    }
    
    // Handle other 400 errors from provider
    if (statusCode === 400) {
      console.error("⚠️ Bad request error from provider");
      const userMessage = providerErrorMessage || error?.message || "Invalid request to AI provider";
      throw new Error(`AI provider error: ${userMessage}`);
    }
    
    // Handle rate limiting
    if (statusCode === 429 || error?.message?.includes('rate limit')) {
      console.error("⏱️ Rate limit error");
      throw new Error("AI provider rate limit exceeded. Please wait a moment and try again.");
    }
    
    // Generic error with more context
    const errorMessage = providerErrorMessage || error?.message || "Unknown error occurred";
    console.error(`❌ Throwing error: ${errorMessage}`);
    throw new Error(`Failed to generate content: ${errorMessage}`);
  }
}

// Generate multi-product Present to Win content
export async function generateMultiProductPresentToWin(
  type: string,
  conversationContext: string,
  domainExpertise: string,
  userId?: string
): Promise<any> {
  // Guard: userId is required for Present to Win generation
  if (!userId) {
    throw new Error("User ID is required for Present to Win generation");
  }
  
  try {
    console.log(`🎯🎯 Multi-Product Present to Win: Detecting products in conversation for ${type}`);
    
    // Use Sales Intelligence Layer to detect multiple products
    const { SalesIntelligenceLayer } = await import("./sales-intelligence-layer");
    const intelligenceLayer = new SalesIntelligenceLayer();
    
    // Convert conversation context to history format
    const conversationHistory = conversationContext.split('\n').map((line: string) => {
      const [sender, ...contentParts] = line.split(':');
      return {
        sender: sender?.trim() || 'user',
        content: contentParts.join(':').trim()
      };
    }).filter((msg: any) => msg.content);
    
    // Detect products from conversation
    const productDetectionResult = await intelligenceLayer.analyzeConversationForProducts({
      transcript: conversationContext,
      conversationHistory: conversationHistory,
      currentInsights: {}
    });
    
    // Combine primary and secondary products into a single array
    const allProducts: any[] = [];
    if (productDetectionResult.primaryProduct) {
      allProducts.push(productDetectionResult.primaryProduct);
    }
    if (productDetectionResult.secondaryProducts && productDetectionResult.secondaryProducts.length > 0) {
      allProducts.push(...productDetectionResult.secondaryProducts);
    }
    
    // If only 1 or no products detected, fall back to single-product mode
    if (allProducts.length <= 1) {
      console.log(`📦 Single product detected (${allProducts.length}), using standard generation`);
      const content = await generatePresentToWin(type, conversationContext, domainExpertise, userId);
      return {
        ...content,
        _multiProduct: false
      };
    }
    
    console.log(`📦 ${allProducts.length} products detected: ${allProducts.map((p: any) => p.productName).join(', ')}`);
    
    // Generate content for each detected product (in parallel for speed)
    const productContents = await Promise.all(
      allProducts.map(async (product: any) => {
        console.log(`🎯 Generating ${type} for product: ${product.productName}`);
        
        // CRITICAL: Create product-specific conversation context
        // Highlight mentions of this product to guide AI toward product-specific content
        const productKeywords = [
          product.productName.toLowerCase(),
          product.productId?.toLowerCase() || '',
          ...(product.keywords || [])
        ].filter(Boolean);
        
        // Extract product-specific conversation excerpts
        const conversationLines = conversationContext.split('\n');
        const productSpecificLines = conversationLines.filter(line => {
          const lowerLine = line.toLowerCase();
          return productKeywords.some(keyword => lowerLine.includes(keyword));
        });
        
        // Build enhanced context: product-specific excerpts + full conversation for context
        const productEnhancedContext = productSpecificLines.length > 0
          ? `🎯 PRODUCT FOCUS: ${product.productName}\n\nPRODUCT-SPECIFIC DISCUSSION:\n${productSpecificLines.join('\n')}\n\nFULL CONVERSATION CONTEXT:\n${conversationContext}`
          : `🎯 PRODUCT FOCUS: ${product.productName}\n\n${conversationContext}`;
        
        // Use product-specific domain expertise for better competitive context
        const productDomain = product.productId || product.productName || domainExpertise;
        const content = await generatePresentToWin(
          type,
          productEnhancedContext,  // Product-specific enhanced context
          productDomain,
          userId
        );
        
        return {
          productName: product.productName,
          productCode: product.productId || product.productName,
          confidence: product.relevanceScore >= 85 ? "high" : product.relevanceScore >= 70 ? "medium" : "low",
          content: content
        };
      })
    );
    
    console.log(`✅ Multi-product ${type} generation complete: ${productContents.length} products`);
    
    return {
      _multiProduct: true,
      products: productContents,
      multiProductIntelligence: {
        detectedProducts: allProducts,
        totalProducts: allProducts.length
      }
    };
    
  } catch (error: any) {
    console.error(`❌ Multi-product ${type} generation failed:`, error);
    console.log(`⚠️ Falling back to single-product mode`);
    
    // Fallback to single-product generation
    const content = await generatePresentToWin(type, conversationContext, domainExpertise, userId);
    return {
      ...content,
      _multiProduct: false
    };
  }
}

// Generate AI-powered summary of what was learned from training documents
export async function generateDocumentSummary(
  documents: Array<{
    fileName: string;
    fileType: string;
    content: string | null;
    metadata?: any;
  }>,
  domainName: string,
  userId?: string
): Promise<string[]> {
  try {
    // Filter out documents with no content
    const validDocs = documents.filter(doc => doc.content && doc.content.trim().length > 0);
    
    if (validDocs.length === 0) {
      return ["No documents processed yet. Upload documents to see AI-generated insights."];
    }

    // Get user's AI client or fall back to deepseek
    let client;
    let model;
    
    if (userId) {
      try {
        const aiConfig = await getAIClient(userId);
        client = aiConfig.client;
        model = aiConfig.model;
      } catch (error) {
        if (!deepseek) throw new Error("AI engine not configured");
        client = deepseek;
        model = "deepseek-chat";
      }
    } else {
      if (!deepseek) throw new Error("Default AI engine not configured");
      client = deepseek;
      model = "deepseek-chat";
    }

    // Prepare document summaries for analysis (limit content to avoid token limits)
    const docSummaries = validDocs.map((doc, idx) => {
      const contentPreview = doc.content!.slice(0, 1000); // First 1000 chars
      const wordCount = doc.metadata?.wordCount || 0;
      return `Document ${idx + 1}: "${doc.fileName}" (${doc.fileType.toUpperCase()}, ${wordCount} words)\nContent preview: ${contentPreview}...`;
    }).join('\n\n');

    const summaryPrompt = `You are an AI knowledge analyst for "${domainName}". Analyze the following training documents and generate a concise summary of key learnings.

${docSummaries}

Based on these ${validDocs.length} document(s), generate 5-10 one-line bullet points summarizing:
- Core topics and themes covered
- Key products, features, or services mentioned
- Important technical specifications or requirements
- Business processes or workflows described
- Pricing, plans, or business models
- Customer pain points or use cases
- Any other critical information

Return ONLY a JSON array of strings, each representing one key learning:
["Learning point 1", "Learning point 2", ...]

Keep each point to ONE line (max 15 words). Focus on the most important and actionable insights.`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: `You are an expert knowledge analyst specializing in ${domainName}. Extract and summarize key information concisely.` },
        { role: "user", content: summaryPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800,
    });

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in AI response");
    }
    
    const cleanedContent = cleanJSONResponse(messageContent);
    const result = JSON.parse(cleanedContent);
    
    // Handle different response formats
    if (Array.isArray(result)) {
      return result;
    } else if (result.learnings && Array.isArray(result.learnings)) {
      return result.learnings;
    } else if (result.summary && Array.isArray(result.summary)) {
      return result.summary;
    } else if (result.points && Array.isArray(result.points)) {
      return result.points;
    }
    
    // If response format is unexpected, return a generic message
    return ["Summary generated successfully but format unexpected. Please try again."];
  } catch (error: any) {
    console.error("Document summary generation error:", error);
    return ["Error generating summary. Please ensure your AI engine is configured in Settings."];
  }
}
