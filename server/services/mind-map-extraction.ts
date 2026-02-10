import { getAIClient } from "./ai-engine";
import { recordTokenUsage, mapEngineToProvider } from "./token-tracker";
import { db } from "../db";
import { knowledgeEntries, domainExpertise } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

// Cache for Train Me knowledge to avoid repeated DB queries
const trainMeCache = new Map<string, { data: string; timestamp: number }>();
const TRAIN_ME_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface TechNode {
  id: string;
  label: string;
  category: string;
  details?: string;
  hoverText?: string;
  confidence: number;
  status: 'assumed' | 'confirmed' | 'suggested';
  painPointType?: 'security_risk' | 'operational_inefficiency' | 'scalability_limitation' | 'cost_inefficiency';
  whyItMatters?: string;
  recommendation?: string;
  source?: string;
  hierarchyLevel?: number;
  sequenceOrder?: number;
}

interface TechEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

interface TechEnvironmentSnapshot {
  sessionId: string;
  nodes: TechNode[];
  edges: TechEdge[];
  lastUpdated: string;
  version: number;
  isReferenceArchitecture: boolean;
  viewMode: 'current' | 'ideal';
}

const validCategories = [
  'users_access',
  'endpoints',
  'network',
  'infrastructure',
  'applications',
  'data_flow',
  'security',
  'operations',
  'cloud',
  'database',
  'integration',
  'people',
  'projects',
  'pain_point',
  'vendor',
  // New categories for enhanced mapping
  'decision_maker',
  'process',
  'timeline',
  'compliance',
  'follow_up'
];

const validPainPointTypes = [
  'security_risk',
  'operational_inefficiency',
  'scalability_limitation',
  'cost_inefficiency'
];

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    users_access: 'User or access point in the system',
    endpoints: 'System endpoint or API',
    network: 'Network infrastructure component',
    infrastructure: 'Infrastructure element',
    applications: 'Application in the technology stack',
    data_flow: 'Data flow or integration point',
    security: 'Security mechanism or policy',
    operations: 'Operational process or tool',
    cloud: 'Cloud service or platform',
    database: 'Database or data storage',
    integration: 'System integration',
    people: 'Key person in the organization',
    projects: 'Active project or initiative',
    pain_point: 'Identified pain point or challenge',
    vendor: 'Vendor or external provider',
    decision_maker: 'Key decision maker in the buying process',
    process: 'Business process or workflow',
    timeline: 'Key moment in the conversation timeline',
    compliance: 'Compliance or regulatory requirement',
    follow_up: 'Suggested follow-up question to complete the picture'
  };
  return descriptions[category] || 'Element in the customer environment';
}

function cleanJSONResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

async function getTrainMeKnowledge(userId?: string, domainName?: string): Promise<string> {
  if (!userId) return '';
  
  // Check cache first
  const cacheKey = `${userId}:${domainName || 'default'}`;
  const cached = trainMeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TRAIN_ME_CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Single optimized query with JOIN instead of two separate queries
    const results = await db
      .select({
        content: knowledgeEntries.content,
        domainName: domainExpertise.name
      })
      .from(knowledgeEntries)
      .innerJoin(domainExpertise, eq(knowledgeEntries.domainExpertiseId, domainExpertise.id))
      .where(eq(domainExpertise.userId, userId))
      .orderBy(desc(knowledgeEntries.createdAt))
      .limit(10);
    
    if (results.length === 0) {
      trainMeCache.set(cacheKey, { data: '', timestamp: Date.now() });
      return '';
    }
    
    // Filter by domain name if provided
    const filteredResults = domainName 
      ? results.filter(r => r.domainName.toLowerCase().includes(domainName.toLowerCase()))
      : results;
    
    const data = (filteredResults.length > 0 ? filteredResults : results.slice(0, 5))
      .map(k => k.content)
      .join('\n\n');
    
    trainMeCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.log('Could not fetch Train Me knowledge:', error);
    return '';
  }
}

