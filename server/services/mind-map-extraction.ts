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
    
    // Enhanced prompt for better hierarchical structure and connections
    const systemPrompt = `Sales intelligence analyst. Extract key elements from conversation and create a HIERARCHICAL MIND MAP with proper connections.

${trainMeKnowledge ? 'DOMAIN KNOWLEDGE:\n' + trainMeKnowledge.substring(0, 500) + '...\n\n' : ''}CRITICAL RULES:
1. Node labels MUST be complete, descriptive names (e.g., "Cisco Catalyst 9300 Switch", NOT just "switch")
2. Create AT LEAST 1-2 edges per node for proper hierarchical layout
3. Use hierarchyLevel (0=top, 1=middle, 2=bottom) for proper ranking
4. Include full context in labels (company name, product name, version)

EXTRACT & CONNECT:

1. TECH STACK: Current systems, tools, infrastructure
   - Label format: "[Vendor] [Product] [Version/Type]" (e.g., "Microsoft Azure Cloud Platform")
   - Create parent-child relationships (Infrastructure → Components)
   - Connect integrations (System A ↔ System B)
   - Show data flows (Source → Destination)

2. PEOPLE: Decision makers with reporting hierarchy
   - Label format: "[Name] - [Title]" (e.g., "John Smith - CTO")
   - Use "reports_to" edges for org chart
   - Set hierarchyLevel: 0 for C-level, 1 for directors, 2 for managers

3. PAIN POINTS: Challenges linked to affected systems
   - Label format: "Pain: [Specific Issue]" (e.g., "Pain: Slow network performance affecting productivity")
   - Connect pain points to the systems they affect
   - Link to potential solutions

4. PROCESSES: Workflows with sequential steps
   - Label format: "Process: [Step Name]" (e.g., "Process: Initial qualification call")
   - Use "sequence" edges for process flows
   - Set sequenceOrder: 1, 2, 3...
   - Connect to systems involved

5. FOLLOW-UPS: Questions linked to topics
   - Label format: "Follow-up: [Question]" (e.g., "Follow-up: What is your current backup solution?")

CATEGORIES: users_access, endpoints, network, infrastructure, applications, data_flow, security, operations, cloud, database, integration, vendor, decision_maker, process, pain_point, follow_up, timeline, compliance

STATUS: "confirmed" (explicitly mentioned) | "assumed" (inferred from context) | "suggested" (AI-recommended) | "preemptive" (not discussed but likely exists)

EDGE TYPES:
- "dependency": Parent-child, infrastructure relationships
- "integration": System integrations, connections
- "data_flow": Data movement between systems
- "reports_to": Organizational hierarchy
- "sequence": Process steps, timeline
- "default": General relationships

EXAMPLE STRUCTURE:
{
  "nodes": [
    {"id":"infra1","label":"Enterprise Network Infrastructure","category":"infrastructure","status":"confirmed","hierarchyLevel":0},
    {"id":"switch1","label":"Cisco Catalyst 9300 Core Switch","category":"network","status":"confirmed","hierarchyLevel":1},
    {"id":"router1","label":"Cisco ISE Router with Policy Enforcement","category":"network","status":"confirmed","hierarchyLevel":1},
    {"id":"sec1","label":"CrowdStrike Falcon EDR/XDR Solution","category":"security","status":"assumed","hierarchyLevel":1},
    {"id":"pain1","label":"Pain: Network congestion during peak hours","category":"pain_point","status":"confirmed","hierarchyLevel":2}
  ],
  "edges": [
    {"id":"e1","source":"infra1","target":"switch1","type":"dependency","label":"contains"},
    {"id":"e2","source":"infra1","target":"router1","type":"dependency","label":"contains"},
    {"id":"e3","source":"switch1","target":"sec1","type":"integration","label":"protected by"},
    {"id":"e4","source":"router1","target":"sec1","type":"integration","label":"protected by"},
    {"id":"e5","source":"pain1","target":"switch1","type":"dependency","label":"affects"}
  ]
}

OUTPUT: Complete JSON with descriptive node labels and proper edges. NO TRUNCATION.`;

    let userPrompt: string;
    
    if (isReferenceMode) {
      userPrompt = `Create reference architecture for ${domainExpertiseInput || 'enterprise IT'}. 

Include:
- Infrastructure layer (servers, network, cloud)
- Application layer (business apps, databases)
- Security layer (firewalls, EDR, access control)
- Integration layer (APIs, middleware)
- Common pain points

IMPORTANT: Create hierarchical connections:
- Infrastructure → Network components
- Infrastructure → Applications
- Applications → Databases
- Security → Protected systems
- All nodes "assumed" status

Output complete JSON with nodes AND edges arrays.`;
    } else {
      // Truncate transcript for speed - keep most recent and relevant parts
      const maxTranscriptLength = 3000; // Reduced from 5000
      const truncatedTranscript = transcript.length > maxTranscriptLength 
        ? '...' + transcript.slice(-maxTranscriptLength)
        : transcript;
      
      userPrompt = `Analyze sales conversation and create hierarchical mind map:
${domainExpertiseInput ? `Domain: ${domainExpertiseInput}` : ''}

TRANSCRIPT:
${truncatedTranscript}

Extract: tech stack, decision makers, pain points, processes, follow-up questions.

CRITICAL: Create edges showing:
1. Infrastructure → Components (dependency)
2. System integrations (integration)
3. Data flows (data_flow)
4. Reporting hierarchy (reports_to)
5. Process sequences (sequence)
6. Pain points → Affected systems (dependency)

Ensure EVERY node has at least 1 connection for proper layout.

Output complete JSON with nodes AND edges arrays.`;
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
        // CRITICAL: Increased timeout and tokens for Map/Flow AI call
        const aiCallPromise = client.chat.completions.create({
          model: fastModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 4000 // Increased from 1500 to prevent truncation
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI call timeout after 60 seconds')), 60000) // Increased from 45s
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

    // FALLBACK: Generate edges if AI didn't create enough
    if (nodes.length > 0 && edges.length < nodes.length * 0.5) {
      console.log(`⚠️ Map/Flow: Insufficient edges (${edges.length} for ${nodes.length} nodes). Generating fallback edges...`);
      const fallbackEdges = generateFallbackEdges(nodes, edges);
      edges.push(...fallbackEdges);
      console.log(`✅ Map/Flow: Added ${fallbackEdges.length} fallback edges. Total: ${edges.length}`);
    }

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

// Fallback edge generation for better hierarchical layout
function generateFallbackEdges(nodes: TechNode[], existingEdges: TechEdge[]): TechEdge[] {
  const newEdges: TechEdge[] = [];
  const existingConnections = new Set(existingEdges.map(e => `${e.source}-${e.target}`));
  let edgeCounter = existingEdges.length;
  
  // Helper to add edge if it doesn't exist
  const addEdge = (source: string, target: string, type: string, label?: string) => {
    const key = `${source}-${target}`;
    if (!existingConnections.has(key) && source !== target) {
      newEdges.push({
        id: `fallback_edge_${edgeCounter++}`,
        source,
        target,
        label: label || '',
        type
      });
      existingConnections.add(key);
    }
  };
  
  // Group nodes by category
  const nodesByCategory: Record<string, TechNode[]> = {};
  nodes.forEach(node => {
    if (!nodesByCategory[node.category]) {
      nodesByCategory[node.category] = [];
    }
    nodesByCategory[node.category].push(node);
  });
  
  // 1. Connect infrastructure to components
  const infrastructure = nodesByCategory['infrastructure'] || [];
  const networkNodes = nodesByCategory['network'] || [];
  const endpoints = nodesByCategory['endpoints'] || [];
  const applications = nodesByCategory['applications'] || [];
  
  infrastructure.forEach(infra => {
    networkNodes.forEach(net => addEdge(infra.id, net.id, 'dependency', 'contains'));
    endpoints.slice(0, 2).forEach(ep => addEdge(infra.id, ep.id, 'dependency', 'hosts'));
    applications.slice(0, 2).forEach(app => addEdge(infra.id, app.id, 'dependency', 'runs'));
  });
  
  // 2. Connect applications to databases
  const databases = nodesByCategory['database'] || [];
  applications.forEach(app => {
    databases.forEach(db => addEdge(app.id, db.id, 'data_flow', 'stores data'));
  });
  
  // 3. Connect security to protected systems
  const security = nodesByCategory['security'] || [];
  const protectedSystems = [...networkNodes, ...applications, ...endpoints];
  security.forEach(sec => {
    protectedSystems.slice(0, 3).forEach(sys => addEdge(sec.id, sys.id, 'integration', 'protects'));
  });
  
  // 4. Connect cloud services to applications
  const cloud = nodesByCategory['cloud'] || [];
  cloud.forEach(cl => {
    applications.slice(0, 2).forEach(app => addEdge(cl.id, app.id, 'dependency', 'hosts'));
  });
  
  // 5. Connect integrations to systems
  const integrations = nodesByCategory['integration'] || [];
  const systems = [...applications, ...cloud, ...databases];
  integrations.forEach(integ => {
    systems.slice(0, 2).forEach(sys => addEdge(integ.id, sys.id, 'integration', 'connects'));
  });
  
  // 6. Connect pain points to affected systems
  const painPoints = nodesByCategory['pain_point'] || [];
  const allSystems = [...infrastructure, ...networkNodes, ...applications, ...security];
  painPoints.forEach(pain => {
    // Connect to 1-2 related systems based on keyword matching
    const relatedSystems = allSystems.filter(sys => {
      const painLower = pain.label.toLowerCase();
      const sysLower = sys.label.toLowerCase();
      return painLower.includes(sysLower.split(' ')[0]) || sysLower.includes(painLower.split(' ')[0]);
    }).slice(0, 2);
    
    if (relatedSystems.length > 0) {
      relatedSystems.forEach(sys => addEdge(pain.id, sys.id, 'dependency', 'affects'));
    } else {
      // If no keyword match, connect to first system
      if (allSystems.length > 0) {
        addEdge(pain.id, allSystems[0].id, 'dependency', 'affects');
      }
    }
  });
  
  // 7. Connect decision makers in hierarchy
  const decisionMakers = nodesByCategory['decision_maker'] || [];
  if (decisionMakers.length > 1) {
    // Sort by hierarchy level if available, otherwise by label
    const sorted = [...decisionMakers].sort((a, b) => {
      if (a.hierarchyLevel !== undefined && b.hierarchyLevel !== undefined) {
        return a.hierarchyLevel - b.hierarchyLevel;
      }
      // CEO/CTO at top, then directors, then managers
      const aLevel = a.label.toLowerCase().includes('ceo') ? 0 
                   : a.label.toLowerCase().includes('cto') || a.label.toLowerCase().includes('cfo') ? 1
                   : a.label.toLowerCase().includes('director') ? 2
                   : a.label.toLowerCase().includes('manager') ? 3
                   : 4;
      const bLevel = b.label.toLowerCase().includes('ceo') ? 0
                   : b.label.toLowerCase().includes('cto') || b.label.toLowerCase().includes('cfo') ? 1
                   : b.label.toLowerCase().includes('director') ? 2
                   : b.label.toLowerCase().includes('manager') ? 3
                   : 4;
      return aLevel - bLevel;
    });
    
    // Connect in hierarchy
    for (let i = 1; i < sorted.length; i++) {
      addEdge(sorted[i].id, sorted[0].id, 'reports_to', 'reports to');
    }
  }
  
  // 8. Connect process steps in sequence
  const processes = nodesByCategory['process'] || [];
  if (processes.length > 1) {
    const sorted = [...processes].sort((a, b) => {
      if (a.sequenceOrder !== undefined && b.sequenceOrder !== undefined) {
        return a.sequenceOrder - b.sequenceOrder;
      }
      return 0;
    });
    
    for (let i = 0; i < sorted.length - 1; i++) {
      addEdge(sorted[i].id, sorted[i + 1].id, 'sequence', 'then');
    }
  }
  
  // 9. If still not enough edges, create category-based connections
  if (newEdges.length + existingEdges.length < nodes.length * 0.5) {
    const categories = Object.keys(nodesByCategory);
    categories.forEach(cat => {
      const catNodes = nodesByCategory[cat];
      if (catNodes.length > 1) {
        // Connect first node to others in same category
        for (let i = 1; i < Math.min(catNodes.length, 3); i++) {
          addEdge(catNodes[0].id, catNodes[i].id, 'default', 'related');
        }
      }
    });
  }
  
  return newEdges;
}
