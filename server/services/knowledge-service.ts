import { db } from "../db";
import { caseStudies, products, implementationPlaybooks, type CaseStudy, type Product, type ImplementationPlaybook } from "../../shared/schema";
import { eq, and, sql, or, inArray } from "drizzle-orm";

export interface KnowledgeContext {
  relevantProducts: Product[];
  relevantCaseStudies: CaseStudy[];
  relevantPlaybooks: ImplementationPlaybook[];
}

export class KnowledgeService {
  async getRelevantProducts(keywords: string[], industries?: string[]): Promise<Product[]> {
    try {
      let query = db
        .select()
        .from(products)
        .where(eq(products.isActive, true));

      const results = await query.limit(10);
      
      if (!keywords.length) return results;

      const keywordLower = keywords.map(k => k.toLowerCase());
      
      return results.filter(product => {
        const searchText = `${product.name} ${product.description} ${product.category || ''} ${(product.keyFeatures || []).join(' ')}`.toLowerCase();
        
        const matchesKeyword = keywordLower.some(keyword => searchText.includes(keyword));
        
        const matchesIndustry = !industries?.length || 
          (product.targetIndustries || []).some(ti => 
            industries.some(ind => ti.toLowerCase().includes(ind.toLowerCase()))
          );
        
        return matchesKeyword && matchesIndustry;
      });
    } catch (error) {
      console.error("Error retrieving relevant products:", error);
      return [];
    }
  }

  async getCaseStudiesByContext(problemKeywords: string[], industries?: string[], productCodes?: string[]): Promise<CaseStudy[]> {
    try {
      let query = db
        .select()
        .from(caseStudies)
        .where(eq(caseStudies.isActive, true));

      const results = await query.limit(20);
      
      if (!problemKeywords.length && !industries?.length && !productCodes?.length) {
        return results.slice(0, 3);
      }

      const keywordLower = problemKeywords.map(k => k.toLowerCase());
      
      return results
        .filter(caseStudy => {
          const searchText = `${caseStudy.title} ${caseStudy.problemStatement} ${caseStudy.solution}`.toLowerCase();
          
          const matchesKeyword = !problemKeywords.length || 
            keywordLower.some(keyword => searchText.includes(keyword));
          
          const matchesIndustry = !industries?.length || 
            industries.some(ind => caseStudy.industry?.toLowerCase().includes(ind.toLowerCase()));
          
          const matchesProduct = !productCodes?.length || 
            (caseStudy.productCodes || []).some(pc => productCodes.includes(pc));
          
          return matchesKeyword || matchesIndustry || matchesProduct;
        })
        .slice(0, 3);
    } catch (error) {
      console.error("Error retrieving case studies:", error);
      return [];
    }
  }

  async getImplementationPlaybooks(keywords: string[], productCodes?: string[]): Promise<ImplementationPlaybook[]> {
    try {
      let query = db
        .select()
        .from(implementationPlaybooks)
        .where(eq(implementationPlaybooks.isActive, true));

      const results = await query.limit(10);
      
      if (!keywords.length && !productCodes?.length) {
        return results.slice(0, 2);
      }

      const keywordLower = keywords.map(k => k.toLowerCase());
      
      return results
        .filter(playbook => {
          const searchText = `${playbook.title} ${playbook.scenario}`.toLowerCase();
          
          const matchesKeyword = !keywords.length || 
            keywordLower.some(keyword => searchText.includes(keyword));
          
          const matchesProduct = !productCodes?.length || 
            (playbook.productCodes || []).some(pc => productCodes.includes(pc));
          
          return matchesKeyword || matchesProduct;
        })
        .slice(0, 2);
    } catch (error) {
      console.error("Error retrieving playbooks:", error);
      return [];
    }
  }

  async buildKnowledgeContext(params: {
    problemKeywords?: string[];
    productKeywords?: string[];
    industries?: string[];
    includePlaybooks?: boolean;
  }): Promise<KnowledgeContext> {
    const {
      problemKeywords = [],
      productKeywords = [],
      industries = [],
      includePlaybooks = false,
    } = params;

    const allKeywords = [...problemKeywords, ...productKeywords];
    
    const [relevantProducts, relevantCaseStudies, relevantPlaybooks] = await Promise.all([
      this.getRelevantProducts(productKeywords, industries),
      this.getCaseStudiesByContext(problemKeywords, industries),
      includePlaybooks ? this.getImplementationPlaybooks(allKeywords) : Promise.resolve([]),
    ]);

    return {
      relevantProducts,
      relevantCaseStudies,
      relevantPlaybooks,
    };
  }

