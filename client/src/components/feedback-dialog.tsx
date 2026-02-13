import { useState, useRef, useCallback, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquarePlus, Bug, Lightbulb, TrendingUp, MessageCircle, Gauge, Palette,
  Send, Loader2, CheckCircle, Clock, ChevronRight, Camera, X, Image,
  User, Mail, Phone,
} from "lucide-react";

const categories = [
  { value: "bug_report", label: "Bug Report", icon: Bug, color: "text-red-500" },
  { value: "feature_request", label: "Feature Request", icon: Lightbulb, color: "text-amber-500" },
  { value: "improvement", label: "Improvement", icon: TrendingUp, color: "text-green-500" },
  { value: "performance", label: "Performance", icon: Gauge, color: "text-blue-500" },
  { value: "ui_ux", label: "UI/UX", icon: Palette, color: "text-purple-500" },
  { value: "general", label: "General", icon: MessageCircle, color: "text-gray-500" },
];

const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
];

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

interface FeedbackItem {
  id: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("submit");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const userName = authData?.user
    ? `${authData.user.firstName || ''} ${authData.user.lastName || ''}`.trim()
    : '';
  const userEmail = authData?.user?.email || '';
  const userPhone = authData?.user?.phone || authData?.user?.mobileNumber || '';

  const { data: feedbackHistory, isLoading: isLoadingHistory } = useQuery<{ success: boolean; data: FeedbackItem[] }>({
    queryKey: ['/api/feedback'],
    enabled: open && activeTab === "history" && !!authData,
  });

  const handleScreenshotCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Screenshot must be under 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotData(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/feedback', {
        category,
        subject,
        message,
        priority,
        page: location,
        userPhone: userPhone || undefined,
        screenshotUrl: screenshotData || undefined,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setSubmitted(true);
        queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback! Our support team will review it shortly.",
        });
        setTimeout(() => {
          setCategory("");
          setSubject("");
          setMessage("");
          setPriority("medium");
          setScreenshotData(null);
          setSubmitted(false);
        }, 2000);
      }
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Could not submit your feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!category || !subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const isSubmitting = submitMutation.isPending;
  const canSubmit = category && subject.trim() && message.trim() && !isSubmitting;

  if (!authData) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSubmitted(false); setScreenshotData(null); } }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          data-testid="feedback-trigger"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-blue-500" />
            Feedback & Support
          </DialogTitle>
          <DialogDescription>
            Report issues or suggest improvements. Your feedback goes directly to our support team.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit">Submit</TabsTrigger>
            <TabsTrigger value="history">My Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="mt-4">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-lg font-medium">Thank you!</p>
                <p className="text-sm text-muted-foreground text-center">
                  Your feedback has been submitted and our support team will review it.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{userName || 'User'}</span>
                    <span className="mx-1">|</span>
                    <Mail className="h-3 w-3" />
                    <span>{userEmail || 'Not set'}</span>
                    {userPhone && (
                      <>
                        <span className="mx-1">|</span>
                        <Phone className="h-3 w-3" />
                        <span>{userPhone}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                              : 'border-border hover:border-blue-300 hover:bg-muted/50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-500' : cat.color}`} />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your feedback"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Details *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your feedback in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                p.value === 'low' ? 'bg-green-500' : p.value === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              {p.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Screenshot</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {screenshotData ? (
                      <div className="relative w-[120px] h-[36px] rounded border overflow-hidden group">
                        <img src={screenshotData} alt="Screenshot" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setScreenshotData(null)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-9"
                        onClick={handleScreenshotCapture}
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Attach
                      </Button>
                    )}
                  </div>
                </div>

                {screenshotData && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 rounded p-2 border border-green-200 dark:border-green-800">
                    <Image className="h-3.5 w-3.5 text-green-600" />
                    <span>Screenshot attached</span>
                    <button
                      onClick={() => setScreenshotData(null)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : feedbackHistory?.data?.length ? (
              <ScrollArea className="h-[350px]">
                <div className="space-y-3 pr-3">
                  {feedbackHistory.data.map((item) => {
                    const cat = categories.find(c => c.value === item.category);
                    const CatIcon = cat?.icon || MessageCircle;
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CatIcon className={`h-3.5 w-3.5 flex-shrink-0 ${cat?.color || ''}`} />
                            <span className="text-sm font-medium truncate">{item.subject}</span>
                          </div>
                          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusColors[item.status] || ''}`}>
                            {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.message}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{cat?.label || item.category}</Badge>
                            <Badge variant="outline" className={`text-[10px] ${priorities.find(p => p.value === item.priority)?.color || ''}`}>
                              {item.priority}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {item.adminNotes && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              <span className="font-medium">Response: </span>
                              {item.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <MessageCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">No feedback submitted yet</p>
                <Button variant="link" size="sm" onClick={() => setActiveTab("submit")}>
                  Submit your first feedback
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function FloatingFeedbackButton() {
  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  if (!authData) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <FeedbackDialog />
    </div>
  );
}
