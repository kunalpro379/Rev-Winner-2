import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
}

export function SalesAssistantQA({
  sessionId,
  conversationContext,
  domainExpertise,
  domainExpertiseId,
  resetVersion = 0,
}: SalesAssistantQAProps) {
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const { toast } = useToast();
  const qaMessagesEndRef = useRef<HTMLDivElement>(null);
  const prevSessionIdRef = useRef<string>(sessionId);

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
      qaMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [qaMessages]);

  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest(
        "POST",
        `/api/conversations/${sessionId}/ask`,
        {
          question,
          conversationContext,
          domainExpertise,
          domainExpertiseId,
        },
      );
      return response.json();
    },
    onSuccess: (data) => {
      setQaMessages((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: data.answer,
          timestamp: new Date(),
        },
      ]);
      setCurrentQuestion("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to answer question",
        variant: "destructive",
      });
    },
  });

  const handleAskQuestion = () => {
    if (!currentQuestion.trim()) return;
    askQuestionMutation.mutate(currentQuestion);
  };

  if (!sessionId) return null;

  return (
    <Card className="card-shadow-lg border-border/50">
      <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-b border-border/50 pb-4">
        <CardTitle className="text-base flex items-center gap-2 font-semibold">
          <MessageCircle className="h-5 w-5 text-cyan-600" />
          Sales Assistant Q&A
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Ask anything - get sales-focused insights in bulleted points
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Q&A Messages */}
        {qaMessages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
            {qaMessages.map((msg, index) => (
              <div key={index} className="space-y-2">
                {/* Question */}
                <div className="flex justify-end">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 max-w-[85%]">
                    <p className="text-sm font-medium text-foreground">
                      {msg.question}
                    </p>
                  </div>
                </div>
                {/* Answer */}
                <div className="flex justify-start">
                  <div className="bg-muted/50 border border-border/30 rounded-lg px-3 py-2 max-w-[85%]">
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {msg.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={qaMessagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask any question - conversation insights, strategies, objection handling, etc..."
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
            disabled={askQuestionMutation.isPending}
            data-testid="input-ask-question"
            className="flex-1"
          />
          <Button
            onClick={handleAskQuestion}
            disabled={!currentQuestion.trim() || askQuestionMutation.isPending}
            data-testid="button-send-question"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {askQuestionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
