import { AlertCircle, CheckCircle2, TrendingUp, FileCheck, FileQuestion, Shield, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OutcomeMetric {
  metric: string;
  value: string;
  confidence?: string;
}

interface CaseStudyData {
  title?: string;
  customer?: string;
  industry?: string;
  challenge?: string;
  solution?: string;
  outcomes?: OutcomeMetric[];
  citation?: string;
  storySource?: 'train_me' | 'knowledge_base' | 'illustrative';
  verificationType?: 'real' | 'anonymized' | 'illustrative';
  verificationLabel?: string;
  _meta?: {
    domain?: string;
    compliance?: string | null;
    verificationType?: string;
    confidenceLevel?: string;
  };
  slides?: {
    type: "problem" | "solution-outcome";
    problem?: string;
    solution?: string;
    outcome?: string;
    metrics?: string[];
  }[];
}

interface CaseStudyProps {
  slides?: {
    type: "problem" | "solution-outcome";
    problem?: string;
    solution?: string;
    outcome?: string;
    metrics?: string[];
  }[];
  data?: CaseStudyData;
}

function getSourceBadge(source: string | undefined, citation: string | undefined, verificationType?: string, verificationLabel?: string) {
  // Priority 1: Check for illustrative type FIRST - this ensures illustrative cases are never misclassified
  if (verificationType === 'illustrative' || verificationLabel === 'Illustrative Example' || citation?.includes('Illustrative')) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
        <FileQuestion className="h-3 w-3" />
        Illustrative Example
      </Badge>
    );
  }
  
  // Priority 2: Use AI-returned verification type for real/anonymized cases
  if (verificationType === 'real' || verificationLabel === 'Verified Case Study') {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 flex items-center gap-1">
        <FileCheck className="h-3 w-3" />
        Verified Case Study
      </Badge>
    );
  }
  if (verificationType === 'anonymized' || verificationLabel === 'Real Case (Anonymized)') {
    return (
      <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 flex items-center gap-1">
        <FileCheck className="h-3 w-3" />
        Real Case (Anonymized)
      </Badge>
    );
  }
  
  // Priority 3: Fallback to source/citation check ONLY when verification type is not specified
  // This maintains backwards compatibility but doesn't override explicit verification types
  if ((source === 'train_me' || citation?.includes('Training')) && !verificationType) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 flex items-center gap-1">
        <FileCheck className="h-3 w-3" />
        From Training Documents
      </Badge>
    );
  }
  if (source === 'knowledge_base' && !verificationType) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1">
        <BookOpen className="h-3 w-3" />
        Knowledge Base
      </Badge>
    );
  }
  
  // Default: Illustrative example (when nothing else matches)
  return (
    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
      <FileQuestion className="h-3 w-3" />
      Illustrative Example
    </Badge>
  );
}

function getConfidenceBadge(confidence: string | undefined) {
  if (!confidence) return null;
  const styles: Record<string, string> = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return <Badge className={`${styles[confidence] || styles.medium} text-xs`}>{confidence}</Badge>;
}

export function CaseStudy({ slides, data }: CaseStudyProps) {
  if (data && (data.title || data.challenge)) {
    const title = data.title || 'Customer Success Story';
    const customer = data.customer;
    const industry = data.industry;
    const challenge = data.challenge || '';
    const solution = data.solution || '';
    const outcomes = data.outcomes || [];
    const citation = data.citation;
    const storySource = data.storySource;
    const verificationType = data.verificationType;
    const verificationLabel = data.verificationLabel;
    const domain = data._meta?.domain;
    
    return (
      <div className="flex flex-col h-full space-y-5 overflow-y-auto p-2" data-testid="slide-case-study">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent text-center">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {getSourceBadge(storySource, citation, verificationType, verificationLabel)}
            {domain && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 text-xs">
                {domain}
              </Badge>
            )}
          </div>
          {(customer || industry) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              {customer}{customer && industry ? ' • ' : ''}{industry}
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
              The Challenge
            </h3>
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
            {challenge}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
              The Solution
            </h3>
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
            {solution}
          </p>
        </div>

        {outcomes.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-5 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                Key Outcomes
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {outcomes.map((outcome, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-800 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {outcome.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {outcome.metric}
                  </div>
                  {outcome.confidence && getConfidenceBadge(outcome.confidence)}
                </div>
              ))}
            </div>
          </div>
        )}

        {citation && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Shield className="h-3 w-3" />
            <span>{citation}</span>
          </div>
        )}
      </div>
    );
  }

  if (slides && slides.length > 0) {
    const problemSlide = slides.find(s => s.type === 'problem');
    const solutionSlide = slides.find(s => s.type === 'solution-outcome');
    
    return (
      <div className="flex flex-col h-full space-y-5 overflow-y-auto p-2" data-testid="slide-case-study-legacy">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent text-center">
          Customer Success Story
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
            <FileQuestion className="h-3 w-3" />
            Illustrative Example
          </Badge>
        </div>

        {problemSlide?.problem && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg p-5 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                The Challenge
              </h3>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
              {problemSlide.problem}
            </p>
          </div>
        )}

        {solutionSlide?.solution && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-5 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                The Solution
              </h3>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
              {solutionSlide.solution}
            </p>
          </div>
        )}

        {solutionSlide?.outcome && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-5 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                The Results
              </h3>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
              {solutionSlide.outcome}
            </p>
            {solutionSlide.metrics && solutionSlide.metrics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {solutionSlide.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-blue-100 dark:border-blue-800 text-center">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {metric}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Shield className="h-3 w-3" />
          <span>Source: Illustrative Example</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertCircle className="h-12 w-12 text-amber-500 dark:text-amber-400 mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Unable to Generate Case Study
      </h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-md">
        The AI response was incomplete. Please try again or switch to a different AI provider in Settings.
      </p>
    </div>
  );
}
