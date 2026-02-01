import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  ReactFlowInstance
} from 'reactflow';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Download, 
  RefreshCw, 
  Network, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Info,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

type TechEnvironmentNodeCategory = 
  | 'users_access'
  | 'endpoints'
  | 'network'
  | 'infrastructure' 
  | 'applications' 
  | 'data_flow'
  | 'security' 
  | 'operations'
  | 'cloud' 
  | 'database' 
  | 'integration' 
  | 'people' 
  | 'projects' 
  | 'pain_point' 
  | 'vendor'
  | 'decision_maker'
  | 'process'
  | 'timeline'
  | 'compliance'
  | 'follow_up';

type NodeStatusIndicator = 'assumed' | 'confirmed' | 'suggested';
type PainPointType = 'security_risk' | 'operational_inefficiency' | 'scalability_limitation' | 'cost_inefficiency';

interface TechNode {
  id: string;
  label: string;
  category: TechEnvironmentNodeCategory;
  details?: string;
  hoverText?: string;
  confidence: number;
  status: NodeStatusIndicator;
  painPointType?: PainPointType;
  whyItMatters?: string;
  recommendation?: string;
  source?: string;
  timestamp?: string;
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
  isReferenceArchitecture?: boolean;
  viewMode?: 'current' | 'ideal';
}

interface TechEnvironmentMindMapProps {
  sessionId: string;
  transcript: string;
  domainExpertise?: string;
  resetVersion?: number;
}

const categoryColors: Record<TechEnvironmentNodeCategory, { bg: string; border: string; text: string }> = {
  users_access: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  endpoints: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  network: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  infrastructure: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  applications: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  data_flow: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  security: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  operations: { bg: '#f5f3ff', border: '#a78bfa', text: '#5b21b6' },
  cloud: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  database: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  integration: { bg: '#f0fdf4', border: '#86efac', text: '#14532d' },
  people: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  projects: { bg: '#f5f3ff', border: '#a78bfa', text: '#5b21b6' },
  pain_point: { bg: '#fff1f2', border: '#fb7185', text: '#be123c' },
  vendor: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' },
  decision_maker: { bg: '#fdf4ff', border: '#d946ef', text: '#86198f' },
  process: { bg: '#ecfeff', border: '#06b6d4', text: '#0e7490' },
  timeline: { bg: '#f0fdf4', border: '#10b981', text: '#047857' },
  compliance: { bg: '#fefce8', border: '#eab308', text: '#a16207' },
  follow_up: { bg: '#f0f9ff', border: '#38bdf8', text: '#0284c7' }
};

const categoryLabels: Record<TechEnvironmentNodeCategory, string> = {
  users_access: 'Users & Access',
  endpoints: 'Endpoints',
  network: 'Network & Infra',
  infrastructure: 'Infrastructure',
  applications: 'Applications',
  data_flow: 'Data Flow',
  security: 'Security',
  operations: 'Operations',
  cloud: 'Cloud Services',
  database: 'Databases',
  integration: 'Integrations',
  people: 'Key People',
  projects: 'Projects',
  pain_point: 'Pain Points',
  vendor: 'Vendors',
  decision_maker: 'Decision Makers',
  process: 'Processes',
  timeline: 'Call Timeline',
  compliance: 'Compliance',
  follow_up: 'Follow-Up Questions'
};

const painPointColors: Record<PainPointType, { bg: string; border: string; emoji: string; label: string }> = {
  security_risk: { bg: '#fef2f2', border: '#dc2626', emoji: '🔴', label: 'Security Risk' },
  operational_inefficiency: { bg: '#fff7ed', border: '#ea580c', emoji: '🟠', label: 'Operational Issue' },
  scalability_limitation: { bg: '#fefce8', border: '#ca8a04', emoji: '🟡', label: 'Scalability Limit' },
  cost_inefficiency: { bg: '#eff6ff', border: '#2563eb', emoji: '🔵', label: 'Cost Issue' }
};

const statusIndicators: Record<NodeStatusIndicator, { emoji: string; label: string; color: string }> = {
  assumed: { emoji: '🟡', label: 'Assumed', color: '#ca8a04' },
  confirmed: { emoji: '🔵', label: 'Confirmed', color: '#2563eb' },
  suggested: { emoji: '💡', label: 'Suggested', color: '#06b6d4' }
};

const nodeWidth = 200;
const nodeHeight = 70;

