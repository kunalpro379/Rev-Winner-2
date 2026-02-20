import { getAIClient } from "./ai-engine";
import { recordTokenUsage, mapEngineToProvider } from "./token-tracker";
import { db } from "../db";
import { knowledgeEntries, domainExpertise } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";

const deepseekFallback = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
      timeout: 60000,
    })
  : null;

const trainMeCache = new Map<string, { data: string; timestamp: number }>();
const TRAIN_ME_CACHE_TTL = 5 * 60 * 1000;

interface TechNode {
  id: string;
  label: string;
  category: string;
  details?: string;
  hoverText?: string;
  confidence: number;
  status: 'assumed' | 'confirmed' | 'suggested' | 'preemptive';
  painPointType?: 'security_risk' | 'operational_inefficiency' | 'scalability_limitation' | 'cost_inefficiency';
  whyItMatters?: string;
  recommendation?: string;
  source?: string;
  hierarchyLevel?: number;
  sequenceOrder?: number;
  problemDetected?: boolean;
  problemSummary?: string;
  problemImpact?: string;
  recommendedSolution?: string;
  solutionSource?: string;
  sellerPositioning?: string;
  preemptiveReason?: string;
  discoveryQuestion?: string;
  iconName?: string;
}

interface TechEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

interface MapSection {
  nodes: TechNode[];
  edges: TechEdge[];
  sectionEmpty: boolean;
  emptyReason?: string;
}

interface MultiSectionMap {
  techEnvironment: MapSection;
  decisionMakers: MapSection;
  businessProcesses: MapSection;
  callTimeline: MapSection;
  compliance: MapSection;
}

interface TechEnvironmentSnapshot {
  sessionId: string;
  nodes: TechNode[];
  edges: TechEdge[];
  lastUpdated: string;
  version: number;
  isReferenceArchitecture: boolean;
  viewMode: 'current' | 'ideal';
  sections: MultiSectionMap;
}

const techCategories = [
  'users_access', 'endpoints', 'network', 'infrastructure', 'applications',
  'data_flow', 'security', 'operations', 'cloud', 'database', 'integration',
  'people', 'projects', 'pain_point', 'vendor'
];

const allValidCategories = [
  ...techCategories, 'decision_maker', 'process', 'timeline', 'compliance', 'follow_up'
];

const validPainPointTypes = [
  'security_risk', 'operational_inefficiency', 'scalability_limitation', 'cost_inefficiency'
];

const validEdgeTypes = ['default', 'integration', 'dependency', 'replacement', 'data_flow', 'reports_to', 'sequence', 'preemptive_link'];

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
  
  const cacheKey = `${userId}:${domainName || 'default'}`;
  const cached = trainMeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TRAIN_ME_CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const results = await db
      .select({
        content: knowledgeEntries.content,
        domainName: domainExpertise.name
      })
      .from(knowledgeEntries)
      .innerJoin(domainExpertise, eq(knowledgeEntries.domainExpertiseId, domainExpertise.id))
      .where(eq(domainExpertise.userId, userId))
      .orderBy(desc(knowledgeEntries.createdAt))
      .limit(5);
    
    if (results.length === 0) {
      trainMeCache.set(cacheKey, { data: '', timestamp: Date.now() });
      return '';
    }
    
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

function buildSectionNode(node: any, index: number): TechNode {
  return {
    id: node.id || `node_${index}_${Date.now()}`,
    label: node.label || 'Unknown',
    category: allValidCategories.includes(node.category) ? node.category : 'applications',
    details: node.details || '',
    hoverText: node.hoverText || node.details || node.label,
    confidence: typeof node.confidence === 'number' ? Math.min(100, Math.max(0, node.confidence)) : 80,
    status: ['confirmed', 'assumed', 'suggested', 'preemptive'].includes(node.status) ? node.status : 'assumed',
    painPointType: node.category === 'pain_point' && validPainPointTypes.includes(node.painPointType) 
      ? node.painPointType : undefined,
    whyItMatters: node.whyItMatters || undefined,
    recommendation: node.recommendation || undefined,
    source: node.source || '',
    hierarchyLevel: typeof node.hierarchyLevel === 'number' ? node.hierarchyLevel : undefined,
    sequenceOrder: typeof node.sequenceOrder === 'number' ? node.sequenceOrder : undefined,
    problemDetected: node.problemDetected === true ? true : undefined,
    problemSummary: node.problemSummary || undefined,
    problemImpact: node.problemImpact || undefined,
    recommendedSolution: node.recommendedSolution || undefined,
    solutionSource: node.solutionSource || undefined,
    sellerPositioning: node.sellerPositioning || undefined,
    preemptiveReason: node.preemptiveReason || undefined,
    discoveryQuestion: node.discoveryQuestion || undefined,
    iconName: node.iconName || undefined
  };
}

