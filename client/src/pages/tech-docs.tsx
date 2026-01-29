import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Clock, Layers, Database, Cpu, Code, Server, Shield, BookOpen, ChevronDown, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";

interface Section {
  id: string;
  title: string;
  content: string;
  subsections?: { id: string; title: string; content: string }[];
}

export default function TechDocs() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const tableOfContents = [
    { id: "1", title: "Executive Summary", icon: BookOpen },
    { id: "2", title: "System Architecture Overview", icon: Server },
    { id: "3", title: "Module-by-Module Breakdown", icon: Layers, subsections: [
      "3.1 Live Transcript",
      "3.2 Shift Gears (AI Coaching)",
      "3.3 Query Pitches",
      "3.4 Conversation Analysis",
      "3.5 Products & Services",
      "3.6 Product Recommendations",
      "3.7 Meeting Minutes",
      "3.8 Relationship Builders",
      "3.9 Present to Win"
    ]},
    { id: "4", title: "Data Storage & Folder Structure", icon: Database },
    { id: "5", title: "Database Design (70+ Tables)", icon: Database },
    { id: "6", title: "LLM & AI Processing Pipeline", icon: Cpu },
    { id: "7", title: "Token Utilization & Cost Logic", icon: Code },
    { id: "8", title: "TrainMe Add-on Workflow", icon: FileText },
    { id: "9", title: "Admin Panel & License Manager", icon: Shield },
    { id: "10", title: "Marketing Add-on", icon: FileText },
    { id: "11", title: "Visual Diagrams", icon: Layers },
    { id: "12", title: "Security & Compliance", icon: Shield },
    { id: "13", title: "Integration Guidelines", icon: Code }
  ];

  const keyTopics = [
    "Real-time WebSocket transcription via Deepgram Nova-2",
    "Multi-provider AI engine (OpenAI, Claude, Gemini, DeepSeek)",
    "Selling Intelligence Engine with domain detection",
    "SPIN/MEDDIC/Challenger sales methodology tracking",
    "Enterprise licensing with seat-based management",
    "Train Me knowledge extraction pipeline",
    "Marketing content generation workflow"
  ];

  const generatePDF = async () => {
    setIsGenerating(true);
    setDownloadComplete(false);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      const addPage = () => {
        pdf.addPage();
        yPosition = margin;
      };

      const checkPageBreak = (heightNeeded: number) => {
        if (yPosition + heightNeeded > pageHeight - margin) {
          addPage();
          return true;
        }
        return false;
      };

      const addTitle = (text: string, size: number = 24) => {
        checkPageBreak(20);
        pdf.setFontSize(size);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(text, margin, yPosition);
        yPosition += size * 0.5;
      };

      const addSubtitle = (text: string, size: number = 16) => {
        checkPageBreak(15);
        pdf.setFontSize(size);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(51, 65, 85);
        pdf.text(text, margin, yPosition);
        yPosition += size * 0.45;
      };

      const addParagraph = (text: string, size: number = 10) => {
        pdf.setFontSize(size);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(71, 85, 105);
        const lines = pdf.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          checkPageBreak(6);
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        });
        yPosition += 3;
      };

      const addBullet = (text: string) => {
        checkPageBreak(7);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(71, 85, 105);
        const bulletText = `• ${text}`;
        const lines = pdf.splitTextToSize(bulletText, contentWidth - 5);
        lines.forEach((line: string, index: number) => {
          checkPageBreak(6);
          pdf.text(index === 0 ? line : `   ${line}`, margin + 3, yPosition);
          yPosition += 5;
        });
      };

      const addCodeBlock = (code: string) => {
        const lines = code.split('\n');
        pdf.setFillColor(241, 245, 249);
        const blockHeight = Math.min(lines.length * 4 + 6, 80);
        checkPageBreak(blockHeight);
        pdf.rect(margin, yPosition - 2, contentWidth, blockHeight, 'F');
        pdf.setFontSize(8);
        pdf.setFont("courier", "normal");
        pdf.setTextColor(30, 41, 59);
        yPosition += 3;
        lines.slice(0, 15).forEach((line: string) => {
          pdf.text(line.substring(0, 80), margin + 3, yPosition);
          yPosition += 4;
        });
        if (lines.length > 15) {
          pdf.text("...", margin + 3, yPosition);
          yPosition += 4;
        }
        yPosition += 5;
      };

      const addTable = (headers: string[], rows: string[][]) => {
        const colWidth = contentWidth / headers.length;
        checkPageBreak(8 + rows.length * 6);
        
        pdf.setFillColor(51, 65, 85);
        pdf.rect(margin, yPosition - 4, contentWidth, 7, 'F');
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        headers.forEach((header, i) => {
          pdf.text(header, margin + (i * colWidth) + 2, yPosition);
        });
        yPosition += 6;
        
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(71, 85, 105);
        rows.forEach((row, rowIndex) => {
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, yPosition - 4, contentWidth, 6, 'F');
          }
          row.forEach((cell, i) => {
            pdf.text(cell.substring(0, 25), margin + (i * colWidth) + 2, yPosition);
          });
          yPosition += 6;
        });
        yPosition += 5;
      };

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text("Rev Winner Platform", margin, 30);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.text("Complete Technical Documentation for Developers", margin, 42);
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Version 1.0 | Generated: ${new Date().toLocaleDateString()}`, margin, 52);
      yPosition = 75;

      addTitle("Table of Contents", 18);
      yPosition += 5;
      const tocItems = [
        "1. Executive Summary",
        "2. System Architecture Overview",
        "3. Module-by-Module Breakdown",
        "   3.1 Live Transcript | 3.2 Shift Gears | 3.3 Query Pitches",
        "   3.4 Conversation Analysis | 3.5 Products & Services",
        "   3.6 Recommendations | 3.7 Meeting Minutes",
        "   3.8 Relationship Builders | 3.9 Present to Win",
        "4. Data Storage & Folder Structure",
        "5. Database Design (70+ Tables with ER Diagrams)",
        "6. LLM & AI Processing Pipeline",
        "7. Token Utilization & Cost Logic",
        "8. TrainMe Add-on Workflow",
        "9. Admin Panel & License Manager",
        "10. Marketing Add-on",
        "11. Visual Diagrams",
        "12. Security & Compliance",
        "13. Integration Guidelines"
      ];
      tocItems.forEach(item => {
        addBullet(item);
      });

      addPage();
      addTitle("1. Executive Summary", 20);
      yPosition += 5;
      addParagraph("Rev Winner is a SaaS Sales Assistant platform that empowers sales representatives during discovery calls through real-time AI-powered conversation management. The platform captures live audio, transcribes speech in real-time, and provides instant AI coaching to help close more deals.");
      yPosition += 3;
      addSubtitle("Core Capabilities", 14);
      addBullet("Real-time Transcription: Live speech-to-text via Deepgram's Nova-2 model");
      addBullet("AI Sales Coaching: Shift Gears feature for real-time tactical suggestions");
      addBullet("Conversation Analysis: Comprehensive analysis with 6-page Call Flow Script");
      addBullet("Selling Intelligence Engine: Domain detection, claim safety, compliance-aware content");
      addBullet("Enterprise Licensing: Seat-based assignments with License Manager portal");
      addBullet("Multiple Add-ons: Train Me (domain expertise), Marketing (content generation), DAI (AI tokens)");
      yPosition += 5;
      addSubtitle("Key Business Rules", 14);
      addTable(
        ["Rule", "Description"],
        [
          ["Work Email Only", "Personal emails blocked (Gmail, Yahoo, etc.)"],
          ["Claim Safety", "No absolute claims (best, guaranteed, 100%)"],
          ["Honest Competitors", "When-fits/when-not analysis instead of bias"],
          ["Compliance", "Regulated industries get disclaimers"],
          ["Data Retention", "Call recordings: 7-day auto-delete"]
        ]
      );

      addPage();
      addTitle("2. System Architecture Overview", 20);
      yPosition += 5;
      addSubtitle("Technology Stack", 14);
      addTable(
        ["Layer", "Technology"],
        [
          ["Frontend", "React 18, TypeScript, Vite, TailwindCSS"],
          ["Backend", "Express.js, TypeScript, Node.js"],
          ["Database", "PostgreSQL (Neon serverless) + Drizzle ORM"],
          ["Real-time", "WebSocket (audio streaming, transcription)"],
          ["AI Providers", "OpenAI, Anthropic, Google AI, DeepSeek"],
          ["Speech-to-Text", "Deepgram Nova-2"],
          ["Payments", "Razorpay, Cashfree"]
        ]
      );
      yPosition += 5;
      addSubtitle("Request Flow (How Things Work)", 14);
      addParagraph("1. Browser captures audio via getUserMedia API at 48kHz mono");
      addParagraph("2. Audio chunks sent via WebSocket to /api/transcribe-stream");
      addParagraph("3. Server forwards raw PCM to Deepgram's live API connection");
      addParagraph("4. Deepgram returns transcript events with speaker diarization");
      addParagraph("5. Server broadcasts transcript to connected clients");
      addParagraph("6. AI Engine triggered for Shift Gears coaching (if enabled)");
      addParagraph("7. Responses assembled with domain context from Train Me knowledge");
      yPosition += 5;
      addSubtitle("Directory Structure", 14);
      addCodeBlock(`rev-winner/