const sectionOrder: TechEnvironmentNodeCategory[][] = [
  ['users_access', 'endpoints', 'network', 'infrastructure', 'applications', 'data_flow', 'security', 'operations', 'cloud', 'database', 'integration', 'vendor', 'projects', 'people', 'pain_point'],
  ['decision_maker'],
  ['process'],
  ['timeline'],
  ['compliance'],
  ['follow_up']
];

const sectionTitles: Record<number, string> = {
  0: 'Tech Environment',
  1: 'Decision Makers & Hierarchy',
  2: 'Business Processes',
  3: 'Call Timeline',
  4: 'Compliance Requirements',
  5: 'Follow-Up Questions'
};

function getLayoutedElements(
  nodes: Node[], 
  edges: Edge[], 
  direction: 'TB' | 'LR' = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes: [], edges };
  
  const allLayoutedNodes: Node[] = [];
  let currentYOffset = 0;
  const sectionGap = 120;
  const sectionHeaderHeight = 50;
  
  sectionOrder.forEach((sectionCategories, sectionIndex) => {
    const sectionNodes = nodes.filter(node => 
      sectionCategories.includes(node.data.category as TechEnvironmentNodeCategory)
    );
    
    if (sectionNodes.length === 0) return;
    
    const sectionEdges = edges.filter(edge => 
      sectionNodes.some(n => n.id === edge.source) && 
      sectionNodes.some(n => n.id === edge.target)
    );
    
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const isHierarchySection = sectionIndex === 1;
    const isSequenceSection = sectionIndex === 2 || sectionIndex === 3;
    const sectionDirection = isHierarchySection ? 'TB' : (isSequenceSection ? 'LR' : direction);
    
    dagreGraph.setGraph({ rankdir: sectionDirection, ranksep: 80, nodesep: 50 });

    sectionNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    sectionEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    let minY = Infinity;
    let maxY = -Infinity;
    
    const layoutedSectionNodes = sectionNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const y = nodeWithPosition.y - nodeHeight / 2 + currentYOffset + sectionHeaderHeight;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + nodeHeight);
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: y,
        },
      };
    });

    const sectionTitle = sectionTitles[sectionIndex] || `Section ${sectionIndex + 1}`;
    const sectionHeaderNode: Node = {
      id: `section_header_${sectionIndex}`,
      type: 'default',
      data: { 
        label: sectionTitle,
        isHeader: true
      },
      position: { x: -50, y: currentYOffset },
      style: {
        background: 'transparent',
        border: 'none',
        fontSize: '14px',
        fontWeight: 700,
        color: '#6b7280',
        width: 'auto',
        padding: '4px 12px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
      },
      draggable: false,
      selectable: false
    };
    
    allLayoutedNodes.push(sectionHeaderNode);
    allLayoutedNodes.push(...layoutedSectionNodes);
    
    const sectionHeight = maxY - minY + nodeHeight;
    currentYOffset = maxY + sectionGap;
  });

  return { nodes: allLayoutedNodes, edges };
}

function convertToReactFlowNodes(techNodes: TechNode[]): Node[] {
  return techNodes.map((node) => {
    const isPainPoint = node.category === 'pain_point';
    const painPointStyle = isPainPoint && node.painPointType ? painPointColors[node.painPointType] : null;
    const colors = painPointStyle || categoryColors[node.category] || categoryColors.applications;
    const statusInfo = statusIndicators[node.status || 'assumed'];
    
    return {
      id: node.id,
      type: 'default',
      data: { 
        label: (
          <div className="flex flex-col items-center gap-1 w-full">
            <div className="flex items-center gap-1 text-xs opacity-70">
              <span>{statusInfo.emoji}</span>
              {isPainPoint && painPointStyle && <span>{painPointStyle.emoji}</span>}
            </div>
            <span className="font-medium text-center leading-tight">{node.label}</span>
          </div>
        ),
        category: node.category,
        details: node.details,
        hoverText: node.hoverText,
        confidence: node.confidence,
        status: node.status,
        painPointType: node.painPointType,
        whyItMatters: node.whyItMatters,
        recommendation: node.recommendation
      },
      position: { x: 0, y: 0 },
      style: {
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '10px',
        padding: '8px 12px',
        fontSize: '11px',
        fontWeight: 500,
        color: (painPointStyle || colors as any).text || colors.border,
        width: nodeWidth,
        textAlign: 'center' as const,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };
  });
}

function convertToReactFlowEdges(techEdges: TechEdge[]): Edge[] {
  const getEdgeStyle = (edgeType?: string) => {
    switch (edgeType) {
      case 'data_flow':
        return { stroke: '#ec4899', strokeDasharray: '5,5' };
      case 'reports_to':
        return { stroke: '#d946ef', strokeWidth: 2 };
      case 'sequence':
        return { stroke: '#10b981', strokeWidth: 2 };
      case 'integration':
        return { stroke: '#6366f1', strokeDasharray: '3,3' };
      case 'dependency':
        return { stroke: '#f59e0b' };
      default:
        return { stroke: '#94a3b8' };
    }
  };
  
  return techEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    animated: edge.type === 'integration' || edge.type === 'data_flow' || edge.type === 'sequence',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15
    },
    style: {
      strokeWidth: 2,
      ...getEdgeStyle(edge.type)
    },
    labelStyle: {
      fontSize: '10px',
      fontWeight: 500
    }
  }));
}

