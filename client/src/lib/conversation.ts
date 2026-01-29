import { apiRequest } from "./queryClient";

export interface ConversationSession {
  conversation: {
    id: string;
    sessionId: string;
    clientName?: string;
    status: string;
    discoveryInsights: any;
    callSummary?: string;
    createdAt: string;
    endedAt?: string;
  };
  messages: Array<{
    id: string;
    conversationId: string;
    content: string;
    sender: "user" | "assistant";
    speakerLabel?: string | null;
    timestamp: string;
    problemStatement?: string | null;
    recommendedSolutions?: any;
    suggestedNextPrompt?: string | null;
  }>;
}

export interface MessageResponse {
  userMessage: any;
  assistantMessage: any;
  discoveryInsights: {
    painPoints: string[];
    currentEnvironment: string;
    requirements: string[];
    budget?: string;
    timeline?: string;
    decisionMakers?: string[];
  };
  discoveryQuestions: string[];
  bantQualification?: {
    budget?: { asked: boolean; question?: string };
    authority?: { asked: boolean; question?: string };
    need?: { asked: boolean; question?: string };
    timeline?: { asked: boolean; question?: string };
  };
  nextQuestions: string[];
  recommendedModules: string[];
  problemStatement?: string;
  recommendedSolutions?: string[];
  suggestedNextPrompt?: string;
}

export interface CallSummary {
  keyChanges: string[];
  discoveryInsights: string[];
  objections: string[];
  nextSteps: string[];
  recommendedSolutions: string[];
}

export async function createConversation(clientName?: string): Promise<ConversationSession> {
  const response = await apiRequest("POST", "/api/conversations", { clientName });
  return response.json();
}

export async function getConversation(sessionId: string): Promise<ConversationSession> {
  const response = await apiRequest("GET", `/api/conversations/${sessionId}`);
  return response.json();
}

export async function sendMessage(sessionId: string, content: string, speakerLabel?: string, domainExpertise?: string): Promise<MessageResponse | { summary: CallSummary }> {
  const response = await apiRequest("POST", `/api/conversations/${sessionId}/messages`, { content, speakerLabel, domainExpertise });
  return response.json();
}

export async function getProductReference() {
  const response = await apiRequest("GET", "/api/product-reference");
  return response.json();
}

export async function getPartnerServiceRecommendations(sessionId: string, domainExpertise: string = "Generic Product") {
  const response = await apiRequest("GET", `/api/conversations/${sessionId}/partner-services?domain=${encodeURIComponent(domainExpertise)}`);
  return response.json();
}

export interface OneLiner {
  id: string;
  category: 'empathy' | 'insight' | 'curiosity' | 'reassurance' | 'opener' | 'rapport' | 'discovery';
  text: string;
  situation: string;
  tone: string;
  strategicIntent?: string;
  phase?: string;
}

export interface RelationshipBuildersResponse {
  oneliners: OneLiner[];
  phase?: string;
  readinessScore?: number;
}

export async function getRelationshipOneLiners(sessionId: string, refresh: boolean = false): Promise<RelationshipBuildersResponse> {
  const url = refresh 
    ? `/api/conversations/${sessionId}/one-liners?refresh=true`
    : `/api/conversations/${sessionId}/one-liners`;
  const response = await apiRequest("GET", url);
  return response.json();
}
