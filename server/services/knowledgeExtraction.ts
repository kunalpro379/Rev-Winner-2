import { createHash } from 'crypto';
import OpenAI from 'openai';
import type { TrainingDocument, InsertKnowledgeEntry, KnowledgeEntry, KnowledgeCategory } from '@shared/schema';
import { knowledgeCategories } from '@shared/schema';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_SEMANTIC_SEARCH_LIMIT = 10;

const openaiForEmbeddings = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000 })
  : null;

interface ExtractedKnowledge {
  category: KnowledgeCategory;
  title: string;
  content: string;
  details: Record<string, any>;
  keywords: string[];
  confidence: number;
}

interface ExtractionResult {
  entries: ExtractedKnowledge[];
  duplicatesSkipped: number;
  newEntriesAdded: number;
}

export function generateContentHash(content: string): string {
  const normalized = content.toLowerCase().trim().replace(/\s+/g, ' ');
  return createHash('sha256').update(normalized).digest('hex');
}

export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let intersectionCount = 0;
  words1.forEach(word => { if (set2.has(word)) intersectionCount++; });
  const unionCount = set1.size + set2.size - intersectionCount;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

const deepseek = process.env.DEEPSEEK_API_KEY 
  ? new OpenAI({ 
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
      timeout: 60000
    })
  : null;

