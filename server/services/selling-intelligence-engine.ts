import { db } from "../db";
import { trainingDocuments } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export type SellingDomain = 
  | 'technology_saas'
  | 'financial_services'
  | 'consulting_services'
  | 'managed_services'
  | 'healthcare'
  | 'education'
  | 'logistics'
  | 'manufacturing'
  | 'b2b_general'
  | 'b2c_general'
  | 'unknown';

export type DealType = 
  | 'product'
  | 'subscription'
  | 'service'
  | 'advisory'
  | 'outcome_based'
  | 'hybrid';

export type ClaimClassification = 
  | 'verified_fact'
  | 'positioning_advantage'
  | 'use_case_strength'
  | 'typical_market_practice'
  | 'trade_off_consideration'
  | 'opinion_seller_framing';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type SourceCategory = 
  | 'train_me_documents'
  | 'official_public_sources'
  | 'industry_standard_practices'
  | 'general_selling_principles';

export type CaseStudyType = 'real' | 'anonymized' | 'illustrative';

export interface DomainContext {
  domain: SellingDomain;
  dealType: DealType;
  isRegulated: boolean;
  complianceSensitivity: 'high' | 'medium' | 'low';
  detectedKeywords: string[];
  confidenceLevel: ConfidenceLevel;
}

export interface ClaimSafetyResult {
  classification: ClaimClassification;
  isSafe: boolean;
  originalClaim: string;
  safeClaim: string;
  riskFactors: string[];
}

export interface SourceTruthResult {
  sourceCategory: SourceCategory;
  confidenceLevel: ConfidenceLevel;
  isVerified: boolean;
  citation?: string;
}

export interface InsightAuditLog {
  id: string;
  timestamp: Date;
  domainDetected: SellingDomain;
  sourceCategory: SourceCategory;
  confidenceLevel: ConfidenceLevel;
  claimClassification: ClaimClassification;
  generatedContent: string;
  userId?: string;
}

const DOMAIN_KEYWORDS: Record<SellingDomain, string[]> = {
  technology_saas: ['software', 'saas', 'cloud', 'api', 'platform', 'integration', 'automation', 'ai', 'machine learning', 'data', 'analytics', 'crm', 'erp', 'devops', 'cybersecurity', 'infrastructure', 'hosting', 'subscription', 'licensing'],
  financial_services: ['banking', 'insurance', 'investment', 'loan', 'mortgage', 'credit', 'fintech', 'payments', 'trading', 'wealth management', 'compliance', 'risk management', 'audit', 'tax', 'accounting', 'financial planning'],
  consulting_services: ['consulting', 'advisory', 'strategy', 'transformation', 'implementation', 'change management', 'process improvement', 'optimization', 'assessment', 'audit', 'professional services', 'engagement'],
  managed_services: ['managed services', 'msp', 'outsourcing', 'support', 'maintenance', 'monitoring', 'helpdesk', 'it services', 'bpo', 'service level', 'sla', 'operations'],
  healthcare: ['healthcare', 'medical', 'patient', 'clinical', 'hospital', 'pharmacy', 'telehealth', 'ehr', 'emr', 'hipaa', 'diagnosis', 'treatment', 'wellness', 'health insurance'],
  education: ['education', 'learning', 'training', 'course', 'curriculum', 'student', 'teacher', 'lms', 'elearning', 'certification', 'school', 'university', 'academic'],
  logistics: ['logistics', 'supply chain', 'shipping', 'freight', 'warehouse', 'inventory', 'fulfillment', 'distribution', 'transportation', 'fleet', 'tracking', 'delivery'],
  manufacturing: ['manufacturing', 'production', 'factory', 'assembly', 'quality control', 'lean', 'automation', 'machinery', 'equipment', 'oem', 'supply chain', 'procurement'],
  b2b_general: ['enterprise', 'business', 'corporate', 'b2b', 'vendor', 'procurement', 'contract', 'partnership', 'channel', 'reseller'],
  b2c_general: ['consumer', 'retail', 'ecommerce', 'customer', 'shopping', 'subscription', 'membership', 'loyalty'],
  unknown: []
};

const DEAL_TYPE_KEYWORDS: Record<DealType, string[]> = {
  product: ['product', 'purchase', 'buy', 'license', 'perpetual', 'one-time', 'hardware', 'equipment'],
  subscription: ['subscription', 'monthly', 'annual', 'recurring', 'saas', 'membership', 'per user', 'per seat'],
  service: ['service', 'implementation', 'integration', 'customization', 'support', 'maintenance', 'professional services'],
  advisory: ['advisory', 'consulting', 'strategy', 'assessment', 'recommendation', 'guidance', 'expert'],
  outcome_based: ['outcome', 'performance', 'results', 'success fee', 'gain sharing', 'value based', 'roi guarantee'],
  hybrid: ['bundle', 'package', 'solution', 'platform plus services', 'full stack']
};

