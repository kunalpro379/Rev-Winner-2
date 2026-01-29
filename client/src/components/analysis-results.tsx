import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ShieldAlert, ArrowRight, Swords, Flame, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Target, Users, Clock, DollarSign, MessageSquare, Zap, CheckCircle2, TrendingUp, Brain, Sparkles, Layers, AlertTriangle, Rocket, BookOpen, HelpCircle, Shield, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MethodologyInsight {
  methodology: string;
  insight: string;
  action?: string;
}

interface DiscoveryTab {
  preemptiveQuestions: string[];
  conversationQuestions: string[];
  methodologyInsights: MethodologyInsight[];
  bantStatus: {
    budget: { status: string; question?: string };
    authority: { status: string; question?: string };
    need: { status: string; question?: string };
    timeline: { status: string; question?: string };
  };
}

interface ObjectionTab {
  identifiedObjections: Array<{ objection: string; response: string; methodology: string }>;
  potentialObjections: Array<{ objection: string; response: string; methodology: string }>;
  handlingTechniques: string[];
}

interface NextStepsTab {
  immediateActions: string[];
  followUpActions: string[];
  closingRecommendation: string;
  dealStage: string;
  readinessScore: number;
}

interface CompetitorTab {
  mentionedCompetitors: Array<{ name: string; differentiators: string[]; battleCard: string }>;
  proactiveDifferentiators: string[];
  competitiveAdvantages: string[];
}

interface UrgencyTab {
  urgencyScript: string;
  bulletPoints: string[];
  valueStatements: string[];
  callToAction: string;
  psychologicalTriggers: string[];
}

interface CallFlowScript {
  opening: {
    greeting: string;
    introduction: string;
    purposeStatement: string;
  };
  discoveryQuestions: string[];
  preEmptedObjections: Array<{ 
    objection: string; 
    response: string;
  }>;
  whyWereBetter: string[];
  nextStepsScript: {
    transition: string;
    proposedActions: string[];
  };
  recommendedActionItems: string[];
}

interface TabBasedAnalysis {
  discovery: DiscoveryTab;
  objections: ObjectionTab;
  nextSteps: NextStepsTab;
  competitors: CompetitorTab;
  urgency: UrgencyTab;
  methodologiesUsed: string[];
  callFlowScript?: CallFlowScript;
}

interface SalesScript {
  solutions: string[];
  valueProposition: string[];
  technicalAnswers: string[];
  caseStudies: string[];
  competitorAnalysis: string[];
  whyBetter: string[];
}

interface ClosingPitch {
  urgencyBuilder: string;
  objectionHandling: string[];
  finalValue: string;
  callToAction: string;
}

interface MultiProductIntelligence {
  detectedProducts?: string[];
  crossSellOpportunities?: Array<{
    product: string;
    reason: string;
    expectedValue?: string;
  }>;
  bundles?: Array<{
    name: string;
    products: string[];
    value: string;
  }>;
  hiddenNeeds?: string[];
  revenueExpansion?: Array<{
    opportunity: string;
    approach: string;
  }>;
  productTransitions?: Array<{
    from: string;
    to: string;
    timing: string;
  }>;
}

interface ProductResponseItem {
  productName: string;
  productId?: string;
  confidence?: number;
  analysis: {
    painPoints?: string[];
    currentEnvironment?: string;
    requirements?: string[];
    discoveryInsights?: any;
    nextQuestions?: string[];
    recommendedSolutions?: string[];
    caseStudies?: string[];
    closingPitch?: ClosingPitch;
    nextSteps?: string[];
  };
  salesScript?: SalesScript;
  tabBasedAnalysis?: TabBasedAnalysis;
}

interface AnalysisResults {
  discoveryQuestions: string[];
  recommendedSolutions: string[];
  caseStudies: string[];
  discoveryInsights?: any;
  nextQuestions?: string[];
  salesScript?: SalesScript;
  closingPitch?: ClosingPitch;
  nextSteps?: string[];
  multiProductIntelligence?: MultiProductIntelligence;
  products?: ProductResponseItem[];
  _multiProduct?: boolean;
  tabBasedAnalysis?: TabBasedAnalysis;
}

