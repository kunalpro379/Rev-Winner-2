/**
 * Sales Intelligence Layer - Multi-Product Elite AI
 * 
 * This module acts like a TOP 1% sales performer, providing:
 * - Multi-product detection (reactive + proactive)
 * - Cross-sell and upsell recommendations
 * - Intelligent product transitions
 * - Bundle suggestions
 * - Revenue expansion opportunities
 * 
 * Follows elite sales methodologies: SPIN, MEDDIC, Challenger, BANT, GAP Selling, Sandler, NLP
 */

import productsData from "../../shared/products.json";

export interface ProductMatch {
  productId: string;
  productName: string;
  relevanceScore: number; // 0-100
  matchReason: string;
  confidence: "high" | "medium" | "low";
  triggerKeywords: string[];
  painPointsMatched: string[];
}

export interface CrossSellOpportunity {
  recommendedProduct: string;
  productName: string;
  trigger: string;
  pitch: string;
  timing: "immediate" | "mid-call" | "follow-up";
  valueAdd: string;
}

export interface BundleRecommendation {
  bundleName: string;
  products: string[];
  valueProposition: string;
  discount: string;
  totalValue: string;
  pitch: string;
}

export interface MultiProductIntelligence {
  primaryProduct: ProductMatch | null;
  secondaryProducts: ProductMatch[];
  crossSellOpportunities: CrossSellOpportunity[];
  bundleRecommendations: BundleRecommendation[];
  revenueExpansionSuggestions: string[];
  hiddenNeedsDetected: string[];
  multiProductPitchStrategy: string;
  transitionGuidance: string[];
}

export class SalesIntelligenceLayer {
  private products: typeof productsData.products;
  private productRelationships: typeof productsData.productRelationships;
  private detectionRules: typeof productsData.detectionRules;

  constructor() {
    this.products = productsData.products;
    this.productRelationships = productsData.productRelationships;
    this.detectionRules = productsData.detectionRules;
  }

  /**
   * Main intelligence function - analyzes conversation and returns multi-product recommendations
   * Acts like a top 1% sales performer
   */
  async analyzeConversationForProducts(params: {
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
  }): Promise<MultiProductIntelligence> {
    const { transcript, conversationHistory, currentInsights, buyerContext } = params;

    // Extract keywords and signals from conversation
    const analysis = this.extractConversationSignals(transcript, conversationHistory, currentInsights);

    // Detect primary product fit (reactive detection)
    const primaryProduct = this.detectPrimaryProduct(analysis);

    // Detect secondary products (proactive + reactive)
    const secondaryProducts = this.detectSecondaryProducts(analysis, primaryProduct);

    // Identify cross-sell opportunities
    const crossSellOpportunities = this.identifyCrossSellOpportunities(
      analysis,
      primaryProduct,
      secondaryProducts
    );

    // Generate bundle recommendations
    const bundleRecommendations = this.generateBundleRecommendations(
      analysis,
      primaryProduct,
      secondaryProducts,
      buyerContext
    );

    // Identify hidden needs (proactive intelligence)
    const hiddenNeedsDetected = this.detectHiddenNeeds(analysis, buyerContext);

    // Revenue expansion suggestions (top 1% mindset)
    const revenueExpansionSuggestions = this.generateRevenueExpansionSuggestions(
      primaryProduct,
      secondaryProducts,
      bundleRecommendations,
      buyerContext
    );

    // Multi-product pitch strategy
    const multiProductPitchStrategy = this.generatePitchStrategy(
      primaryProduct,
      secondaryProducts,
      analysis,
      buyerContext
    );

    // Transition guidance (how to move from Product A → B)
    const transitionGuidance = this.generateTransitionGuidance(
      primaryProduct,
      secondaryProducts,
      analysis
    );

    return {
      primaryProduct,
      secondaryProducts,
      crossSellOpportunities,
      bundleRecommendations,
      revenueExpansionSuggestions,
      hiddenNeedsDetected,
      multiProductPitchStrategy,
      transitionGuidance,
    };
  }