function buildSectionEdges(rawEdges: any[], nodeIds: Set<string>): TechEdge[] {
  return (rawEdges || [])
    .filter((edge: any) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge: any, index: number) => ({
      id: edge.id || `edge_${index}_${Date.now()}`,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
      type: validEdgeTypes.includes(edge.type) ? edge.type : 'default'
    }));
}

function addAutoFlowEdges(
  sectionKey: keyof MultiSectionMap,
  nodes: TechNode[],
  existingEdges: TechEdge[]
): TechEdge[] {
  if (!nodes || nodes.length < 2) return existingEdges;

  const edges = [...existingEdges];
  const edgeKey = (e: { source: string; target: string; type?: string }) =>
    `${e.source}::${e.target}::${e.type || 'default'}`;
  const existing = new Set(edges.map(edgeKey));

  const makeChainEdges = (orderedNodes: TechNode[], type: TechEdge['type'], label?: string) => {
    for (let i = 0; i < orderedNodes.length - 1; i++) {
      const sourceId = orderedNodes[i].id;
      const targetId = orderedNodes[i + 1].id;
      const key = edgeKey({ source: sourceId, target: targetId, type });
      if (existing.has(key)) continue;

      const newEdge: TechEdge = {
        id: `auto_${sectionKey}_${type || 'default'}_${sourceId}_${targetId}`,
        source: sourceId,
        target: targetId,
        type,
        label
      };

      edges.push(newEdge);
      existing.add(key);
    }
  };

  if (sectionKey === 'businessProcesses' || sectionKey === 'callTimeline') {
    const ordered = [...nodes].sort((a, b) => {
      const ao = typeof a.sequenceOrder === 'number' ? a.sequenceOrder : 999;
      const bo = typeof b.sequenceOrder === 'number' ? b.sequenceOrder : 999;
      if (ao !== bo) return ao - bo;
      return a.label.localeCompare(b.label);
    });
    makeChainEdges(ordered, 'sequence');
  } else if (sectionKey === 'decisionMakers') {
    const ordered = [...nodes].sort((a, b) => {
      const al = typeof a.hierarchyLevel === 'number' ? a.hierarchyLevel : 999;
      const bl = typeof b.hierarchyLevel === 'number' ? b.hierarchyLevel : 999;
      if (al !== bl) return al - bl;
      return a.label.localeCompare(b.label);
    });
    makeChainEdges(ordered, 'reports_to');
  } else if (sectionKey === 'techEnvironment') {
    if (existing.size === 0) {
      const ordered = [...nodes].sort((a, b) => {
        const ao = typeof a.sequenceOrder === 'number' ? a.sequenceOrder : 999;
        const bo = typeof b.sequenceOrder === 'number' ? b.sequenceOrder : 999;
        if (ao !== bo) return ao - bo;
        return a.label.localeCompare(b.label);
      });
      makeChainEdges(ordered, 'default');
    }
  }

  return edges;
}

