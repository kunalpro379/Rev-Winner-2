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

const COMPREHENSIVE_EXTRACTION_PROMPT = `You are a comprehensive knowledge extraction AI for Rev Winner, a sales intelligence platform.

Your goal is to THOROUGHLY analyze the document and extract ALL valuable information into a structured knowledge base that will be used to generate accurate, detailed responses during live sales conversations.

IMPORTANT: Extract as much detail as possible. This knowledge base is the ONLY source the AI will use to answer questions. Missing information means the AI cannot help sales reps.

For EACH distinct piece of knowledge, create an entry with:
- category: One of: product, pricing, process, faq, case_study, competitor, pain_point, objection, feature, integration
- title: A clear, descriptive title (max 150 chars)
- content: COMPREHENSIVE content (5-15 sentences with full details, not summaries)
- details: Structured JSON with ALL specific data points (every number, metric, feature, step, comparison)
- keywords: 8-15 relevant keywords for matching (include synonyms, related terms)
- confidence: Your confidence in this extraction (0-100)

EXTRACTION RULES - EXTRACT EVERYTHING:

 PRODUCTS & FEATURES:
- Every feature with full description, not just names
- How each feature works technically
- Benefits and use cases for each feature
- Supported integrations and compatibility
- Limitations and requirements
- Screenshots/UI descriptions if mentioned

 PRICING:
- ALL pricing tiers with exact amounts
- What's included in each tier
- Add-ons and their costs
- Discounts, promotions, volume pricing
- Payment terms and billing cycles
- Free trial details

 CASE STUDIES & RESULTS:
- Company names and industries
- Specific metrics and improvements (exact numbers)
- Timeline of implementation
- Challenges faced and solutions
- Quotes and testimonials
- ROI calculations

🏆 COMPETITIVE INTELLIGENCE:
- Feature-by-feature comparisons
- Pricing comparisons
- Strengths and weaknesses
- Migration/switching considerations
- Win/loss reasons

🎯 PAIN POINTS & SOLUTIONS:
- Customer problems in detail
- How the product solves each problem
- Before/after scenarios
- Quantified benefits

💬 OBJECTIONS & RESPONSES:
- Common customer concerns
- Detailed counter-arguments
- Supporting evidence and proof points

📋 PROCESSES:
- Step-by-step workflows (every step)
- Decision criteria at each stage
- Timeline expectations
- Dependencies and prerequisites

DO NOT:
- Skip any factual information
- Summarize when detail exists
- Omit numbers, metrics, or specifics
- Combine unrelated topics
- Use vague language when specifics exist

Create as many entries as needed to capture ALL information. If a topic is complex, create multiple entries covering different aspects.

Return JSON format: {"entries": [...]}

DOCUMENT TO ANALYZE:
`;

const CHUNK_EXTRACTION_PROMPT = `Continue extracting knowledge from this document chunk. This is part of a larger document.

IMPORTANT: 
- Extract ALL new information not seen before
- Be comprehensive - capture every detail
- Create detailed entries (5-15 sentences each)
- Don't skip anything that could be useful for sales conversations

Return JSON format: {"entries": [...]}

DOCUMENT CHUNK:
`;