  /**
   * Extract conversation signals for product matching
   */
  private extractConversationSignals(
    transcript: string,
    conversationHistory: Array<{ sender: string; content: string }>,
    currentInsights: any
  ) {
    const fullText = (transcript + " " + conversationHistory.map(m => m.content).join(" ")).toLowerCase();

    // Extract pain points
    const painPoints = currentInsights?.discoveryInsights?.painPoints || [];

    // Extract keywords
    const mentionedKeywords: string[] = [];
    this.products.forEach(product => {
      product.keywords.forEach(keyword => {
        if (fullText.includes(keyword.toLowerCase())) {
          mentionedKeywords.push(keyword);
        }
      });
    });

    // Detect buyer signals
    const buyerSignals = {
      hasTeam: /\b(team|reps|sales team|account executives|managers)\b/i.test(fullText),
      hasTrainingNeeds: /\b(training|learn|playbook|onboard|documentation)\b/i.test(fullText),
      hasAnalyticsNeeds: /\b(dashboard|analytics|metrics|performance|tracking|visibility)\b/i.test(fullText),
      hasEnterpriseNeeds: /\b(enterprise|sla|dedicated|compliance|security|uptime)\b/i.test(fullText),
      hasCapacityNeeds: /\b(minutes|usage|capacity|running out|need more)\b/i.test(fullText),
      mentionsCompetitors: /\b(gong|chorus|avoma|otter|clari|salesforce einstein)\b/i.test(fullText),
    };

    // Detect conversation stage
    const messageCount = conversationHistory.length;
    const stage = messageCount < 5 ? "early" : messageCount < 15 ? "mid" : "late";

    return {
      fullText,
      painPoints,
      mentionedKeywords,
      buyerSignals,
      stage,
      insights: currentInsights,
    };
  }

