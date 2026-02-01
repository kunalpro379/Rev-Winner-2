import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getProductReference, getPartnerServiceRecommendations, getRelationshipOneLiners, type OneLiner, type RelationshipBuildersResponse } from "@/lib/conversation";
import { apiRequest } from "@/lib/queryClient";
import { PartnerServiceRecommendation, ProductReference } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Download, Calendar, Clock, Users, Building2, Target, MessageSquare, CheckCircle2, TrendingUp, ListTodo, CalendarClock, FileText as FileTextIcon, StickyNote, Copy, RefreshCw, Edit, Save, Upload, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import pdfBannerUrl from '@assets/IMG_20251213_202308_1765637622298.jpg';

interface CallSummary {
  keyChanges: string[];
  discoveryInsights: string[];
  objections: string[];
  nextSteps: string[];
  recommendedSolutions: string[];
}

interface MeetingMinutes {
  date: string;
  time: string;
  duration: string;
  repName?: string;
  attendees: string[];
  companyName: string;
  opportunityName: string;
  meetingType: string;
  discussionSummary: string;
  discoveryQA: Array<{ question: string; answer: string }>;
  bant: {
    budget: string;
    authority: string;
    need: string;
    timeline: string;
  };
  challenges: string[];
  keyInsights: string[];
  actionItems: Array<{ action: string; owner: string; deadline: string }>;
  followUpPlan: {
    nextMeetingDate: string;
    documentsToShare: string[];
    internalAlignment: string[];
  };
  notes: string;
}

