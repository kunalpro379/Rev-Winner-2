import { knowledgeService } from "./knowledge-service";
import { promptRegistry } from "./prompt-registry";
import { trainMeIntelligence, type DomainIsolationConfig } from "./train-me-intelligence";

export interface AIContextParams {
  userId: string;
  transcript: string;
  feature: 'shift_gears' | 'conversation_analysis' | 'present_to_win' | 'customer_query_pitches';
  customPrompt?: string;
  includePlaybooks?: boolean;
  domainName?: string;
  domainId?: string;
  trainingContext?: string;
  strictIsolation?: boolean;
  allowUniversalFallback?: boolean;
}

export interface AIContextResult {
  systemPrompt: string;
  knowledgeContext: string;
  trainMeContext?: string;
  domainUsed?: string;
  domainId?: string;
  isolationEnforced: boolean;
  source: 'domain_strict' | 'domain' | 'universal' | 'fallback';
}

function isUniversalDomain(name?: string): boolean {
  if (!name) return true;
  const universalNames = ['generic product', 'universal', 'universal rv mode', 'universal knowledge', 'all domains'];
  return universalNames.some(u => name.toLowerCase().includes(u));
}

export async function buildEnhancedAIContext(params: AIContextParams): Promise<AIContextResult> {
  const { 
    userId, 
    transcript, 
    feature, 
    customPrompt, 
    includePlaybooks = false, 
    domainName, 
    domainId,
    trainingContext,
    strictIsolation = false,
    allowUniversalFallback = true
  } = params;

  // For Shift Gears, enforce strict domain isolation by default when a domain is selected
  const isShiftGears = feature === 'shift_gears';
  const hasDomainSelected = Boolean(domainName && !isUniversalDomain(domainName));
  const effectiveStrict = strictIsolation || hasDomainSelected;
  
  console.log(`🔧 AI Context Builder: feature=${feature}, domain="${domainName}", strict=${effectiveStrict}, hasDomain=${hasDomainSelected}`);
  console.log(`🎯 Shift Gears Mode: ${isShiftGears ? 'STRICT DOMAIN ISOLATION - Train Me first, Universal fallback only if no domain match' : 'Standard mode'}`);

  const [trainMeResult, keywords] = await Promise.all([
    trainMeIntelligence.buildEnhancedContext({
      userId,
      transcript,
      domainName,
      domainId,
      maxTokens: isShiftGears ? 12000 : 8000, // Shift Gears gets more context for better reasoning
      strictIsolation: effectiveStrict,
      allowUniversalFallback // Train Me handles its own fallback logic
    }),
    Promise.resolve(knowledgeService.extractKeywordsFromTranscript(transcript))
  ]);

  const hasTrainMeKnowledge = trainMeResult.entriesCount > 0;
  const effectiveTrainingContext = hasTrainMeKnowledge 
    ? trainMeResult.context 
    : (effectiveStrict ? '' : (trainingContext || ''));

  // Shift Gears knowledge priority flow:
  // 1. If Train Me has domain knowledge → USE IT ONLY (no universal mixing)
  // 2. If Train Me has NO domain knowledge AND domain is selected → Allow universal fallback
  // 3. If no domain selected (universal mode) → Use universal knowledge
  let shouldIncludeUniversalKnowledge: boolean;
  if (isShiftGears) {
    if (hasTrainMeKnowledge) {
      // Train Me has knowledge → DO NOT mix with universal
      shouldIncludeUniversalKnowledge = false;
    } else if (hasDomainSelected) {
      // Domain selected but no Train Me knowledge → Allow universal as fallback
      shouldIncludeUniversalKnowledge = allowUniversalFallback;
    } else {
      // No domain selected (universal mode) → Use universal
      shouldIncludeUniversalKnowledge = true;
    }
  } else {
    // Other features: Normal logic
    shouldIncludeUniversalKnowledge = !effectiveStrict && allowUniversalFallback;
  }
  
  if (isShiftGears) {
    const knowledgeSource = hasTrainMeKnowledge 
      ? `Train Me ONLY (${trainMeResult.entriesCount} entries from ${trainMeResult.domainUsed}) - NO CROSS-DOMAIN`
      : shouldIncludeUniversalKnowledge 
        ? 'Universal Fallback (no domain match found)' 
        : 'No Knowledge Available';
    console.log(`🎯 Shift Gears Knowledge Source: ${knowledgeSource}`);
  }
  
  const knowledge = await knowledgeService.buildKnowledgeContext({
    problemKeywords: keywords.problemKeywords,
    productKeywords: keywords.productKeywords,
    industries: keywords.industries,
    includePlaybooks: includePlaybooks && !hasTrainMeKnowledge && shouldIncludeUniversalKnowledge,
  });

  let systemPrompt = "";
  const effectiveDomain = trainMeResult.domainUsed || domainName;
  
  switch (feature) {
    case 'shift_gears':
      systemPrompt = promptRegistry.buildShiftGearsPrompt(
        knowledge, 
        effectiveDomain, 
        effectiveTrainingContext, 
        transcript
      );
      break;
    case 'conversation_analysis':
      systemPrompt = promptRegistry.buildConversationAnalysisPrompt(
        knowledge, 
        customPrompt, 
        effectiveDomain, 
        effectiveTrainingContext
      );
      break;
    case 'customer_query_pitches':
      systemPrompt = promptRegistry.buildCustomerQueryPitchesPrompt(
        knowledge, 
        effectiveDomain, 
        effectiveTrainingContext, 
        transcript
      );
      break;
    case 'present_to_win':
      systemPrompt = promptRegistry.buildPresentToWinPrompt(
        'pitch_deck', 
        knowledge, 
        customPrompt, 
        transcript, 
        effectiveDomain
      );
      break;
  }

  let knowledgeContext = '';
  
  if (hasTrainMeKnowledge) {
    // For Shift Gears: NEVER mix domain knowledge with universal - strict isolation always
    if (effectiveStrict || isShiftGears) {
      knowledgeContext = `=== DOMAIN-SPECIFIC KNOWLEDGE (Train Me: ${trainMeResult.domainUsed}) - STRICT ISOLATION ===
⚠️ CRITICAL: Use ONLY the knowledge below. Do NOT reference external or universal knowledge.
This is authoritative domain-specific data for "${trainMeResult.domainUsed}".
ZERO CROSS-DOMAIN MIXING ALLOWED.

${trainMeResult.context}
`.trim();
    } else {
      // Other features: Allow supplementary universal knowledge
      knowledgeContext = `=== DOMAIN-SPECIFIC KNOWLEDGE (Train Me: ${trainMeResult.domainUsed}) ===
${trainMeResult.context}

=== SUPPLEMENTARY UNIVERSAL KNOWLEDGE ===
${knowledgeService.formatProductsForPrompt(knowledge.relevantProducts.slice(0, 3))}
${knowledgeService.formatCaseStudiesForPrompt(knowledge.relevantCaseStudies.slice(0, 2))}
`.trim();
    }
  } else if (shouldIncludeUniversalKnowledge) {
    knowledgeContext = `
${knowledgeService.formatProductsForPrompt(knowledge.relevantProducts)}

${knowledgeService.formatCaseStudiesForPrompt(knowledge.relevantCaseStudies)}
${includePlaybooks ? knowledgeService.formatPlaybooksForPrompt(knowledge.relevantPlaybooks) : ''}
`.trim();
  }

  if (trainMeResult.domainUsed) {
    console.log(`🎯 AI Context: Using Train Me domain "${trainMeResult.domainUsed}" with ${trainMeResult.entriesCount} entries (source: ${trainMeResult.source}, strict: ${trainMeResult.isolationEnforced})`);
  } else if (effectiveStrict && domainName) {
    console.log(`⚠️ AI Context: Strict isolation requested for "${domainName}" but no domain knowledge found`);
  }

  return {
    systemPrompt,
    knowledgeContext,
    trainMeContext: effectiveTrainingContext || undefined,
    domainUsed: trainMeResult.domainUsed || undefined,
    domainId: trainMeResult.domainId || undefined,
    isolationEnforced: trainMeResult.isolationEnforced,
    source: trainMeResult.source
  };
}