  /**
   * Detect primary product fit (best match)
   */
  private detectPrimaryProduct(analysis: any): ProductMatch | null {
    const matches: ProductMatch[] = [];

    this.products.forEach(product => {
      let score = 0;
      const triggeredKeywords: string[] = [];
      const matchedPainPoints: string[] = [];

      // Keyword matching (40 points)
      product.keywords.forEach(keyword => {
        if (analysis.mentionedKeywords.includes(keyword)) {
          score += 8;
          triggeredKeywords.push(keyword);
        }
      });

      // Pain point matching (40 points)
      product.painPoints.forEach(painPoint => {
        if (analysis.painPoints.some((p: string) =>
          p.toLowerCase().includes(painPoint.toLowerCase()) ||
          painPoint.toLowerCase().includes(p.toLowerCase())
        )) {
          score += 8;
          matchedPainPoints.push(painPoint);
        }
      });

      // Industry matching (20 points)
      if (analysis.insights?.industry) {
        if (product.targetIndustries.some(ind =>
          analysis.insights.industry.toLowerCase().includes(ind.toLowerCase())
        )) {
          score += 20;
        }
      }

      if (score > 20) {
        matches.push({
          productId: product.id,
          productName: product.name,
          relevanceScore: Math.min(score, 100),
          matchReason: this.generateMatchReason(product, triggeredKeywords, matchedPainPoints),
          confidence: score > 60 ? "high" : score > 35 ? "medium" : "low",
          triggerKeywords: triggeredKeywords,
          painPointsMatched: matchedPainPoints,
        });
      }
    });

    // Return highest scoring product
    matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Detect secondary products (proactive recommendations)
   */
  private detectSecondaryProducts(analysis: any, primaryProduct: ProductMatch | null): ProductMatch[] {
    const secondaryMatches: ProductMatch[] = [];

    // If primary product detected, look for related products
    if (primaryProduct) {
      const primary = this.products.find(p => p.id === primaryProduct.productId);
      if (primary?.relatedProducts) {
        primary.relatedProducts.forEach(relatedId => {
          const relatedProduct = this.products.find(p => p.id === relatedId);
          if (relatedProduct) {
            secondaryMatches.push({
              productId: relatedProduct.id,
              productName: relatedProduct.name,
              relevanceScore: 75, // High relevance as it's related to primary
              matchReason: `Complements ${primary.name} for complete solution`,
              confidence: "high",
              triggerKeywords: [],
              painPointsMatched: [],
            });
          }
        });
      }
    }

    // Proactive detection based on buyer signals
    if (analysis.buyerSignals.hasTrainingNeeds) {
      const training = this.products.find(p => p.id === "revwinner-training");
      if (training && !secondaryMatches.some(m => m.productId === training.id)) {
        secondaryMatches.push({
          productId: training.id,
          productName: training.name,
          relevanceScore: 80,
          matchReason: "Training needs detected - custom AI would solve product-specific knowledge gap",
          confidence: "high",
          triggerKeywords: ["training", "playbook"],
          painPointsMatched: ["need AI to understand our specific solutions"],
        });
      }
    }

    if (analysis.buyerSignals.hasAnalyticsNeeds) {
      const analytics = this.products.find(p => p.id === "revwinner-analytics");
      if (analytics && !secondaryMatches.some(m => m.productId === analytics.id)) {
        secondaryMatches.push({
          productId: analytics.id,
          productName: analytics.name,
          relevanceScore: 80,
          matchReason: "Manager/team visibility needs - Analytics Dashboard provides team-wide insights",
          confidence: "high",
          triggerKeywords: ["dashboard", "analytics", "performance"],
          painPointsMatched: ["no visibility into team performance"],
        });
      }
    }

    if (analysis.buyerSignals.hasEnterpriseNeeds) {
      const dai = this.products.find(p => p.id === "revwinner-dai-premium");
      if (dai && !secondaryMatches.some(m => m.productId === dai.id)) {
        secondaryMatches.push({
          productId: dai.id,
          productName: dai.name,
          relevanceScore: 90,
          matchReason: "Enterprise requirements detected - Premium DAI ensures SLA compliance and dedicated infrastructure",
          confidence: "high",
          triggerKeywords: ["enterprise", "sla", "dedicated"],
          painPointsMatched: ["need guaranteed SLA for enterprise compliance"],
        });
      }
    }

    if (analysis.buyerSignals.hasCapacityNeeds) {
      const minutes = this.products.find(p => p.id === "session-minutes-packages");
      if (minutes && !secondaryMatches.some(m => m.productId === minutes.id)) {
        secondaryMatches.push({
          productId: minutes.id,
          productName: minutes.name,
          relevanceScore: 95,
          matchReason: "Usage capacity concern - Additional Session Minutes prevent interruption",
          confidence: "high",
          triggerKeywords: ["minutes", "capacity"],
          painPointsMatched: ["running out of monthly minutes"],
        });
      }
    }

    return secondaryMatches.slice(0, 3); // Top 3 secondary products
  }

  /**
   * Identify cross-sell opportunities based on conversation context
   */
  private identifyCrossSellOpportunities(
    analysis: any,
    primaryProduct: ProductMatch | null,
    secondaryProducts: ProductMatch[]
  ): CrossSellOpportunity[] {
    const opportunities: CrossSellOpportunity[] = [];

    if (!primaryProduct) return opportunities;

    const primary = this.products.find(p => p.id === primaryProduct.productId);
    if (!primary?.crossSellOpportunities) return opportunities;

    primary.crossSellOpportunities.forEach(crossSell => {
      // Check if trigger condition met
      const triggerMet = analysis.fullText.includes(crossSell.trigger.toLowerCase());

      if (triggerMet) {
        const recommendedProduct = this.products.find(p => p.id === crossSell.recommendProduct);
        if (recommendedProduct) {
          opportunities.push({
            recommendedProduct: crossSell.recommendProduct,
            productName: recommendedProduct.name,
            trigger: crossSell.trigger,
            pitch: crossSell.pitch,
            timing: analysis.stage === "early" ? "mid-call" : "immediate",
            valueAdd: this.generateValueAdd(recommendedProduct, primaryProduct),
          });
        }
      }
    });

    return opportunities;
  }

  /**
   * Generate bundle recommendations (TOP 1% strategy - increase deal size)
   */
  private generateBundleRecommendations(
    analysis: any,
    primaryProduct: ProductMatch | null,
    secondaryProducts: ProductMatch[],
    buyerContext?: any
  ): BundleRecommendation[] {
    const recommendations: BundleRecommendation[] = [];

    if (!primaryProduct) return recommendations;

    // Find bundles that include primary product
    this.productRelationships.commonBundles.forEach(bundle => {
      if (bundle.products.includes(primaryProduct.productId)) {
        const bundleProducts = bundle.products.map(id => {
          const product = this.products.find(p => p.id === id);
          return product?.name || id;
        });

        recommendations.push({
          bundleName: bundle.name,
          products: bundleProducts,
          valueProposition: bundle.pitch,
          discount: bundle.discount,
          totalValue: this.calculateBundleValue(bundle.products),
          pitch: this.generateBundlePitch(bundle, analysis, buyerContext),
        });
      }
    });

    return recommendations.slice(0, 2); // Top 2 bundles
  }

  /**
   * Detect hidden needs (proactive intelligence - what they didn't mention)
   */
  private detectHiddenNeeds(analysis: any, buyerContext?: any): string[] {
    const hiddenNeeds: string[] = [];

    // If they mention team but not analytics
    if (analysis.buyerSignals.hasTeam && !analysis.buyerSignals.hasAnalyticsNeeds) {
      hiddenNeeds.push("Team visibility and performance tracking - typically needed when managing multiple reps");
    }

    // If they mention specific products but not training
    if (analysis.mentionedKeywords.length > 3 && !analysis.buyerSignals.hasTrainingNeeds) {
      hiddenNeeds.push("Custom AI training on your product knowledge - ensures accurate, specific responses");
    }

    // If enterprise scale but no mention of SLA
    if (buyerContext?.teamSize && buyerContext.teamSize > 20 && !analysis.buyerSignals.hasEnterpriseNeeds) {
      hiddenNeeds.push("Dedicated infrastructure with SLA guarantees - critical for enterprise deployments");
    }

    // If mentions competitors, they need differentiation
    if (analysis.buyerSignals.mentionsCompetitors) {
      hiddenNeeds.push("Competitive positioning and battle cards - help your team win against Gong, Chorus, Avoma");
    }

    return hiddenNeeds;
  }

  /**
   * Generate revenue expansion suggestions (expand deal size like top 1% rep)
   */
  private generateRevenueExpansionSuggestions(
    primaryProduct: ProductMatch | null,
    secondaryProducts: ProductMatch[],
    bundleRecommendations: BundleRecommendation[],
    buyerContext?: any
  ): string[] {
    const suggestions: string[] = [];

    if (primaryProduct && secondaryProducts.length > 0) {
      suggestions.push(
        `Position this as a complete solution, not just ${primaryProduct.productName}. Bundle Core + ${secondaryProducts[0].productName} increases value by 3x.`
      );
    }

    if (bundleRecommendations.length > 0) {
      const topBundle = bundleRecommendations[0];
      suggestions.push(
        `Recommend ${topBundle.bundleName} (${topBundle.discount} discount) instead of individual products - better ROI story and higher ASP.`
      );
    }

    if (buyerContext?.teamSize && buyerContext.teamSize > 1) {
      suggestions.push(
        `Mention team-wide value: "With ${buyerContext.teamSize} reps, you'd get ${buyerContext.teamSize}x the ROI and consistent performance across the entire team."`
      );
    }

    if (secondaryProducts.some(p => p.productId === "revwinner-analytics")) {
      suggestions.push(
        `Position Analytics as revenue protection: "Manager visibility prevents deals from slipping - customers report 35% fewer lost opportunities."`
      );
    }

    return suggestions;
  }

  /**
   * Generate multi-product pitch strategy (like a top 1% closer)
   */
  private generatePitchStrategy(
    primaryProduct: ProductMatch | null,
    secondaryProducts: ProductMatch[],
    analysis: any,
    buyerContext?: any
  ): string {
    if (!primaryProduct) {
      return "Lead with discovery - uncover pain points before pitching specific products. Ask: 'What's your biggest challenge with sales conversations today?'";
    }

    const strategy = [];

    // Opening (problem-first, Challenger-style)
    strategy.push(
      `OPENING: Lead with their pain - "${analysis.painPoints[0] || 'many sales teams struggle with consistency'}". Then position ${primaryProduct.productName} as the solve.`
    );

    // Mid-conversation expansion (SPIN/MEDDIC)
    if (secondaryProducts.length > 0) {
      strategy.push(
        `MID-CALL: After establishing ${primaryProduct.productName} fit, expand scope: "Beyond just coaching, most teams also need ${secondaryProducts[0].productName} to ${this.getProductBenefit(secondaryProducts[0].productId)}. Worth discussing?"`
      );
    }

    // Closing (value-stacking + urgency)
    if (secondaryProducts.length >= 2) {
      strategy.push(
        `CLOSING: Stack value with bundle: "Here's what I'd recommend - ${primaryProduct.productName} + ${secondaryProducts[0].productName} + ${secondaryProducts[1].productName}. Complete solution at ${this.getBundleDiscount()}% off. Sound reasonable?"`
      );
    } else {
      strategy.push(
        `CLOSING: Direct close on ${primaryProduct.productName}: "Based on what you've shared, this solves [specific pain]. Can we get you started with a pilot?"`
      );
    }

    return strategy.join(" → ");
  }

  /**
   * Generate transition guidance (how to introduce additional products smoothly)
   */
  private generateTransitionGuidance(
    primaryProduct: ProductMatch | null,
    secondaryProducts: ProductMatch[],
    analysis: any
  ): string[] {
    const guidance: string[] = [];

    if (!primaryProduct || secondaryProducts.length === 0) return guidance;

    secondaryProducts.forEach(secondary => {
      const transition = this.getTransitionPhrase(primaryProduct, secondary, analysis);
      guidance.push(transition);
    });

    return guidance;
  }

  // Helper functions
  private generateMatchReason(product: any, keywords: string[], painPoints: string[]): string {
    if (keywords.length > 0 && painPoints.length > 0) {
      return `Strong fit: mentioned "${keywords.slice(0, 2).join(", ")}" and experiencing "${painPoints[0].substring(0, 50)}..."`;
    } else if (keywords.length > 0) {
      return `Keyword match: "${keywords.slice(0, 2).join(", ")}" indicates ${product.name} need`;
    } else if (painPoints.length > 0) {
      return `Pain point alignment: "${painPoints[0].substring(0, 50)}..." solved by ${product.name}`;
    }
    return `Potential fit for ${product.name} based on conversation context`;
  }

  private generateValueAdd(recommendedProduct: any, primaryMatch: ProductMatch): string {
    return `Complements ${primaryMatch.productName} by providing ${recommendedProduct.description}`;
  }

  private calculateBundleValue(productIds: string[]): string {
    // Simplified - in real implementation, fetch actual pricing
    const values: { [key: string]: number } = {
      "revwinner-core": 40,
      "revwinner-training": 15,
      "revwinner-analytics": 25,
      "revwinner-dai-premium": 200,
      "session-minutes-1800": 25,
    };

    const total = productIds.reduce((sum, id) => sum + (values[id] || 0), 0);
    return `$${total}/month`;
  }

  private generateBundlePitch(bundle: any, analysis: any, buyerContext?: any): string {
    const pitch = `${bundle.pitch}. `;
    
    if (buyerContext?.teamSize && buyerContext.teamSize > 5) {
      return pitch + `With ${buyerContext.teamSize} reps, this bundle delivers 5x ROI in the first quarter.`;
    }

    return pitch + "Most successful customers choose this package for complete coverage.";
  }

  private getProductBenefit(productId: string): string {
    const benefits: { [key: string]: string } = {
      "revwinner-training": "ensure AI knows your exact product",
      "revwinner-analytics": "track team performance and identify top performers",
      "revwinner-dai-premium": "guarantee enterprise-grade uptime and support",
      "session-minutes-packages": "eliminate usage constraints",
    };
    return benefits[productId] || "enhance your sales operations";
  }

  private getBundleDiscount(): number {
    return 20; // Default bundle discount
  }

  private getTransitionPhrase(
    primary: ProductMatch,
    secondary: ProductMatch,
    analysis: any
  ): string {
    const phrases = [
      `"By the way, most ${primary.productName} customers also use ${secondary.productName} to ${this.getProductBenefit(secondary.productId)}. Worth exploring?"`,
      `"Quick question - beyond ${primary.productName}, have you thought about ${secondary.productName}? It's designed specifically for ${secondary.matchReason}."`,
      `"One thing I'd recommend - pair ${primary.productName} with ${secondary.productName}. Our most successful customers use both because ${this.getProductBenefit(secondary.productId)}."`,
    ];

    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

// Export singleton instance
export const salesIntelligence = new SalesIntelligenceLayer();
