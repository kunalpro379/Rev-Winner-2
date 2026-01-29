import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Brain,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoachingSuggestion {
  id: string;
  type: 'question' | 'objection' | 'next-step' | 'discovery' | 'closing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  content: string;
  context?: string;
  timestamp: Date;
  acknowledged?: boolean;
}

interface SalesInsight {
  id: string;
  category: 'pain-point' | 'requirement' | 'budget' | 'timeline' | 'decision-maker' | 'objection';
  content: string;
  confidence: number;
  timestamp: Date;
}

interface SalesCoachingOverlayProps {
  sessionId: string;
  transcriptEntries: any[];
  onSuggestionUsed?: (suggestion: CoachingSuggestion) => void;
}

export default function SalesCoachingOverlay({ 
  sessionId, 
  transcriptEntries,
  onSuggestionUsed 
}: SalesCoachingOverlayProps) {
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([]);
  const [insights, setInsights] = useState<SalesInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<CoachingSuggestion[]>([]);
  const [roles, setRoles] = useState<{ salesRep: string[]; customers: string[] } | null>(null);

  // Analyze conversation and generate coaching suggestions using real AI
  useEffect(() => {
    if (transcriptEntries.length === 0) return;

    const analyzeConversation = async () => {
      setIsAnalyzing(true);
      
      try {
        const recentMessages = transcriptEntries.slice(-4);
        const conversationContext = recentMessages.map(e => e.text).join(' ');
        
        // Call real AI coaching endpoint
        const response = await fetch(`/api/conversations/${sessionId}/coaching`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationContext,
            transcriptEntries,
            currentInsights: insights
          }),
        });

        if (response.ok) {
          const coaching = await response.json();
          
          // Store role identification
          if (coaching.roles) {
            setRoles(coaching.roles);
          }
          
          // Transform AI suggestions to match our component interface
          const newSuggestions: CoachingSuggestion[] = coaching.suggestions.map((s: {
            type: 'question' | 'objection' | 'next-step' | 'discovery' | 'closing';
            priority: 'low' | 'medium' | 'high' | 'urgent';
            title: string;
            content: string;
            context?: string;
          }) => ({
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: s.type,
            priority: s.priority,
            title: s.title,
            content: s.content,
            context: s.context,
            timestamp: new Date()
          }));

          const newInsights: SalesInsight[] = coaching.insights.map((i: {
            category: 'pain-point' | 'requirement' | 'budget' | 'timeline' | 'decision-maker' | 'objection';
            content: string;
            confidence: number;
          }) => ({
            id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            category: i.category,
            content: i.content,
            confidence: i.confidence,
            timestamp: new Date()
          }));
          
          setSuggestions(prev => {
            const existing = prev.filter(s => !s.acknowledged);
            return [...existing, ...newSuggestions];
          });
          
          setInsights(prev => [...prev, ...newInsights]);
          
          // Check for urgent suggestions that should be shown as alerts
          const urgentSuggestions = newSuggestions.filter(s => s.priority === 'urgent');
          if (urgentSuggestions.length > 0) {
            setActiveAlerts(prev => [...prev, ...urgentSuggestions]);
          }
        } else {
          console.error('Failed to get coaching suggestions:', response.statusText);
          // Fallback to basic heuristic suggestions if AI fails
          const fallbackSuggestions = generateContextualSuggestions(conversationContext, transcriptEntries.length);
          setSuggestions(prev => {
            const existing = prev.filter(s => !s.acknowledged);
            return [...existing, ...fallbackSuggestions];
          });
        }
        
      } catch (error) {
        console.error('Error analyzing conversation:', error);
        // Fallback to basic heuristic suggestions if AI fails
        const recentMessages = transcriptEntries.slice(-5);
        const conversationContext = recentMessages.map(e => e.text).join(' ');
        const fallbackSuggestions = generateContextualSuggestions(conversationContext, transcriptEntries.length);
        setSuggestions(prev => {
          const existing = prev.filter(s => !s.acknowledged);
          return [...existing, ...fallbackSuggestions];
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Analyze every 4 messages for faster performance (was 3)
    const shouldAnalyze = transcriptEntries.length % 4 === 0;
    
    if (shouldAnalyze) {
      analyzeConversation();
    }
  }, [transcriptEntries, sessionId, insights]);

  const generateContextualSuggestions = (context: string, messageCount: number): CoachingSuggestion[] => {
    const suggestions: CoachingSuggestion[] = [];
    const contextLower = context.toLowerCase();
    
    // Early conversation suggestions
    if (messageCount < 10) {
      suggestions.push({
        id: `early-${Date.now()}`,
        type: 'discovery',
        priority: 'medium',
        title: 'Discovery Questions',
        content: 'Ask about their current IT challenges and pain points',
        context: 'Early in conversation - focus on discovery',
        timestamp: new Date()
      });
    }
    
    // Pain point identification
    if (contextLower.includes('problem') || contextLower.includes('issue') || contextLower.includes('challenge')) {
      suggestions.push({
        id: `pain-${Date.now()}`,
        type: 'question',
        priority: 'high',
        title: 'Probe Pain Points',
        content: 'Ask: "Can you quantify the impact of this issue on your operations?"',
        context: 'Customer mentioned challenges',
        timestamp: new Date()
      });
    }
    
    // Budget discussions
    if (contextLower.includes('budget') || contextLower.includes('cost') || contextLower.includes('price')) {
      suggestions.push({
        id: `budget-${Date.now()}`,
        type: 'next-step',
        priority: 'high',
        title: 'Value Discussion',
        content: 'Pivot to ROI and value proposition rather than just price',
        context: 'Budget concerns raised',
        timestamp: new Date()
      });
    }
    
    // Timeline discussions
    if (contextLower.includes('timeline') || contextLower.includes('when') || contextLower.includes('implementation')) {
      suggestions.push({
        id: `timeline-${Date.now()}`,
        type: 'question',
        priority: 'medium',
        title: 'Implementation Planning',
        content: 'Ask about their ideal go-live date and any constraints',
        context: 'Timeline discussion started',
        timestamp: new Date()
      });
    }
    
    // Decision maker identification
    if (contextLower.includes('team') || contextLower.includes('approval') || contextLower.includes('decision')) {
      suggestions.push({
        id: `decision-${Date.now()}`,
        type: 'discovery',
        priority: 'high',
        title: 'Decision Process',
        content: 'Identify all stakeholders in the decision-making process',
        context: 'Decision-making process mentioned',
        timestamp: new Date()
      });
    }
    
    // Objection handling
    if (contextLower.includes('but') || contextLower.includes('however') || contextLower.includes('concerned')) {
      suggestions.push({
        id: `objection-${Date.now()}`,
        type: 'objection',
        priority: 'urgent',
        title: 'Address Concerns',
        content: 'Acknowledge their concern and ask clarifying questions',
        context: 'Potential objection detected',
        timestamp: new Date()
      });
    }
    
    return suggestions;
  };

  const extractSalesInsights = (context: string): SalesInsight[] => {
    const insights: SalesInsight[] = [];
    const contextLower = context.toLowerCase();
    
    // Extract pain points
    if (contextLower.includes('slow') || contextLower.includes('inefficient') || contextLower.includes('manual')) {
      insights.push({
        id: `insight-${Date.now()}`,
        category: 'pain-point',
        content: 'Process efficiency issues identified',
        confidence: 0.8,
        timestamp: new Date()
      });
    }
    
    // Extract budget signals
    if (contextLower.includes('budget') && (contextLower.includes('limited') || contextLower.includes('tight'))) {
      insights.push({
        id: `budget-insight-${Date.now()}`,
        category: 'budget',
        content: 'Budget constraints mentioned',
        confidence: 0.9,
        timestamp: new Date()
      });
    }
    
    return insights;
  };

  const acknowledgeSuggestion = (suggestionId: string) => {
    setSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, acknowledged: true } : s)
    );
    
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      onSuggestionUsed?.(suggestion);
    }
  };

  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getPriorityColor = (priority: CoachingSuggestion['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getTypeIcon = (type: CoachingSuggestion['type']) => {
    switch (type) {
      case 'question':
        return <MessageSquare className="h-4 w-4" />;
      case 'objection':
        return <AlertTriangle className="h-4 w-4" />;
      case 'next-step':
        return <Target className="h-4 w-4" />;
      case 'closing':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: SalesInsight['category']) => {
    switch (category) {
      case 'pain-point':
        return <AlertTriangle className="h-3 w-3" />;
      case 'budget':
        return <TrendingUp className="h-3 w-3" />;
      case 'timeline':
        return <Clock className="h-3 w-3" />;
      default:
        return <Brain className="h-3 w-3" />;
    }
  };

  const activeSuggestions = suggestions.filter(s => !s.acknowledged);

  return (
    <div className="space-y-4">
      {/* Urgent Alerts */}
      <AnimatePresence>
        {activeAlerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative"
          >
            <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse">
              <Zap className="h-4 w-4 text-red-500" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong className="text-red-700 dark:text-red-300">{alert.title}</strong>
                  <p className="text-red-600 dark:text-red-400">{alert.content}</p>
                </div>
                <Button
                  onClick={() => dismissAlert(alert.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  data-testid={`button-dismiss-alert-${alert.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Coaching Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Sales Coaching
            {isAnalyzing && (
              <Badge variant="secondary" className="animate-pulse">
                Analyzing...
              </Badge>
            )}
            {activeSuggestions.length > 0 && (
              <Badge variant="default">
                {activeSuggestions.length} suggestions
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {roles && (roles.salesRep.length > 0 || roles.customers.length > 0) && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Coaching for Sales Rep
              </p>
              <div className="text-xs space-y-1">
                {roles.customers.length > 0 && (
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Customers:</span> {roles.customers.join(', ')}
                  </p>
                )}
                {roles.salesRep.length > 0 && (
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Sales Rep:</span> {roles.salesRep.join(', ')}
                  </p>
                )}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                All suggestions below are for the sales rep to use when responding to customers
              </p>
            </div>
          )}
          
          <ScrollArea className="h-64">
            {activeSuggestions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>AI coaching suggestions will appear here</p>
                  <p className="text-sm">Start conversing to receive personalized guidance</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSuggestions.map(suggestion => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border-l-4 ${getPriorityColor(suggestion.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {getTypeIcon(suggestion.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                            <Badge 
                              variant={suggestion.priority === 'urgent' ? 'destructive' : 'secondary'} 
                              className="text-xs"
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.content}
                          </p>
                          {suggestion.context && (
                            <p className="text-xs text-muted-foreground italic">
                              Context: {suggestion.context}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => acknowledgeSuggestion(suggestion.id)}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-acknowledge-${suggestion.id}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sales Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sales Insights
              <Badge variant="secondary">{insights.length}</Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {insights.slice(-5).map(insight => (
                  <div key={insight.id} className="flex items-center gap-2 text-sm">
                    {getCategoryIcon(insight.category)}
                    <span className="flex-1">{insight.content}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(insight.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}