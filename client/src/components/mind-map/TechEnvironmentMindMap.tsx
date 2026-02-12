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
  Download, RefreshCw, Network, Loader2, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight,
  Maximize2, Minimize2, AlertTriangle, Info,
  Server, Shield, Cloud, Database, Users, Monitor, Wifi, AppWindow,
  Settings, Plug, Building2, User, UserCheck, GitBranch, Clock, Scale,
  FolderKanban, ArrowLeftRight, MessageCircleQuestion, Lock, Eye, Zap,
  Globe, HardDrive, Cpu, FileCheck, BadgeCheck, Landmark, Gavel,
  ShieldCheck, Workflow, Timer, Flag, Target, TrendingUp, CheckCircle,
  XCircle, CircleDot, type LucideIcon
} from 'lucide-react';

type MapNodeCategory = 
  | 'users_access' | 'endpoints' | 'network' | 'infrastructure' 
  | 'applications' | 'data_flow' | 'security' | 'operations'
  | 'cloud' | 'database' | 'integration' | 'people' 
  | 'projects' | 'pain_point' | 'vendor'
  | 'decision_maker' | 'process' | 'timeline' | 'compliance' | 'follow_up';

type NodeStatusIndicator = 'assumed' | 'confirmed' | 'suggested' | 'preemptive';
type PainPointType = 'security_risk' | 'operational_inefficiency' | 'scalability_limitation' | 'cost_inefficiency';

interface TechNode {
  id: string;
  label: string;
  category: MapNodeCategory;
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
  sectionEmpty?: boolean;
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
  isReferenceArchitecture?: boolean;
  viewMode?: 'current' | 'ideal';
  sections?: MultiSectionMap;
}

interface TechEnvironmentMindMapProps {
  sessionId: string;
  transcript: string;
  domainExpertise?: string;
  resetVersion?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Server, Shield, Cloud, Database, Users, Monitor, Wifi, AppWindow,
  Settings, Plug, Building2, User, UserCheck, GitBranch, Clock, Scale,
  FolderKanban, ArrowLeftRight, MessageCircleQuestion, Lock, Eye, Zap,
  Globe, HardDrive, Cpu, FileCheck, BadgeCheck, Landmark, Gavel,
  ShieldCheck, Workflow, Timer, Flag, Target, TrendingUp, CheckCircle,
  XCircle, CircleDot, Network, AlertTriangle, Download, Info
};

const categoryDefaultIcon: Record<string, string> = {
  users_access: 'Users',
  endpoints: 'Monitor',
  network: 'Wifi',
  infrastructure: 'Server',
  applications: 'AppWindow',
  data_flow: 'ArrowLeftRight',
  security: 'Shield',
  operations: 'Settings',
  cloud: 'Cloud',
  database: 'Database',
  integration: 'Plug',
  people: 'User',
  projects: 'FolderKanban',
  pain_point: 'AlertTriangle',
  vendor: 'Building2',
  decision_maker: 'UserCheck',
  process: 'GitBranch',
  timeline: 'Clock',
  compliance: 'Scale',
  follow_up: 'MessageCircleQuestion'
};

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
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

const categoryLabels: Record<string, string> = {
  users_access: 'Users & Access', endpoints: 'Endpoints', network: 'Network',
  infrastructure: 'Infrastructure', applications: 'Applications', data_flow: 'Data Flow',
  security: 'Security', operations: 'Operations', cloud: 'Cloud', database: 'Databases',
  integration: 'Integrations', people: 'People', projects: 'Projects',
  pain_point: 'Pain Points', vendor: 'Vendors', decision_maker: 'Decision Maker',
  process: 'Process', timeline: 'Timeline', compliance: 'Compliance', follow_up: 'Follow-Up'
};

const painPointColors: Record<PainPointType, { bg: string; border: string; label: string }> = {
  security_risk: { bg: '#fef2f2', border: '#dc2626', label: 'Security Risk' },
  operational_inefficiency: { bg: '#fff7ed', border: '#ea580c', label: 'Operational Issue' },
  scalability_limitation: { bg: '#fefce8', border: '#ca8a04', label: 'Scalability Limit' },
  cost_inefficiency: { bg: '#eff6ff', border: '#2563eb', label: 'Cost Issue' }
};

type SectionKey = 'tech_environment' | 'decision_makers' | 'business_processes' | 'call_timeline' | 'compliance';