function buildSection(rawSection: any, sectionKey: keyof MultiSectionMap): MapSection {
  if (!rawSection || (!rawSection.nodes?.length && !rawSection.length)) {
    return { nodes: [], edges: [], sectionEmpty: true, emptyReason: 'Not discussed in conversation' };
  }
  
  const rawNodes = Array.isArray(rawSection) ? rawSection : (rawSection.nodes || []);
  const rawEdges = Array.isArray(rawSection) ? [] : (rawSection.edges || []);
  
  const nodes: TechNode[] = rawNodes.map((n: any, i: number) => buildSectionNode(n, i));
  const nodeIds = new Set<string>(nodes.map(n => n.id));
  const sectionEdges = buildSectionEdges(rawEdges, nodeIds);
  const edges = addAutoFlowEdges(sectionKey, nodes, sectionEdges);
  
  return {
    nodes,
    edges,
    sectionEmpty: nodes.length === 0,
    emptyReason: nodes.length === 0 ? 'Not discussed in conversation' : undefined
  };
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
    const emptySection: MapSection = { nodes: [], edges: [], sectionEmpty: true, emptyReason: 'No user context' };
    return {
      sessionId,
      nodes: [],
      edges: [],
      lastUpdated: new Date().toISOString(),
      version: 1,
      isReferenceArchitecture: isReferenceMode,
      viewMode: 'current',
      sections: {
        techEnvironment: emptySection,
        decisionMakers: emptySection,
        businessProcesses: emptySection,
        callTimeline: emptySection,
        compliance: emptySection
      }
    };
  }
  
  try {
    console.log(`🗺️ Map/Flow extraction: Starting for session ${sessionId}, userId ${userId}`);
    
    let client: any;
    let model: string;
    let engine: string;
    
    const trainMeKnowledge = await getTrainMeKnowledge(userId, domainExpertiseInput);
    
    try {
      const aiConfig = await getAIClient(userId);
      client = aiConfig.client;
      model = aiConfig.model;
      engine = aiConfig.engine;
      console.log(`🗺️ Map/Flow: Using user's AI engine: ${engine}, model: ${model}`);
    } catch (aiError: any) {
      console.warn(`⚠️ Map/Flow: User AI key failed (${aiError.message}), falling back to DeepSeek`);
      if (!deepseekFallback) {
        throw new Error("AI engine not available - please configure your API key in Settings");
      }
      client = deepseekFallback;
      model = "deepseek-chat";
      engine = "deepseek";
      console.log(`🗺️ Map/Flow: Using DeepSeek fallback`);
    }
    
    const systemPrompt = `You are a consulting intelligence system analyzing sales conversations. Extract technology, people, processes, timeline, and compliance into 5 SEPARATE JSON sections.
${trainMeKnowledge ? 'DOMAIN KNOWLEDGE:\n' + trainMeKnowledge.substring(0, 600) + '\n' : ''}
RULES:
- Extract confirmed info from transcript, infer missing components as "assumed" based on industry context
- Detect pain points: set problemDetected:true with problemSummary and recommendedSolution
- Add preemptive nodes for undiscussed but likely components with discoveryQuestion
- Keep details SHORT (under 15 words). Be concise.
- Edges within SAME section only

OUTPUT FORMAT - Return JSON with exactly these 5 keys:
{"techEnvironment":{"nodes":[...],"edges":[...]},"decisionMakers":{"nodes":[...],"edges":[...]},"businessProcesses":{"nodes":[...],"edges":[...]},"callTimeline":{"nodes":[...],"edges":[...]},"compliance":{"nodes":[...],"edges":[...]}}

SECTION RULES:
1."techEnvironment" - systems/tools/platforms/infra/security/cloud/networking. Max 6 nodes. Categories: users_access|endpoints|network|infrastructure|applications|security|operations|cloud|database|integration|vendor|pain_point
2."decisionMakers" - people/roles only. Max 3 nodes. Category: decision_maker. Include hierarchyLevel(1=top,2=mid,3=eval)
3."businessProcesses" - workflows only. Max 3 nodes. Category: process. Include sequenceOrder
4."callTimeline" - conversation moments. Max 4 nodes. Category: timeline. Include sequenceOrder
5."compliance" - regulations/frameworks. Max 2 nodes. Category: compliance

Node schema: {"id":"str","label":"str","category":"str","details":"short str","confidence":80,"status":"confirmed|assumed|preemptive","iconName":"Server|Shield|Cloud|Database|Users|Monitor|Wifi|AppWindow|Settings|Building2|User|UserCheck|Clock|Scale|Lock|Globe|HardDrive|Cpu|Workflow|Target","problemDetected":false,"problemSummary":"opt","recommendedSolution":"opt","preemptiveReason":"opt","discoveryQuestion":"opt","hierarchyLevel":"opt","sequenceOrder":"opt"}
Edge schema: {"id":"str","source":"nodeId","target":"nodeId","label":"str","type":"default|integration|dependency|reports_to|sequence"}`;

    let userPrompt: string;
    
    if (isReferenceMode) {
      userPrompt = `Generate consulting-grade reference architecture for ${domainExpertiseInput || 'enterprise IT'}. Include typical tech stack, common decision-making hierarchy, standard procurement processes, and likely compliance requirements. All nodes "assumed". Apply industry context intelligence. Provide all 5 sections. JSON only.`;
    } else {
      const maxTranscriptLength = 2500;
      const truncatedTranscript = transcript.length > maxTranscriptLength 
        ? '...' + transcript.slice(-maxTranscriptLength)
        : transcript;
      
      userPrompt = `Analyze this sales conversation.${domainExpertiseInput ? ` Domain: ${domainExpertiseInput}.` : ''}${sellerIntent ? ` Intent: ${sellerIntent}.` : ''} Return all 5 sections as JSON.
TRANSCRIPT:
${truncatedTranscript}`;
    }

    console.log(`🧠 Map/Flow: ${isReferenceMode ? 'Reference mode' : 'Live extraction'} for ${transcript?.length || 0} chars`);

    const fastModel = model.includes('gpt-4') ? 'gpt-4o-mini' 
                    : model.includes('claude') ? 'claude-3-5-haiku-latest'
                    : model.includes('gemini') ? 'gemini-2.0-flash'
                    : model.includes('deepseek') ? 'deepseek-chat'
                    : model.includes('grok') ? 'grok-3'
                    : model.includes('kimi') ? model
                    : model;
    
    console.log(`🗺️ Map/Flow: Engine=${engine}, Original model=${model}, Fast model=${fastModel}`);

    let response;
    let lastError;
    const modelsToTry = fastModel !== model ? [fastModel, model] : [model];
    
    for (const tryModel of modelsToTry) {
      try {
        console.log(`🗺️ Map/Flow: Trying model ${tryModel}...`);
        const supportsJsonFormat = !tryModel.includes('claude') && !tryModel.includes('gemini') && !tryModel.includes('grok') && !tryModel.includes('kimi');
        const requestParams: any = {
          model: tryModel,
          messages: [
            { role: "system", content: systemPrompt + (supportsJsonFormat ? '' : '\nRespond with ONLY valid JSON, no other text.') },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 3500
        };
        if (supportsJsonFormat) {
          requestParams.response_format = { type: "json_object" };
        }
        response = await client.chat.completions.create(requestParams);
        
        console.log(`✅ Map/Flow: Model ${tryModel} succeeded, finish_reason: ${response.choices?.[0]?.finish_reason}`);
        break;
      } catch (apiError: any) {
        lastError = apiError;
        console.warn(`⚠️ Map/Flow: Model ${tryModel} failed: ${apiError.message}`);
        if (apiError.message?.includes('response_format') || apiError.message?.includes('json_object')) {
          console.log(`🔄 Map/Flow: Retrying ${tryModel} without response_format...`);
          try {
            response = await client.chat.completions.create({
              model: tryModel,
              messages: [
                { role: "system", content: systemPrompt + '\nRespond with ONLY valid JSON, no other text.' },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.1,
              max_tokens: 3500
            });
            console.log(`✅ Map/Flow: Model ${tryModel} succeeded without json format`);
            break;
          } catch (retryError: any) {
            lastError = retryError;
            console.warn(`⚠️ Map/Flow: Model ${tryModel} retry also failed: ${retryError.message}`);
          }
        }
        if (tryModel !== modelsToTry[modelsToTry.length - 1]) {
          console.log(`🔄 Map/Flow: Falling back to next model...`);
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
    
    if (!response) {
      console.error(`❌ Map/Flow: All models failed. Last error: ${lastError?.message}`);
      const emptySection: MapSection = { nodes: [], edges: [], sectionEmpty: true, emptyReason: 'AI generation failed - please try again' };
      return {
        sessionId,
        nodes: [],
        edges: [],
        lastUpdated: new Date().toISOString(),
        version: 1,
        isReferenceArchitecture: isReferenceMode,
        viewMode: 'current',
        sections: {
          techEnvironment: emptySection,
          decisionMakers: emptySection,
          businessProcesses: emptySection,
          callTimeline: emptySection,
          compliance: emptySection
        }
      };
    }

    console.log(`⚡ Map/Flow AI call: ${Date.now() - startTime}ms | Model: ${fastModel}`);

    if (userId && engine) {
      await recordTokenUsage(userId, mapEngineToProvider(engine), response, 'mind_map');
    }

    const finishReason = response.choices?.[0]?.finish_reason;
    if (finishReason === 'length') {
      console.warn(`⚠️ Map/Flow: Response truncated (finish_reason=length). Will attempt JSON repair.`);
    }
    
    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.warn('⚠️ Map/Flow: No content in AI response, returning empty sections');
      const emptySection: MapSection = { nodes: [], edges: [], sectionEmpty: true, emptyReason: 'No AI response - please try again' };
      return {
        sessionId,
        nodes: [],
        edges: [],
        lastUpdated: new Date().toISOString(),
        version: 1,
        isReferenceArchitecture: isReferenceMode,
        viewMode: 'current',
        sections: {
          techEnvironment: emptySection,
          decisionMakers: emptySection,
          businessProcesses: emptySection,
          callTimeline: emptySection,
          compliance: emptySection
        }
      };
    }

    const cleanedContent = cleanJSONResponse(messageContent);
    
    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      console.warn(`⚠️ Map/Flow: JSON parse failed, attempting repair. Error: ${parseError.message}`);
      console.warn(`⚠️ Map/Flow: Raw content length: ${cleanedContent.length}, last 100 chars: ${cleanedContent.slice(-100)}`);
      
      let repairedJson = cleanedContent;
      
      const sectionNames = ['techEnvironment', 'decisionMakers', 'businessProcesses', 'callTimeline', 'compliance'];
      const extractedSections: Record<string, any> = {};
      
      for (const section of sectionNames) {
        const sectionRegex = new RegExp(`"${section}"\\s*:\\s*\\{`);
        const match = repairedJson.match(sectionRegex);
        if (match && match.index !== undefined) {
          let depth = 0;
          let start = match.index + match[0].length - 1;
          let end = -1;
          let inStr = false;
          let esc = false;
          
          for (let i = start; i < repairedJson.length; i++) {
            const c = repairedJson[i];
            if (esc) { esc = false; continue; }
            if (c === '\\') { esc = true; continue; }
            if (c === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (c === '{') depth++;
            if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
          }
          
          if (end > start) {
            try {
              extractedSections[section] = JSON.parse(repairedJson.substring(start, end));
            } catch {}
          }
        }
      }
      
      if (Object.keys(extractedSections).length > 0) {
        console.log(`✅ Map/Flow: Repaired ${Object.keys(extractedSections).length} sections: ${Object.keys(extractedSections).join(', ')}`);
        const emptySec = { nodes: [], edges: [] };
        result = {
          techEnvironment: extractedSections.techEnvironment || emptySec,
          decisionMakers: extractedSections.decisionMakers || emptySec,
          businessProcesses: extractedSections.businessProcesses || emptySec,
          callTimeline: extractedSections.callTimeline || emptySec,
          compliance: extractedSections.compliance || emptySec
        };
      } else {
        const nodesRegex = /"nodes"\s*:\s*\[/;
        const nodesMatch = repairedJson.match(nodesRegex);
        if (nodesMatch) {
          const completeObjects = repairedJson.match(/\{[^{}]*"id"\s*:\s*"[^"]+",\s*"label"\s*:\s*"[^"]+"[^{}]*\}/g);
          if (completeObjects && completeObjects.length > 0) {
            const nodes = completeObjects.map(obj => { try { return JSON.parse(obj); } catch { return null; } }).filter(Boolean);
            if (nodes.length > 0) {
              console.log(`✅ Map/Flow: Extracted ${nodes.length} individual nodes from broken JSON`);
              result = { nodes, edges: [] };
            }
          }
        }
        
        if (!result) {
          console.error(`❌ Map/Flow: JSON repair failed, returning empty result`);
          const emptySection: MapSection = { nodes: [], edges: [], sectionEmpty: true, emptyReason: 'Parse error' };
          return {
            sessionId,
            nodes: [],
            edges: [],
            lastUpdated: new Date().toISOString(),
            version: 1,
            isReferenceArchitecture: isReferenceMode,
            viewMode: 'current',
            sections: {
              techEnvironment: emptySection,
              decisionMakers: emptySection,
              businessProcesses: emptySection,
              callTimeline: emptySection,
              compliance: emptySection
            }
          };
        }
      }
    }

    let sections: MultiSectionMap;
    
    if (result.techEnvironment || result.decisionMakers || result.businessProcesses || result.callTimeline || result.compliance) {
      sections = {
        techEnvironment: buildSection(result.techEnvironment, 'techEnvironment'),
        decisionMakers: buildSection(result.decisionMakers, 'decisionMakers'),
        businessProcesses: buildSection(result.businessProcesses, 'businessProcesses'),
        callTimeline: buildSection(result.callTimeline, 'callTimeline'),
        compliance: buildSection(result.compliance, 'compliance')
      };
    } else if (result.nodes) {
      const allNodes = (result.nodes || []).map((n: any, i: number) => buildSectionNode(n, i));
      const allEdges = result.edges || [];
      
      const techNodes = allNodes.filter((n: TechNode) => techCategories.includes(n.category));
      const dmNodes = allNodes.filter((n: TechNode) => n.category === 'decision_maker');
      const procNodes = allNodes.filter((n: TechNode) => n.category === 'process');
      const tlNodes = allNodes.filter((n: TechNode) => n.category === 'timeline');
      const compNodes = allNodes.filter((n: TechNode) => n.category === 'compliance');
      
      const makeSection = (sectionNodes: TechNode[], key: keyof MultiSectionMap): MapSection => {
        const ids = new Set<string>(sectionNodes.map(n => n.id));
        const baseEdges = buildSectionEdges(allEdges, ids);
        const edges = addAutoFlowEdges(key, sectionNodes, baseEdges);
        return {
          nodes: sectionNodes,
          edges,
          sectionEmpty: sectionNodes.length === 0
        };
      };
      
      sections = {
        techEnvironment: makeSection(techNodes, 'techEnvironment'),
        decisionMakers: makeSection(dmNodes, 'decisionMakers'),
        businessProcesses: makeSection(procNodes, 'businessProcesses'),
        callTimeline: makeSection(tlNodes, 'callTimeline'),
        compliance: makeSection(compNodes, 'compliance')
      };
    } else {
      const emptySection: MapSection = { nodes: [], edges: [], sectionEmpty: true, emptyReason: 'No data returned' };
      sections = {
        techEnvironment: emptySection,
        decisionMakers: emptySection,
        businessProcesses: emptySection,
        callTimeline: emptySection,
        compliance: emptySection
      };
    }

    const allNodes = [
      ...sections.techEnvironment.nodes,
      ...sections.decisionMakers.nodes,
      ...sections.businessProcesses.nodes,
      ...sections.callTimeline.nodes,
      ...sections.compliance.nodes
    ];
    const allEdges = [
      ...sections.techEnvironment.edges,
      ...sections.decisionMakers.edges,
      ...sections.businessProcesses.edges,
      ...sections.callTimeline.edges,
      ...sections.compliance.edges
    ];

    console.log(`✅ Map/Flow: Extracted ${allNodes.length} nodes (Tech:${sections.techEnvironment.nodes.length} DM:${sections.decisionMakers.nodes.length} Proc:${sections.businessProcesses.nodes.length} TL:${sections.callTimeline.nodes.length} Comp:${sections.compliance.nodes.length}), ${allEdges.length} edges in ${Date.now() - startTime}ms`);

    return {
      sessionId,
      nodes: allNodes,
      edges: allEdges,
      lastUpdated: new Date().toISOString(),
      version: 1,
      isReferenceArchitecture: isReferenceMode,
      viewMode: 'current',
      sections
    };

  } catch (error: any) {
    console.error("❌ Map/Flow extraction error:", error);
    console.error("❌ Map/Flow error details:", error.message, error.stack);
    const emptySection: MapSection = { nodes: [], edges: [], sectionEmpty: true, emptyReason: error.message || 'Generation error - please try again' };
    return {
      sessionId,
      nodes: [],
      edges: [],
      lastUpdated: new Date().toISOString(),
      version: 1,
      isReferenceArchitecture: !transcript || transcript.trim().length < 50,
      viewMode: 'current' as const,
      sections: {
        techEnvironment: emptySection,
        decisionMakers: emptySection,
        businessProcesses: emptySection,
        callTimeline: emptySection,
        compliance: emptySection
      }
    };
  }
}
