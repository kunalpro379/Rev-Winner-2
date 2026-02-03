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

export function SalesAssistantQA({ sessionId, conversationContext, domainExpertise, domainExpertiseId, resetVersion = 0 }: SalesAssistantQAProps) {
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const { toast } = useToast();
  const qaMessagesEndRef = useRef<HTMLDivElement>(null);
  const prevSessionIdRef = useRef<string>(sessionId);

  // Parse markdown formatting in text
  const parseMarkdownText = (text: string): JSX.Element | string => {
    if (!text) return text;
    
    const parts: (string | JSX.Element)[] = [];
    let currentIndex = 0;
    let keyCounter = 0;
    
    // Combined pattern for **bold** and *italic* text - fixed regex
    const markdownPattern = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
    let match;
    
    while ((match = markdownPattern.exec(text)) !== null) {
      // Add text before formatting
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }
      
      if (match[1]) {
        // Bold text (**text**)
        parts.push(
          <strong key={`bold-${keyCounter++}`} className="font-bold text-foreground">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic text (*text*)
        parts.push(
          <em key={`italic-${keyCounter++}`} className="italic text-foreground">
            {match[4]}
          </em>
        );
      }
      
      currentIndex = markdownPattern.lastIndex;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 1 ? <>{parts}</> : text;
  };

  // Parse answer with proper formatting for bullets and sections
  const parseAnswer = (answer: string): JSX.Element => {
    const lines = answer.split('\n');
    const sections: JSX.Element[] = [];
    let currentIndex = 0;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        currentIndex++;
        return;
      }

      // Check if line is a bullet point (•, -, or numbers)
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
        const bulletText = trimmed.replace(/^[•\-\d+.]\s*/, '').trim();
        sections.push(
          <div key={`bullet-${currentIndex}`} className="flex gap-3 mb-2">
            <span className="text-cyan-600 font-bold flex-shrink-0 mt-0.5">•</span>
            <span className="text-sm text-foreground flex-1 leading-relaxed">{parseMarkdownText(bulletText)}</span>
          </div>
        );
      } 
      // Check for **Quick Answer:** pattern
      else if (trimmed.toLowerCase().includes('quick answer:')) {
        sections.push(
          <div key={`quick-answer-${currentIndex}`} className="font-bold text-foreground mt-3 mb-2 text-sm">
            <span className="text-cyan-700 dark:text-cyan-400">Quick Answer:</span>
            <span className="font-normal ml-1">{parseMarkdownText(trimmed.replace(/\*\*quick answer:\*\*/i, '').replace(/quick answer:/i, '').trim())}</span>
          </div>
        );
      }
      // Check for **Key Points:** pattern
      else if (trimmed.toLowerCase().includes('key points:')) {
        sections.push(
          <div key={`key-points-${currentIndex}`} className="font-bold text-foreground mt-4 mb-2 text-sm text-purple-700 dark:text-purple-400">
            Key Points:
          </div>
        );
      }
      // Check for **Suggest:** pattern  
      else if (trimmed.toLowerCase().includes('suggest:')) {
        sections.push(
          <div key={`suggest-${currentIndex}`} className="font-bold text-foreground mt-3 mb-2 text-sm">
            <span className="text-green-700 dark:text-green-400">Suggest:</span>
            <span className="font-normal ml-1">{parseMarkdownText(trimmed.replace(/\*\*suggest:\*\*/i, '').replace(/suggest:/i, '').trim())}</span>
          </div>
        );
      }
      // Check for other section headers (ends with : or contains **)
      else if ((trimmed.endsWith(':') && trimmed.length < 80) || (trimmed.includes('**') && trimmed.includes(':'))) {
        sections.push(
          <div key={`section-${currentIndex}`} className="font-bold text-foreground mt-4 mb-2 text-sm">
            {parseMarkdownText(trimmed)}
          </div>
        );
      } 
      // Regular paragraph text
      else {
        sections.push(
          <p key={`text-${currentIndex}`} className="text-sm text-foreground mb-2 leading-relaxed">
            {parseMarkdownText(trimmed)}
          </p>
        );
      }
      
      currentIndex++;
    });

    return <div className="space-y-1">{sections}</div>;
  };

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

  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", `/api/conversations/${sessionId}/ask`, {
        question,
        conversationContext,
        domainExpertise,
        domainExpertiseId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQaMessages(prev => [...prev, {
        question: currentQuestion,
        answer: data.answer,
        timestamp: new Date()
      }]);
      setCurrentQuestion("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to answer question",
        variant: "destructive"
      });
    }
  });

  const handleAskQuestion = () => {
    if (!currentQuestion.trim()) return;
    askQuestionMutation.mutate(currentQuestion);
  };

  if (!sessionId) return null;

  return (
    <Card className="card-shadow-lg border-border/50 flex flex-col h-full">
      <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-b border-border/50 pb-4">
        <CardTitle className="text-base flex items-center gap-2 font-semibold">
          <MessageCircle className="h-5 w-5 text-cyan-600" />
          Sales Assistant Q&A
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Ask anything - get sales-focused insights in bulleted points</p>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col flex-1 overflow-hidden">
        {/* Q&A Messages */}
        {qaMessages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
            {qaMessages.map((msg, index) => (
              <div key={index} className="space-y-2">
                {/* Question */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-br from-cyan-600/15 to-cyan-500/10 border border-cyan-600/30 rounded-lg px-4 py-2.5 max-w-[80%] shadow-sm">
                    <p className="text-sm font-medium text-foreground">{msg.question}</p>
                  </div>
                </div>
                {/* Answer */}
                <div className="flex justify-start">
                  <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 rounded-lg px-4 py-3 max-w-[90%] shadow-sm">
                    <div className="text-sm text-foreground">
                      {parseAnswer(msg.answer)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={qaMessagesEndRef} />
          </div>
        )}
        
        {/* Input Area */}
        <div className="flex gap-2 pt-2 border-t border-border/30 mt-auto">
          <Input
            placeholder="Ask a question..."
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !askQuestionMutation.isPending && handleAskQuestion()}
            disabled={askQuestionMutation.isPending}
            data-testid="input-ask-question"
            className="flex-1 text-sm bg-background border-border/50 focus-visible:ring-cyan-600/50"
          />
          <Button
            onClick={handleAskQuestion}
            disabled={!currentQuestion.trim() || askQuestionMutation.isPending}
            data-testid="button-send-question"
            size="sm"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-3"
            title="Send question (or press Enter)"
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