const REGULATED_INDUSTRIES = ['financial_services', 'healthcare', 'education'];

const DISALLOWED_CLAIM_PATTERNS = [
  /\bbest\b/i,
  /\bonly\b/i,
  /\bguaranteed?\b/i,
  /\bfastest\b/i,
  /\bcheapest\b/i,
  /\b100%\b/,
  /\balways\b/i,
  /\bnever\b/i,
  /\bno risk\b/i,
  /\brisk.?free\b/i,
  /\bunmatched\b/i,
  /\bunrivaled\b/i,
  /\b#1\b/,
  /\bnumber one\b/i
];

const DIFFERENTIATION_FRAMEWORKS = [
  'problem_fit',
  'approach_methodology',
  'delivery_model',
  'risk_profile',
  'customization_level',
  'time_to_value',
  'cost_transparency',
  'trust_accountability'
] as const;

export class SellingIntelligenceEngine {
  private auditLogs: InsightAuditLog[] = [];

  detectDomain(conversationText: string, domainExpertise?: string): DomainContext {
    const lowerText = (conversationText + ' ' + (domainExpertise || '')).toLowerCase();
    const detectedKeywords: string[] = [];
    let bestDomain: SellingDomain = 'unknown';
    let bestScore = 0;

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const matches = keywords.filter(kw => lowerText.includes(kw));
      if (matches.length > bestScore) {
        bestScore = matches.length;
        bestDomain = domain as SellingDomain;
        detectedKeywords.push(...matches);
      }
    }

    let bestDealType: DealType = 'hybrid';
    let dealScore = 0;

    for (const [dealType, keywords] of Object.entries(DEAL_TYPE_KEYWORDS)) {
      const matches = keywords.filter(kw => lowerText.includes(kw));
      if (matches.length > dealScore) {
        dealScore = matches.length;
        bestDealType = dealType as DealType;
      }
    }

    const isRegulated = REGULATED_INDUSTRIES.includes(bestDomain);
    const complianceSensitivity = isRegulated ? 'high' : (bestDomain === 'unknown' ? 'medium' : 'low');
    const confidenceLevel: ConfidenceLevel = bestScore >= 5 ? 'high' : (bestScore >= 2 ? 'medium' : 'low');

    const uniqueKeywords = Array.from(new Set(detectedKeywords));