const CHUNK_SIZE = 15000; // Characters per chunk for processing
const MAX_CHUNKS = 10; // Maximum chunks to process per document

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
    parsed = JSON.parse(responseText);
    if (parsed.entries) parsed = parsed.entries;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed;
  } catch {
    // Try to extract JSON from markdown code blocks or surrounding text
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                     responseText.match(/\[\s*\{[\s\S]*\}\s*\]/) ||
                     responseText.match(/\{\s*"entries"\s*:\s*\[[\s\S]*\]\s*\}/);
    
    if (jsonMatch) {
      try {
        const cleanJson = jsonMatch[1] || jsonMatch[0];
        parsed = JSON.parse(cleanJson);
        if (parsed.entries) parsed = parsed.entries;
        if (!Array.isArray(parsed)) parsed = [parsed];
        return parsed;
      } catch (innerError) {
        console.error('Failed to parse AI response as JSON:', responseText.substring(0, 200));
        return [];
      }
    }
    console.error('No valid JSON found in response:', responseText.substring(0, 200));
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
  
  console.log(`[Claude] Chunk ${chunkIndex + 1}/${totalChunks}: Sending to Claude (${chunk.length} chars)...`);
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        { 
          role: 'user', 
          content: `You are a comprehensive knowledge extraction AI. Extract MAXIMUM detail from documents.
Always respond with valid JSON only: {"entries": [...]}
Each entry must have: category, title (descriptive), content (5-15 detailed sentences), details (all data points), keywords (8-15), confidence.
Create multiple entries to cover all information. Do not summarize - preserve all details.

${prompt}`
        }
      ]
    });
    
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '[]';
    console.log(`[Claude] Chunk ${chunkIndex + 1}/${totalChunks}: Received ${responseText.length} chars`);
    
    const entries = parseAIResponse(responseText);
    console.log(` [Claude] Chunk ${chunkIndex + 1}/${totalChunks}: Extracted ${entries.length} entries`);
    
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
  // Try DeepSeek first, fallback to Claude
  if (deepseek) {
    const prompt = isFirstChunk 
      ? COMPREHENSIVE_EXTRACTION_PROMPT + chunk
      : CHUNK_EXTRACTION_PROMPT + chunk;
    
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks}: Sending to DeepSeek (${chunk.length} chars)...`);
    
    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: `You are a comprehensive knowledge extraction AI. Extract MAXIMUM detail from documents.
Always respond with valid JSON: {"entries": [...]}
Each entry must have: category, title (descriptive), content (5-15 detailed sentences), details (all data points), keywords (8-15), confidence.
Create multiple entries to cover all information. Do not summarize - preserve all details.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      
      const responseText = response.choices[0]?.message?.content || '[]';
      console.log(`Chunk ${chunkIndex + 1}/${totalChunks}: Received ${responseText.length} chars from DeepSeek`);
      
      const entries = parseAIResponse(responseText);
      console.log(` Chunk ${chunkIndex + 1}/${totalChunks}: Extracted ${entries.length} entries`);
      
      if (entries.length > 0) {
        return entries;
      }
      
      // If no entries from DeepSeek, try Claude
      console.log(`⚠️ DeepSeek returned no entries, trying Claude...`);
    } catch (error: any) {
      console.error(`❌ DeepSeek failed for chunk ${chunkIndex + 1}: ${error.message}`);
      console.log(`Falling back to Claude...`);
    }
  }
  
  // Fallback to Claude
  return extractFromChunkWithClaude(chunk, chunkIndex, totalChunks, isFirstChunk);
}