├── client/                  # React Frontend (40+ pages, 80+ components)
│   ├── src/pages/           # Route components
│   ├── src/components/      # Reusable UI components
│   └── src/hooks/           # Custom React hooks
├── server/                  # Express Backend
│   ├── services/            # Business logic (openai.ts = 5000+ lines)
│   ├── routes-*.ts          # Feature-specific API routes
│   └── middleware/          # Auth, rate limiting
├── shared/
│   └── schema.ts            # Drizzle ORM schema (70+ tables)
└── migrations/              # Database migrations`);

      addPage();
      addTitle("3. Module-by-Module Breakdown", 20);
      yPosition += 5;
      
      addSubtitle("3.1 Live Transcript", 14);
      addParagraph("PURPOSE: Capture and display real-time speech-to-text during sales calls.");
      addParagraph("HOW IT WORKS:");
      addBullet("Browser mic captures audio via MediaRecorder API");
      addBullet("Audio encoded as linear16 PCM at 48kHz sample rate");
      addBullet("WebSocket streams chunks to /api/transcribe-stream endpoint");
      addBullet("Server maintains persistent Deepgram connection per session");
      addBullet("Deepgram Nova-2 model processes with smart_format, punctuate, diarize options");
      addBullet("Transcript events include speaker labels, confidence scores, timestamps");
      addBullet("Frontend renders with speaker identification (Rep vs Prospect)");
      yPosition += 3;
      addParagraph("KEY FILES: server/routes-transcription.ts, client/src/components/live-transcript.tsx");
      yPosition += 5;

      addSubtitle("3.2 Shift Gears (AI Sales Coaching)", 14);
      addParagraph("PURPOSE: Provide real-time tactical suggestions during live calls based on conversation context.");
      addParagraph("HOW IT WORKS:");
      addBullet("Transcript buffer accumulates last 2000 tokens of conversation");
      addBullet("On user request OR auto-trigger, buffer sent to AI Engine");
      addBullet("Domain detection determines industry context (Tech, Healthcare, Finance, etc.)");
      addBullet("Knowledge Retrieval fetches relevant Train Me content by domain");
      addBullet("Selling Intelligence Engine applies claim safety filters");
      addBullet("Response generated with industry-specific language and disclaimers");
      addBullet("Suggestions streamed back via WebSocket for instant display");
      yPosition += 3;
      addParagraph("LOGIC FLOW: Transcript → Domain Detection → Knowledge Retrieval → Prompt Assembly → LLM Call → Safety Filter → Response");
      addParagraph("KEY FILES: server/services/openai.ts (generateShiftGearsResponse), server/services/selling-intelligence-engine.ts");
      yPosition += 5;

      addSubtitle("3.3 Query Pitches", 14);
      addParagraph("PURPOSE: Answer specific sales questions with domain-aware, compliant responses.");
      addParagraph("HOW IT WORKS:");
      addBullet("User types question or clicks quick-action buttons");
      addBullet("Question categorized: Objection Handling, Feature Query, Pricing, Competitor");
      addBullet("Relevant knowledge entries retrieved by category and domain");
      addBullet("System prompt includes: domain context, claim safety rules, competitor guidelines");
      addBullet("Response includes disclaimers for regulated industries");
      yPosition += 3;
      addParagraph("KEY FILES: server/services/openai.ts (generateQueryPitchResponse)");
      yPosition += 5;

      addPage();
      addSubtitle("3.4 Conversation Analysis", 14);
      addParagraph("PURPOSE: Generate comprehensive 6-page Call Flow Script analyzing the entire conversation.");
      addParagraph("OUTPUT STRUCTURE:");
      addBullet("Page 1: Executive Summary - Call overview, key outcomes, next steps");
      addBullet("Page 2: BANT Qualification - Budget, Authority, Need, Timeline scores");
      addBullet("Page 3: Objection Analysis - Identified objections with recommended responses");
      addBullet("Page 4: Competitor Mentions - Competitive positioning opportunities");
      addBullet("Page 5: Action Items - Categorized by owner (Rep vs Prospect)");
      addBullet("Page 6: Coaching Tips - Areas for improvement, what went well");
      yPosition += 3;
      addParagraph("HOW IT WORKS:");
      addBullet("Full transcript submitted after call ends (or on-demand)");
      addBullet("AI processes with structured output format instructions");
      addBullet("Results stored in call_analysis table (7-day retention)");
      addBullet("PDF export available via generateAnalysisPDF function");
      addParagraph("KEY FILES: server/services/openai.ts (generateConversationAnalysis)");
      yPosition += 5;

      addSubtitle("3.5 Products & Services", 14);
      addParagraph("PURPOSE: Manage product catalog for AI-powered recommendations during calls.");
      addParagraph("DATA SOURCES (Priority Order):");
      addBullet("1. Train Me Knowledge (PRIMARY): User-uploaded product docs with extracted features");
      addBullet("2. Database Products Table: Manually configured product entries");
      addBullet("3. Static References: Default product catalog in shared/schema.ts");
      addParagraph("HOW PRODUCTS ARE USED:");
      addBullet("Document upload → knowledgeExtraction.ts parses product info");
      addBullet("Content categorized as 'product', 'pricing', 'feature' entries");
      addBullet("During calls, AI retrieves relevant products based on pain points");
      addBullet("Products matched by industry, feature coverage, budget fit");
      addParagraph("KEY FILES: server/services/knowledgeExtraction.ts, shared/schema.ts (products table)");
      yPosition += 5;

      addSubtitle("3.6 Product & Service Recommendations", 14);
      addParagraph("PURPOSE: AI-driven product matching based on conversation context.");
      addParagraph("RECOMMENDATION ALGORITHM:");
      addBullet("Step 1: Extract pain points and requirements from transcript");
      addBullet("Step 2: Load domain-specific product knowledge");
      addBullet("Step 3: Score products by: Pain Point Coverage (40%), Budget Fit (25%), Industry Alignment (20%), Implementation Complexity (15%)");
      addBullet("Step 4: Generate ranked list with confidence scores (0-100)");
      addBullet("Step 5: Include reasoning, competitive advantages, next steps");
      addParagraph("KEY FILES: server/services/openai.ts (generateProductRecommendations)");

      addPage();
      addSubtitle("3.7 Meeting Minutes", 14);
      addParagraph("PURPOSE: Generate AI-powered meeting summaries from call transcripts.");
      addParagraph("OUTPUT INCLUDES:");
      addBullet("Attendees and their roles identified from conversation");
      addBullet("Discussion topics organized chronologically");
      addBullet("Decisions made during the call");
      addBullet("Action items with assigned owners and deadlines");
      addBullet("Next meeting requirements and follow-up notes");
      addParagraph("HOW IT WORKS:");
      addBullet("Full transcript processed after call ends");
      addBullet("AI extracts structured data using prompted output format");
      addBullet("Minutes stored in call_meeting_minutes table (7-day retention)");
      addBullet("Backup stored in conversation_minutes_backup for Marketing analysis");
      addBullet("PDF export available on-demand");
      addParagraph("KEY FILES: server/services/openai.ts (generateMeetingMinutes), call_meeting_minutes table");
      yPosition += 5;

      addSubtitle("3.8 Relationship Builders", 14);
      addParagraph("PURPOSE: Track prospect relationships and provide engagement recommendations.");
      addParagraph("FRAMEWORKS SUPPORTED:");
      addTable(
        ["Framework", "Data Tracked"],
        [
          ["SPIN", "Situation, Problem, Implication, Need-Payoff"],
          ["MEDDIC", "Metrics, Economic Buyer, Decision Criteria/Process, Pain, Champion"],
          ["Challenger", "Teaching insights, tailoring approach, taking control"],
          ["BANT", "Budget, Authority, Need, Timeline"]
        ]
      );
      addParagraph("HOW IT WORKS:");
      addBullet("Intent Detection: Analyze conversation for buying signals (strong/moderate/weak)");
      addBullet("Buyer Stage Tracking: Map to journey stages (Awareness → Decision → Closed)");
      addBullet("Memory Building: Store preferences, objections, decision criteria, stakeholders");
      addBullet("Engagement Recommendations: Suggest follow-up timing, content to share, next actions");
      addParagraph("KEY TABLES: buyer_stages, conversation_intents, conversation_memories");
      yPosition += 5;

      addSubtitle("3.9 Present to Win (Battle Cards, Case Studies, Pitch Decks)", 14);
      addParagraph("PURPOSE: Generate competitive intelligence assets for sales presentations.");
      addParagraph("ASSET TYPES:");
      addBullet("Battle Cards: Side-by-side competitor comparisons with when-fits/when-not-fits analysis");
      addBullet("Case Studies: Customer success stories tailored to prospect's industry");
      addBullet("Pitch Decks: Slide content focused on prospect's identified pain points");
      addParagraph("HOW IT WORKS:");
      addBullet("User identifies competitor or selects from detected mentions");
      addBullet("System retrieves competitor data from Train Me knowledge");
      addBullet("AI generates honest comparison (no absolute claims)");
      addBullet("Content formatted for presentation with export options");
      addParagraph("KEY FILES: server/services/openai.ts (generateBattleCard, generateCaseStudy, generatePitchDeck)");

      addPage();
      addTitle("4. Data Storage & Folder Structure", 20);
      yPosition += 5;
      addSubtitle("Object Storage Organization", 14);
      addCodeBlock(`storage/
├── recordings/           # Audio recordings (7-day retention)
│   └── {userId}/
│       └── {sessionId}.webm
├── documents/            # Train Me uploads (permanent)
│   └── {userId}/
│       └── {documentId}.{ext}
├── exports/              # Generated PDFs (temporary)
│   └── {userId}/
│       └── analysis-{timestamp}.pdf
└── avatars/              # User profile images
    └── {userId}.{ext}`);
      addParagraph("RETENTION POLICIES:");
      addBullet("Recordings: Auto-deleted after 7 days via cron job");
      addBullet("Documents: Permanent storage (Train Me knowledge)");
      addBullet("Exports: Temporary (24-hour cleanup)");
      addBullet("Database: Conversation minutes backed up before deletion");

      addPage();
      addTitle("5. Database Design", 20);
      yPosition += 5;
      addParagraph("The database contains 70+ tables organized by functional domain. All schemas defined in shared/schema.ts using Drizzle ORM.");
      yPosition += 3;
      addSubtitle("Core User & Auth Tables", 14);
      addTable(
        ["Table", "Purpose", "Key Fields"],
        [
          ["auth_users", "User accounts", "id, email, passwordHash, role"],
          ["user_profiles", "Extended profile data", "userId, company, industry"],
          ["refresh_tokens", "JWT refresh tokens", "userId, token, expiresAt"],
          ["sessions", "Active sessions", "userId, token, createdAt"]
        ]
      );
      addSubtitle("Subscription & Billing Tables", 14);
      addTable(
        ["Table", "Purpose", "Key Fields"],
        [
          ["subscriptions", "Active subscriptions", "userId, planType, status, expiresAt"],
          ["addon_purchases", "Add-on purchases", "userId, addonType, amount"],
          ["payment_records", "Payment history", "subscriptionId, gatewayId, status"],
          ["dai_tokens", "AI token balances", "userId, balance, expiresAt"]
        ]
      );
      addSubtitle("Conversation & Analysis Tables", 14);
      addTable(
        ["Table", "Purpose", "Key Fields"],
        [
          ["conversations", "Call sessions", "userId, startTime, duration, transcript"],
          ["call_analysis", "Analysis results", "conversationId, bantScores, analysis"],
          ["call_meeting_minutes", "Meeting summaries", "conversationId, minutes, actionItems"],
          ["conversation_memories", "Relationship data", "conversationId, spinData, meddicData"]
        ]
      );
      addSubtitle("Knowledge & Training Tables", 14);
      addTable(
        ["Table", "Purpose", "Key Fields"],
        [
          ["knowledge_entries", "Extracted knowledge", "userId, category, content, domain"],
          ["train_me_documents", "Uploaded docs", "userId, filename, status, processedAt"],
          ["user_domains", "Domain mappings", "userId, domain, isActive"]
        ]
      );
      addSubtitle("Enterprise & License Tables", 14);
      addTable(
        ["Table", "Purpose", "Key Fields"],
        [
          ["enterprise_licenses", "License pools", "ownerId, totalSeats, usedSeats"],
          ["license_assignments", "Seat assignments", "licenseId, userId, assignedAt"],
          ["license_invitations", "Pending invites", "licenseId, email, status"]
        ]
      );

      addPage();
      addTitle("6. LLM & AI Processing Pipeline", 20);
      yPosition += 5;
      addSubtitle("Supported AI Providers", 14);
      addTable(
        ["Provider", "Models", "Use Case"],
        [
          ["OpenAI", "GPT-4, GPT-4o, GPT-4o-mini", "Primary, Analysis"],
          ["Anthropic", "Claude 3.5 Sonnet, Claude 3 Opus", "Complex reasoning"],
          ["Google AI", "Gemini Pro, Gemini Ultra", "Alternative provider"],
          ["DeepSeek", "DeepSeek Chat, DeepSeek Coder", "Cost-effective"],
          ["X.AI", "Grok-3", "Alternative provider"],
          ["Moonshot", "Kimi K2", "Specialized tasks"]
        ]
      );
      yPosition += 3;
      addSubtitle("Processing Pipeline (Step by Step)", 14);
      addParagraph("1. INPUT: Raw transcript or user query arrives at API endpoint");
      addParagraph("2. DOMAIN DETECTION: selling-intelligence-engine.ts identifies industry (Tech, Healthcare, Finance, Legal, etc.)");
      addParagraph("3. KNOWLEDGE RETRIEVAL: Fetch relevant Train Me entries by domain and category");
      addParagraph("4. CONTEXT ASSEMBLY: Build system prompt with domain rules, knowledge, claim safety guidelines");
      addParagraph("5. PROMPT CONSTRUCTION: Combine system prompt + user context + specific instructions");
      addParagraph("6. LLM CALL: Send to selected provider based on user preference or task type");
      addParagraph("7. RESPONSE FILTERING: Apply claim safety (remove absolutes), add compliance disclaimers");
      addParagraph("8. OUTPUT: Return processed response to client via REST or WebSocket");
      yPosition += 5;
      addSubtitle("Claim Safety Rules", 14);
      addParagraph("The Selling Intelligence Engine enforces honest, compliant content:");
      addBullet("BLOCKED TERMS: 'best', 'only', 'guaranteed', '100%', 'always', 'never', 'fastest'");
      addBullet("REPLACEMENT: Absolute claims replaced with qualified statements");
      addBullet("COMPETITOR HONESTY: When-fits/when-not-fits analysis instead of biased claims");
      addBullet("REGULATED INDUSTRIES: Healthcare, Finance, Legal get mandatory disclaimers");
      addParagraph("KEY FILE: server/services/selling-intelligence-engine.ts");

      addPage();
      addTitle("7. Token Utilization & Cost Logic", 20);
      yPosition += 5;
      addSubtitle("Per-Module Token Estimates", 14);
      addTable(
        ["Module", "Input Tokens", "Output Tokens", "Est. Cost/Call"],
        [
          ["Shift Gears", "~2000", "~500", "$0.02-0.04"],
          ["Query Pitch", "~1500", "~400", "$0.015-0.03"],
          ["Conversation Analysis", "~8000", "~3000", "$0.10-0.20"],
          ["Meeting Minutes", "~6000", "~1500", "$0.06-0.12"],
          ["Battle Card", "~3000", "~1000", "$0.03-0.06"],
          ["Marketing Content", "~4000", "~2000", "$0.05-0.10"]
        ]
      );
      yPosition += 3;
      addSubtitle("DAI Token System", 14);
      addParagraph("Users purchase DAI (Domain AI) tokens for AI operations:");
      addBullet("1 DAI = 1000 OpenAI tokens (approximate)");
      addBullet("Token deduction calculated after each AI call");
      addBullet("Balance tracked in dai_tokens table per user");
      addBullet("Low balance warnings at 10% remaining");
      addBullet("Tokens expire based on subscription period");
      addParagraph("KEY FILE: server/services/openai.ts (token tracking), server/routes-billing.ts (DAI purchases)");

      addPage();
      addTitle("8. TrainMe Add-on Workflow", 20);
      yPosition += 5;
      addSubtitle("Document Ingestion Pipeline", 14);
      addParagraph("TrainMe allows users to upload domain-specific documents to customize AI responses.");
      yPosition += 3;
      addParagraph("STEP 1: DOCUMENT UPLOAD");
      addBullet("Supported formats: PDF, DOCX, TXT, CSV, XLSX");
      addBullet("Max file size: 10MB per document");
      addBullet("Files stored in object storage under documents/{userId}/");
      yPosition += 2;
      addParagraph("STEP 2: CONTENT EXTRACTION");
      addBullet("PDF: pdf-parse library extracts text content");
      addBullet("DOCX: mammoth library converts to plain text");
      addBullet("Excel/CSV: exceljs parses structured data");
      addBullet("Text chunked into 500-1000 token segments");
      yPosition += 2;
      addParagraph("STEP 3: KNOWLEDGE EXTRACTION");
      addBullet("AI categorizes each chunk: product, pricing, competitor, objection, case_study, faq");
      addBullet("Domain classification: Tech, Healthcare, Finance, Legal, Retail, Manufacturing");
      addBullet("Content hash generated for deduplication");
      yPosition += 2;
      addParagraph("STEP 4: STORAGE & INDEXING");
      addBullet("Entries stored in knowledge_entries table");
      addBullet("Indexed by userId, domain, category for fast retrieval");
      addBullet("Universal entries (domain=null) available across all domains");
      yPosition += 2;
      addParagraph("STEP 5: RUNTIME RETRIEVAL");
      addBullet("During calls, domain detected from conversation context");
      addBullet("Relevant knowledge fetched by domain + category match");
      addBullet("Content injected into AI system prompt for contextualized responses");
      yPosition += 3;
      addParagraph("KEY FILES: server/services/documentProcessor.ts, server/services/knowledgeExtraction.ts");

      addPage();
      addTitle("9. Admin Panel & License Manager", 20);
      yPosition += 5;
      addSubtitle("Admin Panel Features", 14);
      addParagraph("Accessible at /admin after admin authentication:");
      addBullet("User Management: View all users, edit profiles, reset passwords, manage subscriptions");
      addBullet("Billing Overview: Revenue tracking, subscription status, payment history");
      addBullet("Analytics Dashboard: Usage metrics, call volumes, AI token consumption");
      addBullet("System Configuration: Feature flags, payment gateway settings, email templates");
      addBullet("Audit Logs: Track admin actions, user activity, security events");
      yPosition += 3;
      addSubtitle("User Roles", 14);
      addTable(
        ["Role", "Permissions"],
        [
          ["User", "Standard access to sales assistant features"],
          ["License Manager", "Manage seats within assigned enterprise license"],
          ["Admin", "Full system access, user management, billing"]
        ]
      );
      yPosition += 3;
      addSubtitle("License Manager Features", 14);
      addParagraph("Enterprise license managers can:");
      addBullet("View available and used seat count");
      addBullet("Invite new users via email (invitation expires in 7 days)");
      addBullet("Assign/revoke seats from existing users");
      addBullet("View team usage analytics");
      addBullet("Transfer license manager role to another user");
      addParagraph("KEY FILES: server/routes-admin.ts, server/routes-enterprise.ts, client/src/pages/license-manager.tsx");

      addPage();
      addTitle("10. Marketing Add-on", 20);
      yPosition += 5;
      addParagraph("The Marketing add-on provides AI-powered content generation from conversation insights.");
      yPosition += 3;
      addSubtitle("Content Types Generated", 14);
      addBullet("Blog Posts: SEO-optimized articles from call topics");
      addBullet("Social Media Posts: LinkedIn, Twitter content from key insights");
      addBullet("Email Sequences: Follow-up email templates based on objections");
      addBullet("Case Study Drafts: Success story outlines from positive calls");
      addBullet("FAQ Content: Common questions extracted from calls");
      yPosition += 3;
      addSubtitle("Domain Isolation", 14);
      addParagraph("Marketing content is isolated by domain to prevent cross-contamination:");
      addBullet("Each user's domains tracked in user_domains table");
      addBullet("Content tagged with source domain on generation");
      addBullet("Knowledge retrieval respects domain boundaries");
      addBullet("Universal content (no domain) available across all contexts");
      yPosition += 3;
      addSubtitle("Data Flow", 14);
      addParagraph("1. Conversation minutes backed up to conversation_minutes_backup table");
      addParagraph("2. Marketing insights service processes backup data");
      addParagraph("3. AI generates content based on conversation themes");
      addParagraph("4. Content stored with domain tag for retrieval");
      addParagraph("5. User accesses generated content via Marketing dashboard");
      addParagraph("KEY FILES: server/services/marketing-insights.ts, server/routes-marketing.ts");

      addPage();
      addTitle("11. Visual Diagrams Reference", 20);
      yPosition += 5;
      addParagraph("The full documentation includes ASCII diagrams for:");
      addBullet("High-Level Architecture: Platform component overview");
      addBullet("Component Interaction Flow: Request/response paths");
      addBullet("Database ER Diagram: Table relationships");
      addBullet("LLM Processing Pipeline: AI request flow");
      addBullet("TrainMe Ingestion Workflow: Document processing steps");
      addBullet("License Assignment Flow: Enterprise seat management");
      addParagraph("Refer to the full markdown documentation for detailed ASCII diagrams.");

      addPage();
      addTitle("12. Security & Compliance", 20);
      yPosition += 5;
      addSubtitle("Authentication", 14);
      addBullet("JWT-based authentication with access (15min) and refresh (7 day) tokens");
      addBullet("Passwords hashed with bcrypt (12 rounds)");
      addBullet("Work email validation blocks personal email providers");
      addBullet("Optional Replit OIDC integration for SSO");
      yPosition += 3;
      addSubtitle("Data Protection", 14);
      addBullet("All API routes protected by auth middleware");
      addBullet("Rate limiting on sensitive endpoints (login, API calls)");
      addBullet("SQL injection prevention via Drizzle ORM parameterization");
      addBullet("XSS prevention through React's default escaping");
      addBullet("HTTPS enforced in production");
      yPosition += 3;
      addSubtitle("Content Compliance", 14);
      addBullet("Claim Safety Engine blocks absolute/misleading statements");
      addBullet("Regulated industry detection adds mandatory disclaimers");
      addBullet("Competitor content uses fair comparison approach");
      addBullet("Audit trail for AI-generated content");

      addPage();
      addTitle("13. Integration Guidelines", 20);
      yPosition += 5;
      addSubtitle("API Authentication", 14);
      addParagraph("All API requests require JWT Bearer token:");
      addCodeBlock(`Authorization: Bearer <access_token>

Token obtained via POST /api/auth/login
Refresh via POST /api/auth/refresh`);
      yPosition += 3;
      addSubtitle("Key Endpoints", 14);
      addTable(
        ["Endpoint", "Method", "Purpose"],
        [
          ["/api/auth/login", "POST", "User authentication"],
          ["/api/transcribe-stream", "WS", "Live transcription"],
          ["/api/conversations", "GET/POST", "Conversation management"],
          ["/api/analysis/:id", "GET", "Get analysis results"],
          ["/api/knowledge", "GET/POST", "Knowledge entries"],
          ["/api/subscriptions", "GET", "User subscription status"]
        ]
      );
      yPosition += 3;
      addSubtitle("WebSocket Events", 14);
      addBullet("transcript: Real-time transcript updates");
      addBullet("shift_gears: AI coaching suggestions");
      addBullet("error: Error notifications");
      addBullet("session_end: Call session completed");
      yPosition += 3;
      addSubtitle("Rate Limits", 14);
      addBullet("Authentication: 5 requests/minute");
      addBullet("AI Endpoints: 30 requests/minute");
      addBullet("Standard API: 100 requests/minute");

      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Rev Winner Technical Documentation | Page ${i} of ${pageCount}`, margin, pageHeight - 10);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, pageHeight - 10);
      }

      pdf.save("Rev_Winner_Technical_Documentation.pdf");
      setDownloadComplete(true);
      setTimeout(() => setDownloadComplete(false), 3000);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-white">Rev Winner</div>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">Documentation</span>
            <span className="text-slate-500">/</span>
            <span className="text-white">Technical Guide</span>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
            v1.0 | January 2026
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Complete Technical Documentation
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed">
                Everything a developer needs to understand Rev Winner's architecture, modules, data flows, AI pipelines, and integration points.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={generatePDF}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : downloadComplete ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download Full PDF
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-slate-900 border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-emerald-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">15+</div>
                    <div className="text-sm text-slate-400">Pages</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Layers className="h-8 w-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">9</div>
                    <div className="text-sm text-slate-400">Core Modules</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Database className="h-8 w-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">70+</div>
                    <div className="text-sm text-slate-400">Database Tables</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-400" />
                  Key Topics Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {keyTopics.map((topic, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-white/10 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Table of Contents</CardTitle>
                <CardDescription className="text-slate-400">
                  13 sections covering full platform architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {tableOfContents.map((item) => (
                      <div key={item.id}>
                        <button
                          onClick={() => item.subsections && toggleSection(item.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          <item.icon className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-300 text-sm flex-1">
                            {item.id}. {item.title}
                          </span>
                          {item.subsections && (
                            expandedSections.includes(item.id) 
                              ? <ChevronDown className="h-4 w-4 text-slate-500" />
                              : <ChevronRight className="h-4 w-4 text-slate-500" />
                          )}
                        </button>
                        {item.subsections && expandedSections.includes(item.id) && (
                          <div className="ml-9 mt-1 space-y-1">
                            {item.subsections.map((sub, idx) => (
                              <div key={idx} className="text-sm text-slate-500 py-1">
                                {sub}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