interface AnalysisResultsProps {
  results: AnalysisResults | null;
  onClose: () => void;
  sessionId: string;
  conversationContext?: string;
  domainExpertise?: string;
}

const methodologyColors: Record<string, string> = {
  'SPIN': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'MEDDIC': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Challenger': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'NLP': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'BANT': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Psychology': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  // New contextual insight categories
  'BANT Gaps': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Discovery Focus': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Qualification': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  'Value Selling': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Closing': 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  'Objection Handling': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Competitive Positioning': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

function MethodologyBadge({ methodology }: { methodology: string }) {
  const colorClass = methodologyColors[methodology] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  return (
    <Badge variant="outline" className={`text-xs ${colorClass}`}>
      {methodology}
    </Badge>
  );
}

function DiscoveryQuestionsTab({ data }: { data: DiscoveryTab }) {
  // Check if we have actual BANT values (not just 'unknown')
  const hasBantValues = data.bantStatus && (
    data.bantStatus.budget.status !== 'unknown' ||
    data.bantStatus.authority.status !== 'unknown' ||
    data.bantStatus.need.status !== 'unknown' ||
    data.bantStatus.timeline.status !== 'unknown'
  );

  return (
    <div className="space-y-6">
      {/* Coaching Tips - Contextual action items for the sales rep */}
      {data.methodologyInsights && data.methodologyInsights.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              Coaching Tips
              <span className="ml-auto text-xs font-normal text-muted-foreground">Based on this conversation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.methodologyInsights.map((insight, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-gray-900 rounded-lg border-l-4 border-amber-400">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <span className="text-amber-700 dark:text-amber-300 text-xs font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{insight.insight}</p>
                    {insight.action && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 italic">💡 {insight.action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.bantStatus && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              BANT Qualification Status
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {hasBantValues ? 'Extracting from conversation...' : 'Ask qualifying questions'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${data.bantStatus.budget.status !== 'unknown' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-900'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={`h-4 w-4 ${data.bantStatus.budget.status !== 'unknown' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">Budget</span>
                </div>
                {data.bantStatus.budget.status !== 'unknown' ? (
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">{data.bantStatus.budget.status}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">❓ {data.bantStatus.budget.question || 'Ask about budget'}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${data.bantStatus.authority.status !== 'unknown' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Users className={`h-4 w-4 ${data.bantStatus.authority.status !== 'unknown' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">Authority</span>
                </div>
                {data.bantStatus.authority.status !== 'unknown' ? (
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{data.bantStatus.authority.status}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">❓ {data.bantStatus.authority.question || 'Ask about decision makers'}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${data.bantStatus.need.status !== 'unknown' ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-gray-900'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-4 w-4 ${data.bantStatus.need.status !== 'unknown' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">Need</span>
                </div>
                {data.bantStatus.need.status !== 'unknown' ? (
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">✓ Identified</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">❓ {data.bantStatus.need.question || 'Ask about their challenges'}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${data.bantStatus.timeline.status !== 'unknown' ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-gray-900'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className={`h-4 w-4 ${data.bantStatus.timeline.status !== 'unknown' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">Timeline</span>
                </div>
                {data.bantStatus.timeline.status !== 'unknown' ? (
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">{data.bantStatus.timeline.status}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">❓ {data.bantStatus.timeline.question || 'Ask about timeline'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.conversationQuestions && data.conversationQuestions.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Based on Current Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.conversationQuestions.map((question, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <span className="text-blue-600 font-bold text-sm flex-shrink-0">Q{idx + 1}:</span>
                  <p className="text-sm">{question}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.preemptiveQuestions && data.preemptiveQuestions.length > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              Preemptive Discovery Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.preemptiveQuestions.map((question, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <span className="text-green-600 font-bold text-sm flex-shrink-0">Q{idx + 1}:</span>
                  <p className="text-sm">{question}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ObjectionHandlingTab({ data }: { data: ObjectionTab }) {
  return (
    <div className="space-y-6">
      {data.identifiedObjections && data.identifiedObjections.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Objections Identified in Conversation
              <Badge variant="destructive" className="ml-auto">{data.identifiedObjections.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.identifiedObjections.map((item, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-100 dark:border-red-900">
                <div className="flex items-start gap-2 mb-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">
                    Objection
                  </Badge>
                  <MethodologyBadge methodology={item.methodology} />
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">"{item.objection}"</p>
                <div className="pl-4 border-l-2 border-green-400">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <span className="font-medium">Response: </span>{item.response}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.potentialObjections && data.potentialObjections.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Potential Objections to Prepare For
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.potentialObjections.map((item, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-900">
                <div className="flex items-start gap-2 mb-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                    Potential
                  </Badge>
                  <MethodologyBadge methodology={item.methodology} />
                </div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">"{item.objection}"</p>
                <div className="pl-4 border-l-2 border-green-400">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <span className="font-medium">Prepared Response: </span>{item.response}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.handlingTechniques && data.handlingTechniques.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Pro Tips for Handling Objections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.handlingTechniques.map((technique, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>{technique}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NextStepsTab({ data }: { data: NextStepsTab }) {
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'discovery': return 'bg-blue-100 text-blue-800';
      case 'qualification': return 'bg-purple-100 text-purple-800';
      case 'presentation': return 'bg-amber-100 text-amber-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closing': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Deal Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStageColor(data.dealStage)}>{data.dealStage}</Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {data.readinessScore}% Ready
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${data.readinessScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {data.immediateActions && data.immediateActions.length > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Rocket className="h-4 w-4 text-green-600" />
              Immediate Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.immediateActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-100 dark:border-green-900">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-sm">{action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.followUpActions && data.followUpActions.length > 0 && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-indigo-600" />
              Follow-Up Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.followUpActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <Clock className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.closingRecommendation && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Closing Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-400 p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-purple-900">
              {data.closingRecommendation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompetitorAnalysisTab({ data }: { data: CompetitorTab }) {
  return (
    <div className="space-y-6">
      {data.mentionedCompetitors && data.mentionedCompetitors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Swords className="h-4 w-4 text-red-600" />
              Competitors Mentioned
              <Badge variant="destructive" className="ml-auto">{data.mentionedCompetitors.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.mentionedCompetitors.map((competitor, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-100 dark:border-red-900">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-bold">
                    vs {competitor.name}
                  </Badge>
                </div>
                
                {competitor.differentiators && competitor.differentiators.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Key Differentiators:</h5>
                    <ul className="space-y-1">
                      {competitor.differentiators.map((diff, dIdx) => (
                        <li key={dIdx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {competitor.battleCard && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Battle Card Response:</h5>
                    <p className="text-sm">{competitor.battleCard}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(!data.mentionedCompetitors || data.mentionedCompetitors.length === 0) && data.proactiveDifferentiators && data.proactiveDifferentiators.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              No Competitors Mentioned - Proactive Differentiators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Use these points to highlight your competitive advantages:</p>
            <div className="space-y-2">
              {data.proactiveDifferentiators.map((diff, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{diff}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.competitiveAdvantages && data.competitiveAdvantages.length > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Your Competitive Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.competitiveAdvantages.map((advantage, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-100 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{advantage}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CreateUrgencyTab({ data }: { data: UrgencyTab }) {
  return (
    <div className="space-y-6">
      {data.urgencyScript && (
        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600" />
              Ready-to-Read Urgency Script
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-orange-200 dark:border-orange-800 shadow-inner">
              <p className="text-sm italic leading-relaxed">"{data.urgencyScript}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.bulletPoints && data.bulletPoints.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              Quick Urgency Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.bulletPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                  <Flame className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.valueStatements && data.valueStatements.length > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Value Statements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.valueStatements.map((statement, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-100 dark:border-green-900">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">{statement}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.psychologicalTriggers && data.psychologicalTriggers.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Psychological Triggers (Use Subtly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.psychologicalTriggers.map((trigger, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                  <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>{trigger}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.callToAction && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Call to Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white text-center">
              <p className="text-sm font-bold">{data.callToAction}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CallFlowScriptTab({ data }: { data: CallFlowScript }) {
  const [currentPage, setCurrentPage] = useState(0);
  
  const pages = [
    { title: 'Opening', icon: MessageSquare, color: 'blue' },
    { title: 'Discovery', icon: HelpCircle, color: 'cyan' },
    { title: 'Objections', icon: Shield, color: 'amber' },
    { title: 'Why Better', icon: Star, color: 'green' },
    { title: 'Next Steps', icon: ArrowRight, color: 'purple' },
    { title: 'Action Items', icon: CheckCircle2, color: 'orange' },
  ];

  const renderPageContent = () => {
    switch (currentPage) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Greeting</h4>
              <p className="text-sm italic">{data.opening.greeting}</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Introduction</h4>
              <p className="text-sm italic">{data.opening.introduction}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">Purpose Statement</h4>
              <p className="text-sm italic">{data.opening.purposeStatement}</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            {data.discoveryQuestions.map((q, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <span className="bg-cyan-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                <p className="text-sm">{q}</p>
              </div>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            {data.preEmptedObjections.map((obj, idx) => (
              <div key={idx} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Objection: {obj.objection}</p>
                </div>
                <div className="ml-6 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400"><span className="font-semibold">Response:</span> {obj.response}</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            {data.whyWereBetter.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{point}</p>
              </div>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">Transition Script</h4>
              <p className="text-sm italic whitespace-pre-line">{data.nextStepsScript.transition}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Proposed Actions:</h4>
              {data.nextStepsScript.proposedActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-purple-900">
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                  <p className="text-sm">{action}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            {data.recommendedActionItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <Target className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/20 dark:to-gray-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-600" />
            Call Flow Script - Page {currentPage + 1} of {pages.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex gap-1">
              {pages.map((page, idx) => {
                const Icon = page.icon;
                const activeColors: Record<string, string> = {
                  blue: 'bg-blue-600 text-white',
                  cyan: 'bg-cyan-600 text-white',
                  amber: 'bg-amber-600 text-white',
                  green: 'bg-green-600 text-white',
                  purple: 'bg-purple-600 text-white',
                  orange: 'bg-orange-600 text-white',
                };
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      currentPage === idx
                        ? activeColors[page.color]
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={page.title}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
              disabled={currentPage === pages.length - 1}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{pages[currentPage].title}</h3>
          </div>
          
          <div className="min-h-[300px]">
            {renderPageContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDefaultTabData(): TabBasedAnalysis {
  return {
    discovery: {
      preemptiveQuestions: [],
      conversationQuestions: [],
      methodologyInsights: [],
      bantStatus: {
        budget: { status: 'unknown' },
        authority: { status: 'unknown' },
        need: { status: 'unknown' },
        timeline: { status: 'unknown' },
      },
    },
    objections: {
      identifiedObjections: [],
      potentialObjections: [],
      handlingTechniques: [],
    },
    nextSteps: {
      immediateActions: [],
      followUpActions: [],
      closingRecommendation: '',
      dealStage: 'discovery',
      readinessScore: 20,
    },
    competitors: {
      mentionedCompetitors: [],
      proactiveDifferentiators: [],
      competitiveAdvantages: [],
    },
    urgency: {
      urgencyScript: '',
      bulletPoints: [],
      valueStatements: [],
      callToAction: '',
      psychologicalTriggers: [],
    },
    methodologiesUsed: [],
  };
}

function convertLegacyToTabBased(results: AnalysisResults): TabBasedAnalysis {
  const tabData = getDefaultTabData();
  
  // Discovery Questions - combine from multiple legacy sources
  const allQuestions: string[] = [];
  if (results.discoveryQuestions) {
    allQuestions.push(...results.discoveryQuestions);
  }
  if (results.nextQuestions) {
    allQuestions.push(...results.nextQuestions);
  }
  if (allQuestions.length > 0) {
    tabData.discovery.conversationQuestions = allQuestions.slice(0, 5);
    tabData.discovery.preemptiveQuestions = allQuestions.slice(5, 10);
  }
  
  // Recommended solutions can inform discovery
  if (results.recommendedSolutions && results.recommendedSolutions.length > 0) {
    tabData.discovery.preemptiveQuestions = [
      ...tabData.discovery.preemptiveQuestions,
      ...results.recommendedSolutions.slice(0, 3).map(s => `Explore: ${s}`),
    ].slice(0, 5);
  }
  
  // Case studies can inform competitive advantages
  if (results.caseStudies && results.caseStudies.length > 0) {
    tabData.competitors.proactiveDifferentiators = [
      ...tabData.competitors.proactiveDifferentiators,
      ...results.caseStudies.slice(0, 3),
    ];
  }
  
  // Objection Handling from closing pitch
  if (results.closingPitch) {
    if (results.closingPitch.objectionHandling && results.closingPitch.objectionHandling.length > 0) {
      tabData.objections.potentialObjections = results.closingPitch.objectionHandling.map((obj, idx) => ({
        objection: `Potential objection ${idx + 1}`,
        response: obj,
        methodology: ['Challenger', 'NLP', 'SPIN'][idx % 3],
      }));
    }
    tabData.urgency.urgencyScript = results.closingPitch.urgencyBuilder || 'Build urgency by highlighting time-sensitive value';
    tabData.urgency.callToAction = results.closingPitch.callToAction || 'Schedule a follow-up discussion';
    const values = [results.closingPitch.finalValue].filter(Boolean) as string[];
    if (values.length > 0) {
      tabData.urgency.valueStatements = values;
    }
  }
  
  // Next Steps
  if (results.nextSteps && results.nextSteps.length > 0) {
    tabData.nextSteps.immediateActions = results.nextSteps.slice(0, 3);
    tabData.nextSteps.followUpActions = results.nextSteps.slice(3);
    tabData.nextSteps.dealStage = results.nextSteps.length > 3 ? 'qualification' : 'discovery';
    tabData.nextSteps.readinessScore = Math.min(20 + (results.nextSteps.length * 10), 60);
    tabData.nextSteps.closingRecommendation = 'Continue building rapport and qualifying the opportunity';
  }
  
  // Sales Script - competitor and value content
  if (results.salesScript) {
    if (results.salesScript.competitorAnalysis && results.salesScript.competitorAnalysis.length > 0) {
      tabData.competitors.competitiveAdvantages = results.salesScript.competitorAnalysis;
    }
    if (results.salesScript.whyBetter && results.salesScript.whyBetter.length > 0) {
      tabData.competitors.proactiveDifferentiators = [
        ...tabData.competitors.proactiveDifferentiators,
        ...results.salesScript.whyBetter,
      ];
    }
    if (results.salesScript.valueProposition && results.salesScript.valueProposition.length > 0) {
      tabData.urgency.valueStatements = [
        ...tabData.urgency.valueStatements,
        ...results.salesScript.valueProposition,
      ];
    }
  }
  
  // Try to extract methodology insights from results first (legacy format)
  // Check for methodologyInsights in various possible locations
  const backendInsights = results.methodologyInsights || 
    (results as any).tabBasedAnalysis?.discovery?.methodologyInsights;
  
  if (backendInsights && Array.isArray(backendInsights) && backendInsights.length > 0) {
    // Use backend-provided methodology insights
    tabData.discovery.methodologyInsights = backendInsights;
  } else if (!tabData.discovery.methodologyInsights || tabData.discovery.methodologyInsights.length === 0) {
    // Only build contextual fallbacks if no backend data exists
    // Generate tips based on what's missing in the conversation
    const contextualInsights: Array<{ methodology: string; insight: string; action?: string }> = [];
    
    // Check what BANT elements are missing and add relevant coaching tips
    if (tabData.discovery.bantStatus) {
      const unknownCount = [
        tabData.discovery.bantStatus.budget?.status === 'unknown',
        tabData.discovery.bantStatus.authority?.status === 'unknown',
        tabData.discovery.bantStatus.need?.status === 'unknown',
        tabData.discovery.bantStatus.timeline?.status === 'unknown'
      ].filter(Boolean).length;
      
      if (unknownCount > 0) {
        contextualInsights.push({
          methodology: 'BANT Gaps',
          insight: `${unknownCount} qualification elements still unknown. Ask qualifying questions early.`,
          action: 'Focus on Budget, Authority, Need, and Timeline questions before pitching.'
        });
      }
    }
    
    // Add stage-specific coaching tip based on what data we have
    if (tabData.discovery.conversationQuestions.length === 0) {
      contextualInsights.push({
        methodology: 'Discovery Focus',
        insight: 'Early stage conversation. Focus on understanding their current situation.',
        action: 'Ask open-ended questions about their challenges and goals.'
      });
    }
    
    tabData.discovery.methodologyInsights = contextualInsights;
  }
  
  // Set methodologiesUsed for legacy data
  tabData.methodologiesUsed = ['SPIN', 'MEDDIC', 'Challenger', 'BANT', 'NLP', 'Psychology'];
  
  // Extract BANT values from discoveryInsights if available (legacy format)
  // The backend puts discoveryInsights.budget, .authority, .need, .timeline
  const legacyBant = results.discoveryInsights as {
    budget?: string;
    authority?: string;
    need?: string;
    timeline?: string;
    painPoints?: string[];
  } | undefined;
  
  if (legacyBant) {
    // Build bantStatus from legacy discoveryInsights values
    tabData.discovery.bantStatus = {
      budget: {
        status: legacyBant.budget ? `✓ ${legacyBant.budget}` : 'unknown',
        question: legacyBant.budget ? undefined : 'What budget have you set aside for solving this challenge?'
      },
      authority: {
        status: legacyBant.authority ? `✓ ${legacyBant.authority}` : 'unknown',
        question: legacyBant.authority ? undefined : 'Besides yourself, who else will be involved in the final decision?'
      },
      need: {
        status: (legacyBant.need || (legacyBant.painPoints && legacyBant.painPoints.length > 0)) ? '✓ Identified' : 'unknown',
        question: (legacyBant.need || (legacyBant.painPoints && legacyBant.painPoints.length > 0)) ? undefined : 'What\'s the biggest challenge driving this initiative?'
      },
      timeline: {
        status: legacyBant.timeline ? `✓ ${legacyBant.timeline}` : 'unknown',
        question: legacyBant.timeline ? undefined : 'When are you looking to have a solution in place?'
      },
    };
  } else if (!tabData.discovery.bantStatus || Object.keys(tabData.discovery.bantStatus).length === 0) {
    // Only use defaults if nothing else is available
    tabData.discovery.bantStatus = {
      budget: { status: 'unknown', question: 'What budget have you set aside for solving this challenge?' },
      authority: { status: 'unknown', question: 'Besides yourself, who else will be involved in the final decision?' },
      need: { status: 'unknown', question: 'What\'s the biggest challenge driving this initiative?' },
      timeline: { status: 'unknown', question: 'When are you looking to have a solution in place?' },
    };
  }
  
  // Add default objection handling techniques
  if (tabData.objections.potentialObjections.length === 0 && tabData.objections.handlingTechniques.length === 0) {
    tabData.objections.handlingTechniques = [
      'Feel-Felt-Found: Empathize, relate to similar clients, then provide solution',
      'Acknowledge & Redirect: Validate their concern, then pivot to value',
      'Isolate & Address: Confirm the objection is the only blocker before responding',
    ];
  }
  
  // Add default psychological triggers for urgency
  if (tabData.urgency.psychologicalTriggers.length === 0) {
    tabData.urgency.psychologicalTriggers = [
      'Time-limited opportunity',
      'Competitive advantage window',
      'Cost of inaction',
    ];
  }
  
  return tabData;
}

export function AnalysisResults({ results, onClose }: AnalysisResultsProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!results) return null;
  
  const hasMultipleProducts = results._multiProduct && results.products && results.products.length > 0;
  
  const tabData = results.tabBasedAnalysis || convertLegacyToTabBased(results);
  const methodologiesUsed = tabData.methodologiesUsed?.length > 0 
    ? tabData.methodologiesUsed 
    : ['SPIN', 'MEDDIC', 'Challenger', 'BANT', 'NLP', 'Psychology'];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 text-left" data-testid="toggle-analysis-results">
            <h3 className="text-lg font-semibold">
              Analysis Results
              {hasMultipleProducts && (
                <Badge variant="secondary" className="ml-2">
                  {results.products!.length} Products
                </Badge>
              )}
            </h3>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {methodologiesUsed.slice(0, 4).map((m) => (
                <MethodologyBadge key={m} methodology={m} />
              ))}
              {methodologiesUsed.length > 4 && (
                <Badge variant="outline" className="text-xs">+{methodologiesUsed.length - 4}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-analysis"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CollapsibleContent>
          {hasMultipleProducts ? (
            <Tabs defaultValue={results.products![0].productName} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 p-2">
                {results.products!.map((product) => (
                  <TabsTrigger
                    key={product.productName}
                    value={product.productName}
                    className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                    data-testid={`tab-product-${product.productName.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Layers className="h-4 w-4" />
                    {product.productName}
                    {product.confidence && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        {Math.round(product.confidence * 100)}%
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {results.products!.map((product) => {
                const productTabData = product.tabBasedAnalysis || convertLegacyToTabBased({
                  discoveryQuestions: product.analysis?.nextQuestions || [],
                  recommendedSolutions: product.analysis?.recommendedSolutions || [],
                  caseStudies: product.analysis?.caseStudies || [],
                  closingPitch: product.analysis?.closingPitch,
                  nextSteps: product.analysis?.nextSteps,
                  salesScript: product.salesScript,
                });
                
                return (
                  <TabsContent key={product.productName} value={product.productName} className="mt-4">
                    <AnalysisTabs tabData={productTabData} productName={product.productName} />
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <AnalysisTabs tabData={tabData} />
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function AnalysisTabs({ tabData, productName }: { tabData: TabBasedAnalysis; productName?: string }) {
  const safeTabData = {
    discovery: tabData?.discovery || getDefaultTabData().discovery,
    objections: tabData?.objections || getDefaultTabData().objections,
    nextSteps: tabData?.nextSteps || getDefaultTabData().nextSteps,
    competitors: tabData?.competitors || getDefaultTabData().competitors,
    urgency: tabData?.urgency || getDefaultTabData().urgency,
    methodologiesUsed: tabData?.methodologiesUsed || getDefaultTabData().methodologiesUsed,
    callFlowScript: tabData?.callFlowScript,
  };
  
  return (
    <Tabs defaultValue="discovery" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-1.5 rounded-lg gap-1">
        <TabsTrigger 
          value="discovery" 
          className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          data-testid="tab-discovery-questions"
        >
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">Discovery Questions</span>
          <span className="sm:hidden">Discovery</span>
        </TabsTrigger>
        <TabsTrigger 
          value="objections" 
          className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          data-testid="tab-objection-handling"
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="hidden sm:inline">Objection Handling</span>
          <span className="sm:hidden">Objections</span>
        </TabsTrigger>
        <TabsTrigger 
          value="nextsteps" 
          className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          data-testid="tab-next-steps"
        >
          <ArrowRight className="h-4 w-4" />
          <span className="hidden sm:inline">Next Steps</span>
          <span className="sm:hidden">Next</span>
        </TabsTrigger>
        <TabsTrigger 
          value="competitors" 
          className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          data-testid="tab-competitor-analysis"
        >
          <Swords className="h-4 w-4" />
          <span className="hidden sm:inline">Competitor Analysis</span>
          <span className="sm:hidden">Compete</span>
        </TabsTrigger>
        <TabsTrigger 
          value="urgency" 
          className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          data-testid="tab-create-urgency"
        >
          <Flame className="h-4 w-4" />
          <span className="hidden sm:inline">Create Urgency</span>
          <span className="sm:hidden">Urgency</span>
        </TabsTrigger>
        <TabsTrigger 
          value="callflow" 
          className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
          data-testid="tab-call-flow"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Call Script</span>
          <span className="sm:hidden">Script</span>
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="h-[500px] mt-4">
        <TabsContent value="discovery" className="mt-0 pr-4">
          <DiscoveryQuestionsTab data={safeTabData.discovery} />
        </TabsContent>

        <TabsContent value="objections" className="mt-0 pr-4">
          <ObjectionHandlingTab data={safeTabData.objections} />
        </TabsContent>

        <TabsContent value="nextsteps" className="mt-0 pr-4">
          <NextStepsTab data={safeTabData.nextSteps} />
        </TabsContent>

        <TabsContent value="competitors" className="mt-0 pr-4">
          <CompetitorAnalysisTab data={safeTabData.competitors} />
        </TabsContent>

        <TabsContent value="urgency" className="mt-0 pr-4">
          <CreateUrgencyTab data={safeTabData.urgency} />
        </TabsContent>

        {safeTabData.callFlowScript && (
          <TabsContent value="callflow" className="mt-0 pr-4">
            <CallFlowScriptTab data={safeTabData.callFlowScript} />
          </TabsContent>
        )}
      </ScrollArea>
    </Tabs>
  );
}