const sectionMeta: Record<SectionKey, {
  title: string;
  icon: LucideIcon;
  description: string;
  color: string;
  emptyMessage: string;
  direction: 'TB' | 'LR';
}> = {
  tech_environment: {
    title: 'Tech Environment',
    icon: Network,
    description: 'Systems, tools, infrastructure & integrations',
    color: '#3b82f6',
    emptyMessage: 'No technology components identified yet',
    direction: 'LR'
  },
  decision_makers: {
    title: 'Decision Makers',
    icon: UserCheck,
    description: 'Key people, roles & organizational hierarchy',
    color: '#d946ef',
    emptyMessage: 'No decision makers identified yet',
    direction: 'TB'
  },
  business_processes: {
    title: 'Business Processes',
    icon: GitBranch,
    description: 'Workflows, approvals & procedures',
    color: '#06b6d4',
    emptyMessage: 'No business processes identified yet',
    direction: 'LR'
  },
  call_timeline: {
    title: 'Call Timeline',
    icon: Clock,
    description: 'Key moments, topic shifts & commitments',
    color: '#10b981',
    emptyMessage: 'No timeline events captured yet',
    direction: 'LR'
  },
  compliance: {
    title: 'Compliance & Regulatory',
    icon: Scale,
    description: 'Certifications, standards & regulations',
    color: '#eab308',
    emptyMessage: 'No compliance requirements identified yet',
    direction: 'LR'
  }
};

const nodeWidth = 210;
const nodeHeight = 72;

function getNodeIcon(node: TechNode): LucideIcon {
  if (node.iconName && iconMap[node.iconName]) {
    return iconMap[node.iconName];
  }
  return iconMap[categoryDefaultIcon[node.category] || 'CircleDot'] || CircleDot;
}

function getLayoutedElements(
  nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes: [], edges };
  
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    if (nodes.some(n => n.id === edge.source) && nodes.some(n => n.id === edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function convertToReactFlowNodes(techNodes: TechNode[]): Node[] {
  return techNodes.map((node) => {
    const isPainPoint = node.category === 'pain_point';
    const isPreemptive = node.status === 'preemptive';
    const hasProblem = node.problemDetected === true;
    const painPointStyle = isPainPoint && node.painPointType ? painPointColors[node.painPointType] : null;
    const NodeIcon = getNodeIcon(node);
    
    let colors = categoryColors[node.category] || categoryColors.applications;
    if (isPreemptive) {
      colors = { bg: '#f5f3ff', border: '#7c3aed', text: '#5b21b6' };
    } else if (painPointStyle) {
      colors = { ...colors, bg: painPointStyle.bg, border: painPointStyle.border };
    }
    
    const borderStyle = isPreemptive 
      ? '2px dashed #7c3aed' 
      : hasProblem ? '3px solid #dc2626' 
      : `2px solid ${colors.border}`;
    
    const boxShadowStyle = hasProblem 
      ? '0 0 8px rgba(220,38,38,0.2), 0 2px 4px rgba(0,0,0,0.1)' 
      : isPreemptive ? '0 2px 8px rgba(124,58,237,0.15)' 
      : '0 2px 4px rgba(0,0,0,0.08)';

    return {
      id: node.id,
      type: 'default',
      data: {
        label: (
          <div className="flex items-center gap-2 w-full px-1">
            <div 
              className="flex-shrink-0 rounded-md p-1.5 flex items-center justify-center"
              style={{ backgroundColor: `${colors.border}15`, color: colors.border }}
            >
              <NodeIcon size={14} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
              <span className="font-semibold text-[11px] leading-tight truncate w-full text-left">{node.label}</span>
              {hasProblem && node.problemSummary && (
                <span className="text-[9px] text-red-600 leading-tight truncate w-full flex items-center gap-0.5">
                  <AlertTriangle size={8} /> {node.problemSummary.length > 28 ? node.problemSummary.slice(0, 28) + '...' : node.problemSummary}
                </span>
              )}
              {isPreemptive && !hasProblem && (
                <span className="text-[9px] text-purple-600 leading-tight flex items-center gap-0.5">
                  <Eye size={8} /> Not discussed
                </span>
              )}
              {!isPreemptive && !hasProblem && node.details && (
                <span className="text-[9px] opacity-60 leading-tight truncate w-full text-left">
                  {node.details.length > 32 ? node.details.slice(0, 32) + '...' : node.details}
                </span>
              )}
            </div>
            {(hasProblem || isPreemptive || node.status === 'confirmed') && (
              <div className="flex-shrink-0">
                {hasProblem && <AlertTriangle size={12} className="text-red-500" />}
                {isPreemptive && !hasProblem && <Eye size={12} className="text-purple-500" />}
                {node.status === 'confirmed' && !hasProblem && !isPreemptive && <CheckCircle size={12} className="text-blue-500" />}
              </div>
            )}
          </div>
        ),
        category: node.category,
        details: node.details,
        hoverText: node.hoverText,
        confidence: node.confidence,
        status: node.status,
        painPointType: node.painPointType,
        whyItMatters: node.whyItMatters,
        recommendation: node.recommendation,
        problemDetected: node.problemDetected,
        problemSummary: node.problemSummary,
        problemImpact: node.problemImpact,
        recommendedSolution: node.recommendedSolution,
        solutionSource: node.solutionSource,
        sellerPositioning: node.sellerPositioning,
        preemptiveReason: node.preemptiveReason,
        discoveryQuestion: node.discoveryQuestion
      },
      position: { x: 0, y: 0 },
      style: {
        background: colors.bg,
        border: borderStyle,
        borderRadius: '12px',
        padding: '8px 10px',
        fontSize: '11px',
        fontWeight: 500,
        color: colors.text || colors.border,
        width: nodeWidth,
        boxShadow: boxShadowStyle,
        cursor: 'pointer'
      }
    };
  });
}

function convertToReactFlowEdges(techEdges: TechEdge[]): Edge[] {
  const getEdgeStyle = (edgeType?: string) => {
    switch (edgeType) {
      case 'data_flow': return { stroke: '#ec4899', strokeDasharray: '5,5' };
      case 'reports_to': return { stroke: '#d946ef', strokeWidth: 2 };
      case 'sequence': return { stroke: '#10b981', strokeWidth: 2 };
      case 'integration': return { stroke: '#6366f1', strokeDasharray: '3,3' };
      case 'dependency': return { stroke: '#f59e0b' };
      case 'preemptive_link': return { stroke: '#7c3aed', strokeDasharray: '8,4', strokeWidth: 2 };
      case 'replacement': return { stroke: '#ef4444', strokeDasharray: '4,4' };
      default: return { stroke: '#94a3b8' };
    }
  };
  
  return techEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    animated: edge.type === 'integration' || edge.type === 'data_flow' || edge.type === 'sequence' || edge.type === 'preemptive_link',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: getEdgeStyle(edge.type).stroke
    },
    style: { strokeWidth: 2, ...getEdgeStyle(edge.type) },
    labelStyle: { fontSize: '9px', fontWeight: 600, fill: getEdgeStyle(edge.type).stroke },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4
  }));
}