// Anthropic Claude as fallback for knowledge extraction
import Anthropic from '@anthropic-ai/sdk';
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const COMPREHENSIVE_EXTRACTION_PROMPT = `You are an ELITE knowledge extraction AI for a sales intelligence platform. Your extraction directly powers real-time AI responses during live sales calls. EVERY missed detail = a failed sales conversation.

🎯 MISSION: Extract EVERY SINGLE piece of knowledge from this document. Be EXHAUSTIVE and GRANULAR. This is the ONLY data source the AI will use.

For EACH entry, provide:
- category: One of: product, pricing, process, faq, case_study, competitor, pain_point, objection, feature, integration
- title: Clear, descriptive title (max 150 chars). For pricing: "{Product/Tier} - Pricing Details"
- content: ULTRA-COMPREHENSIVE content (8-20 sentences with COMPLETE details, exact numbers, specific names, full context)
- details: Structured JSON object with ALL data points. REQUIRED fields by category:
  * pricing: {productName, tierName, price, currency, billingCycle, seatsIncluded, maxSeats, featuresIncluded:[], addOns:[], discounts:[], effectiveDate, comparedTo, setupFee, minimumCommitment, overage, supportLevel, sla}
  * product/feature: {productName, featureName, howItWorks, benefits:[], useCases:[], limitations:[], integrations:[], technicalSpecs:{}, supportedPlatforms:[], requirements:[], deployment:[], security:[], compliance:[]}
  * case_study: {companyName, industry, companySize, challenge, solution, results:{}, timeline, roi, testimonialQuote, contactPerson, implementationDetails, beforeMetrics:{}, afterMetrics:{}}
  * competitor: {competitorName, comparedProduct, strengthsUs:[], strengthsThem:[], pricingComparison:{}, migrationPath:[], winReasons:[], lossReasons:[], marketPosition, customerOverlap}
  * process: {processName, steps:[], prerequisites:[], timeline, decisionCriteria:[], dependencies:[], stakeholders:[], approvalLevels:[], documentation:[], tools:[]}
  * pain_point: {painDescription, affectedRole:[], impact:{}, solution, quantifiedBenefit:{}, beforeAfter:{}, frequency, severity, industrySpecific}
  * objection: {objection, response, evidence:[], proofPoints:[], statistics:[], caseStudies:[], competitorComparison, riskMitigation}
  * feature: {featureName, description, benefits:[], technicalDetails:{}, useCases:[], pricing, availability, roadmap, integrations:[]}
  * integration: {partnerName, integrationType, capabilities:[], setupSteps:[], requirements:[], limitations:[], pricing, supportLevel, documentation}
- keywords: 15-30 relevant keywords (include synonyms, abbreviations, related terms, industry jargon, acronyms, alternative names)
- confidence: 0-100

🔥 ULTRA-DEEP EXTRACTION RULES:

📦 PRODUCTS & FEATURES (Extract EVERYTHING):
- Every single feature with complete description
- Technical specifications (versions, compatibility, requirements)
- Benefits with quantified outcomes
- Use cases with industry examples
- Integrations with setup details
- Limitations and workarounds
- Supported platforms and devices
- Deployment options (cloud, on-premise, hybrid)
- Security features and compliance certifications
- Performance metrics and benchmarks
- Scalability limits and recommendations
- API capabilities and documentation
- Mobile app features
- Admin/user roles and permissions

� PRICING (CRITICAL - EXTRACT EVERY SINGLE PRICE POINT):
- ALL tiers/plans with EXACT amounts and currencies
- What's included vs excluded in EACH tier (list every feature)
- Per-user/per-seat pricing with volume breakpoints
- Add-ons with individual costs and descriptions
- Discounts (volume tiers, annual vs monthly, promotional codes, early bird)
- Payment terms, billing cycles, contract lengths
- Free trial details (duration, limitations, credit card required?)
- Enterprise/custom pricing indicators and typical ranges
- Setup fees, onboarding costs, implementation fees
- Support tiers and their costs
- Overage charges and rate limits
- Minimum commitments and penalties
- Renewal terms and price lock guarantees
- Refund policies and cancellation terms
- Currency options and international pricing
- Educational/nonprofit/startup discounts
- Create SEPARATE entries for EACH pricing tier/plan

📊 CASE STUDIES & SUCCESS STORIES (Extract ALL metrics):
- Company names with full details (size, industry, location)
- Specific challenges with quantified pain points
- Solution implementation details (timeline, team size, approach)
- Results with EXACT metrics (percentages, dollar amounts, time saved)
- ROI calculations with methodology
- Testimonial quotes with attribution
- Before/after comparisons with numbers
- Implementation timeline and milestones
- Key stakeholders and their roles
- Lessons learned and best practices

📈 DATA, GRAPHS, CHARTS, STATISTICS (Extract ALL data points):
- Every number, percentage, and metric
- Trends over time with specific dates
- Comparisons between products/competitors
- Market share data
- Growth rates and projections
- Survey results with sample sizes
- Benchmark data and industry averages
- Performance metrics and KPIs
- User statistics and demographics

🏆 COMPETITIVE INTELLIGENCE (Deep comparison):
- Competitor names and products
- Feature-by-feature detailed comparisons
- Pricing differences with exact amounts
- Strengths and weaknesses (ours vs theirs)
- Migration paths with step-by-step guides
- Win/loss reasons with frequency data
- Market positioning and differentiation
- Customer overlap and switching patterns
- Integration capabilities comparison
- Support and service level comparison
- Roadmap and future plans comparison

🎯 PAIN POINTS & SOLUTIONS (Comprehensive):
- Detailed problem descriptions
- Affected roles and departments
- Business impact (cost, time, efficiency)
- Our solution approach
- Quantified benefits with ROI
- Before/after scenarios with metrics
- Industry-specific variations
- Frequency and severity ratings
- Related pain points and dependencies

💬 OBJECTION HANDLING (Complete responses):
- Common objections word-for-word
- Detailed counter-arguments
- Supporting evidence and data
- Proof points (case studies, testimonials)
- Statistics and research citations
- Competitor comparisons
- Risk mitigation strategies
- Success stories addressing the objection

📋 PROCESSES & WORKFLOWS (Step-by-step):
- Complete process descriptions
- Every step with detailed instructions
- Prerequisites and requirements
- Timeline with duration estimates
- Decision criteria and approval gates
- Stakeholders and their responsibilities
- Dependencies and sequencing
- Tools and systems required
- Documentation and templates
- Common pitfalls and how to avoid them

🔗 INTEGRATIONS & PARTNERSHIPS (Full details):
- Partner/platform names
- Integration types (API, native, third-party)
- Capabilities and features enabled
- Setup instructions step-by-step
- Requirements and prerequisites
- Limitations and known issues
- Pricing and licensing
- Support level and SLAs
- Documentation links

🔍 ADDITIONAL EXTRACTION TARGETS:
- Company information (history, mission, values, team)
- Industry trends and market analysis
- Regulatory compliance and certifications
- Security and privacy policies
- Terms of service and SLAs
- Training and onboarding programs
- Support channels and response times
- Roadmap and upcoming features
- Partnership opportunities
- Geographic availability and restrictions
- Language support
- Accessibility features
- System requirements and compatibility
- Backup and disaster recovery
- Data migration services
- Professional services offerings
- Community and user resources

CRITICAL RULES:
- Create SEPARATE entries for each distinct topic (NEVER combine)
- NEVER summarize - preserve ALL specifics (numbers, names, dates, percentages, quotes)
- Extract data from tables, charts, graphs, infographics, sidebars, footnotes, appendices
- If document contains "[DEEP ANALYSIS]" or "[TABLE STRUCTURE]" sections, extract those as separate entries
- Create 3-5 entries per page of content (be granular)
- For complex topics, create multiple related entries
- Include context and background for each entry
- Cross-reference related entries in keywords
- Preserve exact terminology and product names
- Include version numbers and dates where mentioned

Return JSON format: {"entries": [...]}

DOCUMENT TO ANALYZE:
`;

const CHUNK_EXTRACTION_PROMPT = `Continue extracting knowledge from this document chunk. This is part of a larger document.

🔥 ULTRA-CRITICAL RULES FOR CONTINUATION:
- Extract ALL new information not covered in previous chunks
- Be ULTRA-EXHAUSTIVE - every number, price, feature, metric, name, quote, and data point matters
- Create DETAILED entries (8-20 sentences each) with COMPREHENSIVE "details" JSON
- For pricing data: create SEPARATE entries per product/tier with {productName, tierName, price, currency, billingCycle, seatsIncluded, maxSeats, featuresIncluded:[], addOns:[], discounts:[], setupFee, minimumCommitment, supportLevel}
- For tables/charts: extract ALL rows, columns, and data points - NEVER summarize
- For processes/workflows: capture EVERY step with prerequisites, outcomes, timelines, stakeholders
- For case studies: extract ALL metrics, quotes, company details, before/after data
- For features: include technical specs, benefits, use cases, limitations, integrations
- For competitors: detailed comparisons, pricing differences, strengths/weaknesses
- Include 15-30 keywords per entry including synonyms, acronyms, and industry terms
- Extract information from headers, footers, sidebars, callout boxes, footnotes
- Preserve exact terminology, product names, version numbers, dates
- Create 3-5 entries per page of content (be granular, not broad)

EXTRACTION TARGETS IN THIS CHUNK:
- Products, features, capabilities
- Pricing (all tiers, add-ons, discounts)
- Technical specifications
- Case studies and success stories
- Statistics, metrics, benchmarks
- Competitive comparisons
- Pain points and solutions
- Objections and responses
- Processes and workflows
- Integrations and partnerships
- Company information
- Compliance and certifications
- Support and SLAs
- Training and resources

Return JSON format: {"entries": [...]}

DOCUMENT CHUNK:
`;

