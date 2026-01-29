import { db } from "../db";
import { domainExpertise, knowledgeEntries, type KnowledgeEntry, type DomainExpertise } from "../../shared/schema";
import { eq, desc, sql, and, or, ilike } from "drizzle-orm";
import { semanticSearch, buildStructuredKnowledgeContext, DEFAULT_SEMANTIC_SEARCH_LIMIT } from "./knowledgeExtraction";

interface CachedQuery {
  result: KnowledgeEntry[];
  timestamp: number;
  domainId: string | null;
  domainName: string | null;
  strictMode: boolean;
}

interface DomainMatchResult {
  domain: DomainExpertise | null;
  confidence: number;
  matchType: 'exact' | 'partial' | 'keyword' | 'none';
}

export interface DomainIsolationConfig {
  strictIsolation: boolean;
  allowUniversalFallback: boolean;
  domainName?: string;
  domainId?: string;
}

export interface KnowledgeRetrievalResult {
  entries: KnowledgeEntry[];
  domainUsed: string | null;
  domainId: string | null;
  matchType: 'domain_strict' | 'domain' | 'universal' | 'fallback' | 'no_domain_selected';
  fromCache: boolean;
  isolationEnforced: boolean;
  crossDomainBlocked: boolean;
}

const QUERY_CACHE_TTL = 5 * 60 * 1000;
const DOMAIN_CACHE_TTL = 10 * 60 * 1000;

const queryCache = new Map<string, CachedQuery>();
const domainCache = new Map<string, { domains: DomainExpertise[]; timestamp: number }>();

const UNIVERSAL_DOMAIN_NAMES = [
  'generic product',
  'universal',
  'universal rv mode',
  'universal knowledge',
  'all domains'
];

function isUniversalDomain(name?: string): boolean {
  if (!name) return true;
  return UNIVERSAL_DOMAIN_NAMES.some(u => name.toLowerCase().includes(u));
}

export class TrainMeIntelligence {
  
