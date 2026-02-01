import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp } from "lucide-react";

interface ConversationAreaProps {
  children?: React.ReactNode;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  hasAnalysis?: boolean;
}

export function ConversationArea({ children, onRegenerate, isRegenerating = false, hasAnalysis = false }: ConversationAreaProps) {
  return (
    <Card className="card-shadow-lg border-border/50 overflow-hidden w-full">
      <CardHeader className="border-b border-border/50 pb-4 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Conversation Analysis</CardTitle>
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                  Beta
                </Badge>
                {hasAnalysis && (
                  <Badge variant="default" className="text-xs bg-purple-600">
                    Active
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
              disabled={isRegenerating}
              data-testid="button-regenerate-analysis"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5" data-testid="conversation-area">
        {children}
      </CardContent>
    </Card>
  );
}