  extractKeywordsFromTranscript(transcript: string): {
    problemKeywords: string[];
    productKeywords: string[];
    industries: string[];
  } {
    const text = transcript.toLowerCase();
    
    // CRITICAL FIX: Extract ACTUAL words from transcript, not just predefined keywords
    const words = transcript
      .replace(/[^\w\s'-]/g, ' ') // Keep hyphens and apostrophes
      .split(/\s+/)
      .filter(w => w.length > 2); // Skip very short words
    
    // Stop words to exclude
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one',
      'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'now', 'old',
      'see', 'two', 'who', 'boy', 'did', 'she', 'too', 'use', 'dad', 'mom', 'let', 'put',
      'say', 'set', 'way', 'yes', 'yet', 'also', 'back', 'been', 'call', 'came', 'come',
      'down', 'each', 'even', 'find', 'from', 'give', 'good', 'have', 'here', 'into',
      'just', 'know', 'like', 'long', 'look', 'made', 'make', 'many', 'more', 'most',
      'much', 'must', 'name', 'need', 'next', 'only', 'over', 'part', 'said', 'same',
      'some', 'such', 'take', 'than', 'that', 'them', 'then', 'they', 'this', 'time',
      'very', 'want', 'well', 'went', 'were', 'what', 'when', 'will', 'with', 'year',
      'your', 'about', 'after', 'again', 'could', 'every', 'first', 'found', 'great',
      'other', 'place', 'right', 'still', 'their', 'there', 'these', 'thing', 'think',
      'three', 'under', 'where', 'which', 'while', 'would', 'write', 'being', 'doing',
      'having', 'getting', 'going', 'asking', 'telling', 'speaker', 'currently', 'using',
      'looking', 'please', 'better', 'within', 'months', 'switch', 'because', 'happy',
      'really', 'pretty', 'quite', 'actually', 'basically', 'literally', 'something'
    ]);
    
    // Problem indicators (keep existing)
    const problemIndicators = [
      'problem', 'issue', 'challenge', 'struggling', 'difficult', 'pain point', 'pain',
      'bottleneck', 'inefficient', 'slow', 'manual', 'frustrated', 'error', 'errors',
      'failing', 'broken', 'stuck', 'concern', 'worried', 'trouble', 'hard'
    ];
    
    // Technical/product keywords (massively expanded)
    const technicalTerms = new Set([
      // General IT
      'software', 'platform', 'system', 'tool', 'solution', 'service', 'application', 'app',
      'integration', 'api', 'dashboard', 'reporting', 'analytics', 'automation', 'workflow',
      
      // RMM/MSP specific
      'rmm', 'monitoring', 'management', 'remote', 'endpoints', 'devices', 'agents', 'patching',
      'alerts', 'alerting', 'backup', 'recovery', 'disaster', 'security', 'antivirus', 'firewall',
      'network', 'discovery', 'mapping', 'asset', 'inventory', 'tracking', 'deployment',
      
      // CRM/Sales
      'crm', 'sales', 'leads', 'pipeline', 'deals', 'opportunities', 'contacts', 'accounts',
      'forecasting', 'reporting', 'customer', 'client', 'prospect',
      
      // General business
      'documentation', 'compliance', 'billing', 'invoicing', 'ticketing', 'helpdesk',
      'support', 'onboarding', 'training', 'collaboration', 'communication'
    ]);
    
    // Industry indicators (keep existing)
    const industryIndicators = [
      'healthcare', 'finance', 'retail', 'manufacturing', 'technology', 'education',
      'real estate', 'insurance', 'telecommunications', 'automotive', 'energy', 'msp', 'it'
    ];
    
    // Extract meaningful keywords
    const meaningfulWords = words
      .filter(w => {
        const lower = w.toLowerCase();
        // Keep if: technical term, capitalized (brand name), or long enough and not stop word
        return technicalTerms.has(lower) || 
               (w[0] === w[0].toUpperCase() && w.length > 3) || // Capitalized words (brands)
               (w.length > 4 && !stopWords.has(lower)); // Longer words, not stop words
      })
      .map(w => w.toLowerCase());
    
    // Deduplicate and limit
    const uniqueWords = Array.from(new Set(meaningfulWords));
    
    // Categorize keywords
    const problemKeywords = [
      ...problemIndicators.filter(word => text.includes(word)),
      ...uniqueWords.filter(w => 
        w.includes('fail') || w.includes('struggle') || w.includes('break') || 
        w.includes('wrong') || w.includes('miss')
      )
    ];
    
    const productKeywords = [
      ...uniqueWords.filter(w => technicalTerms.has(w)),
      ...uniqueWords.filter(w => !technicalTerms.has(w) && w.length > 3) // Other meaningful terms
    ].slice(0, 20); // Limit to top 20 for performance
    
    const industries = industryIndicators.filter(word => text.includes(word));
    
    console.log(`🔍 Extracted keywords from transcript:`, {
      problemKeywords: problemKeywords.slice(0, 10),
      productKeywords: productKeywords.slice(0, 15),
      industries
    });
    
    return { problemKeywords, productKeywords, industries };
  }