const CHUNK_SIZE = 20000; // Increased for more context per chunk
const MAX_CHUNKS = 15; // Increased to process more content

function splitIntoChunks(content: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let currentPosition = 0;
  
  while (currentPosition < content.length && chunks.length < MAX_CHUNKS) {
    let endPosition = Math.min(currentPosition + chunkSize, content.length);
    
    // Try to break at paragraph or sentence boundary
    if (endPosition < content.length) {
      const paragraphBreak = content.lastIndexOf('\n\n', endPosition);
      const sentenceBreak = content.lastIndexOf('. ', endPosition);
      
      if (paragraphBreak > currentPosition + chunkSize * 0.5) {
        endPosition = paragraphBreak + 2;
      } else if (sentenceBreak > currentPosition + chunkSize * 0.5) {
        endPosition = sentenceBreak + 2;
      }
    }
    
    chunks.push(content.substring(currentPosition, endPosition).trim());
    currentPosition = endPosition;
  }
  
  return chunks.filter(c => c.length > 100);
}

function parseAIResponse(responseText: string): any[] {
  let parsed: any;
  
  try {
    // First try direct JSON parse
    parsed = JSON.parse(responseText);
    if (parsed.entries) parsed = parsed.entries;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed;
  } catch {
    // Try to extract JSON from markdown code blocks or surrounding text
    // Match ```json ... ``` or ``` ... ``` or just the JSON object/array
    const patterns = [
      /```(?:json)?\s*([\s\S]*?)```/,  // Markdown code blocks
      /\{\s*"entries"\s*:\s*\[([\s\S]*)\]\s*\}/,  // {"entries": [...]}
      /\[\s*\{[\s\S]*\}\s*\]/  // Direct array
    ];
    
    for (const pattern of patterns) {
      const match = responseText.match(pattern);
      if (match) {
        try {
          let jsonStr = match[1] || match[0];
          
          // If we matched the entries content only, wrap it
          if (pattern === patterns[1]) {
            jsonStr = `{"entries": [${jsonStr}]}`;
          }
          
          // Clean up common issues
          jsonStr = jsonStr.trim();
          
          // Try to parse
          parsed = JSON.parse(jsonStr);
          if (parsed.entries) parsed = parsed.entries;
          if (!Array.isArray(parsed)) parsed = [parsed];
          
          console.log(`✅ Successfully parsed JSON from pattern ${patterns.indexOf(pattern) + 1}`);
          return parsed;
        } catch (innerError) {
          console.log(`⚠️ Pattern ${patterns.indexOf(pattern) + 1} matched but parse failed`);
          continue;
        }
      }
    }
    
    console.error('❌ Failed to parse AI response as JSON. Response preview:', responseText.substring(0, 300));
    return [];
  }
}

async function extractFromChunkWithClaude(
  chunk: string, 
  chunkIndex: number, 
  totalChunks: number,
  isFirstChunk: boolean
): Promise<any[]> {
  if (!anthropic) {
    console.error('❌ Anthropic API not available for extraction');
    return [];
  }
  
  const prompt = isFirstChunk 
    ? COMPREHENSIVE_EXTRACTION_PROMPT + chunk
    : CHUNK_EXTRACTION_PROMPT + chunk;
  
  console.log(`🔄 [Claude] Chunk ${chunkIndex + 1}/${totalChunks}: Sending to Claude (${chunk.length} chars)...`);
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000, // Increased for more comprehensive extraction
      messages: [
        { 
          role: 'user', 
          content: `You are an ELITE knowledge extraction AI for a sales intelligence platform.
Always respond with valid JSON only: {"entries": [...]}

ULTRA-COMPREHENSIVE EXTRACTION REQUIREMENTS:
- Each entry MUST have: category, title (descriptive, max 150 chars), content (8-20 detailed sentences with ALL specifics), details (structured JSON with ALL data points), keywords (15-30 including synonyms, acronyms, industry terms), confidence (0-100)
- Create SEPARATE entries for each distinct topic/tier/feature
- For pricing: one entry per tier with {productName, tierName, price, currency, billingCycle, seatsIncluded, maxSeats, featuresIncluded:[], addOns:[], discounts:[], setupFee, minimumCommitment, supportLevel, sla}
- For products/features: {productName, featureName, howItWorks, benefits:[], useCases:[], limitations:[], integrations:[], technicalSpecs:{}, supportedPlatforms:[], requirements:[], deployment:[], security:[], compliance:[]}
- For case studies: {companyName, industry, companySize, challenge, solution, results:{}, timeline, roi, testimonialQuote, contactPerson, beforeMetrics:{}, afterMetrics:{}}
- Extract data from tables, charts, statistics, graphs, sidebars, footnotes, appendices
- NEVER summarize - preserve EVERY number, name, metric, quote, date, percentage, and data point
- Create 3-5 entries per page of content (be granular)
- Include ALL context and background information
- Preserve exact terminology, product names, version numbers

${prompt}`
        }
      ]
    });
    
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '[]';
    console.log(`✅ [Claude] Chunk ${chunkIndex + 1}/${totalChunks}: Received ${responseText.length} chars`);
    
    const entries = parseAIResponse(responseText);
    console.log(`📊 [Claude] Chunk ${chunkIndex + 1}/${totalChunks}: Extracted ${entries.length} entries`);
    
    return entries;
  } catch (error: any) {
    console.error(`❌ [Claude] Chunk ${chunkIndex + 1} extraction failed:`, error.message);
    return [];
  }
}