export async function extractTechEnvironment(
  sessionId: string,
  transcript: string,
  domainExpertiseInput?: string,
  userId?: string,
  sellerIntent?: string
): Promise<TechEnvironmentSnapshot> {
  const startTime = Date.now();
  const isReferenceMode = !transcript || transcript.trim().length < 50;
  
  if (!userId) {
    console.log('❌ Map/Flow: No userId provided');
    return {
      sessionId,
      nodes: [],
      edges: [],
      lastUpdated: new Date().toISOString(),
      version: 1,
      isReferenceArchitecture: isReferenceMode,
      viewMode: 'current'
    };
  }
  
  try {
    console.log(`🗺️ Map/Flow extraction: Starting for session ${sessionId}, userId ${userId}`);
    
    // Run AI client setup and knowledge fetch in parallel for speed
    const [aiConfig, trainMeKnowledge] = await Promise.all([
      getAIClient(userId),
      getTrainMeKnowledge(userId, domainExpertiseInput)
    ]);
    
    const { client, model, engine } = aiConfig;
    console.log(`🗺️ Map/Flow: Using user's AI engine: ${engine}, model: ${model}`);
    
    // Simplified prompt for faster generation
    const systemPrompt = `Sales intelligence analyst. Extract key elements from conversation. Output JSON only.

${trainMeKnowledge ? 'DOMAIN KNOWLEDGE:\n' + trainMeKnowledge.substring(0, 1000) + '\n\n' : ''}EXTRACT:

1. TECH STACK: Current systems, tools, infrastructure mentioned
2. PEOPLE: Decision makers with roles and influence
3. PAIN POINTS: Challenges, issues, inefficiencies
4. PROCESSES: Key workflows or business processes
5. FOLLOW-UPS: Questions to ask if info is incomplete

CATEGORIES: users_access, endpoints, network, infrastructure, applications, data_flow, security, operations, cloud, database, integration, vendor, decision_maker, process, pain_point, follow_up

STATUS: "confirmed" (explicit) | "assumed" (inferred) | "suggested" (AI-recommended)

OUTPUT:
{"nodes":[{"id":"str","label":"str","category":"str","details":"str","confidence":0-100,"status":"confirmed|assumed|suggested"}],"edges":[{"id":"str","source":"id","target":"id","label":"relationship","type":"default|integration|dependency|data_flow|reports_to"}]}`;

    let userPrompt: string;
    
    if (isReferenceMode) {
      userPrompt = `Reference architecture for ${domainExpertiseInput || 'enterprise IT'}. Include typical infrastructure, apps, security, pain points. All nodes "assumed". JSON only.`;
    } else {
      // Truncate transcript for speed - keep most recent and relevant parts
      const maxTranscriptLength = 3000; // Reduced from 5000
      const truncatedTranscript = transcript.length > maxTranscriptLength 
        ? '...' + transcript.slice(-maxTranscriptLength)
        : transcript;
      
      userPrompt = `Analyze sales conversation:
${domainExpertiseInput ? `Domain: ${domainExpertiseInput}` : ''}

TRANSCRIPT:
${truncatedTranscript}

Extract: tech stack, decision makers, pain points, processes, follow-up questions. JSON only.`;
    }

    console.log(`🧠 Map/Flow: ${isReferenceMode ? 'Reference mode' : 'Live extraction'} for ${transcript?.length || 0} chars`);

    const fastModel = model.includes('gpt-4') ? 'gpt-4o-mini' 
                    : model.includes('claude') ? 'claude-3-5-haiku-20241022'
                    : model.includes('gemini') ? 'gemini-2.0-flash'
                    : model.includes('deepseek') ? 'deepseek-chat'
                    : model.includes('grok') ? 'grok-3'
                    : model.includes('kimi') ? model
                    : model;
    
    console.log(`🗺️ Map/Flow: Engine=${engine}, Original model=${model}, Fast model=${fastModel}`);

    // Retry logic for robustness
    let response;
    let lastError;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // CRITICAL: 20-second timeout for Map/Flow AI call (increased for complex conversations)
        const aiCallPromise = client.chat.completions.create({
          model: fastModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 3000 // Reduced from 4500 for faster response
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI call timeout after 20 seconds')), 20000)
        );
        
        response = await Promise.race([aiCallPromise, timeoutPromise]) as any;
        
        break; // Success, exit retry loop
      } catch (apiError: any) {
        lastError = apiError;
        console.warn(`⚠️ Map/Flow: API attempt ${attempt}/${maxRetries} failed: ${apiError.message}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('API call failed after retries');
    }

    console.log(`⚡ Map/Flow AI call: ${Date.now() - startTime}ms | Model: ${fastModel}`);

    if (userId && engine) {
      await recordTokenUsage(userId, mapEngineToProvider(engine), response, 'mind_map');
    }

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in AI response");
    }

    const cleanedContent = cleanJSONResponse(messageContent);
    
    // Handle potentially truncated JSON responses
    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      console.warn(`⚠️ Map/Flow: JSON parse failed, attempting repair. Error: ${parseError.message}`);
      // Try to repair truncated JSON by finding the last complete node/edge
      let repairedJson = cleanedContent;
      
      // If JSON is truncated, try to close it properly
      if (parseError.message.includes('Unterminated') || parseError.message.includes('Unexpected end')) {
        // Find last complete object in nodes array
        const nodesMatch = repairedJson.match(/"nodes"\s*:\s*\[([\s\S]*)/);
        if (nodesMatch) {
          const nodesContent = nodesMatch[1];
          // Find all complete node objects
          const completeNodes: string[] = [];
          let depth = 0;
          let currentNode = '';
          let inString = false;
          let escapeNext = false;
          
          for (let i = 0; i < nodesContent.length; i++) {
            const char = nodesContent[i];
            if (escapeNext) {
              currentNode += char;
              escapeNext = false;
              continue;
            }
            if (char === '\\') {
              currentNode += char;
              escapeNext = true;
              continue;
            }
            if (char === '"' && !escapeNext) {
              inString = !inString;
            }
            if (!inString) {
              if (char === '{') depth++;
              if (char === '}') {
                depth--;
                if (depth === 0) {
                  currentNode += char;
                  completeNodes.push(currentNode.trim());
                  currentNode = '';
                  continue;
                }
              }
            }
            if (depth > 0) {
              currentNode += char;
            }
          }
          
          if (completeNodes.length > 0) {
            repairedJson = `{"nodes":[${completeNodes.join(',')}],"edges":[]}`;
            console.log(`Map/Flow: Repaired JSON with ${completeNodes.length} complete nodes`);
          }
        }
      }
      
      try {
        result = JSON.parse(repairedJson);
      } catch (repairError) {
        console.error(`❌ Map/Flow: JSON repair also failed, returning empty result`);
        return {
          sessionId,
          nodes: [],
          edges: [],
          lastUpdated: new Date().toISOString(),
          version: 1,
          isReferenceArchitecture: isReferenceMode,
          viewMode: 'current'
        };
      }
    }

    const nodes: TechNode[] = (result.nodes || []).map((node: any, index: number) => ({
      id: node.id || `node_${index}`,
      label: node.label || 'Unknown',
      category: validCategories.includes(node.category) ? node.category : 'applications',
      details: node.details || '',
      hoverText: node.hoverText || node.details || `${node.label}: ${getCategoryDescription(node.category)}`,
      confidence: typeof node.confidence === 'number' ? Math.min(100, Math.max(0, node.confidence)) : 80,
      status: ['confirmed', 'assumed', 'suggested'].includes(node.status) ? node.status : 'assumed',
      painPointType: node.category === 'pain_point' && validPainPointTypes.includes(node.painPointType) 
        ? node.painPointType 
        : undefined,
      whyItMatters: node.whyItMatters || undefined,
      recommendation: node.recommendation || undefined,
      source: node.source || '',
      hierarchyLevel: typeof node.hierarchyLevel === 'number' ? node.hierarchyLevel : undefined,
      sequenceOrder: typeof node.sequenceOrder === 'number' ? node.sequenceOrder : undefined
    }));

    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdgeTypes = ['default', 'integration', 'dependency', 'replacement', 'data_flow', 'reports_to', 'sequence'];
    const edges: TechEdge[] = (result.edges || []).filter((edge: any) => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    ).map((edge: any, index: number) => ({
      id: edge.id || `edge_${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
      type: validEdgeTypes.includes(edge.type) ? edge.type : 'default'
    }));

    console.log(`Map/Flow: Extracted ${nodes.length} nodes, ${edges.length} edges in ${Date.now() - startTime}ms`);

    if (nodes.length === 0) {
      console.warn('⚠️ Map/Flow: AI returned 0 nodes. Raw response:', messageContent?.substring(0, 500));
      console.warn('⚠️ Map/Flow: Parsed result:', JSON.stringify(result).substring(0, 500));
    }

    return {
      sessionId,
      nodes,
      edges,
      lastUpdated: new Date().toISOString(),
      version: 1,
      isReferenceArchitecture: isReferenceMode,
      viewMode: 'current'
    };

  } catch (error: any) {
    console.error("❌ Map/Flow extraction error:", error);
    console.error("❌ Map/Flow error details:", error.message, error.stack);
    throw new Error(`AI extraction failed: ${error.message || 'Unknown error'}`);
  }
}