  formatCaseStudiesForPrompt(caseStudies: CaseStudy[]): string {
    if (!caseStudies.length) return "No relevant case studies available.";
    
    return caseStudies.map((cs, idx) => {
      const outcomes = Array.isArray(cs.outcomes) ? cs.outcomes as Array<{ metric: string; value: string }> : [];
      const outcomesText = outcomes.map(o => `- ${o.metric}: ${o.value}`).join('\n');
      
      return `
CASE STUDY ${idx + 1}: ${cs.title}
Industry: ${cs.industry || 'General'}
Customer Size: ${cs.customerSize || 'Not specified'}

PROBLEM:
${cs.problemStatement}

SOLUTION:
${cs.solution}

${cs.implementation ? `IMPLEMENTATION:\n${cs.implementation}\n` : ''}
OUTCOMES:
${outcomesText || 'Results documented in case study'}

Time to Value: ${cs.timeToValue || 'Varies by customer'}
`.trim();
    }).join('\n\n---\n\n');
  }

  formatProductsForPrompt(products: Product[]): string {
    if (!products.length) return "No specific products identified yet.";
    
    return products.map((p, idx) => {
      const features = (p.keyFeatures || []).slice(0, 5).map(f => `- ${f}`).join('\n');
      
      return `
PRODUCT ${idx + 1}: ${p.name} (${p.code})
Category: ${p.category || 'General'}
Description: ${p.description}

Key Features:
${features || '- See product documentation'}

Typical Use Cases:
${(p.useCases || []).slice(0, 3).map(uc => `- ${uc}`).join('\n') || '- Various business scenarios'}

Pricing: ${p.typicalPrice || 'Contact sales'}
Implementation Time: ${p.implementationTime || '2-6 weeks'}
`.trim();
    }).join('\n\n---\n\n');
  }

  formatPlaybooksForPrompt(playbooks: ImplementationPlaybook[]): string {
    if (!playbooks.length) return "";
    
    return `\n\nIMPLEMENTATION GUIDES:\n\n` + playbooks.map((pb, idx) => {
      const steps = Array.isArray(pb.steps) ? pb.steps as Array<{ step: number; title: string; description: string; duration?: string }> : [];
      const stepsText = steps.map(s => `${s.step}. ${s.title}${s.duration ? ` (${s.duration})` : ''}\n   ${s.description}`).join('\n');
      
      return `
PLAYBOOK ${idx + 1}: ${pb.title}

When to Use: ${pb.scenario}

Implementation Steps:
${stepsText}

Prerequisites:
${(pb.prerequisites || []).map(p => `- ${p}`).join('\n') || '- Standard requirements'}
`.trim();
    }).join('\n\n---\n\n');
  }

  /**
   * NEW: Multi-Product Intelligence Integration
   * Integrates with Sales Intelligence Layer for advanced product recommendations
   */
  async getMultiProductRecommendations(params: {
    transcript: string;
    conversationHistory: Array<{ sender: string; content: string }>;
    currentInsights: any;
    buyerContext?: {
      teamSize?: number;
      industry?: string;
      title?: string;
      budget?: string;
      urgency?: string;
    };
    multiProductEliteAI?: boolean;
  }): Promise<any> {
    // Only use multi-product intelligence if feature is enabled
    if (!params.multiProductEliteAI) {
      return null; // Fallback to existing single-product flow
    }

    try {
      const { salesIntelligence } = await import("./sales-intelligence-layer");
      
      const intelligence = await salesIntelligence.analyzeConversationForProducts({
        transcript: params.transcript,
        conversationHistory: params.conversationHistory,
        currentInsights: params.currentInsights,
        buyerContext: params.buyerContext,
      });

      console.log("🎯 Multi-Product Intelligence activated:", {
        primaryProduct: intelligence.primaryProduct?.productName,
        secondaryCount: intelligence.secondaryProducts.length,
        crossSellCount: intelligence.crossSellOpportunities.length,
        bundleCount: intelligence.bundleRecommendations.length,
      });

      return intelligence;
    } catch (error) {
      console.error("❌ Multi-Product Intelligence error (falling back to standard flow):", error);
      return null; // Graceful fallback
    }
  }