export async function buildPresentToWinContext(
  userId: string,
  transcript: string,
  feature: 'pitch_deck' | 'battle_card' | 'case_study',
  customPrompt?: string,
  domainExpertise?: string,
  options?: { strictIsolation?: boolean; allowUniversalFallback?: boolean }
): Promise<AIContextResult> {
  const strictIsolation = options?.strictIsolation || Boolean(domainExpertise && !isUniversalDomain(domainExpertise));
  const allowUniversalFallback = options?.allowUniversalFallback ?? true;
  
  const [trainMeResult, keywords] = await Promise.all([
    trainMeIntelligence.buildEnhancedContext({
      userId,
      transcript,
      domainName: domainExpertise,
      maxTokens: 8000,
      strictIsolation,
      allowUniversalFallback
    }),
    Promise.resolve(knowledgeService.extractKeywordsFromTranscript(transcript))
  ]);

  const hasTrainMeKnowledge = trainMeResult.entriesCount > 0;
  const shouldIncludeUniversalKnowledge = !strictIsolation && allowUniversalFallback;
  
  const knowledge = await knowledgeService.buildKnowledgeContext({
    problemKeywords: keywords.problemKeywords,
    productKeywords: keywords.productKeywords,
    industries: keywords.industries,
    includePlaybooks: feature === 'pitch_deck' && !hasTrainMeKnowledge && shouldIncludeUniversalKnowledge,
  });

  const effectiveDomain = trainMeResult.domainUsed || domainExpertise;

  const systemPrompt = promptRegistry.buildPresentToWinPrompt(
    feature, 
    knowledge, 
    customPrompt,
    transcript,
    effectiveDomain
  );

  let knowledgeContext = '';
  
  if (hasTrainMeKnowledge) {
    if (strictIsolation) {
      knowledgeContext = `=== DOMAIN-SPECIFIC KNOWLEDGE (Train Me: ${trainMeResult.domainUsed}) - STRICT ISOLATION ===
IMPORTANT: Use ONLY the knowledge below. Do not reference external or universal knowledge.

${trainMeResult.context}
`.trim();
    } else {
      knowledgeContext = `=== DOMAIN-SPECIFIC KNOWLEDGE (Train Me: ${trainMeResult.domainUsed}) ===
${trainMeResult.context}

=== SUPPLEMENTARY UNIVERSAL KNOWLEDGE ===
${knowledgeService.formatProductsForPrompt(knowledge.relevantProducts.slice(0, 3))}
${knowledgeService.formatCaseStudiesForPrompt(knowledge.relevantCaseStudies.slice(0, 2))}
`.trim();
    }
  } else if (shouldIncludeUniversalKnowledge) {
    knowledgeContext = `
${knowledgeService.formatProductsForPrompt(knowledge.relevantProducts)}

${knowledgeService.formatCaseStudiesForPrompt(knowledge.relevantCaseStudies)}
${feature === 'pitch_deck' ? knowledgeService.formatPlaybooksForPrompt(knowledge.relevantPlaybooks) : ''}
`.trim();
  }

  if (trainMeResult.domainUsed) {
    console.log(`🎯 Present-to-Win: Using Train Me domain "${trainMeResult.domainUsed}" with ${trainMeResult.entriesCount} entries (strict: ${trainMeResult.isolationEnforced})`);
  }

  const effectiveTrainMeContext = hasTrainMeKnowledge 
    ? trainMeResult.context 
    : (strictIsolation ? '' : undefined);

  return {
    systemPrompt,
    knowledgeContext,
    trainMeContext: effectiveTrainMeContext || undefined,
    domainUsed: trainMeResult.domainUsed || undefined,
    domainId: trainMeResult.domainId || undefined,
    isolationEnforced: trainMeResult.isolationEnforced,
    source: trainMeResult.source
  };
}

