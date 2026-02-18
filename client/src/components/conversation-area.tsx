import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, TrendingUp, Loader2 } from "lucide-react";

interface ConversationAreaProps {
  children?: React.ReactNode;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  hasAnalysis?: boolean;
  isAnalyzing?: boolean;
}

export function ConversationArea({ children, onRegenerate, isRegenerating = false, hasAnalysis = false, isAnalyzing = false }: ConversationAreaProps) {
  return (
    <Card className="card-shadow-lg border-border/50 w-full">
      <CardHeader className="border-b border-border/50 pb-4 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold">Conversation Analysis</CardTitle>
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400 flex-shrink-0">
                  Beta
                </Badge>
                {hasAnalysis && !isAnalyzing && (
                  <Badge variant="default" className="text-xs bg-purple-600 flex-shrink-0">
                    Active
                  </Badge>
                )}
                {isAnalyzing && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex-shrink-0">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Analyzing
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI-powered insights to help close deals: discovery questions, solutions, and case studies
              </p>
            </div>
          </div>

          {hasAnalysis && onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating || isAnalyzing}
              data-testid="button-regenerate-analysis"
              className="gap-2 flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 max-h-[600px] overflow-y-auto" data-testid="conversation-area">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-full mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">Analyzing Conversation</p>
            <p className="text-sm text-muted-foreground max-w-md text-center leading-relaxed">
              AI is processing your conversation to extract insights, discovery questions, and recommendations...
            </p>
          </div>
        ) : (
          <div className="w-full min-w-0">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