  /**
   * Format multi-product intelligence for AI prompts
   */
  formatMultiProductIntelligenceForPrompt(intelligence: any): string {
    if (!intelligence) return "";

    let formatted = "\n\n=== MULTI-PRODUCT INTELLIGENCE (Act like TOP 1% Elite Sales Rep) ===\n\n";

    // Primary Product
    if (intelligence.primaryProduct) {
      formatted += `PRIMARY PRODUCT BEST FIT: ${intelligence.primaryProduct.productName}\n`;
      formatted += `Relevance: ${intelligence.primaryProduct.relevanceScore}/100 (${intelligence.primaryProduct.confidence} confidence)\n`;
      formatted += `Why: ${intelligence.primaryProduct.matchReason}\n\n`;
    }

    // Secondary Products
    if (intelligence.secondaryProducts?.length > 0) {
      formatted += `SECONDARY RECOMMENDED PRODUCTS:\n`;
      intelligence.secondaryProducts.forEach((product: any, idx: number) => {
        formatted += `${idx + 1}. ${product.productName} (${product.relevanceScore}/100)\n`;
        formatted += `   Reason: ${product.matchReason}\n`;
      });
      formatted += "\n";
    }

    // Cross-Sell Opportunities
    if (intelligence.crossSellOpportunities?.length > 0) {
      formatted += `CROSS-SELL OPPORTUNITIES (introduce naturally):\n`;
      intelligence.crossSellOpportunities.forEach((opp: any, idx: number) => {
        formatted += `${idx + 1}. ${opp.productName}\n`;
        formatted += `   Trigger: "${opp.trigger}"\n`;
        formatted += `   Pitch: "${opp.pitch}"\n`;
        formatted += `   Timing: ${opp.timing}\n`;
      });
      formatted += "\n";
    }

    // Bundle Recommendations
    if (intelligence.bundleRecommendations?.length > 0) {
      formatted += `BUNDLE RECOMMENDATIONS (increase deal size):\n`;
      intelligence.bundleRecommendations.forEach((bundle: any, idx: number) => {
        formatted += `${idx + 1}. ${bundle.bundleName}\n`;
        formatted += `   Products: ${bundle.products.join(" + ")}\n`;
        formatted += `   Value: ${bundle.totalValue} (${bundle.discount} discount)\n`;
        formatted += `   Pitch: "${bundle.pitch}"\n`;
      });
      formatted += "\n";
    }

    // Hidden Needs
    if (intelligence.hiddenNeedsDetected?.length > 0) {
      formatted += `HIDDEN NEEDS DETECTED (proactive selling):\n`;
      intelligence.hiddenNeedsDetected.forEach((need: string, idx: number) => {
        formatted += `${idx + 1}. ${need}\n`;
      });
      formatted += "\n";
    }

    // Revenue Expansion Suggestions
    if (intelligence.revenueExpansionSuggestions?.length > 0) {
      formatted += `REVENUE EXPANSION STRATEGIES (act like top 1% closer):\n`;
      intelligence.revenueExpansionSuggestions.forEach((suggestion: string, idx: number) => {
        formatted += `${idx + 1}. ${suggestion}\n`;
      });
      formatted += "\n";
    }

    // Pitch Strategy
    if (intelligence.multiProductPitchStrategy) {
      formatted += `MULTI-PRODUCT PITCH STRATEGY:\n${intelligence.multiProductPitchStrategy}\n\n`;
    }

    // Transition Guidance
    if (intelligence.transitionGuidance?.length > 0) {
      formatted += `PRODUCT TRANSITION PHRASES (use naturally in conversation):\n`;
      intelligence.transitionGuidance.forEach((phrase: string, idx: number) => {
        formatted += `${idx + 1}. ${phrase}\n`;
      });
      formatted += "\n";
    }

    formatted += "=== END MULTI-PRODUCT INTELLIGENCE ===\n";
    formatted += "\nCRITICAL: Use this intelligence to guide conversation like a TOP 1% elite sales performer. Focus on expanding deal size, introducing complementary products naturally, and positioning bundles for higher ASP.\n";

    return formatted;
  }
}

export const knowledgeService = new KnowledgeService();
