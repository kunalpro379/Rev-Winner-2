import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChatbotLeadForm, type ChatbotLead } from "@/components/chatbot-lead-form";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotSession {
  leadData: ChatbotLead | null;
  messages: Message[];
  sessionId: string;
}

interface RevWinnerChatbotProps {
  embedded?: boolean;
}

const STORAGE_KEY = "revwinner_chatbot_session";

export function RevWinnerChatbot({ embedded = false }: RevWinnerChatbotProps) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [leadData, setLeadData] = useState<ChatbotLead | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(true);
  const [sessionId] = useState(() => `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm the Rev Winner AI Assistant. Ask me anything about Rev Winner - features, pricing, setup, how we compare to competitors, or how to get started!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session: ChatbotSession = JSON.parse(saved);
        if (session.leadData) {
          setLeadData(session.leadData);
          setShowLeadForm(false);
        }
        if (session.messages && session.messages.length > 1) {
          setMessages(session.messages);
        }
      }
    } catch (error) {
      console.error("Failed to load chatbot session:", error);
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (leadData || messages.length > 1) {
      try {
        const session: ChatbotSession = {
          leadData,
          messages,
          sessionId,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (error) {
        console.error("Failed to save chatbot session:", error);
      }
    }
  }, [leadData, messages, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLeadSubmit = async (lead: ChatbotLead) => {
    setIsLoading(true);
    try {
      // Save lead to backend
      await apiRequest("POST", "/api/chatbot/lead", {
        leadData: lead,
        sessionId,
      });
      
      setLeadData(lead);
      setShowLeadForm(false);
      
      toast({
        title: "Thank you!",
        description: "You can now start chatting with our AI assistant.",
      });
    } catch (error: any) {
      console.error("Lead submission error:", error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !leadData) return;

    const userMessage = input.trim();
    setInput("");
    const newUserMessage = { role: "user" as const, content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Include the new user message in the conversation history
      const contextWithNewMessage = [...messages, newUserMessage];
      
      const res = await apiRequest("POST", "/api/chatbot/rev-winner", {
        message: userMessage,
        conversationHistory: contextWithNewMessage,
        leadData,
        sessionId,
      });

      const data: any = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I'm having trouble responding right now. Please try again or contact support@revwinner.com for help."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What is Rev Winner?",
    "How much does it cost?",
    "How is Rev Winner different from Gong?",
    "What AI providers are supported?",
    "How do I get started?"
  ];

  const handleSuggestedQuestion = async (question: string) => {
    if (isLoading || !leadData) return;
    
    setInput("");
    const newUserMessage = { role: "user" as const, content: question };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Include the new user message in the conversation history
      const contextWithNewMessage = [...messages, newUserMessage];
      
      const res = await apiRequest("POST", "/api/chatbot/rev-winner", {
        message: question,
        conversationHistory: contextWithNewMessage,
        leadData,
        sessionId,
      });

      const data: any = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I'm having trouble responding right now. Please try again or contact support@revwinner.com for help."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (embedded) {
    return (
      <Card className="border-purple-200 dark:border-purple-700 shadow-xl">
        <div className="flex flex-col h-[600px]">
          <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Rev Winner AI Assistant</h3>
                <p className="text-sm text-purple-100">Ask me anything about Rev Winner</p>
              </div>
            </div>
          </div>

          {showLeadForm ? (
            <div className="flex-1 p-6 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:to-purple-950/30 overflow-y-auto">
              <ChatbotLeadForm onSubmit={handleLeadSubmit} isLoading={isLoading} />
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-6 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:to-purple-950/30" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-purple-200 dark:border-purple-700"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Rev Winner AI</span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
            </div>

            {messages.length === 1 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Suggested questions:</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="block w-full text-left px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    data-testid={`suggested-question-${index}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

              <div className="p-4 bg-white dark:bg-slate-900 border-t border-purple-200 dark:border-purple-700 rounded-b-lg">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about features, pricing, setup..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                    data-testid="chatbot-input"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    data-testid="chatbot-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-110 z-[9999]"
          data-testid="chatbot-toggle"
          style={{ pointerEvents: 'auto' }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 z-[9999] shadow-2xl">
          <Card className="border-purple-200 dark:border-purple-700">
            <div className="flex flex-col h-[500px]">
              <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">Rev Winner Assistant</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  data-testid="chatbot-close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {showLeadForm ? (
                <div className="flex-1 p-4 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:to-purple-950/30 overflow-y-auto">
                  <ChatbotLeadForm onSubmit={handleLeadSubmit} isLoading={isLoading} />
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:to-purple-950/30" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${message.role}-${index}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-purple-200 dark:border-purple-700"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-1 mb-1">
                            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">AI</span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-2xl px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      </div>
                    </div>
                  )}
                </div>

                {messages.length === 1 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Try asking:</p>
                    {suggestedQuestions.slice(0, 3).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="block w-full text-left px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        data-testid={`suggested-question-${index}`}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-purple-200 dark:border-purple-700 rounded-b-lg">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1 text-sm"
                        data-testid="chatbot-input"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                        data-testid="chatbot-send"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