async function extractFromChunk(
  chunk: string, 
  chunkIndex: number, 
  totalChunks: number,
  isFirstChunk: boolean
): Promise<any[]> {
  // Use DeepSeek only (Claude fallback disabled due to credit issues)
  if (!deepseek) {
    console.error('❌ DeepSeek API not configured for knowledge extraction');
    return [];
  }
  
  const prompt = isFirstChunk 
    ? COMPREHENSIVE_EXTRACTION_PROMPT + chunk
    : CHUNK_EXTRACTION_PROMPT + chunk;
  
  console.log(`🔄 Chunk ${chunkIndex + 1}/${totalChunks}: Sending to DeepSeek (${chunk.length} chars)...`);
  
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { 
          role: 'system', 
          content: `You are an ELITE knowledge extraction AI for a sales intelligence platform.

CRITICAL: Respond with ONLY valid JSON. NO markdown, NO code blocks, NO explanations.
Format: {"entries": [...]}

ULTRA-COMPREHENSIVE EXTRACTION REQUIREMENTS:
- Each entry MUST have: category, title (descriptive, max 150 chars), content (8-20 detailed sentences with ALL specifics), details (structured JSON with ALL data points), keywords (15-30 including synonyms, acronyms, industry terms), confidence (0-100)
- Create SEPARATE entries for each distinct topic/tier/feature
- For pricing: one entry per tier with {productName, tierName, price, currency, billingCycle, seatsIncluded, maxSeats, featuresIncluded:[], addOns:[], discounts:[], setupFee, minimumCommitment, supportLevel, sla}
- For products/features: {productName, featureName, howItWorks, benefits:[], useCases:[], limitations:[], integrations:[], technicalSpecs:{}, supportedPlatforms:[], requirements:[], deployment:[], security:[], compliance:[]}
- For case studies: {companyName, industry, companySize, challenge, solution, results:{}, timeline, roi, testimonialQuote, contactPerson, beforeMetrics:{}, afterMetrics:{}}
- Extract data from tables, charts, statistics, graphs, sidebars, footnotes, appendices
- NEVER summarize - preserve EVERY number, name, metric, quote, date, percentage, and data point
- Create 3-5 entries per page of content (be granular)
- Include ALL context and background information
- Preserve exact terminology, product names, version numbers

RESPONSE FORMAT (NO MARKDOWN):
{"entries": [{"category": "pricing", "title": "...", "content": "...", "details": {...}, "keywords": [...], "confidence": 85}]}`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" } // Force JSON response
    });
    
    const responseText = response.choices[0]?.message?.content || '[]';
    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks}: Received ${responseText.length} chars from DeepSeek`);
    
    const entries = parseAIResponse(responseText);
    console.log(`📊 Chunk ${chunkIndex + 1}/${totalChunks}: Extracted ${entries.length} entries`);
    
    return entries;
  } catch (error: any) {
    console.error(`❌ DeepSeek failed for chunk ${chunkIndex + 1}: ${error.message}`);
    return [];
  }
}

export async function extractKnowledgeFromDocument(
  document: TrainingDocument,
  existingHashes: Set<string>,
  progressCallback?: (progress: { current: number; total: number; percentage: number; message: string }) => void
): Promise<ExtractedKnowledge[]> {
  if (!document.content || document.content.trim().length < 50) {
    console.log(`⏭️ Skipping document ${document.fileName}: insufficient content`);
    return [];
  }

  if (!deepseek) {
    console.error('❌ DeepSeek API not configured for knowledge extraction');
    return [];
  }

  const content = document.content.trim();
  console.log(`📚 Processing document: ${document.fileName} (${content.length} chars)`);

  try {
    const chunks = splitIntoChunks(content, CHUNK_SIZE);
    console.log(`📑 Split into ${chunks.length} chunks for comprehensive extraction`);
    
    const allParsedEntries: any[] = [];
    
    // Process chunks with progress tracking
    for (let i = 0; i < chunks.length; i++) {
      const percentage = Math.round(((i + 1) / chunks.length) * 100);
      const message = `Processing chunk ${i + 1} of ${chunks.length}...`;
      
      // Emit progress
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: chunks.length,
          percentage,
          message
        });
      }
      
      const chunkEntries = await extractFromChunk(chunks[i], i, chunks.length, i === 0);
      allParsedEntries.push(...chunkEntries);
      
      // Brief pause between chunks to avoid rate limits (reduced from 500ms to 200ms for speed)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`📊 Total raw entries extracted: ${allParsedEntries.length}`);

    const validEntries: ExtractedKnowledge[] = [];
    const seenTitles = new Set<string>(); // Avoid duplicate titles within same document

    for (const entry of allParsedEntries) {
      if (!entry.category || !entry.title || !entry.content) continue;
      
      // Normalize category
      if (!knowledgeCategories.includes(entry.category as KnowledgeCategory)) {
        entry.category = 'product';
      }

      if (entry.content.length < 50) continue;

      // Ensure content is comprehensive (encourage longer, detailed entries)
      if (entry.content.length < 100 && entry.category !== 'faq') {
        console.log(`⚠️ Skipping short entry: "${entry.title}" (${entry.content.length} chars)`);
        continue;
      }

      const titleNormalized = entry.title.toLowerCase().trim();
      const contentHash = generateContentHash(entry.title + entry.content);
      
      // Skip duplicates
      if (existingHashes.has(contentHash) || seenTitles.has(titleNormalized)) {
        continue;
      }

      validEntries.push({
        category: entry.category as KnowledgeCategory,
        title: String(entry.title).substring(0, 255),
        content: String(entry.content),
        details: entry.details || {},
        keywords: Array.isArray(entry.keywords) ? entry.keywords.slice(0, 20) : [],
        confidence: Math.round(Math.min(100, Math.max(0, (Number(entry.confidence) || 0.85) * (Number(entry.confidence) <= 1 ? 100 : 1))))
      });

      existingHashes.add(contentHash);
      seenTitles.add(titleNormalized);
    }

    console.log(`✅ Extracted ${validEntries.length} comprehensive knowledge entries from ${document.fileName}`);
    return validEntries;

  } catch (error: any) {
    console.error(`❌ Knowledge extraction failed for ${document.fileName}:`, error.message);
    return [];
  }
}

function isPricingDocument(document: TrainingDocument): boolean {
  const fileNameLower = (document.fileName || '').toLowerCase();
  const pricingFilePatterns = /pric(e|ing|es|elist)|rate\s*card|rate\s*sheet|tariff|cost\s*sheet|plan|subscription|billing|quote|proposal/i;
  if (pricingFilePatterns.test(fileNameLower)) return true;

  const content = (document.content || '').toLowerCase();
  const pricingKeywords = ['pricing', 'price', 'cost', 'rate card', 'per user', 'per seat', 'per month',
    'annual', 'monthly', 'subscription', 'tier', 'plan', 'enterprise', 'professional', 'starter',
    'basic plan', 'premium', 'free trial', 'billing', 'discount', 'volume pricing', 'add-on', 'mrp',
    '$/user', '₹', 'usd', 'inr', 'eur'];
  
  const matchCount = pricingKeywords.filter(kw => content.includes(kw)).length;
  return matchCount >= 4;
}

function extractProductIdentifier(entry: ExtractedKnowledge): string | null {
  const details = entry.details || {};
  const productName = details.productName || details.product_name || details.product || details.tierName || details.tier || details.planName || details.plan;
  if (productName) return String(productName).toLowerCase().trim();

  const titleMatch = entry.title.match(/^(.+?)[\s\-–:]+(?:pricing|price|cost|plan|tier|rate)/i);
  if (titleMatch) return titleMatch[1].toLowerCase().trim();

  return entry.title.toLowerCase().trim();
}

async function supersedePricingEntries(
  storage: any,
  existingEntries: KnowledgeEntry[],
  newPricingEntries: ExtractedKnowledge[],
  userId: string
): Promise<{ superseded: number }> {
  let superseded = 0;
  const existingPricingEntries = existingEntries.filter(e => e.category === 'pricing');

  if (existingPricingEntries.length === 0) return { superseded: 0 };

  const newProductIds = new Set(
    newPricingEntries.map(e => extractProductIdentifier(e)).filter(Boolean) as string[]
  );

  for (const existing of existingPricingEntries) {
    const existingProductId = extractProductIdentifier({
      category: existing.category as KnowledgeCategory,
      title: existing.title,
      content: existing.content,
      details: (existing.details || {}) as Record<string, any>,
      keywords: existing.keywords || [],
      confidence: existing.confidence || 80
    });

    if (!existingProductId) continue;

    const hasExactProductMatch = newProductIds.has(existingProductId);
    const hasTitleMatch = newPricingEntries.some(newEntry => {
      const similarity = calculateSimilarity(existing.title, newEntry.title);
      return similarity > 0.7;
    });
    const shouldSupersede = hasExactProductMatch || hasTitleMatch;

    if (shouldSupersede) {
      try {
        await storage.deleteKnowledgeEntry(existing.id, userId);
        superseded++;
        console.log(`🔄 Superseded old pricing entry: "${existing.title}"`);
      } catch (err: any) {
        console.error(`Failed to supersede entry: ${err.message}`);
      }
    }
  }

  return { superseded };
}

export async function processDocumentForKnowledge(
  document: TrainingDocument,
  domainExpertiseId: string,
  userId: string
): Promise<ExtractionResult> {
  const { storage } = await import('../storage');
  
  const existingEntries = await storage.getKnowledgeEntriesByDomain(domainExpertiseId, userId);
  const existingHashes = new Set(existingEntries.map(e => e.contentHash).filter(Boolean) as string[]);

  const extracted = await extractKnowledgeFromDocument(document, existingHashes);

  const isPricing = isPricingDocument(document);
  let pricingSuperseded = 0;

  if (isPricing) {
    const newPricingEntries = extracted.filter(e => e.category === 'pricing');
    if (newPricingEntries.length > 0) {
      console.log(`💰 Pricing document detected: "${document.fileName}". Superseding ${newPricingEntries.length} old pricing entries...`);
      const result = await supersedePricingEntries(storage, existingEntries, newPricingEntries, userId);
      pricingSuperseded = result.superseded;
      console.log(`🔄 Superseded ${pricingSuperseded} old pricing entries`);
    }
  }

  let newEntriesAdded = 0;
  let duplicatesSkipped = 0;

  const refreshedEntries = pricingSuperseded > 0
    ? await storage.getKnowledgeEntriesByDomain(domainExpertiseId, userId)
    : existingEntries;

  for (const entry of extracted) {
    const contentHash = generateContentHash(entry.title + entry.content);
    
    const isDuplicate = refreshedEntries.some(existing => {
      if (existing.contentHash === contentHash) return true;
      const similarity = calculateSimilarity(
        existing.title + ' ' + existing.content,
        entry.title + ' ' + entry.content
      );
      return similarity > 0.85;
    });

    if (isDuplicate) {
      duplicatesSkipped++;
      continue;
    }

    try {
      const created = await storage.createKnowledgeEntry({
        domainExpertiseId,
        userId,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        details: entry.details,
        keywords: entry.keywords,
        sourceDocumentIds: [document.id],
        contentHash,
        confidence: entry.confidence,
        isVerified: false,
        usageCount: 0
      });
      newEntriesAdded++;
      
      const text = `${entry.title}. ${entry.content}`;
      generateEmbeddingForEntry(storage, created.id, text).catch(err => 
        console.warn(`⚠️ Embedding generation deferred: ${err.message}`)
      );
    } catch (error: any) {
      console.error(`Failed to save knowledge entry: ${error.message}`);
    }
  }

  console.log(`📚 Knowledge extraction complete: ${newEntriesAdded} added, ${duplicatesSkipped} duplicates skipped${pricingSuperseded > 0 ? `, ${pricingSuperseded} pricing entries superseded` : ''}`);

  return {
    entries: extracted,
    duplicatesSkipped,
    newEntriesAdded
  };
}

export async function rebuildKnowledgeBase(
  domainExpertiseId: string,
  userId: string,
  forceFullRebuild: boolean = false
): Promise<ExtractionResult> {
  const { storage } = await import('../storage');
  const crypto = await import('crypto');
  
  // Get all documents and existing knowledge entries
  const documents = await storage.getTrainingDocumentsByDomain(domainExpertiseId, userId);
  const completedDocs = documents.filter(d => d.processingStatus === 'completed' && d.content);
  const existingEntries = await storage.getKnowledgeEntriesByDomain(domainExpertiseId, userId);
  
  // Determine which documents need processing based on:
  // 1. Never processed (no knowledgeExtractedAt)
  // 2. Content changed since last extraction (contentHash mismatch)
  const unprocessedDocs = forceFullRebuild 
    ? completedDocs 
    : completedDocs.filter(doc => {
        // Never processed
        if (!doc.knowledgeExtractedAt) return true;
        // Content changed - compute hash and compare
        if (doc.content) {
          const currentHash = crypto.createHash('sha256').update(doc.content).digest('hex');
          if (doc.contentHash && doc.contentHash !== currentHash) return true;
        }
        return false;
      });
  
  if (unprocessedDocs.length === 0 && !forceFullRebuild) {
    console.log(`✅ All ${completedDocs.length} documents already processed. No new extraction needed.`);
    return {
      entries: [],
      duplicatesSkipped: 0,
      newEntriesAdded: 0
    };
  }
  
  // Only delete existing entries if doing a FULL rebuild
  if (forceFullRebuild) {
    console.log(`🗑️ Full rebuild requested - clearing existing ${existingEntries.length} entries`);
    await storage.deleteKnowledgeEntriesByDomain(domainExpertiseId, userId);
  }
  
  console.log(`📚 Processing ${unprocessedDocs.length} unprocessed documents (${completedDocs.length - unprocessedDocs.length} already done)`);

  let totalAdded = 0;
  let totalDuplicates = 0;
  const allEntries: ExtractedKnowledge[] = [];
  
  // Build hash set from existing entries to avoid duplicates
  const existingHashes = new Set<string>(
    forceFullRebuild ? [] : existingEntries.map(e => e.contentHash).filter(Boolean) as string[]
  );

  // Track newly created entries in this run for intra-run duplicate detection
  const newlyCreatedEntries: Array<{ title: string; content: string; hash: string }> = [];

  let totalPricingSuperseded = 0;

  for (const doc of unprocessedDocs) {
    console.log(`📄 Extracting knowledge from: ${doc.fileName}`);
    const extracted = await extractKnowledgeFromDocument(doc, existingHashes);
    let docEntriesAdded = 0;

    if (!forceFullRebuild && isPricingDocument(doc)) {
      const newPricingEntries = extracted.filter(e => e.category === 'pricing');
      if (newPricingEntries.length > 0) {
        const currentEntries = await storage.getKnowledgeEntriesByDomain(domainExpertiseId, userId);
        const result = await supersedePricingEntries(storage, currentEntries, newPricingEntries, userId);
        totalPricingSuperseded += result.superseded;
        if (result.superseded > 0) {
          const refreshed = await storage.getKnowledgeEntriesByDomain(domainExpertiseId, userId);
          existingEntries.length = 0;
          existingEntries.push(...refreshed);
          existingHashes.clear();
          refreshed.forEach(e => { if (e.contentHash) existingHashes.add(e.contentHash); });
        }
        console.log(`💰 Superseded ${result.superseded} old pricing entries for "${doc.fileName}"`);
      }
    }
    
    for (const entry of extracted) {
      const contentHash = generateContentHash(entry.title + entry.content);
      
      const isDuplicateOfExisting = !forceFullRebuild && existingEntries.some(existing => {
        if (existing.contentHash === contentHash) return true;
        const similarity = calculateSimilarity(
          existing.title + ' ' + existing.content,
          entry.title + ' ' + entry.content
        );
        return similarity > 0.85;
      });
      
      const isDuplicateOfNew = newlyCreatedEntries.some(created => {
        if (created.hash === contentHash) return true;
        const similarity = calculateSimilarity(
          created.title + ' ' + created.content,
          entry.title + ' ' + entry.content
        );
        return similarity > 0.85;
      });
      
      if (isDuplicateOfExisting || isDuplicateOfNew) {
        totalDuplicates++;
        continue;
      }
      
      try {
        const created = await storage.createKnowledgeEntry({
          domainExpertiseId,
          userId,
          category: entry.category,
          title: entry.title,
          content: entry.content,
          details: entry.details,
          keywords: entry.keywords,
          sourceDocumentIds: [doc.id],
          contentHash,
          confidence: entry.confidence,
          isVerified: false,
          usageCount: 0
        });
        totalAdded++;
        docEntriesAdded++;
        allEntries.push(entry);
        existingHashes.add(contentHash);
        newlyCreatedEntries.push({ title: entry.title, content: entry.content, hash: contentHash });
        
        // Generate embedding for semantic search (async, don't block)
        const text = `${entry.title}. ${entry.content}`;
        generateEmbeddingForEntry(storage, created.id, text).catch(err => 
          console.warn(`⚠️ Embedding generation deferred: ${err.message}`)
        );
      } catch (error: any) {
        console.error(`Failed to save: ${error.message}`);
      }
    }
    
    // Mark document as processed with timestamp and content hash
    if (docEntriesAdded > 0 || extracted.length === 0) {
      const docContentHash = doc.content 
        ? crypto.createHash('sha256').update(doc.content).digest('hex')
        : null;
      await storage.updateTrainingDocument(doc.id, userId, {
        knowledgeExtractedAt: new Date(),
        contentHash: docContentHash
      });
      console.log(`✅ Marked ${doc.fileName} as processed (${docEntriesAdded} entries added)`);
    }
  }

  const totalEntries = forceFullRebuild ? totalAdded : existingEntries.length + totalAdded - totalPricingSuperseded;
  console.log(`🔄 Knowledge base updated: ${totalAdded} new entries added (${totalEntries} total), ${totalDuplicates} duplicates skipped${totalPricingSuperseded > 0 ? `, ${totalPricingSuperseded} pricing entries superseded` : ''}`);

  return {
    entries: allEntries,
    duplicatesSkipped: totalDuplicates,
    newEntriesAdded: totalAdded
  };
}

export function buildStructuredKnowledgeContext(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return '';

  const byCategory = entries.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, KnowledgeEntry[]>);

  let context = `╔══════════════════════════════════════════════════════════════════╗
