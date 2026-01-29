import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageCircle, DollarSign, Users, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BANTCriterion {
  asked: boolean;
  question?: string;
}

interface BANTQualification {
  budget?: BANTCriterion;
  authority?: BANTCriterion;
  need?: BANTCriterion;
  timeline?: BANTCriterion;
}

interface SmartBANTQuestionsProps {
  bantQualification?: BANTQualification;
  onQuestionClick?: (question: string) => void;
  isLoading?: boolean;
}

export function SmartBANTQuestions({ bantQualification, onQuestionClick, isLoading }: SmartBANTQuestionsProps) {
  if (!bantQualification) return null;

  const unansweredQuestions = [
    {
      key: 'budget',
      label: 'Budget',
      icon: DollarSign,
      data: bantQualification.budget,
      color: 'violet'
    },
    {
      key: 'authority',
      label: 'Authority',
      icon: Users,
      data: bantQualification.authority,
      color: 'indigo'
    },
    {
      key: 'need',
      label: 'Need',
      icon: Target,
      data: bantQualification.need,
      color: 'purple'
    },
    {
      key: 'timeline',
      label: 'Timeline',
      icon: Clock,
      data: bantQualification.timeline,
      color: 'fuchsia'
    }
  ].filter(item => item.data && !item.data.asked && item.data.question);

  if (unansweredQuestions.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-violet-900 dark:text-violet-100">
          <MessageCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Smart BANT Qualification Questions
        </CardTitle>
        <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
          AI-generated contextual questions based on your conversation
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {unansweredQuestions.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="p-4 bg-white dark:bg-gray-900/50 border border-violet-200 dark:border-violet-800/50 rounded-lg hover:shadow-md transition-shadow"
              data-testid={`bant-question-${item.key}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex-shrink-0">
                  <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.data?.question}
                  </p>
                  {onQuestionClick && item.data?.question && (
                    <Button
                      onClick={() => onQuestionClick(item.data?.question!)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs h-8 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                      data-testid={`button-use-bant-${item.key}`}
                    >
                      Use this question
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 border-t border-violet-200 dark:border-violet-800/50">
          <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
            {unansweredQuestions.length} qualification {unansweredQuestions.length === 1 ? 'question' : 'questions'} pending
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