    return {
      domain: bestDomain,
      dealType: bestDealType,
      isRegulated,
      complianceSensitivity,
      detectedKeywords: uniqueKeywords,
      confidenceLevel
    };
  }

  async getSourceTruthHierarchy(userId: string, domainExpertiseId?: string): Promise<{
    hasTrainMeData: boolean;
    trainMeSummary?: string;
    sourceCategory: SourceCategory;
  }> {
    let hasTrainMeData = false;
    let trainMeSummary = '';

    if (domainExpertiseId) {
      try {
        const docs = await db.select()
          .from(trainingDocuments)
          .where(and(
            eq(trainingDocuments.domainExpertiseId, domainExpertiseId),
            eq(trainingDocuments.processingStatus, 'completed')
          ))
          .orderBy(desc(trainingDocuments.uploadedAt));

        if (docs.length > 0) {
          hasTrainMeData = true;
          trainMeSummary = docs.map(d => `${d.fileName}: ${(d.content || '').slice(0, 500)}`).join('\n');
        }
      } catch (error) {
        console.error('Error fetching training documents:', error);
      }
    }

    const sourceCategory: SourceCategory = hasTrainMeData 
      ? 'train_me_documents' 
      : 'general_selling_principles';

    return { hasTrainMeData, trainMeSummary, sourceCategory };
  }

  classifyClaim(claim: string): ClaimSafetyResult {
    const riskFactors: string[] = [];
    let isSafe = true;
    let safeClaim = claim;
    let classification: ClaimClassification = 'positioning_advantage';

    for (const pattern of DISALLOWED_CLAIM_PATTERNS) {
      if (pattern.test(claim)) {
        isSafe = false;
        riskFactors.push(`Contains absolute term: ${pattern.source}`);
        safeClaim = safeClaim.replace(pattern, (match) => {
          if (/best/i.test(match)) return 'leading';
          if (/only/i.test(match)) return 'among the few';
          if (/guaranteed/i.test(match)) return 'designed to deliver';
          if (/fastest/i.test(match)) return 'optimized for speed';
          if (/cheapest/i.test(match)) return 'cost-effective';
          if (/100%/i.test(match)) return 'high';
          if (/always/i.test(match)) return 'typically';
          if (/never/i.test(match)) return 'rarely';
          return 'typically';
        });
      }
    }

    if (/study|research|survey|data shows|statistics/i.test(claim)) {
      classification = claim.includes('our') ? 'verified_fact' : 'typical_market_practice';
    } else if (/compared to|versus|unlike|vs\.?/i.test(claim)) {
      classification = 'positioning_advantage';
    } else if (/use case|scenario|when|ideal for/i.test(claim)) {
      classification = 'use_case_strength';
    } else if (/however|trade-?off|consideration|caveat/i.test(claim)) {
      classification = 'trade_off_consideration';
    } else if (/we believe|in our view|our opinion/i.test(claim)) {
      classification = 'opinion_seller_framing';
    }

    return {
      classification,
      isSafe,
      originalClaim: claim,
      safeClaim: isSafe ? claim : safeClaim,
      riskFactors
    };
  }

  buildDifferentiationFramework(context: DomainContext): string[] {
    const frameworks: string[] = [];

    frameworks.push('Problem-Fit: What specific challenges is this solution designed to address?');
    frameworks.push('Approach & Methodology: How does the implementation approach differ from alternatives?');
    
    if (context.dealType === 'service' || context.dealType === 'advisory') {
      frameworks.push('Delivery Model: What resources, expertise, and effort are required?');
    }
    
    if (context.isRegulated) {
      frameworks.push('Risk Profile & Compliance: How does this address regulatory requirements and reduce risk?');
    }
    
    frameworks.push('Time-to-Value: How quickly can measurable results be achieved?');
    frameworks.push('Cost Transparency: What is the total cost of ownership and pricing model?');
    frameworks.push('Trust & Accountability: What guarantees, SLAs, or success metrics are in place?');

    return frameworks;
  }

  buildComplianceDisclaimer(context: DomainContext): string | null {
    if (!context.isRegulated) return null;

    switch (context.domain) {
      case 'financial_services':
        return 'This information is for general purposes only and does not constitute financial advice. Please consult with a licensed financial advisor for specific recommendations.';
      case 'healthcare':
        return 'This information is for informational purposes only and does not constitute medical advice. Please consult with a qualified healthcare professional for medical decisions.';
      case 'education':
        return 'Educational outcomes may vary based on individual circumstances and institutional requirements.';
      default:
        return 'Please consult with appropriate licensed professionals for specific advice in your situation.';
    }
  }

  generateCaseStudyTag(isReal: boolean, isAnonymized: boolean): { type: CaseStudyType; label: string } {
    if (isReal && !isAnonymized) {
      return { type: 'real', label: 'Verified Case Study' };
    } else if (isReal && isAnonymized) {
      return { type: 'anonymized', label: 'Real Case (Anonymized)' };
    } else {
      return { type: 'illustrative', label: 'Illustrative Example' };
    }
  }

  buildCompetitorHandlingGuidelines(): string {
    return `
COMPETITOR & ALTERNATIVE HANDLING GUIDELINES:
1. Acknowledge the strengths of alternatives when relevant
2. Clearly state scenarios where alternatives may be a better fit
3. Position your offering honestly based on problem-fit
4. Use language like:
   - "Option A works well when [condition]. This approach is more suitable when [different condition]."
   - "For organizations prioritizing [X], they may consider [alternative]. For those prioritizing [Y], our solution offers..."
5. Avoid:
   - Direct attacks on competitor weaknesses
   - Unverified claims about competitor limitations
   - Binary yes/no superiority tables
`;
  }

  logInsight(insight: Omit<InsightAuditLog, 'id' | 'timestamp'>): InsightAuditLog {
    const log: InsightAuditLog = {
      ...insight,
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    this.auditLogs.push(log);
    
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-500);
    }
    
    return log;
  }

  getRecentAuditLogs(limit: number = 50): InsightAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  buildAccuracyFirstSystemPrompt(context: DomainContext, sourceHierarchy: SourceCategory, hasTrainMeData: boolean): string {
    const domainLabel = context.domain.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const complianceDisclaimer = this.buildComplianceDisclaimer(context);
    const differentiationFramework = this.buildDifferentiationFramework(context);

    return `You are an Accuracy-First Selling Intelligence Engine for Rev Winner.
You assist sellers across ALL industries with clear, credible, and accurate differentiation.

DETECTED CONTEXT:
- Selling Domain: ${domainLabel}
- Deal Type: ${context.dealType.replace(/_/g, ' ')}
- Compliance Sensitivity: ${context.complianceSensitivity}
- Confidence Level: ${context.confidenceLevel}

SOURCE-OF-TRUTH HIERARCHY (MANDATORY):
${hasTrainMeData ? '1. PRIMARY: Customer-provided "Train Me" data - USE THIS FIRST' : '1. No Train Me data available - using general selling principles'}
2. Official, publicly available sources (vendor websites, brochures)
3. Industry-standard practices (use cautiously, never as absolute facts)
4. General selling principles (only when domain-specific data unavailable)

If information is uncertain, clearly label as "Positioning Insight" or "Typical Market Observation"

CLAIM SAFETY RULES - DISALLOWED ACROSS ALL VERTICALS:
- Absolute claims: best, only, guaranteed, fastest, cheapest
- Unverified performance numbers
- Regulatory or financial guarantees
- Medical, legal, or financial advice language

DIFFERENTIATION FRAMEWORK (Use these, NOT feature checklists):
${differentiationFramework.map((f, i) => `${i + 1}. ${f}`).join('\n')}

${this.buildCompetitorHandlingGuidelines()}

${complianceDisclaimer ? `COMPLIANCE DISCLAIMER (Include when appropriate):\n${complianceDisclaimer}\n` : ''}

CASE STUDY RULES:
- Tag all case studies as: Real (verified), Anonymized (real but identity hidden), or Illustrative (hypothetical example)
- No fabricated customer names or logos
- No invented metrics
- Focus on problem → approach → outcome
- Avoid exaggerated ROI claims

RESPONSE QUALITY STANDARDS:
- Use probabilistic language when confidence is low: "In similar situations, sellers typically see...", "Based on available information..."
- Every generated statement must be internally classifiable as:
  * Verified Fact
  * Positioning Advantage
  * Use-Case Strength
  * Typical Market Practice
  * Trade-Off / Consideration
  * Opinion (Seller Framing)
- Prefer trust preservation over persuasion
- ${context.isRegulated ? 'This is a REGULATED INDUSTRY - automatically soften claims and avoid advice-giving language' : 'Standard compliance applies'}`;
  }
}