║                    KNOWLEDGE BASE REPOSITORY                      ║
║  Use this information to provide accurate, detailed responses     ║
╚══════════════════════════════════════════════════════════════════╝\n\n`;

  const categoryLabels: Record<string, string> = {
    product: '📦 PRODUCTS & SERVICES',
    pricing: '💰 PRICING INFORMATION',
    process: '📋 PROCESSES & WORKFLOWS',
    faq: '❓ FREQUENTLY ASKED QUESTIONS',
    case_study: '📈 CASE STUDIES & SUCCESS STORIES',
    competitor: '🏆 COMPETITIVE INTELLIGENCE',
    pain_point: '🎯 PAIN POINTS & SOLUTIONS',
    objection: '💬 OBJECTION HANDLING',
    feature: '⭐ FEATURES & BENEFITS',
    integration: '🔗 INTEGRATIONS'
  };

  for (const [category, label] of Object.entries(categoryLabels)) {
    const categoryEntries = byCategory[category];
    if (!categoryEntries || categoryEntries.length === 0) continue;

    context += `\n┌${'─'.repeat(60)}┐\n`;
    context += `│ ${label.padEnd(58)} │\n`;
    context += `└${'─'.repeat(60)}┘\n\n`;

    for (const entry of categoryEntries) {
      context += `▸ ${entry.title}\n`;
      context += `${'─'.repeat(50)}\n`;
      context += `${entry.content}\n`;
      
      // Include ALL details for comprehensive response generation
      if (entry.details && Object.keys(entry.details).length > 0) {
        const details = entry.details as Record<string, any>;
        context += `\n  📊 DETAILS:\n`;
        
        for (const [key, value] of Object.entries(details)) {
          if (value === null || value === undefined) continue;
          
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          if (Array.isArray(value)) {
            context += `  • ${formattedKey}:\n`;
            value.forEach((item, idx) => {
              if (typeof item === 'object') {
                context += `    ${idx + 1}. ${JSON.stringify(item)}\n`;
              } else {
                context += `    ${idx + 1}. ${item}\n`;
              }
            });
          } else if (typeof value === 'object') {
            context += `  • ${formattedKey}: ${JSON.stringify(value)}\n`;
          } else {
            context += `  • ${formattedKey}: ${value}\n`;
          }
        }
      }
      
      // Include keywords for context
      if (entry.keywords && entry.keywords.length > 0) {
        context += `  🏷️ Related: ${entry.keywords.join(', ')}\n`;
      }
      
      context += `\n`;
    }
  }

  context += `\n${'═'.repeat(60)}\n`;
  context += `📚 KNOWLEDGE BASE SUMMARY:\n`;
  context += `   Total Entries: ${entries.length}\n`;
  context += `   Categories: ${Object.keys(byCategory).length}\n`;
  
  for (const [category, categoryEntries] of Object.entries(byCategory)) {
    context += `   - ${category}: ${categoryEntries.length} entries\n`;
  }
  context += `${'═'.repeat(60)}\n`;

  return context;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openaiForEmbeddings) {
    console.warn('⚠️ OpenAI not configured for embeddings');
    return null;
  }

  try {
    const response = await openaiForEmbeddings.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error: any) {
    console.error(`❌ Embedding generation failed: ${error.message}`);
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

export interface SemanticSearchResult {
  entry: KnowledgeEntry;
  similarity: number;
}

export async function semanticSearch(
  query: string,
  entries: KnowledgeEntry[],
  limit: number = DEFAULT_SEMANTIC_SEARCH_LIMIT
): Promise<SemanticSearchResult[]> {
  if (entries.length === 0) return [];
  
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) {
    console.warn('⚠️ Could not generate query embedding, falling back to enhanced keyword match');
    // ENHANCED: Split query into words and match any of them (essential for pricing queries)
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const pricingTerms = ['price', 'pricing', 'cost', 'fee', 'rate', 'subscription', '$', '₹', 'euro', 'usd', 'inr'];
    const isPricingSearch = queryWords.some(w => pricingTerms.includes(w));
    
    const scoredEntries = entries.map(e => {
      const titleLower = e.title.toLowerCase();
      const contentLower = e.content.toLowerCase();
      const keywordsLower = (e.keywords || []).map(k => k.toLowerCase());
      
      let score = 0;
      for (const word of queryWords) {
        if (titleLower.includes(word)) score += 3;
        if (contentLower.includes(word)) score += 2;
        if (keywordsLower.some(k => k.includes(word))) score += 2;
      }
      
      // BOOST: Prioritize pricing category entries for pricing queries
      if (isPricingSearch && e.category === 'pricing') score += 10;
      
      return { entry: e, similarity: score / (queryWords.length * 7) };
    });
    
    const keywordMatches = scoredEntries
      .filter(r => r.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return keywordMatches.length > 0 ? keywordMatches : entries.slice(0, limit).map(e => ({ entry: e, similarity: 0 }));
  }

  // ENHANCED: Detect pricing queries to boost pricing category entries
  const queryLower = query.toLowerCase();
  const isPricingSearch = /pric(e|ing|es)|cost|fee|rate|subscription|\$|₹|euro|usd|inr|per\s*(user|seat|month)/.test(queryLower);
  
  const results: SemanticSearchResult[] = [];
  
  for (const entry of entries) {
    const entryEmbedding = entry.embedding as number[] | null;
    let similarity = 0;
    
    if (entryEmbedding && Array.isArray(entryEmbedding)) {
      similarity = cosineSimilarity(queryEmbedding, entryEmbedding);
    }
    
    // BOOST: Give pricing category entries a significant boost for pricing queries
    if (isPricingSearch && entry.category === 'pricing') {
      similarity = Math.min(1.0, similarity + 0.3);
    }
    
    results.push({ entry, similarity });
  }

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export async function generateEmbeddingForEntry(
  storage: any,
  entryId: string,
  content: string
): Promise<boolean> {
  const embedding = await generateEmbedding(content);
  if (!embedding) return false;
  
  try {
    await storage.updateKnowledgeEntryEmbedding(entryId, embedding);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to save embedding for entry ${entryId}: ${error.message}`);
    return false;
  }
}

export async function generateMissingEmbeddings(
  storage: any,
  userId: string
): Promise<{ generated: number; failed: number }> {
  const entries = await storage.getAllUserKnowledgeEntries(userId);
  let generated = 0;
  let failed = 0;

  for (const entry of entries) {
    if (entry.embedding) continue;
    
    const text = `${entry.title}. ${entry.content}`;
    const success = await generateEmbeddingForEntry(storage, entry.id, text);
    
    if (success) {
      generated++;
    } else {
      failed++;
    }
    
    if (generated % 10 === 0) {
      console.log(`🔄 Generated embeddings: ${generated}/${entries.length}`);
    }
  }

  console.log(`✅ Embedding generation complete: ${generated} generated, ${failed} failed`);
  return { generated, failed };
}