export function TechEnvironmentMindMap({ 
  sessionId, 
  transcript, 
  domainExpertise,
  resetVersion 
}: TechEnvironmentMindMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TechNode | null>(null);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mindMapData, isFetching } = useQuery<TechEnvironmentSnapshot | null>({
    queryKey: ['/api/conversations', sessionId, 'mind-map'],
    enabled: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/conversations/${sessionId}/mind-map`, {
        sessionId,
        transcript,
        domainExpertise
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.setQueryData(['/api/conversations', sessionId, 'mind-map'], data.data);
        
        // Directly update nodes and edges to ensure immediate rendering
        const techNodes = data.data.nodes || [];
        const techEdges = data.data.edges || [];
        if (techNodes.length > 0) {
          const flowNodes = convertToReactFlowNodes(techNodes);
          const flowEdges = convertToReactFlowEdges(techEdges);
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        }
        
        const msg = data.data.isReferenceArchitecture 
          ? `Generated reference architecture with ${data.data.nodes?.length || 0} elements`
          : `Extracted ${data.data.nodes?.length || 0} technology elements`;
        toast({
          title: "Map/Flow Generated",
          description: msg
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate map",
        variant: "destructive"
      });
    }
  });

  const rawNodes = useMemo(() => mindMapData?.nodes || [], [mindMapData]);

  useEffect(() => {
    if (rawNodes.length > 0) {
      const flowNodes = convertToReactFlowNodes(rawNodes);
      const flowEdges = convertToReactFlowEdges(mindMapData?.edges || []);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [rawNodes, mindMapData?.edges, setNodes, setEdges]);

  useEffect(() => {
    if (resetVersion !== undefined && resetVersion > 0) {
      setNodes([]);
      setEdges([]);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', sessionId, 'mind-map'] });
    }
  }, [resetVersion, sessionId, queryClient, setNodes, setEdges]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    setTimeout(() => instance.fitView({ padding: 0.2 }), 100);
  }, []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const techNode = rawNodes.find(n => n.id === node.id);
    if (techNode) {
      setSelectedNode(techNode);
    }
  }, [rawNodes]);

  const handleDownload = useCallback(async () => {
    if (!reactFlowRef.current) return;
    
    try {
      const dataUrl = await toPng(reactFlowRef.current, {
        backgroundColor: '#f8fafc',
        quality: 1.0,
        pixelRatio: 2
      });
      
      const link = document.createElement('a');
      link.download = `map-flow-${sessionId}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Downloaded",
        description: "Map/Flow saved as PNG"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not export map",
        variant: "destructive"
      });
    }
  }, [sessionId, toast]);

  const handleGenerate = useCallback(() => {
    generateMutation.mutate();
  }, [generateMutation]);

  const isGenerating = generateMutation.isPending;
  const hasNodes = nodes.length > 0;
  const categoriesPresent = Array.from(new Set(rawNodes.map(n => n.category)));
  const painPointCount = rawNodes.filter(n => n.category === 'pain_point').length;
  const confirmedCount = rawNodes.filter(n => n.status === 'confirmed').length;
  const assumedCount = rawNodes.filter(n => n.status === 'assumed').length;
  const suggestedCount = rawNodes.filter(n => n.status === 'suggested').length;
  const decisionMakerCount = rawNodes.filter(n => n.category === 'decision_maker').length;
  const processCount = rawNodes.filter(n => n.category === 'process').length;
  const timelineCount = rawNodes.filter(n => n.category === 'timeline').length;
  const complianceCount = rawNodes.filter(n => n.category === 'compliance').length;
  const followUpCount = rawNodes.filter(n => n.category === 'follow_up').length;

  return (
    <TooltipProvider>
      <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-500" />
                Map/Flow
              </CardTitle>
              {mindMapData?.isReferenceArchitecture && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                  Reference Architecture
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {hasNodes ? 'Regenerate' : 'Generate'}
              </Button>
              {hasNodes && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download as PNG</TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {hasNodes && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {categoriesPresent.map((cat) => {
                  const colors = categoryColors[cat as TechEnvironmentNodeCategory];
                  return (
                    <Badge
                      key={cat}
                      variant="outline"
                      className="text-xs"
                      style={{ 
                        backgroundColor: colors?.bg,
                        borderColor: colors?.border,
                        color: colors?.text
                      }}
                    >
                      {categoryLabels[cat as TechEnvironmentNodeCategory]}
                    </Badge>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  🔵 {confirmedCount} Confirmed
                </span>
                <span className="flex items-center gap-1">
                  🟡 {assumedCount} Assumed
                </span>
                {suggestedCount > 0 && (
                  <span className="flex items-center gap-1 text-cyan-600">
                    💡 {suggestedCount} Suggested
                  </span>
                )}
                {painPointCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" /> {painPointCount} Pain Points
                  </span>
                )}
                {decisionMakerCount > 0 && (
                  <span className="flex items-center gap-1 text-fuchsia-600">
                    👤 {decisionMakerCount} Decision Makers
                  </span>
                )}
                {followUpCount > 0 && (
                  <span className="flex items-center gap-1 text-sky-600">
                    ❓ {followUpCount} Follow-Ups
                  </span>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="flex gap-4">
              <div 
                ref={reactFlowRef}
                className={`flex-1 rounded-lg border bg-slate-50 dark:bg-slate-900 ${
                  isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[450px]'
                }`}
              >
                {(isFetching || isGenerating) && !hasNodes ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3 text-purple-500" />
                      <p className="text-base font-medium text-foreground mb-1">
                        {isGenerating ? 'Analyzing Environment' : 'Loading Map'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isGenerating ? 'Creating your visual map...' : 'Please wait...'}
                      </p>
                    </div>
                  </div>
                ) : hasNodes ? (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onInit={onInit}
                    onNodeClick={onNodeClick}
                    fitView
                    proOptions={{ hideAttribution: true }}
                  >
                    <Controls />
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                  </ReactFlow>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-8 max-w-md mx-auto">
                      <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-10 border border-dashed border-purple-300 dark:border-purple-700">
                        <Network className="h-16 w-16 mx-auto mb-4 text-purple-500 dark:text-purple-400" />
                        <h3 className="text-lg font-semibold mb-2 text-foreground">No Map/Flow Generated</h3>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          Click "Generate" to create a visual map of the customer's 
                          technology environment, workflows, and pain points.
                        </p>
                        {!transcript || transcript.length < 50 ? (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                              💡 A reference architecture will be generated based on your domain expertise.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedNode && (
                <div className="w-72 bg-white dark:bg-slate-800 rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{selectedNode.label}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => setSelectedNode(null)}
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: categoryColors[selectedNode.category]?.bg,
                        borderColor: categoryColors[selectedNode.category]?.border
                      }}
                    >
                      {categoryLabels[selectedNode.category]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {statusIndicators[selectedNode.status]?.emoji} {statusIndicators[selectedNode.status]?.label}
                    </Badge>
                  </div>

                  {selectedNode.hoverText && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                      <p className="text-xs flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 text-blue-500" />
                        {selectedNode.hoverText}
                      </p>
                    </div>
                  )}

                  {selectedNode.details && (
                    <p className="text-xs text-muted-foreground">{selectedNode.details}</p>
                  )}

                  {selectedNode.painPointType && (
                    <div className="space-y-2">
                      <Badge 
                        className="text-xs"
                        style={{ 
                          backgroundColor: painPointColors[selectedNode.painPointType]?.bg,
                          borderColor: painPointColors[selectedNode.painPointType]?.border,
                          color: '#991b1b'
                        }}
                      >
                        {painPointColors[selectedNode.painPointType]?.emoji} {painPointColors[selectedNode.painPointType]?.label}
                      </Badge>
                      {selectedNode.whyItMatters && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                          <p className="text-xs font-medium text-amber-800">Why it matters:</p>
                          <p className="text-xs text-amber-700">{selectedNode.whyItMatters}</p>
                        </div>
                      )}
                      {selectedNode.recommendation && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                          <p className="text-xs font-medium text-green-800">Recommendation:</p>
                          <p className="text-xs text-green-700">{selectedNode.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedNode.source && (
                    <div className="border-t pt-2">
                      <p className="text-xs text-muted-foreground italic">
                        "{selectedNode.source}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
}

export default TechEnvironmentMindMap;
