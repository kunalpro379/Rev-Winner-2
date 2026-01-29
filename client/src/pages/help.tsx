import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, Settings, Phone, Sparkles, CreditCard, AlertCircle, FileText, MessageCircle, Rocket, Mic, Brain, Shield, Users, HelpCircle, Download, FileDown, Zap, Building2, Package, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportDocumentationToPDF, exportQuickReferenceToPDF } from "@/utils/pdfExport";
import FeatureGuide from "@/components/feature-guide";
import { RevWinnerChatbot } from "@/components/rev-winner-chatbot";
import { useSEO } from "@/hooks/use-seo";
import { StructuredData, faqSchema } from "@/components/structured-data";

export default function Help() {
  const { toast } = useToast();
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [isExportingQuick, setIsExportingQuick] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Comprehensive SEO for Help page
  useSEO({
    title: "Help & Documentation | Rev Winner AI Sales Assistant Guide",
    description: "Complete guide to Rev Winner AI sales assistant. Learn real-time sales coaching, call transcription, BANT qualification, meeting minutes automation. Tutorials, troubleshooting, and best practices for sales professionals.",
    keywords: "Rev Winner help, AI sales assistant guide, sales coaching tutorial, conversation intelligence help, how to use Rev Winner, sales transcription guide, BANT qualification help, meeting minutes tutorial, sales enablement documentation, AI sales tools guide, real-time coaching setup, sales software support, Rev Winner FAQ, sales assistant troubleshooting",
    ogTitle: "Rev Winner Help Center - Complete User Guide",
    ogDescription: "Everything you need to master Rev Winner AI sales assistant. Setup guides, feature tutorials, troubleshooting, and best practices.",
    ogUrl: "https://revwinner.com/help"
  });

  // FAQ data for structured data
  const helpFaqData = [
    {
      question: "How does Rev Winner's real-time sales coaching work?",
      answer: "During your live sales call, Rev Winner analyzes the conversation in real-time and provides exactly 3 actionable sales tips. The AI responds in under 3 seconds with objection handling, rebuttals, and next steps based on proven sales methodologies like SPIN, MEDDIC, and Challenger Sale."
    },
    {
      question: "What audio sources does Rev Winner support?",
      answer: "Rev Winner supports microphone input, screen share audio from Zoom, Microsoft Teams, and Webex meetings. You can mix microphone input with remote meeting audio using the Web Audio API for comprehensive call capture."
    },
    {
      question: "How do I export meeting minutes?",
      answer: "After your call, Rev Winner automatically generates comprehensive meeting minutes including discussion summary, BANT qualification, pain points, action items, and follow-up plans. Click the 'Export PDF' button to download a professional document."
    },
    {
      question: "Which AI providers does Rev Winner support?",
      answer: "Rev Winner supports multiple AI providers including OpenAI GPT-4 and GPT-4o, Anthropic Claude, Google Gemini, X.AI Grok, DeepSeek, and Kimi K2. You can bring your own API key for any of these providers."
    }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExportFullDocumentation = async () => {
    setIsExportingFull(true);
    try {
      await exportDocumentationToPDF();
      toast({
        title: "PDF Downloaded",
        description: "Full feature documentation has been downloaded successfully.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingFull(false);
    }
  };

  const handleExportQuickReference = async () => {
    setIsExportingQuick(true);
    try {
      await exportQuickReferenceToPDF();
      toast({
        title: "PDF Downloaded",
        description: "Quick reference guide has been downloaded successfully.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingQuick(false);
    }
  };

  return (
    <>
    <StructuredData data={faqSchema(helpFaqData)} />
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4">
            Help & Documentation
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Everything you need to master Rev Winner and close more deals
          </p>
        </div>

        {/* AI Chatbot - Ask anything about Rev Winner - Collapsible */}
        <div className="mb-8">
          <Collapsible open={isChatbotOpen} onOpenChange={setIsChatbotOpen}>
            <CollapsibleTrigger asChild>
              <div 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 cursor-pointer hover:from-purple-700 hover:to-pink-600 transition-all duration-300 shadow-lg"
                data-testid="chatbot-toggle"
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Rev Winner AI Assistant</h3>
                      <p className="text-sm text-white/80">Ask me anything about Rev Winner</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70">{isChatbotOpen ? 'Click to collapse' : 'Click to expand'}</span>
                    {isChatbotOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <RevWinnerChatbot embedded={true} />
            </CollapsibleContent>
          </Collapsible>
        </div>

        <Card className="mb-8 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              Quick Navigation
            </CardTitle>
            <CardDescription>Jump to any section below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => scrollToSection('feature-guide')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-feature-guide">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <Zap className="h-4 w-4" />
                  Feature Guide
                </div>
              </button>
              <button onClick={() => scrollToSection('getting-started')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-getting-started">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <Rocket className="h-4 w-4" />
                  Getting Started
                </div>
              </button>
              <button onClick={() => scrollToSection('configuration')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-configuration">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <Settings className="h-4 w-4" />
                  Configuration & Settings
                </div>
              </button>
              <button onClick={() => scrollToSection('using-calls')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-using-calls">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <Phone className="h-4 w-4" />
                  Using Rev Winner During Calls
                </div>
              </button>
              <button onClick={() => scrollToSection('advanced')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-advanced">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <Sparkles className="h-4 w-4" />
                  Advanced Features
                </div>
              </button>
              <button onClick={() => scrollToSection('billing')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-billing">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <CreditCard className="h-4 w-4" />
                  Pricing & Plans
                </div>
              </button>
              <button onClick={() => scrollToSection('addons')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-addons">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <Package className="h-4 w-4" />
                  Add-ons & Session Minutes
                </div>
              </button>
              <button onClick={() => scrollToSection('license-manager')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-license-manager">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <Building2 className="h-4 w-4" />
                  License Manager Portal
                </div>
              </button>
              <button onClick={() => scrollToSection('troubleshooting')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-troubleshooting">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Troubleshooting & FAQs
                </div>
              </button>
              <button onClick={() => scrollToSection('policies')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-policies">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <FileText className="h-4 w-4" />
                  Policies & Legal
                </div>
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-left p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="nav-contact">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <MessageCircle className="h-4 w-4" />
                  Contact & Support
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <FeatureGuide
            onExportFull={handleExportFullDocumentation}
            onExportQuick={handleExportQuickReference}
            isExportingFull={isExportingFull}
            isExportingQuick={isExportingQuick}
          />
          
          <section id="getting-started">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-getting-started">
                  <Rocket className="h-6 w-6 text-purple-600" />
                  Getting Started
                </CardTitle>
                <CardDescription data-testid="desc-getting-started">Learn the basics and set up Rev Winner quickly</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="what-is">
                    <AccordionTrigger data-testid="accordion-what-is">What is Rev Winner?</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Rev Winner is an AI-powered sales assistant designed to help sales professionals excel during discovery calls. The platform provides:</p>
                        <ul>
                          <li><strong>Real-time transcription</strong> with speaker identification</li>
                          <li><strong>AI-generated insights</strong> tailored to your product domain</li>
                          <li><strong>Instant sales coaching</strong> with actionable tips during calls</li>
                          <li><strong>Automated meeting minutes</strong> with PDF export</li>
                          <li><strong>Custom training materials</strong> to enhance AI responses</li>
                        </ul>
                        <p>Whether you're selling SaaS, hardware, consulting services, or any other product, Rev Winner adapts to your specific domain and helps you identify pain points, gather requirements, and close deals faster.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="requirements">
                    <AccordionTrigger data-testid="accordion-requirements">System Requirements</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Browser Compatibility</h4>
                        <ul>
                          <li>Google Chrome 90+ (recommended)</li>
                          <li>Microsoft Edge 90+</li>
                          <li>Firefox 88+</li>
                          <li>Safari 14+ (limited microphone support)</li>
                        </ul>
                        <h4>Required Permissions</h4>
                        <ul>
                          <li><strong>Microphone access</strong> - Essential for live transcription</li>
                          <li><strong>Browser notifications</strong> - Optional, for status alerts</li>
                        </ul>
                        <h4>Network Requirements</h4>
                        <ul>
                          <li>Stable internet connection (5+ Mbps recommended)</li>
                          <li>WebSocket support (enabled by default in modern browsers)</li>
                          <li>HTTPS connection (automatically provided)</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="account">
                    <AccordionTrigger data-testid="accordion-account">Creating an Account</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <ol>
                          <li><strong>Sign Up</strong> - Click "Get Started" on the homepage and enter your email address</li>
                          <li><strong>Email Verification</strong> - Check your inbox for a verification code (OTP)</li>
                          <li><strong>Complete Profile</strong> - Set your password and basic details</li>
                          <li><strong>Choose Plan</strong> - Start with a free trial or select a paid subscription</li>
                          <li><strong>Start Using</strong> - Access the main dashboard at /ai-sales-assistant</li>
                        </ol>
                        <p className="mt-4"><strong>Note:</strong> Free trial users get limited features. Upgrade to unlock full AI capabilities, unlimited transcription minutes, and advanced features.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dashboard">
                    <AccordionTrigger data-testid="accordion-dashboard">Dashboard Overview</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>The Rev Winner dashboard provides quick access to all features:</p>
                        <ul>
                          <li><strong>Home</strong> - Main landing page with quick start options</li>
                          <li><strong>AI Sales Assistant</strong> - Live transcription and conversation analysis</li>
                          <li><strong>Train Me</strong> - Upload training materials for AI context</li>
                          <li><strong>Settings</strong> - Configure AI engine, domain expertise, and preferences</li>
                          <li><strong>Profile</strong> - View account details, subscription status, and payment history</li>
                          <li><strong>Help</strong> - Access this documentation anytime</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="first-call">
                    <AccordionTrigger data-testid="accordion-first-call">First Call Setup</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <ol>
                          <li><strong>Navigate to AI Sales Assistant</strong> - Click the menu icon and select "Rev Winner App"</li>
                          <li><strong>Allow Microphone Access</strong> - Your browser will prompt for permission</li>
                          <li><strong>Configure Audio Source</strong>:
                            <ul>
                              <li>Use your microphone for in-person or phone calls</li>
                              <li>Use screen audio capture for Zoom/Teams/Google Meet calls</li>
                            </ul>
                          </li>
                          <li><strong>Set Domain Expertise</strong> - Select the product/industry you're selling (or create a new one in Settings)</li>
                          <li><strong>Start Transcription</strong> - Click "Start Recording" to begin capturing the conversation</li>
                          <li><strong>During the Call</strong> - Watch live transcription, AI insights, and coaching tips appear in real-time</li>
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="configuration">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-configuration">
                  <Settings className="h-6 w-6 text-purple-600" />
                  Configuration & Settings
                </CardTitle>
                <CardDescription data-testid="desc-configuration">Personalize your workspace and AI setup</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="ai-engine">
                    <AccordionTrigger data-testid="accordion-ai-engine">AI Engine Selection</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Rev Winner supports multiple AI providers. Choose based on your needs:</p>
                        <ul>
                          <li><strong>OpenAI GPT-4</strong> - Best for detailed analysis and creative insights (requires API key)</li>
                          <li><strong>Anthropic Claude</strong> - Excellent for long conversations and nuanced understanding (requires API key)</li>
                          <li><strong>Google Gemini</strong> - Fast responses with multimodal capabilities (requires API key)</li>
                          <li><strong>DeepSeek</strong> - Cost-effective with strong reasoning abilities (requires API key)</li>
                          <li><strong>X.AI Grok</strong> - Real-time data and conversational insights (requires API key)</li>
                          <li><strong>Moonshot AI (Kimi K2)</strong> - Optimized for Asian markets and multilingual support (requires API key)</li>
                        </ul>
                        <p className="mt-4"><strong>How to configure:</strong> Go to Settings → AI Configuration → Select your preferred provider and enter your API key. Keys are encrypted and stored securely.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="domain">
                    <AccordionTrigger data-testid="accordion-domain">Domain Expertise Setup</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Domain Expertise tells Rev Winner what you're selling, enabling tailored AI responses:</p>
                        <ol>
                          <li>Navigate to <strong>Settings</strong></li>
                          <li>Click <strong>Domain Expertise Configuration</strong></li>
                          <li>Click <strong>Create New Domain</strong></li>
                          <li>Enter details:
                            <ul>
                              <li><strong>Name</strong> - e.g., "Enterprise CRM Software"</li>
                              <li><strong>Description</strong> - Brief overview of your product/service</li>
                              <li><strong>Industry Focus</strong> - Target market or sector</li>
                            </ul>
                          </li>
                          <li>Save and select this domain when starting calls</li>
                        </ol>
                        <p className="mt-4">You can create multiple domains for different products or client segments.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="train-me">
                    <AccordionTrigger data-testid="accordion-train-me">Train Me Module Guide</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>The Train Me module lets you upload training materials to enhance AI responses:</p>
                        <h4>Supported File Types</h4>
                        <ul>
                          <li>PDF documents</li>
                          <li>Word documents (.doc, .docx)</li>
                          <li>Text files (.txt)</li>
                          <li>Excel spreadsheets (.xls, .xlsx)</li>
                          <li>PowerPoint presentations (.ppt, .pptx)</li>
                          <li>Web URLs (articles, documentation)</li>
                        </ul>
                        <h4>How to Upload</h4>
                        <ol>
                          <li>Go to <strong>Train Me</strong> from the menu</li>
                          <li>Select a Domain Expertise profile</li>
                          <li>Click <strong>Upload Documents</strong> or drag-and-drop files</li>
                          <li>Wait for processing (status shows: pending → processing → completed)</li>
                          <li>Uploaded materials are now used by AI during calls</li>
                        </ol>
                        <p className="mt-4"><strong>Limits:</strong> Up to 100 documents per domain expertise profile. Maximum file size: 10MB per file.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="profile-sub">
                    <AccordionTrigger data-testid="accordion-profile">Profile & Subscription Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>View and manage your account from the Profile page:</p>
                        <ul>
                          <li><strong>Personal Information</strong> - Name, email, contact details</li>
                          <li><strong>Subscription Status</strong> - Current plan, renewal date, features included</li>
                          <li><strong>Payment History</strong> - View past invoices and download receipts</li>
                          <li><strong>Usage Statistics</strong> - Track transcription minutes and API usage</li>
                        </ul>
                        <p className="mt-4">To update your profile, click <strong>Edit Profile</strong> or go to Settings.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="notifications">
                    <AccordionTrigger data-testid="accordion-notifications">Notifications & Preferences</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Customize how Rev Winner notifies you:</p>
                        <ul>
                          <li><strong>Email Notifications</strong> - Receive summaries after calls</li>
                          <li><strong>Browser Alerts</strong> - Get notified when transcription starts/stops</li>
                          <li><strong>Document Processing</strong> - Alerts when training materials finish processing</li>
                          <li><strong>Billing Reminders</strong> - Payment due dates and renewal notices</li>
                        </ul>
                        <p className="mt-4">Configure these in Settings → Notifications.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="using-calls">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-using-calls">
                  <Phone className="h-6 w-6 text-purple-600" />
                  Using Rev Winner During Calls
                </CardTitle>
                <CardDescription data-testid="desc-using-calls">Master the live conversation features</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="start-session">
                    <AccordionTrigger data-testid="accordion-start-session">Starting a Call Session</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <ol>
                          <li><strong>Connect Audio Source</strong>:
                            <ul>
                              <li>Click "Start Recording" to access microphone</li>
                              <li>For remote meetings, use browser's screen audio capture feature</li>
                            </ul>
                          </li>
                          <li><strong>Speaker Diarization</strong> - Rev Winner automatically identifies different speakers (You vs. Client)</li>
                          <li><strong>Manual Speaker Selection</strong> - If auto-detection fails, manually assign speakers</li>
                          <li><strong>Background Noise Suppression</strong> - Enabled automatically for clearer transcription</li>
                          <li><strong>Pause/Resume</strong> - Control recording during breaks or sensitive moments</li>
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="transcription">
                    <AccordionTrigger data-testid="accordion-transcription">Real-Time Transcription Guide</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Live speech-to-text powered by Deepgram AI:</p>
                        <ul>
                          <li><strong>Compact Format</strong> - Displays as <code>[Speaker]: [Text]</code> for easy reading</li>
                          <li><strong>Auto-Scroll</strong> - Automatically follows the latest transcript line</li>
                          <li><strong>Speaker Labels</strong> - "You" vs. "Speaker 1", "Speaker 2", etc.</li>
                          <li><strong>Multi-Language Support</strong> - Works with English and major languages</li>
                          <li><strong>Export Options</strong> - Download full transcript after the call</li>
                        </ul>
                        <p className="mt-4"><strong>Tip:</strong> Speak clearly and avoid overlapping speech for best accuracy.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="analysis">
                    <AccordionTrigger data-testid="accordion-analysis">Analyzing Conversations</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>On-demand AI analysis provides deep insights:</p>
                        <ol>
                          <li><strong>Click "Analyze"</strong> - Triggers AI to review the conversation</li>
                          <li><strong>Select Segments</strong> - Analyze specific parts or the full transcript</li>
                          <li><strong>Review Insights</strong>:
                            <ul>
                              <li>Pain points identified</li>
                              <li>Buying signals detected</li>
                              <li>Recommended discovery questions</li>
                              <li>Solution recommendations</li>
                              <li>Case studies relevant to client needs</li>
                            </ul>
                          </li>
                          <li><strong>Ask Follow-Up Questions</strong> - Use Q&A feature for clarification</li>
                        </ol>
                        <p className="mt-4"><strong>Analysis Speed:</strong> Typically completes in under 3 seconds using optimized AI models.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="present-win">
                    <AccordionTrigger data-testid="accordion-present-win">Present to Win Section</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Auto-generated sales materials based on your conversation:</p>
                        <h4>1. Pitch Deck (5 Slides)</h4>
                        <ul>
                          <li>Opening Hook - Capture attention</li>
                          <li>Problem Statement - Client's pain points</li>
                          <li>Solution Overview - Your product's value</li>
                          <li>Key Benefits - Why choose you</li>
                          <li>Call-to-Action - Next steps</li>
                        </ul>
                        <h4>2. Case Study (2 Slides)</h4>
                        <ul>
                          <li>Challenge - Similar client scenario</li>
                          <li>Solution & Outcome - Results achieved</li>
                        </ul>
                        <h4>3. Battle Card (Comparison Table)</h4>
                        <ul>
                          <li>Your product vs. competitors</li>
                          <li>Feature-by-feature comparison</li>
                          <li>Positioning advantages</li>
                        </ul>
                        <p className="mt-4"><strong>Usage:</strong> Swipe through slides using carousel navigation. Share during or after calls.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="minutes">
                    <AccordionTrigger data-testid="accordion-minutes">Meeting Minutes & Summaries</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Automatically generated after each call:</p>
                        <ul>
                          <li><strong>Executive Summary</strong> - Key takeaways</li>
                          <li><strong>Action Items</strong> - Follow-up tasks</li>
                          <li><strong>Decisions Made</strong> - Agreements reached</li>
                          <li><strong>Next Steps</strong> - Timeline and commitments</li>
                          <li><strong>Full Transcript</strong> - Complete conversation record</li>
                        </ul>
                        <p className="mt-4"><strong>Export:</strong> Download as professional PDF or copy to clipboard for email.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="advanced">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-advanced">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  Advanced Features
                </CardTitle>
                <CardDescription data-testid="desc-advanced">Power user capabilities and enterprise tools</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="ai-comparison">
                    <AccordionTrigger data-testid="accordion-ai-comparison">Multiple AI Models Comparison</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <table className="min-w-full border border-slate-300 dark:border-slate-700">
                          <thead>
                            <tr className="bg-purple-100 dark:bg-purple-900">
                              <th className="border p-2">AI Model</th>
                              <th className="border p-2">Best For</th>
                              <th className="border p-2">Speed</th>
                              <th className="border p-2">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2">OpenAI GPT-4</td>
                              <td className="border p-2">Complex analysis, creative pitches</td>
                              <td className="border p-2">Medium</td>
                              <td className="border p-2">$$$$</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Claude</td>
                              <td className="border p-2">Long conversations, nuanced understanding</td>
                              <td className="border p-2">Fast</td>
                              <td className="border p-2">$$$</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Gemini</td>
                              <td className="border p-2">Fast responses, multimodal</td>
                              <td className="border p-2">Very Fast</td>
                              <td className="border p-2">$$</td>
                            </tr>
                            <tr>
                              <td className="border p-2">DeepSeek</td>
                              <td className="border p-2">Cost-effective, reasoning</td>
                              <td className="border p-2">Fast</td>
                              <td className="border p-2">$</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Grok</td>
                              <td className="border p-2">Real-time data, conversational</td>
                              <td className="border p-2">Medium</td>
                              <td className="border p-2">$$$</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Kimi K2</td>
                              <td className="border p-2">Multilingual, Asian markets</td>
                              <td className="border p-2">Fast</td>
                              <td className="border p-2">$$</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="mt-4"><strong>Recommendation:</strong> Start with Claude or Gemini for balanced speed and quality. Switch to GPT-4 for high-stakes enterprise deals.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="enterprise">
                    <AccordionTrigger data-testid="accordion-enterprise">Enterprise License Management</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Admin features for team management (Enterprise plan only):</p>
                        <ul>
                          <li><strong>User Management</strong> - Add, remove, or reassign licenses</li>
                          <li><strong>Role-Based Access</strong> - Admin vs. User permissions</li>
                          <li><strong>Usage Analytics</strong> - Track team performance and AI usage</li>
                          <li><strong>Centralized Billing</strong> - One invoice for the entire team</li>
                          <li><strong>Custom Domain Expertise</strong> - Shared training materials across team</li>
                        </ul>
                        <p className="mt-4">Contact sales@revwinner.com for enterprise pricing and setup.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="multi-domain">
                    <AccordionTrigger data-testid="accordion-multi-domain">Multi-Domain Training</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Manage multiple product lines with separate training:</p>
                        <ul>
                          <li>Create up to <strong>unlimited domain expertise profiles</strong></li>
                          <li>Upload <strong>up to 100 documents per domain</strong></li>
                          <li>Switch between domains during calls</li>
                          <li>AI automatically prioritizes domain-specific training materials</li>
                        </ul>
                        <p className="mt-4"><strong>Example Use Cases:</strong></p>
                        <ul>
                          <li>SaaS company with multiple product tiers</li>
                          <li>Consulting firm serving different industries</li>
                          <li>Sales rep managing multiple client verticals</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="privacy">
                    <AccordionTrigger data-testid="accordion-privacy">Data Privacy & Security</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Rev Winner takes security seriously:</p>
                        <ul>
                          <li><strong>Encryption</strong> - All data encrypted in transit (HTTPS) and at rest (AES-256)</li>
                          <li><strong>API Key Storage</strong> - Your AI provider keys are encrypted before storage</li>
                          <li><strong>Session Data</strong> - Conversations are private and user-scoped</li>
                          <li><strong>No Sharing</strong> - Your data is never shared with third parties</li>
                          <li><strong>GDPR Compliance</strong> - Data deletion requests honored within 30 days</li>
                          <li><strong>Audit Logs</strong> - Track all account activity</li>
                        </ul>
                        <p className="mt-4">See our <a href="/privacy-policy" className="text-purple-600 dark:text-purple-400">Privacy Policy</a> for full details.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="integrations">
                    <AccordionTrigger data-testid="accordion-integrations">Integrations & APIs</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Connect Rev Winner with your existing tools:</p>
                        <ul>
                          <li><strong>CRM Integration</strong> - Sync meeting minutes to Salesforce, HubSpot, Pipedrive (coming soon)</li>
                          <li><strong>Calendar Apps</strong> - Auto-schedule follow-ups in Google Calendar, Outlook (coming soon)</li>
                          <li><strong>Email</strong> - Send summaries via Gmail, Outlook integration (coming soon)</li>
                          <li><strong>Slack/Teams</strong> - Post call summaries to channels (coming soon)</li>
                        </ul>
                        <p className="mt-4">Interested in API access? Contact sales@revwinner.com</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="billing">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-billing">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                  Pricing & Plans
                </CardTitle>
                <CardDescription data-testid="desc-billing">Transparent pricing with flexible options for individuals and teams</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="how-pricing-works">
                    <AccordionTrigger data-testid="accordion-how-pricing-works">How Rev Winner Pricing Works</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Rev Winner uses a two-part pricing model:</p>
                        <ol>
                          <li><strong>Platform Access</strong> - Your base subscription that unlocks Rev Winner features</li>
                          <li><strong>Session Minutes</strong> - Required add-on for recording and transcription time</li>
                        </ol>
                        <p className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <strong>Important:</strong> Both Platform Access and Session Minutes are required after your free trial. Platform Access alone does not include session minutes.
                        </p>
                        <h4>Free Trial</h4>
                        <ul>
                          <li><strong>Duration:</strong> 3 sessions (up to 60 minutes each)</li>
                          <li><strong>Features:</strong> All AI features included</li>
                          <li><strong>No credit card required</strong></li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="pricing">
                    <AccordionTrigger data-testid="accordion-pricing">Platform Access Plans</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <table className="min-w-full border border-slate-300 dark:border-slate-700">
                          <thead>
                            <tr className="bg-purple-100 dark:bg-purple-900">
                              <th className="border p-2">Plan</th>
                              <th className="border p-2">Price</th>
                              <th className="border p-2">Validity</th>
                              <th className="border p-2">Savings</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2"><strong>Month-to-Month</strong></td>
                              <td className="border p-2">$40/month</td>
                              <td className="border p-2">30 days</td>
                              <td className="border p-2">-</td>
                            </tr>
                            <tr>
                              <td className="border p-2"><strong>6 Months</strong></td>
                              <td className="border p-2">$200</td>
                              <td className="border p-2">180 days</td>
                              <td className="border p-2">Save 17%</td>
                            </tr>
                            <tr>
                              <td className="border p-2"><strong>12 Months</strong></td>
                              <td className="border p-2">$399</td>
                              <td className="border p-2">365 days</td>
                              <td className="border p-2">Save 17%</td>
                            </tr>
                            <tr className="bg-green-50 dark:bg-green-900/30">
                              <td className="border p-2"><strong>36 Months (Best Value)</strong></td>
                              <td className="border p-2">$499</td>
                              <td className="border p-2">3 years</td>
                              <td className="border p-2">Save 67%</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="mt-4"><strong>All Platform Access plans include:</strong> All AI features, priority support, unlimited sessions (within your session minutes), and access to all sales assistant tools.</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">Note: Platform Access does NOT include session minutes. You must purchase Session Minutes add-ons separately.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="user-vs-team">
                    <AccordionTrigger data-testid="accordion-user-vs-team">Individual vs. Team Purchases</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Individual (User) Mode</h4>
                        <ul>
                          <li>Purchase for yourself</li>
                          <li>Single license, single user</li>
                          <li>Manage your own subscription</li>
                          <li>Purchase additional session minutes as needed</li>
                        </ul>
                        <h4>Team Mode</h4>
                        <ul>
                          <li>Purchase multiple licenses for your organization</li>
                          <li>Become a License Manager with centralized control</li>
                          <li>Assign, reassign, or revoke licenses to team members</li>
                          <li>Track usage across your entire team</li>
                          <li>Add more seats anytime</li>
                          <li>Automated email notifications to assigned users</li>
                        </ul>
                        <p className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                          <strong>Tip:</strong> Team purchases require Session Minutes packages to match the number of Platform Access licenses (1:1 ratio).
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="payment">
                    <AccordionTrigger data-testid="accordion-payment">Payment Methods</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>We accept payments via Razorpay:</p>
                        <ul>
                          <li>Credit/Debit Cards (Visa, Mastercard, RuPay, Amex)</li>
                          <li>UPI (Google Pay, PhonePe, Paytm)</li>
                          <li>Net Banking</li>
                          <li>Digital Wallets</li>
                        </ul>
                        <p className="mt-4"><strong>Currency:</strong> US Dollars ($) for all transactions.</p>
                        <p><strong>International Customers:</strong> Payments processed securely through Razorpay in USD.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="invoices">
                    <AccordionTrigger data-testid="accordion-invoices">Invoices & Receipts</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Access your payment history from the Profile page:</p>
                        <ol>
                          <li>Navigate to <strong>Profile</strong></li>
                          <li>Scroll to <strong>Payment History</strong> section</li>
                          <li>Click <strong>Download Receipt</strong> for any transaction</li>
                          <li>Invoices are sent automatically to your registered email</li>
                        </ol>
                        <p className="mt-4">Invoices include all applicable taxes and are suitable for expense reimbursement.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="gst">
                    <AccordionTrigger data-testid="accordion-gst">GST & Taxes</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>USA Customers</h4>
                        <p><strong>Example (Annual Plan):</strong> $240/year (no sales tax applied for digital services)</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Most US states don't require sales tax on B2B SaaS subscriptions. Contact sales@revwinner.com for state-specific tax questions.</p>
                        
                        <h4 className="mt-6">Indian Customers</h4>
                        <p>Tax calculation for Indian customers:</p>
                        <ul>
                          <li><strong>GST Rate:</strong> 18% applied to all subscriptions</li>
                          <li><strong>Display:</strong> Base price + GST shown separately during checkout</li>
                          <li><strong>Invoice:</strong> GST number and breakdown included on receipts</li>
                          <li><strong>Input Credit:</strong> Registered businesses can claim GST input credit</li>
                        </ul>
                        <p className="mt-4"><strong>Example:</strong> 1-Year plan $399 (no sales tax for most US customers)</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cancellation">
                    <AccordionTrigger data-testid="accordion-cancellation">Cancellation & Refund Policy</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Cancellation Process</h4>
                        <ol>
                          <li>Go to <strong>Profile</strong> → <strong>Subscription</strong></li>
                          <li>Click <strong>Cancel Subscription</strong></li>
                          <li>Confirm cancellation</li>
                          <li>Access continues until end of billing period</li>
                        </ol>
                        <h4>Refund Policy</h4>
                        <ul>
                          <li><strong>Free Trial:</strong> No charges, cancel anytime</li>
                          <li><strong>Monthly Plans:</strong> No refunds for partial months</li>
                          <li><strong>Annual Plans:</strong> Pro-rated refund within 30 days of purchase</li>
                          <li><strong>Enterprise Plans:</strong> Custom terms apply</li>
                        </ul>
                        <p className="mt-4">For refund requests, contact support@revwinner.com with your order ID.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="addons">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-addons">
                  <Package className="h-6 w-6 text-purple-600" />
                  Add-ons & Session Minutes
                </CardTitle>
                <CardDescription data-testid="desc-addons">Enhance your Rev Winner experience with add-ons</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="session-minutes">
                    <AccordionTrigger data-testid="accordion-session-minutes">Session Minutes (Required)</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <strong>Important:</strong> Session Minutes are REQUIRED after your free trial. You cannot use Rev Winner without them.
                        </p>
                        <h4>Session Minutes Packages</h4>
                        <table className="min-w-full border border-slate-300 dark:border-slate-700 mt-4">
                          <thead>
                            <tr className="bg-purple-100 dark:bg-purple-900">
                              <th className="border p-2">Package</th>
                              <th className="border p-2">Price</th>
                              <th className="border p-2">Validity</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2"><strong>500 Minutes</strong></td>
                              <td className="border p-2">$8</td>
                              <td className="border p-2">31 days</td>
                            </tr>
                          </tbody>
                        </table>
                        <h4 className="mt-4">How Session Minutes Work</h4>
                        <ul>
                          <li>Minutes are consumed during active transcription sessions</li>
                          <li>You can purchase multiple packages - they stack</li>
                          <li>Oldest minutes are used first (FIFO - First In, First Out)</li>
                          <li>Minutes expire based on their individual validity period</li>
                          <li>Track your remaining minutes on your Profile page</li>
                        </ul>
                        <h4>How to Purchase Session Minutes</h4>
                        <ol>
                          <li>Go to <strong>Manage Subscription</strong> page</li>
                          <li>Select a Session Minutes package</li>
                          <li>Apply promo code if available</li>
                          <li>Click <strong>Purchase</strong></li>
                          <li>Complete payment via Razorpay (UPI, Cards, Net Banking)</li>
                          <li>Minutes are added instantly after payment confirmation</li>
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="train-me-addon">
                    <AccordionTrigger data-testid="accordion-train-me-addon">Train Me Add-on</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Upload your own training materials to customize AI responses for your specific products and services.</p>
                        <h4>Pricing</h4>
                        <ul>
                          <li><strong>Price:</strong> $20/month</li>
                          <li><strong>Capacity:</strong> Up to 100 documents per profile</li>
                        </ul>
                        <h4>Features</h4>
                        <ul>
                          <li>Upload PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX files</li>
                          <li>Add web URLs for AI to reference</li>
                          <li>Create multiple domain expertise profiles</li>
                          <li>AI uses your training materials during calls</li>
                          <li>Improve response accuracy with your product knowledge</li>
                        </ul>
                        <h4>Best Use Cases</h4>
                        <ul>
                          <li>Product catalogs and specifications</li>
                          <li>Case studies and success stories</li>
                          <li>Pricing sheets and competitive analysis</li>
                          <li>Sales playbooks and objection handling guides</li>
                          <li>Technical documentation</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dai-addon">
                    <AccordionTrigger data-testid="accordion-dai-addon">DAI (Rev Winner AI) Service Levels</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>DAI (Rev Winner AI) provides enhanced AI token allocations for users who need more AI processing power.</p>
                        <h4>Service Tiers</h4>
                        <table className="min-w-full border border-slate-300 dark:border-slate-700">
                          <thead>
                            <tr className="bg-purple-100 dark:bg-purple-900">
                              <th className="border p-2">Tier</th>
                              <th className="border p-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2"><strong>Lite</strong></td>
                              <td className="border p-2">Basic token-based usage</td>
                            </tr>
                            <tr>
                              <td className="border p-2"><strong>Moderate</strong></td>
                              <td className="border p-2">Increased token limits</td>
                            </tr>
                            <tr>
                              <td className="border p-2"><strong>Professional</strong></td>
                              <td className="border p-2">Higher tier with more tokens</td>
                            </tr>
                            <tr>
                              <td className="border p-2"><strong>Power</strong></td>
                              <td className="border p-2">Premium token allocation</td>
                            </tr>
                            <tr>
                              <td className="border p-2"><strong>Enterprise</strong></td>
                              <td className="border p-2">Unlimited enterprise usage</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="mt-4"><strong>Note:</strong> All plans require you to bring your own AI API keys (OpenAI, Anthropic, Google, X.AI, DeepSeek, or Moonshot AI).</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="managing-addons">
                    <AccordionTrigger data-testid="accordion-managing-addons">Managing Your Add-ons</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Viewing Your Add-ons</h4>
                        <ol>
                          <li>Go to your <strong>Profile</strong> page</li>
                          <li>Scroll to the <strong>Subscription</strong> section</li>
                          <li>View active add-ons, their status, and expiry dates</li>
                        </ol>
                        <h4>Session Minutes Balance</h4>
                        <ul>
                          <li>Your total remaining minutes are shown on the Profile page</li>
                          <li>Minutes from multiple purchases stack together</li>
                          <li>Expiry dates are tracked per-package</li>
                        </ul>
                        <h4>Purchasing More Add-ons</h4>
                        <ol>
                          <li>Navigate to <strong>Packages</strong> page</li>
                          <li>Browse available add-ons in the Add-ons section</li>
                          <li>Add desired items to cart</li>
                          <li>Complete checkout</li>
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="license-manager">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-license-manager">
                  <Building2 className="h-6 w-6 text-purple-600" />
                  License Manager Portal
                </CardTitle>
                <CardDescription data-testid="desc-license-manager">Enterprise license management for team administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="what-is-license-manager">
                    <AccordionTrigger data-testid="accordion-what-is-license-manager">What is the License Manager Portal?</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>The License Manager Portal is a centralized dashboard for organizations that have purchased team licenses. It allows designated administrators (License Managers) to:</p>
                        <ul>
                          <li>View all purchased licenses and their status</li>
                          <li>Assign licenses to team members</li>
                          <li>Reassign licenses between users</li>
                          <li>Revoke (unassign) licenses</li>
                          <li>Track usage across the organization</li>
                          <li>Purchase additional seats</li>
                          <li>View audit logs and activity history</li>
                        </ul>
                        <h4>Who Becomes a License Manager?</h4>
                        <p>When you make a <strong>Team purchase</strong> on the Packages page, you automatically become the License Manager for your organization. You can then assign licenses to your team members.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="accessing-portal">
                    <AccordionTrigger data-testid="accordion-accessing-portal">Accessing the License Manager Portal</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <ol>
                          <li>Log in to your Rev Winner account</li>
                          <li>Click on your profile avatar in the top-right corner</li>
                          <li>Select <strong>License Manager</strong> from the dropdown menu</li>
                          <li>You'll see your organization dashboard with all license information</li>
                        </ol>
                        <p className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                          <strong>Note:</strong> Only users with the License Manager role can access this portal. Regular users will not see this option.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="assigning-licenses">
                    <AccordionTrigger data-testid="accordion-assigning-licenses">Assigning Licenses to Team Members</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>How to Assign a License</h4>
                        <ol>
                          <li>Go to the License Manager Portal</li>
                          <li>Click the <strong>Assign License</strong> button</li>
                          <li>Fill in the required contact information:
                            <ul>
                              <li><strong>First Name</strong> (required)</li>
                              <li><strong>Last Name</strong> (required)</li>
                              <li><strong>Email Address</strong> (required)</li>
                              <li><strong>Phone Number</strong> (required, minimum 10 digits)</li>
                              <li>Notes (optional)</li>
                            </ul>
                          </li>
                          <li>Click <strong>Assign</strong></li>
                          <li>The user receives an email with login instructions</li>
                        </ol>
                        <h4>What Happens When You Assign a License?</h4>
                        <ul>
                          <li>A new user account is created (if the email doesn't exist)</li>
                          <li>The user receives an email with their login credentials</li>
                          <li>The license is marked as "Assigned" in your dashboard</li>
                          <li>The user can immediately start using Rev Winner</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="reassigning-licenses">
                    <AccordionTrigger data-testid="accordion-reassigning-licenses">Reassigning and Revoking Licenses</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Reassigning a License</h4>
                        <p>Transfer a license from one user to another:</p>
                        <ol>
                          <li>Find the current assignee in your license list</li>
                          <li>Click the <strong>Reassign</strong> button</li>
                          <li>Enter the new user's email address</li>
                          <li>Add optional notes explaining the reassignment</li>
                          <li>Click <strong>Confirm Reassignment</strong></li>
                        </ol>
                        <h4>Revoking (Unassigning) a License</h4>
                        <p>Remove access from a user and free up the license:</p>
                        <ol>
                          <li>Find the user in your license list</li>
                          <li>Click the <strong>Unassign</strong> button</li>
                          <li>Confirm the action</li>
                          <li>The license becomes available for reassignment</li>
                          <li>The user receives an email notification about the revocation</li>
                        </ol>
                        <p className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <strong>Safety Feature:</strong> You cannot unassign your own license. This prevents accidental loss of administrative access.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="adding-seats">
                    <AccordionTrigger data-testid="accordion-adding-seats">Adding More Seats</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Need more licenses for your growing team? You can purchase additional seats anytime:</p>
                        <ol>
                          <li>Go to the License Manager Portal</li>
                          <li>Click <strong>Add Seats</strong> button</li>
                          <li>Enter the number of additional seats needed</li>
                          <li>Review the pricing (based on your current plan)</li>
                          <li>Complete payment via Razorpay</li>
                          <li>New licenses are available immediately</li>
                        </ol>
                        <h4>Pricing for Additional Seats</h4>
                        <p>Additional seats are priced based on your current Platform Access plan. Contact sales@revwinner.com for enterprise volume discounts (50+ seats).</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="expiry-notifications">
                    <AccordionTrigger data-testid="accordion-expiry-notifications">Expiry Warnings and Notifications</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>Rev Winner sends automated notifications to keep you informed:</p>
                        <h4>Email Notifications</h4>
                        <ul>
                          <li><strong>7 days before expiry:</strong> Warning email sent to License Manager</li>
                          <li><strong>3 days before expiry:</strong> Urgent reminder email</li>
                          <li><strong>License revocation:</strong> Affected user notified when access is removed</li>
                          <li><strong>License assignment:</strong> New user receives welcome email with login details</li>
                        </ul>
                        <h4>Dashboard Warnings</h4>
                        <ul>
                          <li><strong>Amber warning:</strong> Licenses expiring within 14 days</li>
                          <li><strong>Red urgent warning:</strong> Licenses expiring within 3 days</li>
                          <li><strong>Expired notification:</strong> Licenses that have passed their expiry date</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="audit-trail">
                    <AccordionTrigger data-testid="accordion-audit-trail">Audit Trail and Activity Logs</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>The License Manager Portal maintains a comprehensive audit trail of all license-related activities:</p>
                        <ul>
                          <li><strong>License assignments:</strong> Who was assigned, when, and by whom</li>
                          <li><strong>License reassignments:</strong> Transfer history between users</li>
                          <li><strong>License revocations:</strong> When and why access was removed</li>
                          <li><strong>Seat additions:</strong> Purchase history for additional licenses</li>
                          <li><strong>User deletions:</strong> When users were removed from the organization</li>
                        </ul>
                        <p>This audit trail helps with compliance, security reviews, and understanding your team's license usage patterns.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="troubleshooting">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-troubleshooting">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                  Troubleshooting & FAQs
                </CardTitle>
                <CardDescription data-testid="desc-troubleshooting">Common issues and quick fixes</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="microphone">
                    <AccordionTrigger data-testid="accordion-microphone">Microphone Not Detected</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Quick Fixes:</h4>
                        <ol>
                          <li><strong>Check Browser Permissions</strong>:
                            <ul>
                              <li>Chrome: Click the lock icon in address bar → Site settings → Allow microphone</li>
                              <li>Firefox: Click the shield icon → Permissions → Allow microphone</li>
                              <li>Safari: Safari menu → Settings → Websites → Microphone → Allow</li>
                            </ul>
                          </li>
                          <li><strong>System Settings</strong>:
                            <ul>
                              <li>Windows: Settings → Privacy → Microphone → Allow apps to access</li>
                              <li>Mac: System Preferences → Security & Privacy → Microphone → Check browser</li>
                            </ul>
                          </li>
                          <li><strong>Hardware Check</strong>:
                            <ul>
                              <li>Test microphone in another app (Zoom, Skype)</li>
                              <li>Try a different microphone</li>
                              <li>Check if muted or volume too low</li>
                            </ul>
                          </li>
                          <li><strong>Refresh Page</strong> - Sometimes a simple reload fixes permission issues</li>
                        </ol>
                        <p className="mt-4">Still not working? Contact support@revwinner.com</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="latency">
                    <AccordionTrigger data-testid="accordion-latency">Transcription Delay or Latency</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Common Causes:</h4>
                        <ul>
                          <li><strong>Slow Internet</strong> - Requires 5+ Mbps for real-time transcription</li>
                          <li><strong>Background Apps</strong> - Close bandwidth-heavy applications</li>
                          <li><strong>Server Load</strong> - Peak usage times may cause slight delays</li>
                        </ul>
                        <h4>Solutions:</h4>
                        <ol>
                          <li>Test your internet speed at <a href="https://fast.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400">fast.com</a></li>
                          <li>Close unnecessary browser tabs and apps</li>
                          <li>Try a wired Ethernet connection instead of Wi-Fi</li>
                          <li>Restart your router</li>
                          <li>Switch to a different browser (Chrome recommended)</li>
                        </ol>
                        <p className="mt-4"><strong>Expected Delay:</strong> 1-3 seconds is normal for real-time transcription.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="recording">
                    <AccordionTrigger data-testid="accordion-recording">Call Recording Not Starting</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Troubleshooting Checklist:</h4>
                        <ol>
                          <li><strong>Microphone Permission</strong> - Ensure browser has access (see above)</li>
                          <li><strong>Domain Expertise</strong> - Select or create a domain before starting</li>
                          <li><strong>AI Configuration</strong> - Verify AI engine is set up with valid API key</li>
                          <li><strong>Browser Compatibility</strong> - Use Chrome 90+ or Edge 90+</li>
                          <li><strong>HTTPS Required</strong> - Transcription only works on secure connections (automatic on Rev Winner)</li>
                          <li><strong>Ad Blockers</strong> - Try disabling extensions that might interfere</li>
                        </ol>
                        <p className="mt-4">Check browser console (F12) for error messages and share with support if issue persists.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="upload-errors">
                    <AccordionTrigger data-testid="accordion-upload-errors">Upload Errors in Train Me</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>File Requirements:</h4>
                        <ul>
                          <li><strong>Supported Formats:</strong> PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX</li>
                          <li><strong>Maximum Size:</strong> 10MB per file</li>
                          <li><strong>File Limit:</strong> 100 documents per domain expertise</li>
                        </ul>
                        <h4>Common Issues:</h4>
                        <ul>
                          <li><strong>"Processing Failed"</strong> - File may be corrupted or password-protected. Try re-saving without encryption.</li>
                          <li><strong>"Upload Failed"</strong> - Check internet connection and file size</li>
                          <li><strong>"Domain Limit Reached"</strong> - Delete old documents before uploading new ones</li>
                        </ul>
                        <p className="mt-4">For large training datasets, contact sales@revwinner.com about enterprise options.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="billing-issues">
                    <AccordionTrigger data-testid="accordion-billing-issues">Billing Issues or Declined Payments</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Payment Declined:</h4>
                        <ol>
                          <li><strong>Check Card Details</strong> - Verify expiry date, CVV, billing address</li>
                          <li><strong>Bank Limits</strong> - Some banks block online payments by default. Call your bank to enable.</li>
                          <li><strong>Try Different Method</strong> - Switch from card to UPI or net banking</li>
                          <li><strong>Payment Gateway Issues</strong> - Contact Razorpay support if payment gateway shows errors</li>
                        </ol>
                        <h4>Subscription Not Activated:</h4>
                        <ul>
                          <li>Payment may take 5-10 minutes to reflect</li>
                          <li>Check email for payment confirmation</li>
                          <li>Refresh your Profile page</li>
                          <li>Contact support@revwinner.com with payment ID</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq">
                    <AccordionTrigger data-testid="accordion-faq">General FAQ</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <h4>Q: How accurate is the transcription?</h4>
                        <p>A: Rev Winner uses Deepgram AI with 90-95% accuracy for clear English speech. Accuracy improves with good audio quality and minimal background noise.</p>
                        
                        <h4>Q: Can I use Rev Winner for languages other than English?</h4>
                        <p>A: Currently optimized for English. Support for Spanish, French, German, and Hindi coming soon.</p>
                        
                        <h4>Q: Are my conversations stored permanently?</h4>
                        <p>A: Yes, all transcripts and analysis are saved to your account. You can delete them anytime from the conversation history.</p>
                        
                        <h4>Q: Can I use Rev Winner offline?</h4>
                        <p>A: No, Rev Winner requires an active internet connection for real-time transcription and AI analysis.</p>
                        
                        <h4>Q: How many calls can I record per month?</h4>
                        <p>A: Paid plans include unlimited transcription minutes. Free trial has a 60-minute total limit.</p>
                        
                        <h4>Q: Do I need my own AI API keys?</h4>
                        <p>A: Yes, Rev Winner requires you to provide API keys for OpenAI, Claude, or other AI providers. This ensures data privacy and lets you control AI costs.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section id="policies">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-policies">
                  <FileText className="h-6 w-6 text-purple-600" />
                  Policies & Legal
                </CardTitle>
                <CardDescription data-testid="desc-policies">Terms, privacy, and compliance information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="card-policy-terms">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" data-testid="heading-policy-terms">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Terms & Conditions
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3" data-testid="text-policy-terms-desc">
                      Legal agreement governing your use of Rev Winner services, including acceptable use policies and limitations.
                    </p>
                    <a href="/terms-and-conditions" className="text-purple-600 dark:text-purple-400 hover:underline" data-testid="link-terms">
                      Read Full Terms →
                    </a>
                  </div>

                  <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="card-policy-privacy">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" data-testid="heading-policy-privacy">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Privacy Policy
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3" data-testid="text-policy-privacy-desc">
                      How we collect, use, and protect your personal information and conversation data. GDPR compliant.
                    </p>
                    <a href="/privacy-policy" className="text-purple-600 dark:text-purple-400 hover:underline" data-testid="link-privacy">
                      Read Privacy Policy →
                    </a>
                  </div>

                  <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="card-policy-refund">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" data-testid="heading-policy-refund">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Cancellation & Refund Policy
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3" data-testid="text-policy-refund-desc">
                      Detailed information about subscription cancellations, refund eligibility, and processing timelines.
                    </p>
                    <a href="/cancellation-and-refund-policy" className="text-purple-600 dark:text-purple-400 hover:underline" data-testid="link-refund">
                      Read Refund Policy →
                    </a>
                  </div>

                  <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="card-policy-shipping">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" data-testid="heading-policy-shipping">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Shipping Policy
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3" data-testid="text-policy-shipping-desc">
                      Digital license delivery and enterprise onboarding process (no physical shipping required).
                    </p>
                    <a href="/shipping-policy" className="text-purple-600 dark:text-purple-400 hover:underline" data-testid="link-shipping">
                      Read Shipping Policy →
                    </a>
                  </div>

                  <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" data-testid="card-policy-security">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2" data-testid="heading-policy-security">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Security & Data Use
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3" data-testid="text-policy-security-desc">
                      Our security practices, encryption standards, and how we handle your sensitive conversation data.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="text-security-summary">
                      <strong>Summary:</strong> AES-256 encryption, HTTPS everywhere, zero data sharing, GDPR compliant, annual security audits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="contact">
            <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl" data-testid="title-contact">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                  Contact & Support
                </CardTitle>
                <CardDescription data-testid="desc-contact">Get help from our team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div data-testid="section-contact-support">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2" data-testid="heading-contact-support">
                      <Users className="h-5 w-5 text-purple-600" />
                      Contact Support
                    </h3>
                    <div className="space-y-2 text-slate-600 dark:text-slate-300">
                      <p data-testid="text-support-email"><strong>Email:</strong> <a href="mailto:support@revwinner.com" className="text-purple-600 dark:text-purple-400 hover:underline" data-testid="email-support">support@revwinner.com</a></p>
                      <p data-testid="text-sales-email"><strong>Sales Inquiries:</strong> <a href="mailto:sales@revwinner.com" className="text-purple-600 dark:text-purple-400 hover:underline" data-testid="email-sales">sales@revwinner.com</a></p>
                      <p data-testid="text-response-time"><strong>Response Time:</strong> 24-48 hours (Priority support for Enterprise customers)</p>
                      <p data-testid="text-live-chat"><strong>Live Chat:</strong> Available on homepage and contact page during business hours</p>
                    </div>
                  </div>

                  <div className="border-t border-purple-200 dark:border-purple-800 pt-6" data-testid="section-community">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2" data-testid="heading-community">
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                      Community & Feedback
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4" data-testid="text-community-desc">
                      We love hearing from our users! Share feature requests, bug reports, and product feedback.
                    </p>
                    <a href="/contact" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg" data-testid="button-contact-us">
                      Contact Us
                    </a>
                  </div>

                  <div className="border-t border-purple-200 dark:border-purple-800 pt-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-purple-600" />
                      System Status
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      All systems operational ✅
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      For planned maintenance or outage notifications, check your email or contact support.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="text-center mt-12 text-slate-500 dark:text-slate-400">
          <p>Still need help? <a href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">Contact our support team</a></p>
        </div>
      </div>
    </div>
    </>
  );
}