export interface PromptSupplement {
  domainBadge: string;
  complianceBanner: string | null;
  claimGuardrails: string;
  differentiationHints: string;
  caseStudyTag: string;
}

const promptSupplementCache = new Map<string, { supplement: PromptSupplement; timestamp: number }>();
const SUPPLEMENT_CACHE_TTL = 300000; // 5 minutes

export function buildPromptSupplement(
  conversationContext: string,
  domainExpertise?: string,
  contentType?: 'pitch_deck' | 'case_study' | 'battle_card'
): PromptSupplement {
  const cacheKey = `${domainExpertise || 'unknown'}:${contentType || 'general'}:${conversationContext.slice(-200)}`;
  
  const cached = promptSupplementCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SUPPLEMENT_CACHE_TTL) {
    return cached.supplement;
  }
  
  const engine = sellingIntelligenceEngine;
  const context = engine.detectDomain(conversationContext, domainExpertise);
  const domainLabel = context.domain.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const domainBadge = `[${domainLabel} | ${context.dealType.replace(/_/g, ' ')} | Confidence: ${context.confidenceLevel}]`;
  
  const complianceBanner = context.isRegulated 
    ? `⚠️ REGULATED INDUSTRY (${domainLabel}): Use conservative language. No guarantees. No financial/medical/legal advice. Include disclaimers.`
    : null;
  
  const claimGuardrails = `CLAIM RULES: ❌NO: best, only, guaranteed, fastest, cheapest, 100%, always, never. ✅USE: leading, among, designed for, optimized, typically, often.`;
  
  const frameworks = engine.buildDifferentiationFramework(context).slice(0, 3);
  const differentiationHints = `DIFFERENTIATE BY: ${frameworks.map(f => f.split(':')[0].trim()).join(' | ')}`;
  
  let caseStudyTag = '';
  if (contentType === 'case_study') {
    caseStudyTag = 'TAG CASE STUDY AS: "Verified Case Study" (real), "Real Case (Anonymized)" (hidden identity), or "Illustrative Example" (hypothetical). Add "verificationType" field.';
  } else if (contentType === 'battle_card') {
    caseStudyTag = 'INCLUDE: buyerContext, whenFitsWell, whenMayNotFit, languageToAvoid. Acknowledge competitor strengths honestly.';
  }
  
  const supplement: PromptSupplement = {
    domainBadge,
    complianceBanner,
    claimGuardrails,
    differentiationHints,
    caseStudyTag
  };
  
  promptSupplementCache.set(cacheKey, { supplement, timestamp: Date.now() });
  
  if (promptSupplementCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of promptSupplementCache.entries()) {
      if (now - value.timestamp > SUPPLEMENT_CACHE_TTL) {
        promptSupplementCache.delete(key);
      }
    }
  }
  
  return supplement;
}

export function formatPromptSupplement(supplement: PromptSupplement): string {
  const parts = [supplement.domainBadge];
  
  if (supplement.complianceBanner) {
    parts.push(supplement.complianceBanner);
  }
  
  parts.push(supplement.claimGuardrails);
  parts.push(supplement.differentiationHints);
  
  if (supplement.caseStudyTag) {
    parts.push(supplement.caseStudyTag);
  }
  
  return parts.join('\n');
}

export const sellingIntelligenceEngine = new SellingIntelligenceEngine();