// Meeting Minutes Content Component
function MeetingMinutesContent({ minutes, isEditing, editedMinutes, setEditedMinutes }: { 
  minutes: MeetingMinutes;
  isEditing: boolean;
  editedMinutes: MeetingMinutes;
  setEditedMinutes: (minutes: MeetingMinutes) => void;
}) {
  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide" data-testid="meeting-minutes-content">

      {/* Header Information - Date & Time are READ-ONLY */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-primary" />
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{minutes.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-primary" />
          <div>
            <p className="text-muted-foreground">Time</p>
            <p className="font-medium">{minutes.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-primary" />
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">{minutes.duration}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-3 w-3 text-primary" />
          <div className="w-full">
            <p className="text-muted-foreground mb-1">Meeting Type</p>
            {isEditing ? (
              <Input 
                value={editedMinutes.meetingType}
                onChange={(e) => setEditedMinutes({...editedMinutes, meetingType: e.target.value})}
                className="h-7 text-xs"
              />
            ) : (
              <p className="font-medium">{minutes.meetingType}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Company & Opportunity - EDITABLE */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-3 w-3 text-primary" />
            <p className="text-xs font-semibold">Company</p>
          </div>
          {isEditing ? (
            <Input 
              value={editedMinutes.companyName}
              onChange={(e) => setEditedMinutes({...editedMinutes, companyName: e.target.value})}
              className="h-7 text-xs"
            />
          ) : (
            <p className="text-muted-foreground">{minutes.companyName}</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3 w-3 text-primary" />
            <p className="text-xs font-semibold">Opportunity</p>
          </div>
          {isEditing ? (
            <Input 
              value={editedMinutes.opportunityName}
              onChange={(e) => setEditedMinutes({...editedMinutes, opportunityName: e.target.value})}
              className="h-7 text-xs"
            />
          ) : (
            <p className="text-muted-foreground">{minutes.opportunityName}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Attendees - EDITABLE */}
      {minutes.attendees && minutes.attendees.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-semibold">Attendees</h4>
            </div>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.attendees.join('\n')}
                onChange={(e) => setEditedMinutes({...editedMinutes, attendees: e.target.value.split('\n').filter(a => a.trim())})}
                className="text-xs min-h-[60px]"
                placeholder="One attendee per line"
              />
            ) : (
              <ul className="text-xs space-y-1">
                {minutes.attendees.map((attendee, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{attendee}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Discussion Summary - EDITABLE */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-3 w-3 text-primary" />
          <h4 className="text-xs font-semibold">Discussion Summary</h4>
        </div>
        {isEditing ? (
          <Textarea 
            value={editedMinutes.discussionSummary}
            onChange={(e) => setEditedMinutes({...editedMinutes, discussionSummary: e.target.value})}
            className="text-xs min-h-[80px]"
          />
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">{minutes.discussionSummary}</p>
        )}
      </div>

      <Separator />

      {/* Key Insights - EDITABLE */}
      {minutes.keyInsights && minutes.keyInsights.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-semibold">Key Insights</h4>
            </div>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.keyInsights.join('\n')}
                onChange={(e) => setEditedMinutes({...editedMinutes, keyInsights: e.target.value.split('\n').filter(i => i.trim())})}
                className="text-xs min-h-[80px]"
                placeholder="One insight per line"
              />
            ) : (
              <ul className="text-xs space-y-2">
                {minutes.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="text-muted-foreground leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* BANT - EDITABLE */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-3 w-3 text-primary" />
          <h4 className="text-xs font-semibold">BANT Qualification</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
            <p className="font-semibold mb-1">Budget</p>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.bant.budget}
                onChange={(e) => setEditedMinutes({...editedMinutes, bant: {...editedMinutes.bant, budget: e.target.value}})}
                className="text-xs min-h-[60px]"
              />
            ) : (
              <p className="text-muted-foreground">{minutes.bant.budget}</p>
            )}
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
            <p className="font-semibold mb-1">Authority</p>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.bant.authority}
                onChange={(e) => setEditedMinutes({...editedMinutes, bant: {...editedMinutes.bant, authority: e.target.value}})}
                className="text-xs min-h-[60px]"
              />
            ) : (
              <p className="text-muted-foreground">{minutes.bant.authority}</p>
            )}
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
            <p className="font-semibold mb-1">Need</p>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.bant.need}
                onChange={(e) => setEditedMinutes({...editedMinutes, bant: {...editedMinutes.bant, need: e.target.value}})}
                className="text-xs min-h-[60px]"
              />
            ) : (
              <p className="text-muted-foreground">{minutes.bant.need}</p>
            )}
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
            <p className="font-semibold mb-1">Timeline</p>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.bant.timeline}
                onChange={(e) => setEditedMinutes({...editedMinutes, bant: {...editedMinutes.bant, timeline: e.target.value}})}
                className="text-xs min-h-[60px]"
              />
            ) : (
              <p className="text-muted-foreground">{minutes.bant.timeline}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Challenges - EDITABLE */}
      {minutes.challenges && minutes.challenges.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-semibold">Identified Challenges</h4>
            </div>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.challenges.join('\n')}
                onChange={(e) => setEditedMinutes({...editedMinutes, challenges: e.target.value.split('\n').filter(c => c.trim())})}
                className="text-xs min-h-[60px]"
                placeholder="One challenge per line"
              />
            ) : (
              <ul className="text-xs space-y-2">
                {minutes.challenges.map((challenge, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-destructive font-bold flex-shrink-0 mt-0.5">⚠</span>
                    <span className="text-muted-foreground leading-relaxed">{challenge}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Action Items - EDITABLE */}
      {minutes.actionItems && minutes.actionItems.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ListTodo className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-semibold">Action Items</h4>
            </div>
            <div className="space-y-2">
              {isEditing ? (
                <Textarea 
                  value={editedMinutes.actionItems.map(item => `${item.action} | ${item.owner} | ${item.deadline}`).join('\n')}
                  onChange={(e) => {
                    const items = e.target.value.split('\n').filter(l => l.trim()).map(line => {
                      const parts = line.split('|').map(p => p.trim());
                      return { action: parts[0] || '', owner: parts[1] || '', deadline: parts[2] || '' };
                    });
                    setEditedMinutes({...editedMinutes, actionItems: items});
                  }}
                  className="text-xs min-h-[100px]"
                  placeholder="Format: Action | Owner | Deadline (one per line)"
                />
              ) : (
                minutes.actionItems.map((item, idx) => (
                  <div key={idx} className="p-2 bg-muted/30 rounded text-xs">
                    <div className="flex items-start gap-2 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                      <p className="font-medium flex-1">{item.action}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-5 text-muted-foreground">
                      <div>
                        <span className="font-semibold">Owner:</span> {item.owner}
                      </div>
                      <div>
                        <span className="font-semibold">Due:</span> {item.deadline}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Follow-Up Plan - EDITABLE */}
      {minutes.followUpPlan && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-semibold">Follow-Up Plan</h4>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-semibold mb-1">Next Meeting</p>
                {isEditing ? (
                  <Input 
                    value={editedMinutes.followUpPlan.nextMeetingDate}
                    onChange={(e) => setEditedMinutes({...editedMinutes, followUpPlan: {...editedMinutes.followUpPlan, nextMeetingDate: e.target.value}})}
                    className="h-7 text-xs"
                  />
                ) : (
                  <p className="text-muted-foreground">{minutes.followUpPlan.nextMeetingDate}</p>
                )}
              </div>
              {minutes.followUpPlan.documentsToShare && minutes.followUpPlan.documentsToShare.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Documents to Share</p>
                  {isEditing ? (
                    <Textarea 
                      value={editedMinutes.followUpPlan.documentsToShare.join('\n')}
                      onChange={(e) => setEditedMinutes({...editedMinutes, followUpPlan: {...editedMinutes.followUpPlan, documentsToShare: e.target.value.split('\n').filter(d => d.trim())}})}
                      className="text-xs min-h-[50px]"
                      placeholder="One document per line"
                    />
                  ) : (
                    <ul className="space-y-1">
                      {minutes.followUpPlan.documentsToShare.map((doc, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {minutes.followUpPlan.internalAlignment && minutes.followUpPlan.internalAlignment.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Internal Alignment Needed</p>
                  {isEditing ? (
                    <Textarea 
                      value={editedMinutes.followUpPlan.internalAlignment.join('\n')}
                      onChange={(e) => setEditedMinutes({...editedMinutes, followUpPlan: {...editedMinutes.followUpPlan, internalAlignment: e.target.value.split('\n').filter(a => a.trim())}})}
                      className="text-xs min-h-[50px]"
                      placeholder="One item per line"
                    />
                  ) : (
                    <ul className="space-y-1">
                      {minutes.followUpPlan.internalAlignment.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Notes - EDITABLE */}
      {(minutes.notes || isEditing) && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-semibold">Notes & Observations</h4>
            </div>
            {isEditing ? (
              <Textarea 
                value={editedMinutes.notes || ''}
                onChange={(e) => setEditedMinutes({...editedMinutes, notes: e.target.value})}
                className="text-xs min-h-[60px]"
                placeholder="Add any additional notes or observations..."
              />
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed italic">{minutes.notes}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface SidebarPanelsProps {
  callSummary?: CallSummary;
  recommendedModules: string[];
  showCallSummary: boolean;
  sessionId: string;
  conversationId: string;
  domainExpertise: string;
  onGenerateMinutes?: () => void;
  isLoadingMinutes?: boolean;
  meetingMinutes?: any;
  onMinutesSaved?: (updatedMinutes: MeetingMinutes) => void;
}

export function SidebarPanels({ 
  callSummary, 
  recommendedModules, 
  showCallSummary,
  sessionId,
  conversationId,
  domainExpertise,
  onGenerateMinutes,
  isLoadingMinutes,
  meetingMinutes,
  onMinutesSaved
}: SidebarPanelsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductReferenceOpen, setIsProductReferenceOpen] = useState(true);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(true);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(true);
  const [isMeetingMinutesOpen, setIsMeetingMinutesOpen] = useState(true);
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);
  const [editedMinutes, setEditedMinutes] = useState<MeetingMinutes | null>(null);
  const { toast } = useToast();

  // Sync editedMinutes when meetingMinutes changes
  useEffect(() => {
    if (meetingMinutes) {
      setEditedMinutes(meetingMinutes);
    }
  }, [meetingMinutes]);

  const { data: productReferenceData = [] } = useQuery({
    queryKey: [`/api/product-reference?domain=${encodeURIComponent(domainExpertise || '')}`],
    enabled: !!domainExpertise,
  });

  const isRecommended = (moduleCode: string) => {
    return recommendedModules?.includes(moduleCode) || false;
  };

  const filteredModules = (productReferenceData as ProductReference[]).filter(module => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      module.code.toLowerCase().includes(searchLower) ||
      module.name.toLowerCase().includes(searchLower) ||
      module.description.toLowerCase().includes(searchLower)
    );
  });

  // Partner Services Recommendations query
  const { data: partnerServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/conversations", sessionId, "partner-services", domainExpertise],
    queryFn: () => getPartnerServiceRecommendations(sessionId, domainExpertise),
    enabled: !!sessionId && !!domainExpertise,
    refetchInterval: false,
  });

  const recommendations = partnerServices?.recommendations || [];

  // One-liners query with regenerate support
  const queryClient = useQueryClient();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { data: oneLinersData, isLoading: isLoadingOneLiners } = useQuery<RelationshipBuildersResponse>({
    queryKey: ["/api/conversations", sessionId, "one-liners"],
    queryFn: () => getRelationshipOneLiners(sessionId, false),
    enabled: !!sessionId,
    refetchInterval: false,
  });

  const oneLiners = oneLinersData?.oneliners || [];
  const conversationPhase = oneLinersData?.phase || 'discovery';
  const readinessScore = oneLinersData?.readinessScore || 0;

  // Save meeting minutes mutation
  const saveMeetingMinutesMutation = useMutation({
    mutationFn: async (minutesData: MeetingMinutes) => {
      return apiRequest('POST', `/api/conversations/${sessionId}/meeting-minutes`, minutesData);
    },
    onSuccess: (_data, variables) => {
      // Update parent state with the saved minutes
      if (onMinutesSaved) {
        onMinutesSaved(variables);
      }
      toast({
        title: "Changes Saved",
        description: "Meeting minutes saved to database successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save meeting minutes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegenerateOneLiners = async () => {
    setIsRegenerating(true);
    try {
      const freshData = await getRelationshipOneLiners(sessionId, true);
      queryClient.setQueryData(["/api/conversations", sessionId, "one-liners"], freshData);
      toast({
        title: "Suggestions refreshed",
        description: "New conversation starters have been generated based on your latest context.",
      });
    } catch (error) {
      toast({
        title: "Failed to refresh",
        description: "Could not generate new suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateMinutes = () => {
    if (onGenerateMinutes) {
      onGenerateMinutes();
    }
  };

  const exportToPDF = async () => {
    const dataToExport = editedMinutes || meetingMinutes;
    if (!dataToExport) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 6;
      let yPosition = margin;
      
      // Brand colors
      const BRAND_COLORS = {
        primary: { r: 139, g: 92, b: 246 },
        secondary: { r: 236, g: 72, b: 153 },
        dark: { r: 30, g: 30, b: 46 },
        text: { r: 60, g: 60, b: 60 },
        accent: { r: 168, g: 85, b: 247 },
        white: { r: 255, g: 255, b: 255 }
      };
      
      // Contact Information
      const CONTACT_INFO = {
        website: 'https://revwinner.com',
        email: 'sales@revwinner.com',
        phoneIndia: '+91 8130276382',
        phoneUSA: '+1 832 632 8555'
      };
      
      // Load and add banner image
      try {
        const bannerImg = new Image();
        bannerImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          bannerImg.onload = resolve;
          bannerImg.onerror = reject;
          bannerImg.src = pdfBannerUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = bannerImg.width;
        canvas.height = bannerImg.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bannerImg, 0, 0);
          const bannerBase64 = canvas.toDataURL('image/jpeg');
          const bannerAspect = bannerImg.width / bannerImg.height;
          const bannerHeight = pageWidth / bannerAspect;
          doc.addImage(bannerBase64, 'JPEG', 0, 0, pageWidth, bannerHeight);
          yPosition = bannerHeight + 10;
        }
      } catch (e) {
        console.log('Banner load failed, using fallback header');
        // Fallback header if banner fails
        doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Rev Winner - Meeting Minutes", pageWidth / 2, 22, { align: "center" });
        yPosition = 45;
      }
      
      // Reset text color
      doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);

      // Helper function to add footer on each page
      const addFooter = () => {
        const footerY = pageHeight - 10;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(`India: ${CONTACT_INFO.phoneIndia} | USA: ${CONTACT_INFO.phoneUSA} | ${CONTACT_INFO.email} | ${CONTACT_INFO.website}`, pageWidth / 2, footerY, { align: "center" });
        doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
      };
      
      // Add footer to first page
      addFooter();

      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
          addFooter();
        }
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.text(text, margin, yPosition);
        yPosition += lineHeight;
      };

      const addWrappedText = (text: string, fontSize: number = 10) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
          addFooter();
        }
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
            addFooter();
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
      };
      
      // Helper to add section header
      const addSectionHeader = (title: string) => {
        yPosition += 3;
        doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.rect(margin - 2, yPosition - 5, pageWidth - 2 * margin + 4, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, yPosition);
        doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
        yPosition += 8;
      };

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
      doc.text("Minutes of Meeting - Sales Discovery Call", pageWidth / 2, yPosition, { align: "center" });
      doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
      yPosition += 12;

      // Meeting Info Box
      doc.setDrawColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 42, 2, 2, 'S');
      
      addText(`Date: ${dataToExport.date}     Time: ${dataToExport.time}     Duration: ${dataToExport.duration}`, 9);
      addText(`Company: ${dataToExport.companyName}`, 9);
      addText(`Opportunity: ${dataToExport.opportunityName}`, 9);
      addText(`Meeting Type: ${dataToExport.meetingType}`, 9);
      if (dataToExport.repName) {
        addText(`Sales Representative: ${dataToExport.repName}`, 9);
      }
      yPosition += 8;

      // Attendees
      addSectionHeader("Attendees");
      addWrappedText(dataToExport.attendees.join(", "), 9);
      yPosition += 5;

      // Discussion Summary
      addSectionHeader("1. Discussion Summary");
      addWrappedText(dataToExport.discussionSummary, 9);
      yPosition += 5;

      // Discovery Q&A
      if (dataToExport.discoveryQA && dataToExport.discoveryQA.length > 0) {
        addSectionHeader("2. Discovery Questions & Answers");
        dataToExport.discoveryQA.forEach((qa: any) => {
          if (qa.answer !== "Not discussed") {
            addText(`Q: ${qa.question}`, 9, true);
            addWrappedText(`A: ${qa.answer}`, 9);
            yPosition += 2;
          }
        });
        yPosition += 3;
      }

      // BANT
      addSectionHeader("3. BANT Qualification");
      addWrappedText(`Budget: ${dataToExport.bant.budget}`, 9);
      addWrappedText(`Authority: ${dataToExport.bant.authority}`, 9);
      addWrappedText(`Need: ${dataToExport.bant.need}`, 9);
      addWrappedText(`Timeline: ${dataToExport.bant.timeline}`, 9);
      yPosition += 5;

      // Challenges
      if (dataToExport.challenges.length > 0) {
        addSectionHeader("4. Challenges Identified");
        dataToExport.challenges.forEach((challenge: string) => {
          addWrappedText(`• ${challenge}`, 9);
        });
        yPosition += 5;
      }

      // Key Insights
      if (dataToExport.keyInsights.length > 0) {
        addSectionHeader("5. Key Insights / Buying Signals");
        dataToExport.keyInsights.forEach((insight: string) => {
          addWrappedText(`• ${insight}`, 9);
        });
        yPosition += 5;
      }

      // Action Items
      if (dataToExport.actionItems.length > 0) {
        addSectionHeader("6. Next Steps / Action Items");
        dataToExport.actionItems.forEach((item: any) => {
          addWrappedText(`• ${item.action} (Owner: ${item.owner}, Deadline: ${item.deadline})`, 9);
        });
        yPosition += 5;
      }

      // Follow-up Plan
      addSectionHeader("7. Follow-up Plan");
      addWrappedText(`Next Meeting Date: ${dataToExport.followUpPlan.nextMeetingDate}`, 9);
      if (dataToExport.followUpPlan.documentsToShare.length > 0) {
        addText("Documents to Share:", 9, true);
        dataToExport.followUpPlan.documentsToShare.forEach((docItem: string) => {
          addWrappedText(`  • ${docItem}`, 9);
        });
      }
      if (dataToExport.followUpPlan.internalAlignment.length > 0) {
        addText("Internal Alignment:", 9, true);
        dataToExport.followUpPlan.internalAlignment.forEach((item: string) => {
          addWrappedText(`  • ${item}`, 9);
        });
      }
      yPosition += 5;

      // Notes
      if (dataToExport.notes) {
        addSectionHeader("8. Notes & Observations");
        addWrappedText(dataToExport.notes, 9);
      }

      const fileName = `Meeting_Minutes_${dataToExport.date.replace(/\//g, '_')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF Exported Successfully",
        description: `Meeting minutes saved as ${fileName}`,
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export meeting minutes as PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    if (!meetingMinutes) return;

    try {
      const textContent = `
Minutes of Meeting - Sales Discovery Call

Date: ${meetingMinutes.date}
Time: ${meetingMinutes.time}
Duration: ${meetingMinutes.duration}
Company / Prospect Name: ${meetingMinutes.companyName}
Opportunity / Account Name: ${meetingMinutes.opportunityName}
Meeting Type: ${meetingMinutes.meetingType}

Attendees: ${meetingMinutes.attendees.join(", ")}

1. Discussion Summary
${meetingMinutes.discussionSummary}

2. Discovery Questions & Answers
${meetingMinutes.discoveryQA?.filter((qa: any) => qa.answer !== "Not discussed").map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n') || ''}

3. BANT Qualification
Budget: ${meetingMinutes.bant.budget}
Authority: ${meetingMinutes.bant.authority}
Need: ${meetingMinutes.bant.need}
Timeline: ${meetingMinutes.bant.timeline}

4. Challenges Identified
${meetingMinutes.challenges.map((c: string) => `• ${c}`).join('\n')}

5. Key Insights / Buying Signals
${meetingMinutes.keyInsights.map((i: string) => `• ${i}`).join('\n')}

6. Next Steps / Action Items
${meetingMinutes.actionItems.map((item: any) => `• ${item.action} (Owner: ${item.owner}, Deadline: ${item.deadline})`).join('\n')}

7. Follow-up Plan
Next Meeting Date: ${meetingMinutes.followUpPlan.nextMeetingDate}
Documents to Share:
${meetingMinutes.followUpPlan.documentsToShare.map((doc: string) => `  • ${doc}`).join('\n')}
Internal Alignment:
${meetingMinutes.followUpPlan.internalAlignment.map((item: string) => `  • ${item}`).join('\n')}

8. Notes & Observations
${meetingMinutes.notes || ''}
      `.trim();

      navigator.clipboard.writeText(textContent);
      toast({
        title: "Copied to Clipboard",
        description: "Meeting minutes have been copied to your clipboard",
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy meeting minutes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content Row: Product Reference and Partner Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product/Service Reference */}
        <Card className="card-shadow-lg border-border/50">
          <Collapsible open={isProductReferenceOpen} onOpenChange={setIsProductReferenceOpen}>
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50 pb-4">
              <CollapsibleTrigger className="w-full flex items-center justify-between text-left" data-testid="toggle-product-reference">
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Product/Service Reference
                </CardTitle>
                {isProductReferenceOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </CollapsibleTrigger>
              <p className="text-xs text-muted-foreground mt-1">Browse available products and services with descriptions</p>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
          <div className="space-y-3 pt-2">
            {/* Search Input */}
            <div className="relative">
              <Input
                data-testid="input-module-search"
                placeholder="Search products by code, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs h-8 pl-8"
              />
              <i className="fas fa-search absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500"></i>
            </div>
            
            {/* Module List */}
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {filteredModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-dashed border-purple-200 dark:border-purple-800">
                  <svg className="w-12 h-12 text-purple-400 dark:text-purple-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm font-medium text-center text-foreground mb-1">No products found</p>
                  <p className="text-xs text-center text-muted-foreground">No matches for "{searchTerm}"</p>
                </div>
              ) : (
                filteredModules.map((module: ProductReference) => (
                  <div
                    key={module.code}
                    className={`border rounded-lg p-3 transition-all ${
                      isRecommended(module.code) 
                        ? 'border-primary bg-primary/10 shadow-sm' 
                        : 'border-border hover:bg-muted/30'
                    }`}
                    data-testid={`module-${module.code.toLowerCase()}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold">{module.code}</span>
                        {isRecommended(module.code) && (
                          <Badge variant="default" className="text-xs bg-primary text-primary-foreground">✓ Recommended</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-medium text-foreground mb-1">{module.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{module.description}</p>
                  </div>
                ))
              )}
            </div>
            
            {/* Results Count */}
            {searchTerm && (
              <div className="text-center pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredModules.length} of {(productReferenceData as ProductReference[]).length} products
                </p>
              </div>
            )}
              </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Product/Service Recommendation */}
        <Card className="card-shadow-lg border-border/50 mt-6">
          <Collapsible open={isRecommendationOpen} onOpenChange={setIsRecommendationOpen}>
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-border/50 pb-4">
              <CollapsibleTrigger className="w-full flex items-center justify-between text-left" data-testid="toggle-recommendation">
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Product/Service Recommendation
                </CardTitle>
                {isRecommendationOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </CollapsibleTrigger>
              <p className="text-xs text-muted-foreground mt-1">Smart, consultant-driven recommendations tailored to your needs</p>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-6">
            <div className="space-y-3">
              {isLoadingServices ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                  <p className="text-sm text-muted-foreground">Analyzing conversation...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800 min-h-[200px]">
                  <svg className="w-12 h-12 text-emerald-400 dark:text-emerald-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-center text-foreground mb-1">No Recommendations Yet</p>
                  <p className="text-xs text-center text-muted-foreground max-w-xs">Continue the discovery conversation to receive tailored product and service recommendations</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                  {recommendations.map((rec: PartnerServiceRecommendation, index: number) => (
                    <div
                      key={rec.service.id || index}
                      className={`border rounded-lg p-3 transition-colors ${
                        rec.priority === 'urgent' || rec.priority === 'high'
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/30'
                      }`}
                      data-testid={`partner-service-${index}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{rec.service.name}</span>
                          <Badge 
                            variant={rec.priority === 'urgent' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rec.service.type}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">{rec.service.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span><strong>Provider:</strong> {rec.service.provider}</span>
                        <span><strong>Duration:</strong> {rec.service.estimatedDuration}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span><strong>Complexity:</strong> 
                          <Badge variant="outline" className="ml-1 text-xs">
                            {rec.service.complexity}
                          </Badge>
                        </span>
                        <span><strong>Match:</strong> {rec.relevanceScore}%</span>
                      </div>
                      
                      <div className="bg-muted/30 rounded p-2 mt-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Why recommended:</strong> {rec.reasoning}
                        </p>
                      </div>
                      
                      {rec.service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.service.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {recommendations.length > 0 && (
                <div className="text-center pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {recommendations.length} strategic recommendation{recommendations.length > 1 ? 's' : ''} based on your discovery conversation
                  </p>
                </div>
              )}
              </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Relationship Building One-liners */}
      <Card className="card-shadow-lg border-border/50">
        <Collapsible open={isRelationshipOpen} onOpenChange={setIsRelationshipOpen}>
          <CardHeader className="bg-gradient-to-r from-pink-500/10 via-pink-500/5 to-transparent border-b border-border/50 pb-4">
            <CollapsibleTrigger className="w-full flex items-center justify-between text-left" data-testid="toggle-relationship-builders">
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Relationship Builders
              </CardTitle>
              {isRelationshipOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </CollapsibleTrigger>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Strategic rapport statements for</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs capitalize ${
                    conversationPhase === 'closing' ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950' :
                    conversationPhase === 'objection_handling' ? 'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950' :
                    conversationPhase === 'presentation' ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950' :
                    conversationPhase === 'qualification' ? 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950' :
                    'border-pink-300 text-pink-700 bg-pink-50 dark:bg-pink-950'
                  }`}
                  data-testid="conversation-phase-badge"
                >
                  {conversationPhase.replace('_', ' ')} phase
                </Badge>
              </div>
              {oneLiners.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegenerateOneLiners();
                  }}
                  disabled={isRegenerating || isLoadingOneLiners}
                  className="h-7 px-2 text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950"
                  data-testid="regenerate-relationship-builders"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? 'Refreshing...' : 'Regenerate'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
          <div className="space-y-3">
            {isLoadingOneLiners ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-3" />
                <p className="text-sm text-muted-foreground">Generating suggestions...</p>
              </div>
            ) : oneLiners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-lg border border-dashed border-pink-200 dark:border-pink-800">
                <svg className="w-12 h-12 text-pink-400 dark:text-pink-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm font-medium text-center text-foreground mb-1">No Suggestions Yet</p>
                <p className="text-xs text-center text-muted-foreground max-w-xs">Continue the conversation to receive personalized relationship-building suggestions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {oneLiners.map((oneLiner) => (
                  <div
                    key={oneLiner.id}
                    className="border border-border rounded-lg p-3 hover:bg-muted/20 transition-colors cursor-pointer group"
                    data-testid={`one-liner-${oneLiner.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          oneLiner.category === 'empathy' ? 'border-red-200 text-red-700 bg-red-50 dark:bg-red-950' :
                          oneLiner.category === 'insight' ? 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950' :
                          oneLiner.category === 'curiosity' ? 'border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-950' :
                          oneLiner.category === 'reassurance' ? 'border-green-200 text-green-700 bg-green-50 dark:bg-green-950' :
                          oneLiner.category === 'opener' ? 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950' :
                          oneLiner.category === 'rapport' ? 'border-pink-200 text-pink-700 bg-pink-50 dark:bg-pink-950' :
                          'border-slate-200 text-slate-700 bg-slate-50 dark:bg-slate-950'
                        }`}
                      >
                        {oneLiner.category}
                      </Badge>
                      <Copy 
                        className="h-3 w-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-pink-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(oneLiner.text);
                          toast({ title: "Copied!", description: "Statement copied to clipboard" });
                        }}
                      />
                    </div>
                    
                    <p className="text-sm text-foreground mb-3 leading-relaxed">
                      "{oneLiner.text}"
                    </p>
                    
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        <strong>When to use:</strong> {oneLiner.situation}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Tone:</strong> <span className="capitalize">{oneLiner.tone}</span>
                      </p>
                      {oneLiner.strategicIntent && (
                        <p className="text-xs text-pink-600 dark:text-pink-400 italic">
                          <strong>Strategic goal:</strong> {oneLiner.strategicIntent}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {oneLiners.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {oneLiners.length} strategic suggestions for {conversationPhase.replace('_', ' ')} phase
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Readiness:</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          readinessScore >= 75 ? 'bg-green-500' :
                          readinessScore >= 50 ? 'bg-blue-500' :
                          readinessScore >= 25 ? 'bg-purple-500' :
                          'bg-pink-500'
                        }`}
                        style={{ width: `${readinessScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{readinessScore}%</span>
                  </div>
                </div>
              </div>
            )}
            </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>


      {/* Meeting Minutes Generator */}
      {sessionId && (
        <Card className="card-shadow-lg border-border/50">
          <Collapsible open={isMeetingMinutesOpen} onOpenChange={setIsMeetingMinutesOpen}>
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-b border-border/50 pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CollapsibleTrigger className="flex items-center gap-2 text-left flex-1 min-w-0" data-testid="toggle-meeting-minutes">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold">Meeting Minutes</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {meetingMinutes ? "Your generated meeting minutes" : "Generate comprehensive meeting minutes from your conversation"}
                    </p>
                  </div>
                  {isMeetingMinutesOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </CollapsibleTrigger>
                
                {/* Action Buttons - Only show when minutes are generated */}
                {meetingMinutes && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditingMinutes ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editedMinutes) {
                            saveMeetingMinutesMutation.mutate(editedMinutes);
                          }
                          setIsEditingMinutes(false);
                        }}
                        disabled={saveMeetingMinutesMutation.isPending}
                        size="sm"
                        variant="outline"
                        className="h-8 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        data-testid="button-save-minutes"
                      >
                        {saveMeetingMinutesMutation.isPending ? (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {saveMeetingMinutesMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingMinutes(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="h-8 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        data-testid="button-edit-minutes"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: "Coming Soon",
                          description: "Export to CRM feature will be available soon!",
                        });
                      }}
                      size="sm"
                      variant="outline"
                      className="h-8 border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      data-testid="button-export-crm"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Export to CRM
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF();
                      }}
                      size="sm"
                      variant="outline"
                      className="h-8 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      data-testid="button-export-pdf"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export PDF
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard();
                      }}
                      size="sm"
                      variant="outline"
                      className="h-8 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      data-testid="button-copy-minutes"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateMinutes();
                      }}
                      size="sm"
                      variant="outline"
                      disabled={isLoadingMinutes}
                      className="h-8 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      data-testid="button-regenerate-minutes"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingMinutes ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {isLoadingMinutes ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Generating meeting minutes...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                  </div>
                ) : meetingMinutes && editedMinutes ? (
                  <MeetingMinutesContent 
                    minutes={meetingMinutes} 
                    isEditing={isEditingMinutes}
                    editedMinutes={editedMinutes}
                    setEditedMinutes={setEditedMinutes}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-8 text-center border border-indigo-200/50 dark:border-indigo-800/50">
                      <svg className="w-14 h-14 text-indigo-500 dark:text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium text-foreground mb-2">Ready to Generate Minutes</p>
                      <p className="text-xs text-muted-foreground mb-6 max-w-sm">
                        Click below to create professional meeting minutes including BANT analysis, key challenges, summary, and next steps.
                      </p>
                      <Button
                        onClick={handleGenerateMinutes}
                        disabled={isLoadingMinutes}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                        data-testid="button-generate-minutes"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Generate Meeting Minutes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Call Summary */}
      {showCallSummary && callSummary && (
        <Card data-testid="call-summary-card" className="card-shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-b border-border/50 pb-4">
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Call Summary
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">AI-generated insights from your conversation</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Key Challenges</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {callSummary.keyChanges?.map((challenge, index) => (
                    <li key={index}>• {challenge}</li>
                  )) || <li>• No challenges identified</li>}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Discovery Insights</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {callSummary.discoveryInsights?.map((insight, index) => (
                    <li key={index}>• {insight}</li>
                  )) || <li>• No insights gathered</li>}
                </ul>
              </div>

              {callSummary.objections && callSummary.objections.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Objections & Responses</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {callSummary.objections.map((objection, index) => (
                      <li key={index}>• {objection}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Next Steps</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {callSummary.nextSteps?.map((step, index) => (
                    <li key={index}>• {step}</li>
                  )) || <li>• Follow up with client</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}