export async function extractKnowledgeFromDocument(
  document: TrainingDocument,
  existingHashes: Set<string>
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
  console.log(`Processing document: ${document.fileName} (${content.length} chars)`);

  try {
    const chunks = splitIntoChunks(content, CHUNK_SIZE);
    console.log(`📑 Split into ${chunks.length} chunks for comprehensive extraction`);
    
    const allParsedEntries: any[] = [];
    
    // Process chunks sequentially to avoid rate limits
    for (let i = 0; i < chunks.length; i++) {
      const chunkEntries = await extractFromChunk(chunks[i], i, chunks.length, i === 0);
      allParsedEntries.push(...chunkEntries);
      
      // Brief pause between chunks to avoid rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(` Total raw entries extracted: ${allParsedEntries.length}`);

    const validEntries: ExtractedKnowledge[] = [];
    const seenTitles = new Set<string>(); // Avoid duplicate titles within same document

    for (const entry of allParsedEntries) {
      if (!entry.category || !entry.title || !entry.content) continue;
      
      // Normalize category
      if (!knowledgeCategories.includes(entry.category as KnowledgeCategory)) {
        entry.category = 'product';
      }

      // Skip very short content (not comprehensive)
      if (entry.content.length < 100) continue;

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

    console.log(`Extracted ${validEntries.length} comprehensive knowledge entries from ${document.fileName}`);
    return validEntries;

  } catch (error: any) {
    console.error(`❌ Knowledge extraction failed for ${document.fileName}:`, error.message);
    return [];
  }
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

  let newEntriesAdded = 0;
  let duplicatesSkipped = 0;

  for (const entry of extracted) {
    const contentHash = generateContentHash(entry.title + entry.content);
    
    const isDuplicate = existingEntries.some(existing => {
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
      
      // Generate embedding for semantic search (async, don't block)
      const text = `${entry.title}. ${entry.content}`;
      generateEmbeddingForEntry(storage, created.id, text).catch(err => 
        console.warn(`⚠️ Embedding generation deferred: ${err.message}`)
      );
    } catch (error: any) {
      console.error(`Failed to save knowledge entry: ${error.message}`);
    }
  }

  console.log(`Knowledge extraction complete: ${newEntriesAdded} added, ${duplicatesSkipped} duplicates skipped`);

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
    console.log(`All ${completedDocs.length} documents already processed. No new extraction needed.`);
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
  
  console.log(`Processing ${unprocessedDocs.length} unprocessed documents (${completedDocs.length - unprocessedDocs.length} already done)`);

  let totalAdded = 0;
  let totalDuplicates = 0;
  const allEntries: ExtractedKnowledge[] = [];
  
  // Build hash set from existing entries to avoid duplicates
  const existingHashes = new Set<string>(
    forceFullRebuild ? [] : existingEntries.map(e => e.contentHash).filter(Boolean) as string[]
  );

  // Track newly created entries in this run for intra-run duplicate detection
  const newlyCreatedEntries: Array<{ title: string; content: string; hash: string }> = [];

  for (const doc of unprocessedDocs) {
    console.log(`📄 Extracting knowledge from: ${doc.fileName}`);
    const extracted = await extractKnowledgeFromDocument(doc, existingHashes);
    let docEntriesAdded = 0;
    
    for (const entry of extracted) {
      const contentHash = generateContentHash(entry.title + entry.content);
      
      // Check for duplicates against existing entries in database
      const isDuplicateOfExisting = !forceFullRebuild && existingEntries.some(existing => {
        if (existing.contentHash === contentHash) return true;
        const similarity = calculateSimilarity(
          existing.title + ' ' + existing.content,
          entry.title + ' ' + entry.content
        );
        return similarity > 0.85;
      });
      
      // Also check against entries created in this run
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
      console.log(`Marked ${doc.fileName} as processed (${docEntriesAdded} entries added)`);
    }
  }

  const totalEntries = forceFullRebuild ? totalAdded : existingEntries.length + totalAdded;
  console.log(`Knowledge base updated: ${totalAdded} new entries added (${totalEntries} total), ${totalDuplicates} duplicates skipped`);

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
    product: ' PRODUCTS & SERVICES',
    pricing: ' PRICING INFORMATION',
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
        context += `\n   DETAILS:\n`;
        
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
  context += `KNOWLEDGE BASE SUMMARY:\n`;
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
    // CRITICAL FIX: Add 10-second timeout to prevent hanging
    const embeddingPromise = openaiForEmbeddings.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Embedding generation timeout after 10s')), 10000);
    });
    
    const response = await Promise.race([embeddingPromise, timeoutPromise]);
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

// PERFORMANCE: Cache query embeddings to avoid repeated API calls (CRITICAL for 3-minute delay fix)
const queryEmbeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
const QUERY_EMBEDDING_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache for query embeddings

export async function semanticSearch(
  query: string,
  entries: KnowledgeEntry[],
  limit: number = DEFAULT_SEMANTIC_SEARCH_LIMIT
): Promise<SemanticSearchResult[]> {
  if (entries.length === 0) return [];
  
  // CRITICAL FIX: Check cache first to avoid expensive embedding API call
  const cacheKey = query.toLowerCase().trim();
  const cached = queryEmbeddingCache.get(cacheKey);
  let queryEmbedding: number[] | null = null;
  
  if (cached && (Date.now() - cached.timestamp < QUERY_EMBEDDING_CACHE_TTL)) {
    queryEmbedding = cached.embedding;
    console.log(`⚡ Using cached query embedding (age: ${Date.now() - cached.timestamp}ms)`);
  } else {
    queryEmbedding = await generateEmbedding(query);
    
    // Cache the embedding for future use
    if (queryEmbedding) {
      queryEmbeddingCache.set(cacheKey, { embedding: queryEmbedding, timestamp: Date.now() });
      
      // Clean up old cache entries (keep cache size manageable)
      if (queryEmbeddingCache.size > 100) {
        const oldestKey = Array.from(queryEmbeddingCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
        queryEmbeddingCache.delete(oldestKey);
      }
    }
  }
  
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
      console.log(`Generated embeddings: ${generated}/${entries.length}`);
    }
  }

  console.log(`Embedding generation complete: ${generated} generated, ${failed} failed`);
  return { generated, failed };
}
