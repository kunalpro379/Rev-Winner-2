import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Download, Loader2, Calendar, Clock, Users, Building2, Target, MessageSquare, CheckCircle2, TrendingUp, ListTodo, CalendarClock, FileText as FileTextIcon, StickyNote, Edit, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import pdfBannerUrl from '@assets/IMG_20251213_202308_1765637622298.jpg';

interface MeetingMinutes {
  date: string;
  time: string;
  repName?: string;
  duration: string;
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

interface MeetingMinutesProps {
  minutes: MeetingMinutes | null;
  isLoading?: boolean;
  onSave?: (updatedMinutes: MeetingMinutes) => void;
}

export function MeetingMinutes({ minutes, isLoading, onSave }: MeetingMinutesProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMinutes, setEditedMinutes] = useState<MeetingMinutes | null>(minutes);

  // Update editedMinutes when minutes prop changes (only if not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedMinutes(minutes);
    }
  }, [minutes, isEditing]);

  const handleExportToCRM = () => {
    toast({
      title: "Coming Soon",
      description: "Export to CRM feature will be available soon!",
    });
  };

  const handleSaveEdit = () => {
    if (editedMinutes) {
      // Call the onSave callback to persist changes to parent
      if (onSave) {
        onSave(editedMinutes);
      }
    }
    setIsEditing(false);
    toast({
      title: "Changes Saved",
      description: "Meeting minutes updated successfully.",
    });
  };

  const exportToPDF = async () => {
    const dataToExport = editedMinutes || minutes;
    if (!dataToExport) {
      toast({
        title: "No Meeting Minutes",
        description: "Please generate meeting minutes first.",
        variant: "destructive",
      });
      return;
    }

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

      // Helper function to add text with automatic page breaks
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

      // Helper function to add wrapped text
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
      if ((dataToExport as any).repName) {
        addText(`Sales Representative: ${(dataToExport as any).repName}`, 9);
      }
      yPosition += 8;

      // Attendees
      addSectionHeader("Attendees");
      addWrappedText(dataToExport.attendees.join(", "), 10);
      yPosition += 5;

      // Discussion Summary
      addSectionHeader("1. Discussion Summary");
      addWrappedText(dataToExport.discussionSummary, 10);
      yPosition += 5;

      // Discovery Questions & Answers
      if (dataToExport.discoveryQA && dataToExport.discoveryQA.length > 0) {
        addSectionHeader("2. Discovery Questions & Answers");
        dataToExport.discoveryQA.forEach(qa => {
          if (qa.answer !== "Not discussed") {
            addText(`Q: ${qa.question}`, 9, true);
            addWrappedText(`A: ${qa.answer}`, 9);
            yPosition += 2;
          }
        });
        yPosition += 3;
      }

      // BANT Qualification
      addSectionHeader("3. BANT Qualification");
      addWrappedText(`Budget: ${dataToExport.bant.budget}`, 9);
      addWrappedText(`Authority: ${dataToExport.bant.authority}`, 9);
      addWrappedText(`Need: ${dataToExport.bant.need}`, 9);
      addWrappedText(`Timeline: ${dataToExport.bant.timeline}`, 9);
      yPosition += 5;

      // Challenges Identified
      if (dataToExport.challenges.length > 0) {
        addSectionHeader("4. Challenges Identified");
        dataToExport.challenges.forEach(challenge => {
          addWrappedText(`• ${challenge}`, 9);
        });
        yPosition += 5;
      }

      // Key Insights / Buying Signals
      if (dataToExport.keyInsights.length > 0) {
        addSectionHeader("5. Key Insights / Buying Signals");
        dataToExport.keyInsights.forEach(insight => {
          addWrappedText(`• ${insight}`, 9);
        });
        yPosition += 5;
      }

      // Next Steps / Action Items
      if (dataToExport.actionItems.length > 0) {
        addSectionHeader("6. Next Steps / Action Items");
        dataToExport.actionItems.forEach(item => {
          addWrappedText(`• ${item.action} (Owner: ${item.owner}, Deadline: ${item.deadline})`, 9);
        });
        yPosition += 5;
      }

      // Follow-up Plan
      addSectionHeader("7. Follow-up Plan");
      addWrappedText(`Next Meeting Date: ${dataToExport.followUpPlan.nextMeetingDate}`, 9);
      if (dataToExport.followUpPlan.documentsToShare.length > 0) {
        addText("Documents to Share:", 9, true);
        dataToExport.followUpPlan.documentsToShare.forEach(docItem => {
          addWrappedText(`  • ${docItem}`, 9);
        });
      }
      if (dataToExport.followUpPlan.internalAlignment.length > 0) {
        addText("Internal Alignment:", 9, true);
        dataToExport.followUpPlan.internalAlignment.forEach(item => {
          addWrappedText(`  • ${item}`, 9);
        });
      }
      yPosition += 5;

      // Notes & Observations
      if (dataToExport.notes) {
        addSectionHeader("8. Notes & Observations");
        addWrappedText(dataToExport.notes, 9);
        yPosition += 3;
      }

      // Save the PDF
      const fileName = `Meeting_Minutes_${dataToExport.date.replace(/\//g, '_')}.pdf`;
      doc.save(fileName);
      
      // Show success toast
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

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating meeting minutes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!minutes) {
    return null;
  }

  return (
    <Card className="border-border/50" data-testid="meeting-minutes-card">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Meeting Minutes</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{editedMinutes?.meetingType}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <Button 
                onClick={handleSaveEdit} 
                className="btn-professional"
                data-testid="save-edit-button"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline"
                data-testid="edit-button"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button 
              onClick={handleExportToCRM} 
              variant="outline"
              data-testid="export-crm-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              Export to CRM
            </Button>
            <Button 
              onClick={exportToPDF} 
              className="btn-professional"
              data-testid="export-pdf-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{minutes.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-medium">{minutes.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">{minutes.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Company</p>
              {isEditing ? (
                <Input
                  value={editedMinutes?.companyName || ''}
                  onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                  className="mt-1 h-8"
                  placeholder="Company Name"
                  data-testid="edit-company-name"
                />
              ) : (
                <p className="text-sm font-medium">{editedMinutes?.companyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Target className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Opportunity</p>
              {isEditing ? (
                <Input
                  value={editedMinutes?.opportunityName || ''}
                  onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, opportunityName: e.target.value } : null)}
                  className="mt-1 h-8"
                  placeholder="Opportunity Name"
                  data-testid="edit-opportunity-name"
                />
              ) : (
                <p className="text-sm font-medium">{editedMinutes?.opportunityName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Attendees */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Attendees</h4>
          </div>
          {isEditing ? (
            <Textarea
              value={(editedMinutes?.attendees || []).join(', ')}
              onChange={(e) => {
                const attendeesList = e.target.value
                  .split(',')
                  .map(a => a.trim())
                  .filter(a => a.length > 0);
                setEditedMinutes(prev => prev ? { ...prev, attendees: attendeesList } : null);
              }}
              className="min-h-[80px]"
              placeholder="Enter attendees separated by commas (e.g., John Smith - CEO, Jane Doe - CTO)"
              data-testid="edit-attendees"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(editedMinutes?.attendees || []).map((attendee, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-muted/50 rounded-full text-xs font-medium"
                  data-testid={`attendee-${index}`}
                >
                  {attendee}
                </span>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Discussion Summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">1️⃣ Discussion Summary</h4>
          </div>
          {isEditing ? (
            <Textarea
              value={editedMinutes?.discussionSummary || ''}
              onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, discussionSummary: e.target.value } : null)}
              className="min-h-[100px]"
              data-testid="edit-discussion-summary"
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{editedMinutes?.discussionSummary}</p>
          )}
        </div>

        <Separator />

        {/* Discovery Questions & Answers */}
        {minutes.discoveryQA && minutes.discoveryQA.length > 0 && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">2️⃣ Discovery Questions & Answers</h4>
              </div>
              <div className="space-y-3">
                {minutes.discoveryQA.map((qa, index) => (
                  <div key={index} className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-xs font-semibold text-foreground mb-1">{qa.question}</p>
                    <p className="text-sm text-muted-foreground">{qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* BANT Qualification */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">3️⃣ BANT Qualification</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-1">Budget</p>
              {isEditing ? (
                <Input
                  value={editedMinutes?.bant.budget || ''}
                  onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, bant: { ...prev.bant, budget: e.target.value } } : null)}
                  className="mt-1"
                  data-testid="edit-bant-budget"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editedMinutes?.bant.budget}</p>
              )}
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-1">Authority</p>
              {isEditing ? (
                <Input
                  value={editedMinutes?.bant.authority || ''}
                  onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, bant: { ...prev.bant, authority: e.target.value } } : null)}
                  className="mt-1"
                  data-testid="edit-bant-authority"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editedMinutes?.bant.authority}</p>
              )}
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-1">Need</p>
              {isEditing ? (
                <Input
                  value={editedMinutes?.bant.need || ''}
                  onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, bant: { ...prev.bant, need: e.target.value } } : null)}
                  className="mt-1"
                  data-testid="edit-bant-need"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editedMinutes?.bant.need}</p>
              )}
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-1">Timeline</p>
              {isEditing ? (
                <Input
                  value={editedMinutes?.bant.timeline || ''}
                  onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, bant: { ...prev.bant, timeline: e.target.value } } : null)}
                  className="mt-1"
                  data-testid="edit-bant-timeline"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editedMinutes?.bant.timeline}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Challenges */}
        {minutes.challenges.length > 0 && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-orange-600" />
                <h4 className="text-sm font-semibold text-foreground">4️⃣ Challenges Identified</h4>
              </div>
              <ul className="space-y-2">
                {minutes.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 mt-1">•</span>
                    <span className="text-muted-foreground">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {/* Key Insights / Buying Signals */}
        {minutes.keyInsights.length > 0 && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold text-foreground">5️⃣ Key Insights / Buying Signals</h4>
              </div>
              <ul className="space-y-2">
                {minutes.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-muted-foreground">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {/* Next Steps / Action Items */}
        {minutes.actionItems.length > 0 && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListTodo className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">6️⃣ Next Steps / Action Items</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">Action Item</th>
                      <th className="text-left py-2 px-3 font-semibold">Owner</th>
                      <th className="text-left py-2 px-3 font-semibold">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {minutes.actionItems.map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-2 px-3 text-muted-foreground">{item.action}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.owner}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Follow-up Plan */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">7️⃣ Follow-up Plan</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-muted/20 rounded-lg">
              <p className="font-semibold text-foreground mb-1">Date of next meeting or demo:</p>
              <p className="text-muted-foreground">{minutes.followUpPlan.nextMeetingDate}</p>
            </div>
            {minutes.followUpPlan.documentsToShare.length > 0 && (
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="font-semibold text-foreground mb-2">Documents / decks to be shared:</p>
                <ul className="space-y-1">
                  {minutes.followUpPlan.documentsToShare.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <FileTextIcon className="h-3 w-3 mt-0.5 text-primary" />
                      <span className="text-muted-foreground">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {minutes.followUpPlan.internalAlignment.length > 0 && (
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="font-semibold text-foreground mb-2">Internal alignment needed:</p>
                <ul className="space-y-1">
                  {minutes.followUpPlan.internalAlignment.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Users className="h-3 w-3 mt-0.5 text-primary" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Notes & Observations */}
        {editedMinutes?.notes && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">8️⃣ Notes & Observations</h4>
              </div>
              {isEditing ? (
                <Textarea
                  value={editedMinutes?.notes || ''}
                  onChange={(e) => setEditedMinutes(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="min-h-[80px] italic"
                  data-testid="edit-notes"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed italic">{editedMinutes?.notes}</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