function SectionMap({ 
  sectionKey, 
  section,
  onNodeSelect,
  isFullscreen
}: { 
  sectionKey: SectionKey; 
  section: MapSection;
  onNodeSelect: (node: TechNode | null) => void;
  isFullscreen: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const meta = sectionMeta[sectionKey];
  const SectionIcon = meta.icon;

  const techNodes = section.nodes || [];
  const techEdges = section.edges || [];
  const hasNodes = techNodes.length > 0;

  useEffect(() => {
    if (hasNodes) {
      const flowNodes = convertToReactFlowNodes(techNodes);
      const flowEdges = convertToReactFlowEdges(techEdges);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges, meta.direction);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [techNodes, techEdges, meta.direction, setNodes, setEdges, hasNodes]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setTimeout(() => instance.fitView({ padding: 0.15 }), 100);
  }, []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const found = techNodes.find(n => n.id === node.id);
    if (found) onNodeSelect(found);
  }, [techNodes, onNodeSelect]);

  const mapHeight = isFullscreen ? 'h-[calc(100vh-280px)]' : 'h-[420px]';

  return (
    <div className={`w-full ${mapHeight} rounded-lg overflow-hidden bg-white dark:bg-slate-900 border`}>
      {hasNodes ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          onNodeClick={onNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Controls showInteractive={false} position="bottom-right" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        </ReactFlow>
      ) : (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <SectionIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{meta.emptyMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function NodeDetailPanel({ node, onClose }: { node: TechNode; onClose: () => void }) {
  const NodeIcon = getNodeIcon(node);
  const colors = categoryColors[node.category] || categoryColors.applications;
  
  return (
    <div className="w-80 bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-4 space-y-3 overflow-y-auto max-h-[600px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="rounded-lg p-2 flex items-center justify-center"
            style={{ backgroundColor: `${colors.border}15`, color: colors.border }}
          >
            <NodeIcon size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{node.label}</h4>
            <p className="text-[10px] text-muted-foreground">{categoryLabels[node.category]}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>×</Button>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[10px]"
          style={node.status === 'preemptive' ? { backgroundColor: '#f5f3ff', borderColor: '#7c3aed', color: '#5b21b6' } :
                 node.status === 'confirmed' ? { backgroundColor: '#dbeafe', borderColor: '#3b82f6', color: '#1e40af' } :
                 node.status === 'assumed' ? { backgroundColor: '#fefce8', borderColor: '#ca8a04', color: '#854d0e' } :
                 { backgroundColor: '#ecfeff', borderColor: '#06b6d4', color: '#0e7490' }}
        >
          {node.status === 'confirmed' && <CheckCircle size={9} className="mr-0.5" />}
          {node.status === 'preemptive' && <Eye size={9} className="mr-0.5" />}
          {node.status === 'assumed' && <CircleDot size={9} className="mr-0.5" />}
          {node.status === 'suggested' && <Zap size={9} className="mr-0.5" />}
          {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
        </Badge>
        {node.problemDetected && (
          <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300">
            <AlertTriangle size={9} className="mr-0.5" /> Problem
          </Badge>
        )}
        {node.confidence !== undefined && (
          <Badge variant="outline" className="text-[10px]">{node.confidence}% confidence</Badge>
        )}
      </div>

      {node.hoverText && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
          <p className="text-xs flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
            {node.hoverText}
          </p>
        </div>
      )}

      {node.details && !node.hoverText && (
        <p className="text-xs text-muted-foreground">{node.details}</p>
      )}

      {node.status === 'preemptive' && (
        <div className="space-y-2">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 border border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1"><Eye size={11} /> Why This Likely Exists</p>
            <p className="text-xs text-purple-700">{node.preemptiveReason || 'Based on the context discussed, this component is typically present but was not mentioned.'}</p>
          </div>
          {node.discoveryQuestion && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2.5 border border-violet-200">
              <p className="text-xs font-semibold text-violet-800 mb-1 flex items-center gap-1"><MessageCircleQuestion size={11} /> Ask the Customer</p>
              <p className="text-xs text-violet-700 italic">"{node.discoveryQuestion}"</p>
            </div>
          )}
        </div>
      )}

      {node.problemDetected && (
        <div className="space-y-2">
          {node.problemSummary && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1"><AlertTriangle size={11} /> Problem</p>
              <p className="text-xs text-red-700">{node.problemSummary}</p>
            </div>
          )}
          {node.problemImpact && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1"><TrendingUp size={11} /> Business Impact</p>
              <p className="text-xs text-amber-700">{node.problemImpact}</p>
            </div>
          )}
          {node.recommendedSolution && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5 border border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1"><CheckCircle size={11} /> Recommended Solution</p>
              <p className="text-xs text-green-700">{node.recommendedSolution}</p>
              {node.solutionSource && (
                <p className="text-[10px] text-green-500 mt-1 italic">Source: {node.solutionSource}</p>
              )}
            </div>
          )}
          {node.sellerPositioning && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2.5 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-800 mb-1 flex items-center gap-1"><Target size={11} /> Seller Positioning</p>
              <p className="text-xs text-indigo-700">{node.sellerPositioning}</p>
            </div>
          )}
        </div>
      )}

      {node.painPointType && (
        <div className="space-y-2">
          <Badge className="text-xs" style={{ backgroundColor: painPointColors[node.painPointType]?.bg, borderColor: painPointColors[node.painPointType]?.border, color: '#991b1b' }}>
            <AlertTriangle size={10} className="mr-1" /> {painPointColors[node.painPointType]?.label}
          </Badge>
          {node.whyItMatters && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5">
              <p className="text-xs font-medium text-amber-800">Why it matters:</p>
              <p className="text-xs text-amber-700">{node.whyItMatters}</p>
            </div>
          )}
          {node.recommendation && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5">
              <p className="text-xs font-medium text-green-800">Recommendation:</p>
              <p className="text-xs text-green-700">{node.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {node.source && (
        <div className="border-t pt-2">
          <p className="text-[10px] text-muted-foreground italic">"{node.source}"</p>
        </div>
      )}
    </div>
  );
}

function downloadAllMapsAsImage(
  sectionEntries: [SectionKey, MapSection][],
  sessionId: string
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const padding = 40;
      const sectionGap = 24;
      const headerHeight = 44;
      const canvasWidth = 1400;
      const legendHeight = 50;
      const titleHeight = 60;
      
      const sectionsWithData = sectionEntries
        .map(([key, section]) => {
          const meta = sectionMeta[key];
          const techNodes = section.nodes || [];
          const techEdges = section.edges || [];
          if (techNodes.length === 0) return null;
          const flowNodes = convertToReactFlowNodes(techNodes);
          const flowEdges = convertToReactFlowEdges(techEdges);
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges, meta.direction);
          
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          layoutedNodes.forEach(n => {
            minX = Math.min(minX, n.position.x);
            minY = Math.min(minY, n.position.y);
            maxX = Math.max(maxX, n.position.x + nodeWidth);
            maxY = Math.max(maxY, n.position.y + nodeHeight);
          });
          const graphWidth = maxX - minX;
          const graphHeight = maxY - minY;
          return { key, meta, techNodes, layoutedNodes, layoutedEdges, minX, minY, graphWidth, graphHeight };
        })
        .filter(Boolean) as Array<{
          key: SectionKey; meta: typeof sectionMeta[SectionKey]; techNodes: TechNode[];
          layoutedNodes: Node[]; layoutedEdges: Edge[]; minX: number; minY: number;
          graphWidth: number; graphHeight: number;
        }>;

      if (sectionsWithData.length === 0) { resolve(false); return; }

      const mapAreaWidth = canvasWidth - padding * 2;
      const sectionHeights = sectionsWithData.map(s => {
        const scale = Math.min(1, (mapAreaWidth - 40) / Math.max(s.graphWidth, 1));
        return headerHeight + Math.max(s.graphHeight * scale + 40, 120);
      });
      const totalHeight = titleHeight + padding * 2 + sectionHeights.reduce((a, b) => a + b, 0) + sectionGap * (sectionsWithData.length - 1) + legendHeight;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth * 2;
      canvas.height = totalHeight * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvasWidth, totalHeight);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Visual Maps - Complete Overview', canvasWidth / 2, padding + 24);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText('Generated from conversation analysis', canvasWidth / 2, padding + 42);
      ctx.textAlign = 'left';

      let yOffset = padding + titleHeight;
      
      sectionsWithData.forEach((section, sIdx) => {
        const sHeight = sectionHeights[sIdx];
        const scale = Math.min(1, (mapAreaWidth - 40) / Math.max(section.graphWidth, 1));
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const rx = 10;
        const sx = padding, sy = yOffset, sw = mapAreaWidth, sh = sHeight;
        ctx.beginPath();
        ctx.moveTo(sx + rx, sy);
        ctx.lineTo(sx + sw - rx, sy);
        ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + rx);
        ctx.lineTo(sx + sw, sy + sh - rx);
        ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - rx, sy + sh);
        ctx.lineTo(sx + rx, sy + sh);
        ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - rx);
        ctx.lineTo(sx, sy + rx);
        ctx.quadraticCurveTo(sx, sy, sx + rx, sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = section.meta.color;
        ctx.beginPath();
        ctx.arc(sx + 20, sy + headerHeight / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(section.meta.title, sx + 32, sy + headerHeight / 2 + 4);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText(`(${section.techNodes.length} elements)`, sx + 32 + ctx.measureText(section.meta.title).width + 8, sy + headerHeight / 2 + 4);

        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(sx, sy + headerHeight);
        ctx.lineTo(sx + sw, sy + headerHeight);
        ctx.stroke();

        const graphOffsetX = sx + 20 + Math.max(0, ((mapAreaWidth - 40) - section.graphWidth * scale) / 2);
        const graphOffsetY = sy + headerHeight + 20;

        section.layoutedEdges.forEach(edge => {
          const sourceNode = section.layoutedNodes.find(n => n.id === edge.source);
          const targetNode = section.layoutedNodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return;
          
          const sx2 = graphOffsetX + (sourceNode.position.x - section.minX + nodeWidth / 2) * scale;
          const sy2 = graphOffsetY + (sourceNode.position.y - section.minY + nodeHeight / 2) * scale;
          const tx2 = graphOffsetX + (targetNode.position.x - section.minX + nodeWidth / 2) * scale;
          const ty2 = graphOffsetY + (targetNode.position.y - section.minY + nodeHeight / 2) * scale;
          
          const edgeStyle = edge.style as any || {};
          ctx.strokeStyle = edgeStyle.stroke || '#94a3b8';
          ctx.lineWidth = 1.5;
          
          if (edgeStyle.strokeDasharray) {
            ctx.setLineDash([4, 3]);
          } else {
            ctx.setLineDash([]);
          }
          
          ctx.beginPath();
          ctx.moveTo(sx2, sy2);
          const midX = (sx2 + tx2) / 2;
          const midY = (sy2 + ty2) / 2;
          ctx.quadraticCurveTo(midX + (ty2 - sy2) * 0.1, midY - (tx2 - sx2) * 0.1, tx2, ty2);
          ctx.stroke();
          ctx.setLineDash([]);

          const angle = Math.atan2(ty2 - sy2, tx2 - sx2);
          const arrowLen = 8;
          ctx.fillStyle = edgeStyle.stroke || '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(tx2, ty2);
          ctx.lineTo(tx2 - arrowLen * Math.cos(angle - Math.PI / 6), ty2 - arrowLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(tx2 - arrowLen * Math.cos(angle + Math.PI / 6), ty2 - arrowLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          if (edge.label) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px system-ui, -apple-system, sans-serif';
            const labelW = ctx.measureText(String(edge.label)).width + 6;
            ctx.fillRect(midX - labelW / 2, midY - 7, labelW, 14);
            ctx.fillStyle = edgeStyle.stroke || '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText(String(edge.label), midX, midY + 3);
            ctx.textAlign = 'left';
          }
        });

        section.layoutedNodes.forEach(node => {
          const nx = graphOffsetX + (node.position.x - section.minX) * scale;
          const ny = graphOffsetY + (node.position.y - section.minY) * scale;
          const nw = nodeWidth * scale;
          const nh = nodeHeight * scale;
          const nodeStyle = node.style as any || {};
          
          ctx.fillStyle = nodeStyle.background || '#ffffff';
          const borderColor = nodeStyle.border?.match(/#[0-9a-fA-F]+/)?.[0] || '#94a3b8';
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = node.data?.problemDetected ? 2.5 : 1.5;
          
          if (node.data?.status === 'preemptive') {
            ctx.setLineDash([5, 3]);
          } else {
            ctx.setLineDash([]);
          }
          
          const nr = 8;
          ctx.beginPath();
          ctx.moveTo(nx + nr, ny);
          ctx.lineTo(nx + nw - nr, ny);
          ctx.quadraticCurveTo(nx + nw, ny, nx + nw, ny + nr);
          ctx.lineTo(nx + nw, ny + nh - nr);
          ctx.quadraticCurveTo(nx + nw, ny + nh, nx + nw - nr, ny + nh);
          ctx.lineTo(nx + nr, ny + nh);
          ctx.quadraticCurveTo(nx, ny + nh, nx, ny + nh - nr);
          ctx.lineTo(nx, ny + nr);
          ctx.quadraticCurveTo(nx, ny, nx + nr, ny);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);

          const techNode = section.techNodes.find(t => t.id === node.id);
          if (techNode) {
            ctx.fillStyle = nodeStyle.color || '#1e293b';
            ctx.font = `600 ${Math.max(9, 11 * scale)}px system-ui, -apple-system, sans-serif`;
            const label = techNode.label.length > 22 ? techNode.label.slice(0, 22) + '...' : techNode.label;
            ctx.fillText(label, nx + 8, ny + nh / 2 + 3);
          }
        });

        yOffset += sHeight + sectionGap;
      });

      const legendY = yOffset + 4;
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(padding, legendY);
      ctx.lineTo(canvasWidth - padding, legendY);
      ctx.stroke();

      const legendItems = [
        { label: 'Confirmed', border: '#3b82f6', bg: '#dbeafe', dashed: false, thick: false },
        { label: 'Assumed', border: '#ca8a04', bg: '#fefce8', dashed: false, thick: false },
        { label: 'Pre-emptive', border: '#7c3aed', bg: '#f5f3ff', dashed: true, thick: false },
        { label: 'Problem', border: '#dc2626', bg: '#fef2f2', dashed: false, thick: true },
      ];
      let lx = padding;
      legendItems.forEach(item => {
        ctx.fillStyle = item.bg;
        ctx.strokeStyle = item.border;
        ctx.lineWidth = item.thick ? 2.5 : 1.5;
        if (item.dashed) ctx.setLineDash([3, 2]); else ctx.setLineDash([]);
        ctx.fillRect(lx, legendY + 14, 12, 12);
        ctx.strokeRect(lx, legendY + 14, 12, 12);
        ctx.setLineDash([]);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.fillText(item.label, lx + 16, legendY + 24);
        lx += ctx.measureText(item.label).width + 36;
      });

      canvas.toBlob((blob) => {
        if (!blob) { resolve(false); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `visual-maps-complete-${sessionId}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        resolve(true);
      }, 'image/png', 1.0);
    } catch {
      resolve(false);
    }
  });
}

export function TechEnvironmentMindMap({ 
  sessionId, transcript, domainExpertise, resetVersion 
}: TechEnvironmentMindMapProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TechNode | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
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
        sessionId, transcript, domainExpertise
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        const wasRegenerate = !!queryClient.getQueryData(['/api/conversations', sessionId, 'mind-map']);
        queryClient.setQueryData(['/api/conversations', sessionId, 'mind-map'], data.data);
        const totalNodes = data.data.nodes?.length || 0;
        setActivePageIndex(0);
        if (totalNodes > 0) {
          toast({
            title: wasRegenerate ? "Maps Updated" : "Visual Maps Generated",
            description: wasRegenerate 
              ? `Updated with latest conversation context - ${totalNodes} elements across all maps`
              : `Created ${totalNodes} elements across all maps`
          });
        } else {
          toast({
            title: "No Data Extracted",
            description: "Could not extract map data. Please ensure there is enough conversation content and try again.",
            variant: "destructive"
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate maps",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (resetVersion !== undefined && resetVersion > 0) {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', sessionId, 'mind-map'] });
    }
  }, [resetVersion, sessionId, queryClient]);

  const handleGenerate = useCallback(() => {
    generateMutation.mutate();
  }, [generateMutation]);

  const isGenerating = generateMutation.isPending;

  const sections = useMemo(() => {
    if (!mindMapData) return null;
    
    if (mindMapData.sections) {
      return mindMapData.sections;
    }
    
    const allNodes = (mindMapData.nodes || []) as TechNode[];
    const allEdges = mindMapData.edges || [];
    
    const techCategories = ['users_access', 'endpoints', 'network', 'infrastructure', 'applications', 'data_flow', 'security', 'operations', 'cloud', 'database', 'integration', 'vendor', 'projects', 'people', 'pain_point'];
    
    const filterSection = (cats: string[]): MapSection => {
      const sNodes = allNodes.filter(n => cats.includes(n.category));
      const sNodeIds = new Set(sNodes.map(n => n.id));
      const sEdges = allEdges.filter(e => sNodeIds.has(e.source) && sNodeIds.has(e.target));
      return { nodes: sNodes, edges: sEdges, sectionEmpty: sNodes.length === 0 };
    };
    
    return {
      techEnvironment: filterSection(techCategories),
      decisionMakers: filterSection(['decision_maker']),
      businessProcesses: filterSection(['process']),
      callTimeline: filterSection(['timeline']),
      compliance: filterSection(['compliance'])
    } as MultiSectionMap;
  }, [mindMapData]);

  const totalNodes = mindMapData?.nodes?.length || 0;
  const hasData = totalNodes > 0;

  const sectionEntries: [SectionKey, MapSection][] = sections ? [
    ['tech_environment', sections.techEnvironment],
    ['decision_makers', sections.decisionMakers],
    ['business_processes', sections.businessProcesses],
    ['call_timeline', sections.callTimeline],
    ['compliance', sections.compliance]
  ] : [];

  const nonEmptySections = sectionEntries.filter(([, s]) => s.nodes.length > 0);

  const handleDownload = useCallback(async () => {
    if (sectionEntries.length === 0) return;
    setIsDownloading(true);
    const success = await downloadAllMapsAsImage(sectionEntries, sessionId);
    setIsDownloading(false);
    if (success) {
      toast({ title: "Downloaded", description: "Complete visual maps saved as PNG" });
    } else {
      toast({ title: "Download Failed", description: "Could not export maps", variant: "destructive" });
    }
  }, [sectionEntries, sessionId, toast]);

  const activeSectionKey = sectionEntries[activePageIndex]?.[0];
  const activeSection = sectionEntries[activePageIndex]?.[1];
  const activeMeta = activeSectionKey ? sectionMeta[activeSectionKey] : null;
  const ActiveIcon = activeMeta?.icon;

  const activeStats = useMemo(() => {
    if (!activeSection) return { total: 0, confirmed: 0, assumed: 0, preemptive: 0, problems: 0 };
    const nodes = activeSection.nodes || [];
    return {
      total: nodes.length,
      confirmed: nodes.filter(n => n.status === 'confirmed').length,
      assumed: nodes.filter(n => n.status === 'assumed').length,
      preemptive: nodes.filter(n => n.status === 'preemptive').length,
      problems: nodes.filter(n => n.problemDetected).length,
    };
  }, [activeSection]);

  const prevSection = activePageIndex > 0 ? sectionMeta[sectionEntries[activePageIndex - 1][0]] : null;
  const nextSection = activePageIndex < sectionEntries.length - 1 ? sectionMeta[sectionEntries[activePageIndex + 1][0]] : null;

  return (
    <TooltipProvider>
      <Card className={`${isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-500" />
                Visual Maps
              </CardTitle>
              {mindMapData?.isReferenceArchitecture && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                  Reference Architecture
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    {hasData ? 'Regenerate' : 'Generate'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasData 
                    ? 'Re-analyze with latest conversation context for updated maps' 
                    : 'Generate visual maps from conversation'}
                </TooltipContent>
              </Tooltip>
              {hasData && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download all maps as PNG</TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {(isFetching || isGenerating) && !hasData ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">
                    {isGenerating ? 'Analyzing conversation & building intelligence maps...' : 'Loading maps...'}
                  </p>
                </div>
              </div>
            ) : hasData && sections && activeMeta && ActiveIcon ? (
              <div className="space-y-3 relative">
                {isGenerating && (
                  <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                    <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                      <p className="text-sm font-medium">Updating maps with latest context...</p>
                      <p className="text-xs text-muted-foreground mt-1">Re-analyzing conversation</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {sectionEntries.map(([key], idx) => {
                    const m = sectionMeta[key];
                    const Icon = m.icon;
                    const nodeCount = sectionEntries[idx][1].nodes?.length || 0;
                    const isActive = idx === activePageIndex;
                    const problemCount = (sectionEntries[idx][1].nodes || []).filter(n => n.problemDetected).length;
                    return (
                      <button
                        key={key}
                        onClick={() => { setActivePageIndex(idx); setSelectedNode(null); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                          isActive 
                            ? 'text-white shadow-md' 
                            : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        style={isActive ? { backgroundColor: m.color } : undefined}
                      >
                        <Icon size={14} />
                        {m.title}
                        {nodeCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {nodeCount}
                          </span>
                        )}
                        {problemCount > 0 && (
                          <span className={`text-[10px] px-1 py-0.5 rounded-full ${isActive ? 'bg-red-300/40' : 'bg-red-100 text-red-600'}`}>
                            <AlertTriangle size={9} className="inline" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg p-1.5 flex items-center justify-center" style={{ backgroundColor: `${activeMeta.color}15`, color: activeMeta.color }}>
                      <ActiveIcon size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{activeMeta.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {activeStats.confirmed > 0 && <span className="flex items-center gap-0.5"><CheckCircle size={10} className="text-blue-500" />{activeStats.confirmed} confirmed</span>}
                    {activeStats.assumed > 0 && <span className="flex items-center gap-0.5"><CircleDot size={10} className="text-yellow-500" />{activeStats.assumed} assumed</span>}
                    {activeStats.preemptive > 0 && <span className="flex items-center gap-0.5"><Eye size={10} className="text-purple-500" />{activeStats.preemptive} pre-emptive</span>}
                    {activeStats.problems > 0 && <span className="flex items-center gap-0.5"><AlertTriangle size={10} className="text-red-500" />{activeStats.problems} issues</span>}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <SectionMap
                      key={activeSectionKey}
                      sectionKey={activeSectionKey!}
                      section={activeSection!}
                      onNodeSelect={setSelectedNode}
                      isFullscreen={isFullscreen}
                    />
                  </div>
                  {selectedNode && (
                    <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activePageIndex === 0}
                    onClick={() => { setActivePageIndex(activePageIndex - 1); setSelectedNode(null); }}
                    className="text-xs gap-1"
                  >
                    <ChevronLeft size={14} />
                    {prevSection ? (
                      <span className="flex items-center gap-1">
                        {(() => { const PrevIcon = prevSection.icon; return <PrevIcon size={12} />; })()}
                        {prevSection.title}
                      </span>
                    ) : 'Previous'}
                  </Button>
                  
                  <div className="flex items-center gap-1.5">
                    {sectionEntries.map(([key], idx) => (
                      <button
                        key={key}
                        onClick={() => { setActivePageIndex(idx); setSelectedNode(null); }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === activePageIndex ? 'w-5 bg-blue-500' : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activePageIndex === sectionEntries.length - 1}
                    onClick={() => { setActivePageIndex(activePageIndex + 1); setSelectedNode(null); }}
                    className="text-xs gap-1"
                  >
                    {nextSection ? (
                      <span className="flex items-center gap-1">
                        {nextSection.title}
                        {(() => { const NextIcon = nextSection.icon; return <NextIcon size={12} />; })()}
                      </span>
                    ) : 'Next'}
                    <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border-2 border-solid border-blue-500 bg-blue-50" />
                      <span>Confirmed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border-2 border-solid border-yellow-500 bg-yellow-50" />
                      <span>Assumed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border-2 border-dashed border-purple-500 bg-purple-50" />
                      <span>Pre-emptive (not discussed)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border-[3px] border-solid border-red-500 bg-red-50" />
                      <span>Problem Detected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="6" viewBox="0 0 20 6"><line x1="0" y1="3" x2="16" y2="3" stroke="#94a3b8" strokeWidth="2" /><polygon points="15,0.5 20,3 15,5.5" fill="#94a3b8" /></svg>
                      <span>Connection</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="6" viewBox="0 0 20 6"><line x1="0" y1="3" x2="16" y2="3" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4,3" /><polygon points="15,0.5 20,3 15,5.5" fill="#7c3aed" /></svg>
                      <span>Missing Link</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center p-8">
                  <Network className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <h3 className="font-medium mb-1">No Visual Maps Generated</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Click "Generate" to create separate visual maps for tech environment, 
                    decision makers, processes, timeline, and compliance.
                  </p>
                  {!transcript || transcript.length < 50 ? (
                    <p className="text-xs text-amber-600">
                      A reference architecture will be generated based on your domain expertise.
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
}

export default TechEnvironmentMindMap;