export async function getTrainMeKnowledgeForQuery(
  userId: string,
  query: string,
  domainName?: string,
  transcript?: string,
  options?: { strictIsolation?: boolean; allowUniversalFallback?: boolean }
): Promise<{
  context: string;
  domainUsed: string | null;
  domainId: string | null;
  entriesCount: number;
  fromCache: boolean;
  isolationEnforced: boolean;
  source: string;
}> {
  const strictIsolation = options?.strictIsolation || Boolean(domainName && !isUniversalDomain(domainName));
  const allowUniversalFallback = options?.allowUniversalFallback ?? true;
  
  const result = await trainMeIntelligence.getRelevantKnowledge({
    userId,
    query,
    domainName,
    transcript,
    limit: 10,
    useCache: true,
    strictIsolation,
    allowUniversalFallback
  });

  if (result.entries.length === 0) {
    return {
      context: '',
      domainUsed: null,
      domainId: null,
      entriesCount: 0,
      fromCache: result.fromCache,
      isolationEnforced: result.isolationEnforced,
      source: result.matchType
    };
  }

  const { buildStructuredKnowledgeContext } = await import("./knowledgeExtraction");
  const context = buildStructuredKnowledgeContext(result.entries);

  return {
    context,
    domainUsed: result.domainUsed,
    domainId: result.domainId,
    entriesCount: result.entries.length,
    fromCache: result.fromCache,
    isolationEnforced: result.isolationEnforced,
    source: result.matchType
  };
}

export async function validateDomainForSession(
  userId: string,
  domainName?: string,
  domainId?: string
): Promise<{
  valid: boolean;
  domainName: string | null;
  domainId: string | null;
  error?: string;
}> {
  const validation = await trainMeIntelligence.validateDomainAccess(userId, domainName, domainId);
  
  return {
    valid: validation.valid,
    domainName: validation.domain?.name || null,
    domainId: validation.domain?.id || null,
    error: validation.error
  };
}

export function clearTrainMeCache(userId?: string): void {
  trainMeIntelligence.clearCache(userId);
}