  async getUserDomains(userId: string): Promise<DomainExpertise[]> {
    const cacheKey = `domains:${userId}`;
    const cached = domainCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < DOMAIN_CACHE_TTL)) {
      return cached.domains;
    }
    
    const domains = await db
      .select()
      .from(domainExpertise)
      .where(and(
        eq(domainExpertise.userId, userId),
        eq(domainExpertise.isActive, true)
      ))
      .orderBy(desc(domainExpertise.updatedAt));
    
    domainCache.set(cacheKey, { domains, timestamp: Date.now() });
    return domains;
  }

  async getDomainById(domainId: string, userId: string): Promise<DomainExpertise | null> {
    const domains = await this.getUserDomains(userId);
    return domains.find(d => d.id === domainId) || null;
  }

  async getDomainByName(domainName: string, userId: string): Promise<DomainExpertise | null> {
    if (isUniversalDomain(domainName)) return null;
    
    const domains = await this.getUserDomains(userId);
    
    const exactMatch = domains.find(d => 
      d.name.toLowerCase() === domainName.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    const partialMatch = domains.find(d =>
      d.name.toLowerCase().includes(domainName.toLowerCase()) ||
      domainName.toLowerCase().includes(d.name.toLowerCase())
    );
    return partialMatch || null;
  }

  async matchDomainFromConversation(
    userId: string,
    transcript: string,
    explicitDomainName?: string
  ): Promise<DomainMatchResult> {
    const userDomains = await this.getUserDomains(userId);
    
    if (userDomains.length === 0) {
      return { domain: null, confidence: 0, matchType: 'none' };
    }

    if (explicitDomainName && !isUniversalDomain(explicitDomainName)) {
      const exactMatch = userDomains.find(d => 
        d.name.toLowerCase() === explicitDomainName.toLowerCase()
      );
      if (exactMatch) {
        return { domain: exactMatch, confidence: 100, matchType: 'exact' };
      }
      
      const partialMatch = userDomains.find(d =>
        d.name.toLowerCase().includes(explicitDomainName.toLowerCase()) ||
        explicitDomainName.toLowerCase().includes(d.name.toLowerCase())
      );
      if (partialMatch) {
        return { domain: partialMatch, confidence: 85, matchType: 'partial' };
      }
    }

    if (transcript && transcript.length > 50) {
      const transcriptLower = transcript.toLowerCase();
      
      let bestMatch: DomainExpertise | null = null;
      let bestScore = 0;
      
      for (const domain of userDomains) {
        let score = 0;
        
        const domainName = domain.name.toLowerCase();
        const domainWords = domainName.split(/\s+/).filter(w => w.length > 2);
        
        for (const word of domainWords) {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          const matches = transcriptLower.match(regex);
          if (matches) {
            score += matches.length * 10;
          }
        }
        
        if (domain.description) {
          const descWords = domain.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          for (const word of descWords.slice(0, 20)) {
            if (transcriptLower.includes(word)) {
              score += 2;
            }
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = domain;
        }
      }
      
      if (bestMatch && bestScore >= 10) {
        const confidence = Math.min(80, 50 + bestScore);
        return { domain: bestMatch, confidence, matchType: 'keyword' };
      }
    }
    
    return { domain: null, confidence: 0, matchType: 'none' };
  }

  async getStrictDomainKnowledge(params: {
    userId: string;
    domainId: string;
    query?: string;
    limit?: number;
  }): Promise<KnowledgeEntry[]> {
    const { userId, domainId, query, limit = DEFAULT_SEMANTIC_SEARCH_LIMIT } = params;
    
    const domainEntries = await db
      .select()
      .from(knowledgeEntries)
      .where(and(
        eq(knowledgeEntries.domainExpertiseId, domainId),
        eq(knowledgeEntries.userId, userId)
      ))
      .orderBy(desc(knowledgeEntries.usageCount));
    
    if (domainEntries.length === 0) {
      return [];
    }
    
    if (query && query.length > 3) {
      const searchResults = await semanticSearch(query, domainEntries, limit);
      return searchResults.map(r => r.entry);
    }
    
    return domainEntries.slice(0, limit);
  }

  async getRelevantKnowledge(params: {
    userId: string;
    query: string;
    domainName?: string;
    domainId?: string;
    transcript?: string;
    limit?: number;
    useCache?: boolean;
    strictIsolation?: boolean;
    allowUniversalFallback?: boolean;
  }): Promise<KnowledgeRetrievalResult> {
    const { 
      userId, 
      query, 
      domainName, 
      domainId,
      transcript, 
      limit = DEFAULT_SEMANTIC_SEARCH_LIMIT, 
      useCache = true,
      strictIsolation = false,
      allowUniversalFallback = true
    } = params;
    
    const effectiveStrict: boolean = strictIsolation || Boolean(domainName && !isUniversalDomain(domainName));
    const cacheKey = `query:${userId}:${domainId || domainName || 'universal'}:${effectiveStrict ? 'strict' : 'lax'}:${query.substring(0, 100)}`;
    
    if (useCache) {
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < QUERY_CACHE_TTL)) {
        return {
          entries: cached.result,
          domainUsed: cached.domainName,
          domainId: cached.domainId,
          matchType: cached.strictMode ? 'domain_strict' : (cached.domainId ? 'domain' : 'universal'),
          fromCache: true,
          isolationEnforced: cached.strictMode,
          crossDomainBlocked: false
        };
      }
    }
    
    let targetDomain: DomainExpertise | null = null;
    const explicitDomainRequested = Boolean(domainId || (domainName && !isUniversalDomain(domainName)));
    
    if (domainId) {
      targetDomain = await this.getDomainById(domainId, userId);
    } else if (domainName && !isUniversalDomain(domainName)) {
      targetDomain = await this.getDomainByName(domainName, userId);
    }
    
    if (!targetDomain && explicitDomainRequested) {
      if (effectiveStrict) {
        console.log(`🔒 STRICT ISOLATION: Domain "${domainName || domainId}" not found - blocking cross-domain access (NO transcript matching in strict mode)`);
        return {
          entries: [],
          domainUsed: null,
          domainId: null,
          matchType: 'no_domain_selected',
          fromCache: false,
          isolationEnforced: true,
          crossDomainBlocked: true
        };
      }
      
      const domainMatch = await this.matchDomainFromConversation(userId, transcript || '', domainName);
      if (domainMatch.domain && domainMatch.confidence >= 50) {
        targetDomain = domainMatch.domain;
        console.log(`📝 Domain matched from transcript: "${targetDomain.name}" (${domainMatch.confidence}% confidence)`);
      }
    }
    
    let entries: KnowledgeEntry[] = [];
    let domainUsed: string | null = null;
    let matchedDomainId: string | null = null;
    let matchType: KnowledgeRetrievalResult['matchType'] = 'fallback';
    let crossDomainBlocked = false;
    
    if (targetDomain) {
      console.log(`🔒 DOMAIN ISOLATION: Querying ONLY domain "${targetDomain.name}" (ID: ${targetDomain.id}) - strict: ${effectiveStrict}`);
      
      entries = await this.getStrictDomainKnowledge({
        userId,
        domainId: targetDomain.id,
        query,
        limit
      });
      
      if (entries.length > 0) {
        domainUsed = targetDomain.name;
        matchedDomainId = targetDomain.id;
        matchType = effectiveStrict ? 'domain_strict' : 'domain';
        console.log(`🎯 Train Me STRICT: Found ${entries.length} entries from domain "${domainUsed}"`);
      } else if (effectiveStrict) {
        console.log(`🔒 STRICT ISOLATION: No entries in domain "${targetDomain.name}" - NOT falling back to universal`);
        crossDomainBlocked = true;
        matchType = 'domain_strict';
      } else if (allowUniversalFallback) {
        console.log(`📚 Domain "${targetDomain.name}" has no matching entries - falling back to universal`);
      }
    }
    
    if (entries.length === 0 && !effectiveStrict && allowUniversalFallback) {
      const universalEntries = await db
        .select()
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.userId, userId))
        .orderBy(desc(knowledgeEntries.usageCount))
        .limit(100);
      
      if (universalEntries.length > 0) {
        if (query && query.length > 3) {
          const searchResults = await semanticSearch(query, universalEntries, limit);
          entries = searchResults.map(r => r.entry);
        } else {
          entries = universalEntries.slice(0, limit);
        }
        matchType = 'universal';
        console.log(`📚 Train Me: Using universal knowledge base (${entries.length} entries)`);
      }
    }
    
    if (useCache && entries.length > 0) {
      queryCache.set(cacheKey, {
        result: entries,
        timestamp: Date.now(),
        domainId: matchedDomainId,
        domainName: domainUsed,
        strictMode: effectiveStrict
      });
    }
    
    return { 
      entries, 
      domainUsed, 
      domainId: matchedDomainId,
      matchType, 
      fromCache: false,
      isolationEnforced: effectiveStrict,
      crossDomainBlocked
    };
  }

  async buildEnhancedContext(params: {
    userId: string;
    transcript: string;
    domainName?: string;
    domainId?: string;
    searchQuery?: string;
    maxTokens?: number;
    strictIsolation?: boolean;
    allowUniversalFallback?: boolean;
  }): Promise<{
    context: string;
    domainUsed: string | null;
    domainId: string | null;
    entriesCount: number;
    source: 'domain_strict' | 'domain' | 'universal' | 'fallback';
    isolationEnforced: boolean;
  }> {
    const { 
      userId, 
      transcript, 
      domainName, 
      domainId,
      searchQuery, 
      maxTokens = 10000,
      strictIsolation = false,
      allowUniversalFallback = true
    } = params;
    
    const effectiveQuery = searchQuery || this.extractQueryFromTranscript(transcript);
    
    const result = await this.getRelevantKnowledge({
      userId,
      query: effectiveQuery,
      domainName,
      domainId,
      transcript,
      limit: 15,
      useCache: true,
      strictIsolation,
      allowUniversalFallback
    });
    
    if (result.entries.length === 0) {
      const source = result.isolationEnforced ? 'domain_strict' : 'fallback';
      return {
        context: '',
        domainUsed: null,
        domainId: null,
        entriesCount: 0,
        source,
        isolationEnforced: result.isolationEnforced
      };
    }
    
    let context = buildStructuredKnowledgeContext(result.entries);
    
    if (context.length > maxTokens * 4) {
      context = this.prioritizeAndTruncate(context, result.entries, maxTokens * 4);
    }
    
    await this.incrementUsageCount(result.entries.map(e => e.id));
    
    let source: 'domain_strict' | 'domain' | 'universal' | 'fallback';
    if (result.matchType === 'domain_strict') {
      source = 'domain_strict';
    } else if (result.matchType === 'domain') {
      source = 'domain';
    } else if (result.matchType === 'universal') {
      source = 'universal';
    } else {
      source = 'fallback';
    }
    
    return {
      context,
      domainUsed: result.domainUsed,
      domainId: result.domainId,
      entriesCount: result.entries.length,
      source,
      isolationEnforced: result.isolationEnforced
    };
  }

  async validateDomainAccess(userId: string, domainName?: string, domainId?: string): Promise<{
    valid: boolean;
    domain: DomainExpertise | null;
    error?: string;
  }> {
    if (!domainName && !domainId) {
      return { valid: true, domain: null };
    }
    
    if (isUniversalDomain(domainName)) {
      return { valid: true, domain: null };
    }
    
    let domain: DomainExpertise | null = null;
    
    if (domainId) {
      domain = await this.getDomainById(domainId, userId);
    } else if (domainName) {
      domain = await this.getDomainByName(domainName, userId);
    }
    
    if (!domain) {
      return {
        valid: false,
        domain: null,
        error: `Domain "${domainName || domainId}" not found or not accessible`
      };
    }
    
    return { valid: true, domain };
  }

  private extractQueryFromTranscript(transcript: string): string {
    if (!transcript || transcript.length < 20) return '';
    
    const recent = transcript.slice(-2000);
    
    const words = recent
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    const stopWords = new Set([
      'about', 'after', 'again', 'could', 'every', 'first', 'found', 'great',
      'other', 'place', 'right', 'still', 'their', 'there', 'these', 'thing',
      'think', 'three', 'under', 'where', 'which', 'while', 'would', 'write',
      'speaker', 'customer', 'agent', 'hello', 'thank', 'thanks', 'please'
    ]);
    
    const meaningfulWords = words.filter(w => !stopWords.has(w.toLowerCase()));
    
    return meaningfulWords.slice(-20).join(' ');
  }

  private prioritizeAndTruncate(context: string, entries: KnowledgeEntry[], maxChars: number): string {
    const pricingEntries = entries.filter(e => e.category === 'pricing');
    const productEntries = entries.filter(e => e.category === 'product' || e.category === 'feature');
    const otherEntries = entries.filter(e => !['pricing', 'product', 'feature'].includes(e.category));
    
    const prioritizedEntries = [...pricingEntries, ...productEntries, ...otherEntries];
    
    let result = buildStructuredKnowledgeContext(prioritizedEntries);
    
    if (result.length > maxChars) {
      result = result.substring(0, maxChars) + '\n... [truncated for performance]';
    }
    
    return result;
  }

  private async incrementUsageCount(entryIds: string[]): Promise<void> {
    if (entryIds.length === 0) return;
    
    try {
      await db
        .update(knowledgeEntries)
        .set({ 
          usageCount: sql`${knowledgeEntries.usageCount} + 1`,
          updatedAt: new Date()
        })
        .where(sql`${knowledgeEntries.id} = ANY(${entryIds})`);
    } catch (error) {
      console.warn('Failed to increment usage count:', error);
    }
  }

  clearCache(userId?: string): void {
    if (userId) {
      const keysToDelete = Array.from(queryCache.keys()).filter(key => key.includes(userId));
      keysToDelete.forEach(key => queryCache.delete(key));
      domainCache.delete(`domains:${userId}`);
    } else {
      queryCache.clear();
      domainCache.clear();
    }
    console.log(`🧹 Train Me cache cleared${userId ? ` for user ${userId}` : ' (all users)'}`);
  }
}

export const trainMeIntelligence = new TrainMeIntelligence();
