import { Express, Request, Response } from "express";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

export function registerBibleRoutes(app: Express) {
  app.get("/api/download/rev-winner-bible", async (req: Request, res: Response) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 6;
      let yPosition = margin;
      let pageNumber = 1;
      
      const BRAND_COLORS = {
        primary: { r: 139, g: 92, b: 246 },
        secondary: { r: 236, g: 72, b: 153 },
        dark: { r: 30, g: 30, b: 46 },
        text: { r: 60, g: 60, b: 60 },
        lightText: { r: 100, g: 100, b: 100 },
        accent: { r: 168, g: 85, b: 247 },
        white: { r: 255, g: 255, b: 255 }
      };
      
      const CONTACT_INFO = {
        website: 'https://revwinner.com',
        email: 'sales@revwinner.com',
        phoneIndia: '+91 8130276382',
        phoneUSA: '+1 832 632 8555'
      };

      // Load logo and banner images
      let logoBase64: string | null = null;
      let bannerBase64: string | null = null;
      
      try {
        const logoPath = path.join(process.cwd(), 'attached_assets', 'rev-winner-logo.png');
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');
        }
      } catch (e) {
        console.warn('Could not load logo:', e);
      }
      
      try {
        const bannerPath = path.join(process.cwd(), 'attached_assets', 'IMG_20251213_202308_1765637622298.jpg');
        if (fs.existsSync(bannerPath)) {
          const bannerBuffer = fs.readFileSync(bannerPath);
          bannerBase64 = 'data:image/jpeg;base64,' + bannerBuffer.toString('base64');
        }
      } catch (e) {
        console.warn('Could not load banner:', e);
      }

      const addFooter = (currentPage: number) => {
        const footerY = pageHeight - 12;
        
        // Footer line
        doc.setDrawColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
        
        // Left side - website and email
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(BRAND_COLORS.lightText.r, BRAND_COLORS.lightText.g, BRAND_COLORS.lightText.b);
        doc.text(`${CONTACT_INFO.website}  |  ${CONTACT_INFO.email}`, margin, footerY);
        
        // Center - page number
        doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.text(`Page ${currentPage}`, pageWidth / 2, footerY, { align: "center" });
        
        // Right side - phone numbers
        doc.setTextColor(BRAND_COLORS.lightText.r, BRAND_COLORS.lightText.g, BRAND_COLORS.lightText.b);
        doc.text(`India: ${CONTACT_INFO.phoneIndia}  |  USA: ${CONTACT_INFO.phoneUSA}`, pageWidth - margin, footerY, { align: "right" });
        
        // Reset text color
        doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
      };

      const addPageHeader = () => {
        // Draw gradient-like header bar
        doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        // Add subtle gradient effect
        doc.setFillColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
        doc.setGState(doc.GState({ opacity: 0.3 }));
        doc.rect(pageWidth * 0.5, 0, pageWidth * 0.5, 25, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        
        let textStartX = margin;
        
        // Add logo if available - maintain proper aspect ratio (18mm width for header)
        if (logoBase64) {
          try {
            const logoWidth = 18;
            const logoHeight = 18; // Square logo with proper proportions
            doc.addImage(logoBase64, 'PNG', margin, 3.5, logoWidth, logoHeight);
            textStartX = margin + logoWidth + 5;
          } catch (e) {
            console.warn('Logo add failed:', e);
          }
        }
        
        // Header text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(BRAND_COLORS.white.r, BRAND_COLORS.white.g, BRAND_COLORS.white.b);
        doc.text('Rev Winner', textStartX, 12);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('The Complete Bible', textStartX, 19);
        
        // Right side - tagline
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('AI-Powered Sales Assistant', pageWidth - margin, 14, { align: 'right' });
        
        doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
        
        return 32; // Starting Y position after header
      };

      const checkPageBreak = (neededSpace: number = 20) => {
        if (yPosition > pageHeight - neededSpace - 15) {
          doc.addPage();
          pageNumber++;
          yPosition = addPageHeader();
          addFooter(pageNumber);
        }
      };

      const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color?: { r: number; g: number; b: number }) => {
        checkPageBreak();
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        if (color) {
          doc.setTextColor(color.r, color.g, color.b);
        } else {
          doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
        }
        doc.text(text, margin, yPosition);
        yPosition += lineHeight;
      };

      const addWrappedText = (text: string, fontSize: number = 10, indent: number = 0) => {
        checkPageBreak(30);
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - indent);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin + indent, yPosition);
          yPosition += lineHeight;
        });
      };

      const addSectionHeader = (title: string) => {
        checkPageBreak(18);
        yPosition += 5;
        doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.rect(margin - 2, yPosition - 5, pageWidth - 2 * margin + 4, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, yPosition);
        doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
        yPosition += 12;
      };

      const addSubHeader = (title: string) => {
        checkPageBreak(12);
        yPosition += 3;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.text(title, margin, yPosition);
        doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
        yPosition += 8;
      };

      const addBullet = (text: string, fontSize: number = 9) => {
        addWrappedText(`• ${text}`, fontSize, 5);
      };

      // ========== COVER PAGE WITH BANNER ==========
      // Add banner image at top if available
      if (bannerBase64) {
        try {
          // Add banner at top - full width, proportional height
          doc.addImage(bannerBase64, 'JPEG', 0, 0, pageWidth, 60);
        } catch (e) {
          console.warn('Banner add failed:', e);
          // Fallback gradient
          doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
          doc.rect(0, 0, pageWidth, 60, 'F');
        }
      } else {
        // Fallback gradient header
        doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
        doc.rect(0, 0, pageWidth, 60, 'F');
      }
      
      // Main cover area with purple background
      doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
      doc.rect(0, 60, pageWidth, pageHeight - 60, 'F');
      
      // Add gradient overlay
      doc.setFillColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
      doc.setGState(doc.GState({ opacity: 0.2 }));
      doc.rect(0, 100, pageWidth, 100, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      
      // Add logo on cover page - proper proportions (40mm width)
      if (logoBase64) {
        try {
          const coverLogoWidth = 40;
          const coverLogoHeight = 40; // Square logo with proper proportions
          doc.addImage(logoBase64, 'PNG', pageWidth / 2 - coverLogoWidth / 2, 72, coverLogoWidth, coverLogoHeight);
        } catch (e) {
          console.warn('Logo on cover failed:', e);
        }
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text("REV WINNER", pageWidth / 2, 130, { align: "center" });
      
      doc.setFontSize(24);
      doc.text("THE COMPLETE BIBLE", pageWidth / 2, 160, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("AI-Powered Sales Assistant Platform", pageWidth / 2, 180, { align: "center" });
      
      doc.setFontSize(12);
      doc.text("Comprehensive Guide for Sales, Operations & Technical Teams", pageWidth / 2, 195, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Version 1.0 | January 2026`, pageWidth / 2, 220, { align: "center" });
      
      // Contact info box on cover
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.15 }));
      doc.roundedRect(pageWidth / 2 - 50, 235, 100, 35, 3, 3, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      
      doc.setFontSize(9);
      doc.text(`${CONTACT_INFO.website}`, pageWidth / 2, 245, { align: "center" });
      doc.text(`${CONTACT_INFO.email}`, pageWidth / 2, 254, { align: "center" });
      doc.text(`India: ${CONTACT_INFO.phoneIndia} | USA: ${CONTACT_INFO.phoneUSA}`, pageWidth / 2, 263, { align: "center" });
      
      doc.setFontSize(9);
      doc.text("A Product of Healthcaa Technologies", pageWidth / 2, 280, { align: "center" });

      // ========== TABLE OF CONTENTS ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      yPosition += 5;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
      doc.text("TABLE OF CONTENTS", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
      
      const tocItems = [
        "1. Executive Summary",
        "2. What is Rev Winner?",
        "3. Unique Value Proposition",
        "4. Core Features & Capabilities",
        "5. AI Agents & Intelligence Layer",
        "6. Technology Stack",
        "7. System Architecture",
        "8. Complete Workflow Diagrams",
        "9. Database Architecture",
        "10. Security & Compliance",
        "11. AI Token Usage Tracking",
        "12. Session & Usage Tracking",
        "13. Train Me Add-On",
        "14. Enterprise License Management",
        "15. Sales Playbook",
        "16. Operations Guide",
        "17. Platform Enhancement Roadmap",
        "18. Technical FAQ for Sales",
        "19. Contact Information"
      ];
      
      tocItems.forEach(item => {
        addText(item, 11, false, BRAND_COLORS.text);
        yPosition += 2;
      });

      // ========== SECTION 1: EXECUTIVE SUMMARY ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("1. EXECUTIVE SUMMARY");
      
      addWrappedText("Rev Winner is an AI-powered SaaS platform designed to transform sales performance by providing real-time coaching, automated documentation, and intelligent insights during live sales conversations. Built for the modern sales professional, Rev Winner combines cutting-edge AI technology with proven sales methodologies to help sales representatives close more deals, faster.");
      yPosition += 5;
      
      addSubHeader("Mission Statement");
      addWrappedText("To empower every sales professional with AI-driven intelligence that transforms conversations into closed deals.");
      yPosition += 5;
      
      addSubHeader("Key Statistics");
      addBullet("Conversation Analysis: <10 seconds response time");
      addBullet("Multi-AI Provider Support: 6+ AI engines");
      addBullet("Sales Methodologies: 6 frameworks integrated (SPIN, MEDDIC, Challenger, NLP, BANT, Call Flow Psychology)");
      addBullet("User Data Isolation: 100% secure, multi-tenant architecture");
      addBullet("Real-time Transcription: <2 second latency");

      // ========== SECTION 2: WHAT IS REV WINNER? ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("2. WHAT IS REV WINNER?");
      
      addWrappedText("Rev Winner is a comprehensive Sales Assistant SaaS platform that empowers sales representatives during discovery calls. It identifies client pain points, gathers requirements, and recommends tailored solutions across various domains.");
      yPosition += 5;
      
      addSubHeader("Platform Capabilities");
      addBullet("Real-time AI-powered conversation management");
      addBullet("Live speech-to-text transcription with speaker identification");
      addBullet("Automated meeting minutes with PDF export");
      addBullet("AI-generated sales collateral (pitch decks, case studies, battle cards)");
      addBullet("Domain expertise training (Train Me feature)");
      addBullet("Administrative portal for user and configuration settings");
      addBullet("Enterprise license management for organizations");
      addBullet("Subscription-based billing with usage tracking");
      yPosition += 5;
      
      addSubHeader("Who Is It For?");
      addBullet("Sales Representatives: Real-time coaching during live calls");
      addBullet("Sales Managers: Team performance insights and training");
      addBullet("Enterprise Sales Teams: Bulk licensing and centralized management");
      addBullet("Startups to Enterprise: Scalable for any organization size");

      // ========== SECTION 3: UNIQUE VALUE PROPOSITION ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("3. UNIQUE VALUE PROPOSITION");
      
      addSubHeader("What Makes Rev Winner Different?");
      yPosition += 3;
      
      addText("1. REAL-TIME AI COACHING", 10, true);
      addWrappedText("Unlike CRM tools that work post-call, Rev Winner provides instant, actionable coaching DURING live conversations. Sales reps get strategic tips, objection handling suggestions, and next-step recommendations in real-time.", 9);
      yPosition += 5;
      
      addText("2. DOMAIN EXPERTISE TRAINING", 10, true);
      addWrappedText("Users can upload their own documents, URLs, and images to train the AI on their specific products, services, and industry knowledge. The AI then uses this training to provide highly relevant, context-aware responses.", 9);
      yPosition += 5;
      
      addText("3. MULTI-AI PROVIDER SUPPORT", 10, true);
      addWrappedText("Users can choose their preferred AI provider (OpenAI, Claude, Gemini, Grok, DeepSeek, Kimi) and use their own API keys. This flexibility allows organizations to leverage their existing AI investments.", 9);
      yPosition += 5;
      
      addText("4. HYBRID SALES METHODOLOGY FRAMEWORK", 10, true);
      addWrappedText("Rev Winner integrates 6 proven sales methodologies into a unified coaching system: SPIN Selling, MEDDIC, Challenger Sale, NLP, BANT, and Call Flow Psychology.", 9);
      yPosition += 5;
      
      addText("5. AUTOMATED SALES COLLATERAL", 10, true);
      addWrappedText("Instantly generate personalized pitch decks, case studies, and competitive battle cards based on the actual conversation - no more manual document creation.", 9);
      yPosition += 5;
      
      addText("6. COMPLETE DATA ISOLATION", 10, true);
      addWrappedText("Each user's training data, conversations, and AI interactions are completely isolated. Enterprise-grade security ensures no data leakage between users or organizations.", 9);

      // ========== SECTION 4: CORE FEATURES ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("4. CORE FEATURES & CAPABILITIES");
      
      addSubHeader("4.1 Train Me (Domain Expertise)");
      addBullet("Upload training documents (PDF, Word, TXT)");
      addBullet("Add URLs for web-based documentation");
      addBullet("Upload images - AI extracts text and analyzes charts/infographics using GPT-4 Vision");
      addBullet("Create up to 5 domain expertise profiles");
      addBullet("Each profile supports up to 100 documents");
      addBullet("Automated content extraction and summarization");
      yPosition += 5;
      
      addSubHeader("4.2 Live Transcription");
      addBullet("Real-time speech-to-text using Deepgram AI");
      addBullet("Multi-speaker identification (Sales Rep vs. Prospect)");
      addBullet("Entity detection (50+ types: names, emails, phone numbers, dates, locations)");
      addBullet("Timestamp for every message");
      addBullet("Supports microphone and screen share audio");
      addBullet("Low latency (<2 seconds typical)");
      yPosition += 5;
      
      addSubHeader("4.3 Shift Gears (Real-time Coaching)");
      addBullet("AI-powered strategic sales tips during live calls");
      addBullet("Buying signal detection");
      addBullet("BANT qualification guidance");
      addBullet("Objection handling suggestions");
      addBullet("Ultra-concise tips (15-30 words) for quick reading");
      addBullet("Query Pitch Generator for instant one-liner responses");
      
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSubHeader("4.4 Conversation Analysis");
      addBullet("On-demand AI analysis (completes in <10 seconds)");
      addBullet("Discovery insights extraction (pain points, requirements, environment)");
      addBullet("BANT qualification tracking");
      addBullet("5-10 strategic discovery questions prioritized by impact");
      addBullet("Product/service recommendations based on conversation");
      addBullet("Case study suggestions matching prospect's needs");
      yPosition += 5;
      
      addSubHeader("4.5 Present to Win (Sales Collateral Generation)");
      addBullet("Pitch Deck: 5-slide presentation tailored to prospect's needs");
      addBullet("Case Study: Success story matching prospect's industry/challenge");
      addBullet("Battle Card: Competitive positioning and objection handling");
      addBullet("All materials generated from actual conversation context");
      addBullet("Regenerate functionality as conversation evolves");
      yPosition += 5;
      
      addSubHeader("4.6 Meeting Minutes");
      addBullet("AI-generated comprehensive meeting documentation");
      addBullet("Structured format: Discussion summary, Q&A, BANT, challenges, action items");
      addBullet("Editable before export");
      addBullet("Professional PDF export with branded banner");
      addBullet("Automatic date, time, and duration tracking");
      addBullet("Rep name included from user profile");
      yPosition += 5;
      
      addSubHeader("4.7 Product/Service Reference");
      addBullet("Searchable product catalog");
      addBullet("AI-recommended products highlighted");
      addBullet("Quick reference during calls");
      addBullet("Cross-sell opportunity identification");
      yPosition += 5;
      
      addSubHeader("4.8 Rev Winner AI Chatbot");
      addBullet("Available on Home and Help pages");
      addBullet("Quick, plain-text responses for platform questions");
      addBullet("Smart escalation to human support when needed");

      // ========== SECTION 5: AI AGENTS ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("5. AI AGENTS & INTELLIGENCE LAYER");
      
      addSubHeader("5.1 Multi-AI Provider Architecture");
      addWrappedText("Rev Winner supports multiple AI providers, allowing users to choose their preferred engine:");
      yPosition += 3;
      addBullet("OpenAI (GPT-4o, GPT-4o-mini)");
      addBullet("Anthropic Claude (claude-sonnet-4-5)");
      addBullet("Google Gemini (gemini-2.5-flash)");
      addBullet("X.AI Grok (grok-3)");
      addBullet("DeepSeek (deepseek-chat)");
      addBullet("Moonshot Kimi (kimi-k2-instruct)");
      yPosition += 5;
      
      addSubHeader("5.2 Specialized AI Agents");
      yPosition += 3;
      
      addText("Conversation Analysis Agent", 10, true);
      addBullet("Extracts discovery insights from sales conversations");
      addBullet("Identifies pain points, requirements, and BANT status");
      addBullet("Generates strategic discovery questions");
      yPosition += 3;
      
      addText("Shift Gears Coaching Agent", 10, true);
      addBullet("Provides real-time tactical sales coaching");
      addBullet("Integrates 6 sales methodologies");
      addBullet("Detects buying signals and objections");
      yPosition += 3;
      
      addText("Sales Script Generation Agent", 10, true);
      addBullet("Generates product recommendations and value propositions");
      addBullet("Creates competitor comparisons and differentiation points");
      addBullet("Produces technical answers from knowledge base");
      yPosition += 3;
      
      addText("Present to Win Agent", 10, true);
      addBullet("Generates personalized pitch decks");
      addBullet("Creates relevant case studies");
      addBullet("Produces competitive battle cards");
      yPosition += 3;
      
      addText("Meeting Minutes Agent", 10, true);
      addBullet("Generates structured meeting documentation");
      addBullet("Extracts action items and follow-up plans");
      addBullet("Credits sales representative (not AI) in notes");
      yPosition += 3;
      
      addText("Sales Intelligence Agent", 10, true);
      addBullet("Passive monitoring during live conversations");
      addBullet("Intent detection and response suggestions");
      addBullet("Knowledge store management");
      yPosition += 3;
      
      addText("Document Processing Agent", 10, true);
      addBullet("Processes PDFs, Word docs, and text files");
      addBullet("GPT-4 Vision for image analysis (charts, infographics)");
      addBullet("URL content extraction");

      // ========== SECTION 6: TECHNOLOGY STACK ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("6. TECHNOLOGY STACK");
      
      addSubHeader("6.1 Frontend Technologies");
      addBullet("React 18 - Modern UI framework");
      addBullet("TypeScript - Type-safe JavaScript");
      addBullet("Vite - Fast build tool and dev server");
      addBullet("TailwindCSS - Utility-first CSS framework");
      addBullet("Shadcn/ui - High-quality UI components");
      addBullet("Radix UI - Accessible headless components");
      addBullet("TanStack Query - Server state management");
      addBullet("Wouter - Lightweight routing");
      addBullet("React Hook Form - Form management");
      addBullet("Lucide React - Icon library");
      addBullet("Framer Motion - Animations");
      yPosition += 5;
      
      addSubHeader("6.2 Backend Technologies");
      addBullet("Node.js - JavaScript runtime");
      addBullet("Express.js - Web application framework");
      addBullet("TypeScript - Type-safe development");
      addBullet("PostgreSQL (Neon Serverless) - Database");
      addBullet("Drizzle ORM - Database ORM");
      addBullet("WebSocket - Real-time communication");
      addBullet("JWT - Authentication tokens");
      addBullet("bcrypt - Password hashing");
      addBullet("node-cron - Scheduled jobs");
      addBullet("nodemailer - Email delivery");
      yPosition += 5;
      
      addSubHeader("6.3 AI & ML Services");
      addBullet("Deepgram - Real-time speech-to-text transcription");
      addBullet("OpenAI SDK - GPT-4o, GPT-4 Vision");
      addBullet("Anthropic SDK - Claude models");
      addBullet("Google Generative AI SDK - Gemini models");
      addBullet("DeepSeek API - DeepSeek chat");
      addBullet("Groq SDK - Fast inference");
      
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSubHeader("6.4 External Services");
      addBullet("Razorpay - Payment processing (India)");
      addBullet("Cashfree - Additional payment option");
      addBullet("Gmail SMTP - Email delivery");
      addBullet("Neon Database - Serverless PostgreSQL hosting");
      yPosition += 5;
      
      addSubHeader("6.5 Browser APIs Used");
      addBullet("getUserMedia API - Microphone access");
      addBullet("getDisplayMedia API - Screen/tab audio capture");
      addBullet("Web Audio API - Audio processing");
      addBullet("WebSocket API - Real-time streaming");
      addBullet("Fetch API - HTTP requests");
      addBullet("Local Storage - Client-side persistence");
      yPosition += 5;
      
      addSubHeader("6.6 Security Technologies");
      addBullet("JWT-based authentication with refresh tokens");
      addBullet("bcrypt password hashing");
      addBullet("AES-256-GCM encryption for API keys");
      addBullet("HMAC-SHA256 for webhook verification");
      addBullet("Role-based access control (RBAC)");
      addBullet("Single-device session enforcement");
      addBullet("Zod validation for all inputs");

      // ========== SECTION 7: SYSTEM ARCHITECTURE ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("7. SYSTEM ARCHITECTURE");
      
      addSubHeader("7.1 Architecture Overview");
      addWrappedText("Rev Winner uses a full-stack TypeScript architecture with clear separation between frontend, backend, and AI services.");
      yPosition += 5;
      
      addSubHeader("7.2 Authentication System");
      addBullet("Custom JWT-based authentication");
      addBullet("Email OTP verification for registration");
      addBullet("Secure password storage with bcrypt");
      addBullet("Refresh token rotation");
      addBullet("Single-device access enforcement");
      addBullet("Role-based access: user, license_manager, admin, super_admin");
      yPosition += 5;
      
      addSubHeader("7.3 User Roles & Permissions");
      addText("User (Standard)", 10, true);
      addBullet("Full access to Sales Assistant features");
      addBullet("Train Me domain management");
      addBullet("Profile and settings management");
      yPosition += 3;
      
      addText("License Manager", 10, true);
      addBullet("Manage enterprise licenses");
      addBullet("Assign/revoke user access");
      addBullet("View usage analytics");
      yPosition += 3;
      
      addText("Admin", 10, true);
      addBullet("User management");
      addBullet("Subscription catalog management");
      addBullet("AI token usage monitoring");
      addBullet("System configuration");
      yPosition += 5;
      
      addSubHeader("7.4 Data Flow");
      addWrappedText("1. User speaks during call → Microphone/Tab audio captured");
      addWrappedText("2. Audio streamed to Deepgram via WebSocket");
      addWrappedText("3. Transcription returned in real-time with speaker labels");
      addWrappedText("4. AI agents analyze conversation context");
      addWrappedText("5. Coaching tips, analysis, and collateral generated");
      addWrappedText("6. All data stored with user isolation in PostgreSQL");

      // ========== SECTION 8: COMPLETE WORKFLOW DIAGRAMS ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("8. COMPLETE WORKFLOW DIAGRAMS");
      
      addSubHeader("8.1 User Registration Flow");
      addWrappedText("The registration process ensures only work emails are accepted:");
      yPosition += 3;
      addBullet("Step 1: User enters email on landing page");
      addBullet("Step 2: System validates email (blocks personal providers like gmail, yahoo)");
      addBullet("Step 3: OTP sent to verified work email");
      addBullet("Step 4: User enters OTP for verification");
      addBullet("Step 5: Complete registration form (name, username, password)");
      addBullet("Step 6: Accept Terms & Conditions");
      addBullet("Step 7: AI Engine setup (select provider, enter API key)");
      addBullet("Step 8: Access dashboard with free trial");
      yPosition += 5;
      
      addSubHeader("8.2 Discovery Call Session Flow");
      addWrappedText("Real-time transcription and AI coaching during live calls:");
      yPosition += 3;
      addBullet("Step 1: User starts new session from dashboard");
      addBullet("Step 2: Enable microphone or screen share audio capture");
      addBullet("Step 3: WebSocket connection established to server");
      addBullet("Step 4: Audio streamed in real-time (48kHz PCM, 16-bit mono)");
      addBullet("Step 5: Server forwards to Deepgram Nova-2 model");
      addBullet("Step 6: Transcription returned with speaker labels (<2s latency)");
      addBullet("Step 7: User clicks 'Shift Gears' for AI coaching");
      addBullet("Step 8: AI analyzes conversation context");
      addBullet("Step 9: Coaching tips displayed in real-time");
      addBullet("Step 10: Session ends, meeting minutes generated");
      yPosition += 5;
      
      addSubHeader("8.3 Payment Processing Flow (Razorpay)");
      addWrappedText("Secure payment with server-side verification:");
      yPosition += 3;
      addBullet("Step 1: User adds items to cart");
      addBullet("Step 2: Optional promo code application");
      addBullet("Step 3: Proceed to checkout");
      addBullet("Step 4: Backend creates Razorpay order (server-side price verification)");
      addBullet("Step 5: Razorpay checkout modal opens");
      addBullet("Step 6: User completes payment");
      addBullet("Step 7: Razorpay sends webhook notification");
      addBullet("Step 8: Backend verifies HMAC signature");
      addBullet("Step 9: Subscription/add-on records created");
      addBullet("Step 10: Confirmation email sent to user");
      
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSubHeader("8.4 Enterprise License Assignment Flow");
      addWrappedText("Bulk licensing for organizations:");
      yPosition += 3;
      addBullet("Step 1: Organization purchases license package");
      addBullet("Step 2: License Manager account created");
      addBullet("Step 3: Manager receives activation email");
      addBullet("Step 4: Manager sets password and accesses portal");
      addBullet("Step 5: Manager enters user details (email, name, phone - all required)");
      addBullet("Step 6: Optional: Enable Train Me or DAI for user");
      addBullet("Step 7: System sends activation email to user");
      addBullet("Step 8: User clicks activation link");
      addBullet("Step 9: New user creates account / existing user gets license");
      addBullet("Step 10: User gains immediate access to platform");
      yPosition += 5;
      
      addSubHeader("8.5 Real-time Audio Pipeline");
      addWrappedText("Technical flow for speech-to-text:");
      yPosition += 3;
      addBullet("Browser: getUserMedia() captures microphone audio");
      addBullet("Browser: AudioContext processes to PCM16 (48kHz, mono)");
      addBullet("Browser: WebSocket sends binary audio chunks");
      addBullet("Server: /api/transcribe-stream receives audio");
      addBullet("Server: Forwards to Deepgram live connection");
      addBullet("Deepgram: Nova-2 model transcribes with diarization");
      addBullet("Server: Receives JSON transcript events");
      addBullet("Server: Sends transcript to client via WebSocket");
      addBullet("Client: Updates UI with real-time transcript");

      // ========== SECTION 9: DATABASE ARCHITECTURE ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("9. DATABASE ARCHITECTURE");
      
      addSubHeader("9.1 Database Overview");
      addWrappedText("PostgreSQL (Neon Serverless) with 70+ tables organized into logical groups:");
      yPosition += 5;
      
      addSubHeader("9.2 User Management Tables (10 tables)");
      addBullet("auth_users - Primary authentication (email, password, roles)");
      addBullet("users - OAuth authentication (legacy compatibility)");
      addBullet("user_preferences - UI/UX settings");
      addBullet("user_profiles - Learning patterns, sales approach");
      addBullet("user_entitlements - Cached access rights");
      addBullet("user_sessions - Active JWT sessions");
      addBullet("otps - Email verification codes");
      addBullet("password_reset_tokens - Password recovery");
      addBullet("refresh_tokens - JWT refresh tokens");
      addBullet("super_user_overrides - Admin bypass");
      yPosition += 5;
      
      addSubHeader("9.3 Organizations & Licensing Tables (8 tables)");
      addBullet("organizations - Company entities");
      addBullet("organization_memberships - User associations");
      addBullet("license_packages - Seat bundles");
      addBullet("enterprise_user_assignments - Individual seats");
      addBullet("activation_invites - Pending activations");
      addBullet("admin_actions_log - Administrative audit trail");
      addBullet("audit_logs - System-wide logs");
      addBullet("traffic_logs - API usage logs");
      yPosition += 5;
      
      addSubHeader("9.4 Billing & Commerce Tables (15 tables)");
      addBullet("subscription_plans - Available plans");
      addBullet("subscriptions - User subscriptions");
      addBullet("addons - Add-on definitions");
      addBullet("subscription_addons - User add-on purchases");
      addBullet("addon_purchases - Detailed transactions");
      addBullet("payments - Payment records");
      addBullet("gateway_providers - Payment gateway config");
      addBullet("gateway_transactions - Transaction logs");
      addBullet("cart_items, pending_orders, promo_codes, invoices, etc.");
      
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSubHeader("9.5 Conversations & AI Tables (12 tables)");
      addBullet("conversations - Call sessions");
      addBullet("messages - Transcript entries with AI annotations");
      addBullet("audio_sources - Input sources (mic, teams)");
      addBullet("teams_meetings - Teams integrations");
      addBullet("conversation_intents - Detected intents");
      addBullet("conversation_memories - Session insights");
      addBullet("call_recordings - Audio files (7-day retention)");
      addBullet("call_meeting_minutes - Generated minutes");
      addBullet("conversation_minutes_backup - Marketing data");
      yPosition += 5;
      
      addSubHeader("9.6 AI & Intelligence Tables (10 tables)");
      addBullet("ai_token_usage - Token consumption tracking");
      addBullet("sales_intelligence_knowledge - Validated responses");
      addBullet("sales_intelligence_suggestions - Real-time tips");
      addBullet("sales_intelligence_learning_logs - Post-call learning");
      addBullet("prompt_templates - Centralized prompts");
      addBullet("case_studies - Success stories");
      addBullet("products - Product catalog");
      addBullet("domain_expertise - Train Me documents");
      yPosition += 5;
      
      addSubHeader("9.7 Key Relationships");
      addWrappedText("auth_users (1) → (N) subscriptions");
      addWrappedText("auth_users (1) → (N) conversations");
      addWrappedText("organizations (1) → (N) license_packages");
      addWrappedText("license_packages (1) → (N) enterprise_user_assignments");
      addWrappedText("conversations (1) → (N) messages");

      // ========== SECTION 10: SECURITY ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("10. SECURITY & COMPLIANCE");
      
      addSubHeader("10.1 Data Security");
      addBullet("All data encrypted at rest and in transit (TLS 1.3)");
      addBullet("API keys encrypted with AES-256-GCM");
      addBullet("Database hosted on Neon (SOC 2 compliant)");
      addBullet("No third-party access to user data");
      yPosition += 5;
      
      addSubHeader("10.2 User Data Isolation");
      addBullet("Complete tenant isolation - users cannot see each other's data");
      addBullet("All database queries filtered by userId");
      addBullet("Training data, conversations, and AI context scoped per user");
      addBullet("Enterprise organizations have additional isolation layer");
      yPosition += 5;
      
      addSubHeader("10.3 Authentication Security");
      addBullet("JWT tokens with short expiration (15 minutes)");
      addBullet("Refresh token rotation on each use");
      addBullet("Single-device session enforcement");
      addBullet("Account lockout after failed attempts");
      addBullet("Password requirements: 8+ characters, uppercase, lowercase, number, special");
      yPosition += 5;
      
      addSubHeader("10.4 Payment Security");
      addBullet("PCI-DSS compliant payment processing via Razorpay");
      addBullet("Webhook signature verification (HMAC-SHA256)");
      addBullet("Server-side plan verification");
      addBullet("Idempotent payment handling");

      // ========== SECTION 11: AI TOKEN USAGE TRACKING ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("11. AI TOKEN USAGE TRACKING");
      
      addSubHeader("11.1 Overview");
      addWrappedText("Rev Winner provides comprehensive AI token usage tracking for monitoring costs and optimizing usage across all AI providers.");
      yPosition += 5;
      
      addSubHeader("11.2 Tracked Metrics");
      addBullet("Provider (OpenAI, Anthropic, Google, X.AI, DeepSeek, Moonshot)");
      addBullet("Model (GPT-4o, Claude, Gemini, Grok, etc.)");
      addBullet("Prompt tokens (input)");
      addBullet("Completion tokens (output)");
      addBullet("Total tokens per request");
      addBullet("Request type (shift-gears, analyze, battle-card, etc.)");
      addBullet("Cost estimate in USD");
      yPosition += 5;
      
      addSubHeader("11.3 Admin Dashboard Metrics");
      addBullet("Total Tokens by Provider - Pie chart distribution");
      addBullet("Daily Usage Trends - Line chart over time");
      addBullet("Top Users by Usage - Heaviest token consumers");
      addBullet("Cost Estimates - Approximate spend by provider");
      addBullet("Request Types Breakdown - Which AI features consume most");
      yPosition += 5;
      
      addSubHeader("11.4 API Endpoints");
      addBullet("GET /api/admin/ai-token-usage - All usage with filters");
      addBullet("GET /api/admin/ai-token-usage/summary - Aggregated by provider");
      addBullet("GET /api/ai-token-usage/me - User's own usage");
      yPosition += 5;
      
      addSubHeader("11.5 Filters Available");
      addBullet("userId - Filter by specific user (admin only)");
      addBullet("startDate/endDate - Date range filtering");
      addBullet("provider - Filter by AI provider");

      // ========== SECTION 12: SESSION & USAGE TRACKING ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("12. SESSION & USAGE TRACKING");
      
      addSubHeader("12.1 Subscription Usage Fields");
      addBullet("sessionsUsed - Number of discovery call sessions completed");
      addBullet("sessionsLimit - null for unlimited (paid plans)");
      addBullet("minutesUsed - Total transcription minutes consumed");
      addBullet("minutesLimit - 180 for free trial, null for unlimited");
      addBullet("sessionHistory - Detailed log of each session");
      yPosition += 5;
      
      addSubHeader("12.2 Usage Limits by Plan");
      addText("Free Trial:", 10, true);
      addBullet("Sessions: 3, Minutes: 180, No Train Me, No DAI");
      addText("Platform Access:", 10, true);
      addBullet("Sessions: Unlimited, Minutes: Per add-on, Optional Train Me/DAI");
      addText("Enterprise:", 10, true);
      addBullet("Sessions: Unlimited, Minutes: Per package, Included Train Me/DAI");
      yPosition += 5;
      
      addSubHeader("12.3 Session Tracking Flow");
      addBullet("1. Session Start - Record startTime, create session entry");
      addBullet("2. Real-time Tracking - Accumulate transcription minutes");
      addBullet("3. Session End - Record endTime, calculate durationMinutes");
      addBullet("4. Update Totals - Increment sessionsUsed and minutesUsed");
      addBullet("5. Check Limits - Warn user if approaching limits");
      yPosition += 5;
      
      addSubHeader("12.4 Session Minutes Add-On Packages");
      addBullet("Starter: 500 minutes - $6 USD");
      addBullet("Professional: 1000 minutes - $10 USD");
      addBullet("Business: 2500 minutes - $20 USD");
      addBullet("Enterprise: 5000 minutes - $35 USD");
      yPosition += 5;
      
      addSubHeader("12.5 Usage Reconciliation");
      addWrappedText("Daily automated job at midnight syncs sessionsUsed and minutesUsed with actual session history, detects discrepancies, and sends usage summary to admins.");

      // ========== SECTION 13: TRAIN ME ADD-ON ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("13. TRAIN ME ADD-ON");
      
      addSubHeader("13.1 Overview");
      addWrappedText("Train Me enables domain expertise customization by allowing users to upload training documents that enhance AI responses with company-specific knowledge.");
      yPosition += 5;
      
      addSubHeader("13.2 Key Benefits");
      addBullet("Upload company-specific documents (product sheets, case studies)");
      addBullet("Train AI with domain-specific terminology");
      addBullet("Get personalized responses based on uploaded materials");
      addBullet("Maintain competitive advantage with proprietary knowledge");
      yPosition += 5;
      
      addSubHeader("13.3 Subscription Details");
      addBullet("Duration: 30 days per purchase");
      addBullet("Activation: Immediate upon purchase");
      addBullet("Renewal: Manual re-purchase required");
      addBullet("Enterprise: Can be enabled by License Manager");
      yPosition += 5;
      
      addSubHeader("13.4 Supported Document Formats");
      addBullet("PDF documents (.pdf)");
      addBullet("Word documents (.docx)");
      addBullet("Text files (.txt)");
      addBullet("Markdown files (.md)");
      yPosition += 5;
      
      addSubHeader("13.5 Document Processing Pipeline");
      addBullet("1. Upload - User uploads document via API");
      addBullet("2. Extraction - Content extracted (PDF → text, DOCX → text)");
      addBullet("3. Processing - Text chunked and indexed for retrieval");
      addBullet("4. Integration - Documents available for AI context enrichment");
      addBullet("5. Cleanup - Documents deleted when subscription expires");
      yPosition += 5;
      
      addSubHeader("13.6 API Routes");
      addBullet("GET /api/train-me/status - Check subscription status");
      addBullet("POST /api/train-me/documents - Upload training document");
      addBullet("GET /api/train-me/documents - List uploaded documents");
      addBullet("DELETE /api/train-me/documents/:id - Delete document");

      // ========== SECTION 14: ENTERPRISE LICENSE MANAGEMENT ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("14. ENTERPRISE LICENSE MANAGEMENT");
      
      addSubHeader("14.1 License Package Types");
      addBullet("Starter: 5-10 seats, Monthly/Annual, Basic features");
      addBullet("Professional: 11-50 seats, Monthly/Annual, + Train Me option");
      addBullet("Enterprise: 51+ seats, Custom terms, Full features");
      yPosition += 5;
      
      addSubHeader("14.2 License States");
      addWrappedText("pending_activation → active → inactive/revoked (can be reactivated)");
      yPosition += 5;
      
      addSubHeader("14.3 License Manager Role");
      addBullet("Manage enterprise licenses for organization");
      addBullet("Assign licenses to team members");
      addBullet("Revoke licenses when needed");
      addBullet("Enable/disable Train Me and DAI per user");
      addBullet("View usage analytics for team");
      yPosition += 5;
      
      addSubHeader("14.4 Assignment Process");
      addBullet("1. License Manager adds user (email, name, phone required)");
      addBullet("2. System sends activation email with secure token");
      addBullet("3. User clicks activation link (24-hour expiry)");
      addBullet("4. New user: Creates account with work email validation");
      addBullet("5. Existing user: License attached immediately");
      addBullet("6. User gains access based on license entitlements");
      yPosition += 5;
      
      addSubHeader("14.5 Automated Notifications");
      addBullet("License expiry warning: 7 days, 3 days, 1 day before");
      addBullet("Revocation notification to affected users");
      addBullet("Assignment confirmation emails");
      addBullet("License Manager portal access instructions");

      // ========== SECTION 15: SALES PLAYBOOK ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("15. SALES PLAYBOOK");
      
      addSubHeader("15.1 Target Customer Profiles");
      addText("Ideal Customer:", 10, true);
      addBullet("B2B sales teams (5-500 reps)");
      addBullet("Companies with discovery-heavy sales processes");
      addBullet("Organizations selling technical/complex products");
      addBullet("Teams looking to scale onboarding and coaching");
      yPosition += 5;
      
      addSubHeader("15.2 Key Selling Points");
      addBullet("REAL-TIME coaching (not post-call analysis)");
      addBullet("PERSONALIZED to their products (Train Me feature)");
      addBullet("AUTOMATED documentation (meeting minutes, collateral)");
      addBullet("FLEXIBLE AI providers (use your own keys)");
      addBullet("ENTERPRISE-READY (bulk licensing, RBAC, audit logs)");
      yPosition += 5;
      
      addSubHeader("15.3 Competitive Differentiation");
      addText("vs. Gong/Chorus:", 10, true);
      addBullet("Rev Winner: Real-time coaching DURING calls");
      addBullet("Gong/Chorus: Post-call analysis only");
      yPosition += 3;
      
      addText("vs. Generic AI Assistants:", 10, true);
      addBullet("Rev Winner: Domain-trained on YOUR products");
      addBullet("Generic AI: No product-specific knowledge");
      yPosition += 3;
      
      addText("vs. Manual Note-taking:", 10, true);
      addBullet("Rev Winner: 100% automated with AI insights");
      addBullet("Manual: Time-consuming, inconsistent, no coaching");
      yPosition += 5;
      
      addSubHeader("15.4 Objection Handling");
      addText("'We already use Gong/Chorus'", 10, true);
      addBullet("Response: Those tools analyze AFTER the call. Rev Winner coaches DURING the call when it matters most.");
      yPosition += 3;
      
      addText("'AI can't understand our complex products'", 10, true);
      addBullet("Response: Train Me lets you upload YOUR docs, so the AI speaks YOUR language.");
      yPosition += 3;
      
      addText("'Security concerns with AI'", 10, true);
      addBullet("Response: Users bring their own API keys, data is isolated per user, enterprise-grade security.");

      // ========== SECTION 16: OPERATIONS GUIDE ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("16. OPERATIONS GUIDE");
      
      addSubHeader("16.1 User Onboarding Flow");
      addBullet("1. User signs up with work email");
      addBullet("2. Email OTP verification");
      addBullet("3. Accept Terms & Conditions");
      addBullet("4. Configure AI engine (bring own API key)");
      addBullet("5. Create first domain expertise (Train Me)");
      addBullet("6. Start first sales session");
      yPosition += 5;
      
      addSubHeader("16.2 Subscription Management");
      addBullet("Free Trial: 180 minutes, limited sessions");
      addBullet("Yearly Plans: Full access, higher limits");
      addBullet("Add-ons: Train Me, Session Minutes bundles");
      addBullet("Enterprise: Bulk licensing, custom terms");
      yPosition += 5;
      
      addSubHeader("16.3 Admin Portal Features");
      addBullet("User Management: View, edit, suspend users");
      addBullet("Subscription Catalog: Manage plans and pricing");
      addBullet("AI Token Usage: Monitor usage across providers");
      addBullet("Promo Codes: Create and manage discounts");
      addBullet("Audit Logs: Track all system changes");
      yPosition += 5;
      
      addSubHeader("16.4 Automated Operations");
      addBullet("Daily maintenance job at 2:00 AM UTC");
      addBullet("Usage reconciliation every 6 hours");
      addBullet("License expiry warnings (7 days, 3 days, 1 day)");
      addBullet("Automated email notifications");
      yPosition += 5;
      
      addSubHeader("16.5 Support Escalation");
      addBullet("Tier 1: Rev Winner AI Chatbot (self-service)");
      addBullet("Tier 2: Email support (sales@revwinner.com)");
      addBullet("Tier 3: Phone support (India/USA numbers)");

      // ========== SECTION 17: ROADMAP ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("17. PLATFORM ENHANCEMENT ROADMAP");
      
      addSubHeader("17.1 Completed Features");
      addBullet("Real-time transcription with Deepgram");
      addBullet("Multi-AI provider support");
      addBullet("Domain expertise training (Train Me)");
      addBullet("Meeting minutes with PDF export");
      addBullet("Present to Win collateral generation");
      addBullet("Entity detection in transcription");
      addBullet("Image processing for training (GPT-4 Vision)");
      addBullet("Enterprise license management");
      addBullet("Razorpay payment integration");
      addBullet("Selling Intelligence Engine with domain detection");
      addBullet("Claim safety classification system");
      addBullet("Compliance-aware content generation");
      yPosition += 5;
      
      addSubHeader("17.2 Future Enhancements");
      addBullet("CRM integrations (Salesforce, HubSpot)");
      addBullet("Calendar integration for scheduled coaching");
      addBullet("Team analytics and leaderboards");
      addBullet("Mobile native apps (iOS/Android)");
      addBullet("Custom reporting and dashboards");
      addBullet("API for third-party integrations");
      addBullet("Multi-language support");

      // ========== SECTION 18: TECHNICAL FAQ ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("18. TECHNICAL FAQ FOR SALES");
      
      addText("Q: What AI models does Rev Winner use?", 10, true);
      addWrappedText("A: Users can choose from OpenAI GPT-4o, Anthropic Claude, Google Gemini, X.AI Grok, DeepSeek, or Moonshot Kimi. They bring their own API keys for full control.", 9);
      yPosition += 5;
      
      addText("Q: How is user data protected?", 10, true);
      addWrappedText("A: All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Each user's data is completely isolated - no cross-user access is possible.", 9);
      yPosition += 5;
      
      addText("Q: Does Rev Winner store audio recordings?", 10, true);
      addWrappedText("A: By default, audio is processed in real-time and not stored. Users can optionally enable call recording for their account.", 9);
      yPosition += 5;
      
      addText("Q: What's the latency for real-time features?", 10, true);
      addWrappedText("A: Transcription: <2 seconds. Conversation Analysis: <10 seconds. Shift Gears tips: <3 seconds.", 9);
      yPosition += 5;
      
      addText("Q: Can Rev Winner integrate with our CRM?", 10, true);
      addWrappedText("A: CRM integration is on our roadmap. Currently, meeting minutes can be copied/exported for CRM entry.", 9);
      yPosition += 5;
      
      addText("Q: What browsers are supported?", 10, true);
      addWrappedText("A: Chrome, Firefox, Safari, Edge. Mobile browsers on iOS and Android are fully supported.", 9);
      yPosition += 5;
      
      addText("Q: Is there an API for custom integrations?", 10, true);
      addWrappedText("A: Yes! Rev Winner offers API access for enterprise customers with rate limiting, IP whitelisting, and usage analytics.", 9);
      yPosition += 5;
      
      addText("Q: What's the uptime SLA?", 10, true);
      addWrappedText("A: We target 99.9% uptime with Neon serverless database and enterprise hosting infrastructure.", 9);

      // ========== SECTION 19: CONTACT ==========
      doc.addPage();
      pageNumber++;
      yPosition = addPageHeader();
      addFooter(pageNumber);
      
      addSectionHeader("19. CONTACT INFORMATION");
      
      yPosition += 10;
      
      // Add logo on contact page
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 20, yPosition, 40, 40);
          yPosition += 50;
        } catch (e) {
          console.warn('Logo on contact page failed:', e);
        }
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
      doc.text("Rev Winner", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
      doc.text("A Product of Healthcaa Technologies", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
      
      addText("Website:", 11, true);
      addText("https://revwinner.com", 11);
      yPosition += 5;
      
      addText("Email:", 11, true);
      addText("sales@revwinner.com", 11);
      yPosition += 5;
      
      addText("Phone (India):", 11, true);
      addText("+91 8130276382", 11);
      yPosition += 5;
      
      addText("Phone (USA):", 11, true);
      addText("+1 832 632 8555", 11);
      yPosition += 15;
      
      doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F');
      yPosition += 15;
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Turn Every Conversation into a Closed Deal", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Your Real-Time AI Sales Ally", pageWidth / 2, yPosition, { align: "center" });

      // Generate PDF buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Rev_Winner_Bible_Complete_Guide.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
  });
}
