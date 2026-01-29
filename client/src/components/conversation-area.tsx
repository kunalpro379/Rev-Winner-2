import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, TrendingUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ConversationAreaProps {
  children?: React.ReactNode;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  hasAnalysis?: boolean;
}

export function ConversationArea({ children, onRegenerate, isRegenerating = false, hasAnalysis = false }: ConversationAreaProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="card-shadow-lg border-border/50 overflow-hidden w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="border-b border-border/50 pb-4 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="toggle-conversation-analysis">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
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
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground ml-2" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground ml-2" />
              )}
            </CollapsibleTrigger>
            
            {hasAnalysis && onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                disabled={isRegenerating}
                data-testid="button-regenerate-analysis"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
          </div>
          <CollapsibleContent>
            <p className="text-xs text-muted-foreground mt-2">
              AI-powered insights to help close deals: discovery questions, solutions, and case studies
            </p>
          </CollapsibleContent>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="p-4">
            <div className="min-h-[200px]" data-testid="conversation-area">
              {children || (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">
                    No analysis yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 max-w-sm">
                    Select specific transcript segments or analyze the full conversation using the "Analyze" button in the Live Transcript section
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
