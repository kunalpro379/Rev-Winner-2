import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseMarkdown } from "@/lib/markdown-parser";

interface QAMessage {
  question: string;
  answer: string;
  timestamp: Date;
}

interface SalesAssistantQAProps {
  sessionId: string;
  conversationContext?: string;
  domainExpertise?: string;
  domainExpertiseId?: string;
  resetVersion?: number;
  variant?: "card" | "embedded";
}

export function SalesAssistantQA({ sessionId, conversationContext, domainExpertise, domainExpertiseId, resetVersion = 0, variant = "card" }: SalesAssistantQAProps) {
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const { toast } = useToast();
  const qaMessagesEndRef = useRef<HTMLDivElement>(null);
  const prevSessionIdRef = useRef<string>(sessionId);
  const submitTimeoutRef = useRef<NodeJS.Timeout>();

  // Clear messages when session changes or resetVersion increments
  useEffect(() => {
    if (resetVersion > 0 || sessionId !== prevSessionIdRef.current) {
      setQaMessages([]);
      setCurrentQuestion("");
      prevSessionIdRef.current = sessionId;
    }
  }, [resetVersion, sessionId]);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (qaMessagesEndRef.current) {
      qaMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaMessages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      console.log(`📝 Q&A Request: ${question.slice(0, 50)}...`);
      
      try {
        const response = await fetch(`/api/conversations/${sessionId}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            conversationContext,
            domainExpertise,
            domainExpertiseId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Q&A Response:`, data);
        return data;
      } catch (error) {
        console.error(`❌ Q&A Error:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`💬 Adding message to Q&A:`, { question: currentQuestion, answer: data.answer });
      setQaMessages(prev => [...prev, {
        question: currentQuestion,
        answer: data.answer,
        timestamp: new Date()
      }]);
      setCurrentQuestion("");
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Failed to answer question";
      console.error(`🚨 Q&A Toast Error: ${errorMsg}`);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  });

  const handleAskQuestion = () => {
    if (!currentQuestion.trim() || askQuestionMutation.isPending) return;
    
    // Prevent rapid consecutive requests
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    // Use requestIdleCallback or setTimeout to defer execution (doesn't block UI)
    submitTimeoutRef.current = setTimeout(() => {
      askQuestionMutation.mutate(currentQuestion);
    }, 0);
  };

  if (!sessionId) return null;

  const content = (
    <div className="flex flex-col h-full gap-0">
      {/* Q&A Messages - Scrollable area with max-height and internal scrolling */}
      <div className="flex-1 overflow-y-auto max-h-[500px] pb-2 border-b border-border/30">
        {qaMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              Ask a question to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {qaMessages.map((msg, index) => (
              <div key={index} className="space-y-2">
                {/* Question */}
                <div className="flex justify-end">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 max-w-[85%]">
                    <p className="text-sm font-medium text-foreground">{msg.question}</p>
                  </div>
                </div>
                {/* Answer - with proper markdown parsing */}
                <div className="flex justify-start">
                  <div className="bg-muted/50 border border-border/30 rounded-lg px-3 py-2 max-w-[85%] text-sm text-foreground">
                    {typeof msg.answer === 'string' ? (
                      parseMarkdown(msg.answer)
                    ) : (
                      msg.answer
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={qaMessagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Always at bottom, shrinks-to-fit */}
      <div className="flex gap-2 pt-3 bg-background flex-shrink-0">
        <Input
          placeholder="Ask any question - conversation insights, strategies..."
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          onKeyPress={(e) => {
            // Don't submit if already pending
            if (e.key === 'Enter' && !askQuestionMutation.isPending) {
              handleAskQuestion();
            }
          }}
          disabled={askQuestionMutation.isPending}
          data-testid="input-ask-question"
          className="flex-1"
        />
        <Button
          onClick={handleAskQuestion}
          disabled={!currentQuestion.trim() || askQuestionMutation.isPending}
          data-testid="button-send-question"
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 flex-shrink-0"
          title={askQuestionMutation.isPending ? "Processing..." : "Send question"}
        >
          {askQuestionMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return <div className="h-full p-3 flex flex-col">{content}</div>;
  }

  return (
    <Card className="card-shadow-lg border-border/50">
      <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-b border-border/50 pb-4">
        <CardTitle className="text-base flex items-center gap-2 font-semibold">
          <MessageCircle className="h-5 w-5 text-cyan-600" />
          Sales Assistant Q&A
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Ask anything - get sales-focused insights in bulleted points</p>
      </CardHeader>
      <CardContent className="pt-4">
        {content}
      </CardContent>
    </Card>
  );
}
