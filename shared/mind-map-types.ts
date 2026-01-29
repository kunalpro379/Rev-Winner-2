import { z } from 'zod';

export const TechEnvironmentNodeCategory = z.enum([
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
  'vendor'
]);

export type TechEnvironmentNodeCategory = z.infer<typeof TechEnvironmentNodeCategory>;

export const NodeStatusIndicator = z.enum(['assumed', 'confirmed']);
export type NodeStatusIndicator = z.infer<typeof NodeStatusIndicator>;

export const PainPointType = z.enum([
  'security_risk',
  'operational_inefficiency', 
  'scalability_limitation',
  'cost_inefficiency'
]);
export type PainPointType = z.infer<typeof PainPointType>;

export const TechEnvironmentNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: TechEnvironmentNodeCategory,
  details: z.string().optional(),
  hoverText: z.string().optional(),
  confidence: z.number().min(0).max(100).default(80),
  status: NodeStatusIndicator.default('assumed'),
  painPointType: PainPointType.optional(),
  whyItMatters: z.string().optional(),
  recommendation: z.string().optional(),
  source: z.string().optional(),
  timestamp: z.string().optional()
});

export type TechEnvironmentNode = z.infer<typeof TechEnvironmentNodeSchema>;

export const TechEnvironmentEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  type: z.enum(['default', 'integration', 'dependency', 'replacement', 'data_flow']).default('default')
});

export type TechEnvironmentEdge = z.infer<typeof TechEnvironmentEdgeSchema>;

export const TechEnvironmentSnapshotSchema = z.object({
  sessionId: z.string(),
  nodes: z.array(TechEnvironmentNodeSchema),
  edges: z.array(TechEnvironmentEdgeSchema),
  lastUpdated: z.string(),
  version: z.number().default(1),
  isReferenceArchitecture: z.boolean().default(false),
  viewMode: z.enum(['current', 'ideal']).default('current')
});

export type TechEnvironmentSnapshot = z.infer<typeof TechEnvironmentSnapshotSchema>;

export const GenerateMindMapRequestSchema = z.object({
  sessionId: z.string(),
  transcript: z.string(),
  domainExpertise: z.string().optional(),
  sellerIntent: z.enum([
    'understand_environment',
    'identify_pain_points',
    'solution_recommendation',
    'compare_states'
  ]).optional()
});

export type GenerateMindMapRequest = z.infer<typeof GenerateMindMapRequestSchema>;

export const categoryColors: Record<TechEnvironmentNodeCategory, { bg: string; border: string; text: string }> = {
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
  vendor: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' }
};

export const categoryLabels: Record<TechEnvironmentNodeCategory, string> = {
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
  vendor: 'Vendors'
};

export const painPointColors: Record<PainPointType, { bg: string; border: string; text: string; emoji: string }> = {
  security_risk: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', emoji: '🔴' },
  operational_inefficiency: { bg: '#fff7ed', border: '#ea580c', text: '#9a3412', emoji: '🟠' },
  scalability_limitation: { bg: '#fefce8', border: '#ca8a04', text: '#854d0e', emoji: '🟡' },
  cost_inefficiency: { bg: '#eff6ff', border: '#2563eb', text: '#1e40af', emoji: '🔵' }
};

export const statusIndicators: Record<NodeStatusIndicator, { emoji: string; label: string }> = {
  assumed: { emoji: '🟡', label: 'Assumed' },
  confirmed: { emoji: '🔵', label: 'Confirmed' }
};
