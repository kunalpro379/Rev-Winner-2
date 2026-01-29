import { Router, Request, Response } from "express";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const router = Router();

// Color palette
const colors = {
  primary: { r: 192, g: 38, b: 211 },
  secondary: { r: 30, g: 58, b: 138 },
  text: { r: 31, g: 41, b: 55 },
  lightGray: { r: 107, g: 114, b: 128 },
  code: { r: 243, g: 244, b: 246 },
  success: { r: 16, g: 185, b: 129 },
};

router.get("/api-documentation", async (req: Request, res: Response) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;
    let pageNumber = 1;

    // Load logo
    let logoBase64: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), "attached_assets", "rev-winner-logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = logoBuffer.toString("base64");
      }
    } catch (err) {
      console.log("Logo not found, continuing without it");
    }

    const addFooter = (page: number) => {
      doc.setFontSize(8);
      doc.setTextColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
      doc.text(`Page ${page}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      doc.text("© 2025 Rev Winner. All rights reserved.", pageWidth / 2, pageHeight - 6, { align: "center" });
    };

    const addPageHeader = () => {
      if (logoBase64) {
        doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", margin, 8, 18, 18 * 0.3);
      }
      doc.setFontSize(8);
      doc.setTextColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
      doc.text("API Documentation v1.0", pageWidth - margin, 12, { align: "right" });
      doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.setLineWidth(0.5);
      doc.line(margin, 18, pageWidth - margin, 18);
      return 25;
    };

    const checkPageBreak = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - 25) {
        doc.addPage();
        pageNumber++;
        yPosition = addPageHeader();
        addFooter(pageNumber);
      }
    };

    const addSectionHeader = (text: string) => {
      checkPageBreak(15);
      doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.rect(margin, yPosition, contentWidth, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(text, margin + 5, yPosition + 7);
      yPosition += 15;
    };

    const addSubHeader = (text: string) => {
      checkPageBreak(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
      doc.text(text, margin, yPosition);
      yPosition += 6;
    };

    const addText = (text: string, fontSize: number = 9, bold: boolean = false) => {
      checkPageBreak(8);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.text(text, margin, yPosition);
      yPosition += 5;
    };

    const addWrappedText = (text: string, fontSize: number = 9) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      const lines = doc.splitTextToSize(text, contentWidth);
      for (const line of lines) {
        checkPageBreak(5);
        doc.text(line, margin, yPosition);
        yPosition += 4.5;
      }
      yPosition += 2;
    };

    const addBullet = (text: string) => {
      checkPageBreak(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.text("•", margin + 2, yPosition);
      const lines = doc.splitTextToSize(text, contentWidth - 8);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) checkPageBreak(5);
        doc.text(lines[i], margin + 7, yPosition);
        yPosition += 4.5;
      }
    };

    const addCodeBlock = (code: string) => {
      const lines = code.split("\n");
      const blockHeight = lines.length * 4 + 6;
      checkPageBreak(blockHeight);
      
      doc.setFillColor(colors.code.r, colors.code.g, colors.code.b);
      doc.roundedRect(margin, yPosition - 2, contentWidth, blockHeight, 2, 2, "F");
      
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      
      for (const line of lines) {
        doc.text(line, margin + 3, yPosition + 2);
        yPosition += 4;
      }
      yPosition += 6;
    };

    const addTable = (headers: string[], rows: string[][]) => {
      const colWidth = contentWidth / headers.length;
      const rowHeight = 7;
      
      checkPageBreak(rowHeight * (rows.length + 1) + 5);
      
      doc.setFillColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
      doc.rect(margin, yPosition, contentWidth, rowHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      headers.forEach((header, i) => {
        doc.text(header, margin + i * colWidth + 2, yPosition + 5);
      });
      yPosition += rowHeight;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      rows.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition, contentWidth, rowHeight, "F");
        }
        row.forEach((cell, i) => {
          const truncated = cell.length > 30 ? cell.substring(0, 27) + "..." : cell;
          doc.text(truncated, margin + i * colWidth + 2, yPosition + 5);
        });
        yPosition += rowHeight;
      });
      yPosition += 5;
    };

    // ========== COVER PAGE ==========
    doc.setFillColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    doc.rect(0, 0, pageWidth, pageHeight * 0.4, "F");
    
    if (logoBase64) {
      doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", (pageWidth - 50) / 2, 30, 50, 50 * 0.3);
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(255, 255, 255);
    doc.text("API Documentation", pageWidth / 2, 75, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Developer Integration Guide", pageWidth / 2, 88, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.text("Version 1.0", pageWidth / 2, pageHeight * 0.5, { align: "center" });
    doc.text("January 2025", pageWidth / 2, pageHeight * 0.5 + 8, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.text("Base URL: https://api.revwinner.com", pageWidth / 2, pageHeight * 0.6, { align: "center" });
    
    doc.setFontSize(9);
    doc.setTextColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    doc.text("Support: sales@revwinner.com", pageWidth / 2, pageHeight - 40, { align: "center" });
    doc.text("India: +91 8130276382 | USA: +1 832 632 8555", pageWidth / 2, pageHeight - 34, { align: "center" });
    
    addFooter(pageNumber);

    // ========== AUTHENTICATION ==========
    doc.addPage();
    pageNumber++;
    yPosition = addPageHeader();
    addFooter(pageNumber);

    addSectionHeader("1. AUTHENTICATION");
    
    addWrappedText("All API requests require authentication using an API key. You can obtain an API key from the Rev Winner Admin Dashboard.");
    yPosition += 3;
    
    addSubHeader("1.1 Header Authentication");
    addWrappedText("Include your API key in the request header:");
    addCodeBlock("x-api-key: rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    
    addSubHeader("1.2 API Key Format");
    addBullet("All Rev Winner API keys start with 'rw_' prefix");
    addBullet("Keys are 35 characters long (including prefix)");
    addBullet("Store your API key securely - it cannot be retrieved after creation");
    yPosition += 5;
    
    addSubHeader("1.3 Example Request");
    addCodeBlock(`curl -X GET "https://api.revwinner.com/api/v1/conversations" \\
  -H "x-api-key: rw_your_api_key_here" \\
  -H "Content-Type: application/json"`);

    // ========== RATE LIMITING ==========
    addSectionHeader("2. RATE LIMITING");
    
    addWrappedText("API requests are subject to rate limiting based on your API key configuration.");
    yPosition += 3;
    
    addSubHeader("2.1 Rate Limit Headers");
    addTable(
      ["Header", "Description"],
      [
        ["X-RateLimit-Limit", "Maximum requests in current window"],
        ["X-RateLimit-Remaining", "Requests remaining in window"],
        ["X-RateLimit-Reset", "Unix timestamp when limit resets"],
      ]
    );
    
    addSubHeader("2.2 Default Limits");
    addTable(
      ["Window", "Default Limit"],
      [
        ["Per Minute", "100 requests"],
        ["Per Hour", "1,000 requests"],
        ["Per Day", "10,000 requests"],
      ]
    );
    addWrappedText("Enterprise customers may request custom rate limits.");

    // ========== ERROR CODES ==========
    doc.addPage();
    pageNumber++;
    yPosition = addPageHeader();
    addFooter(pageNumber);

    addSectionHeader("3. ERROR CODES");
    
    addTable(
      ["HTTP Status", "Code", "Description"],
      [
        ["400", "BAD_REQUEST", "Invalid request parameters"],
        ["401", "API_KEY_MISSING", "No API key provided"],
        ["401", "API_KEY_INVALID", "API key invalid or expired"],
        ["403", "IP_NOT_ALLOWED", "Request IP not in whitelist"],
        ["404", "NOT_FOUND", "Resource not found"],
        ["429", "RATE_LIMIT_EXCEEDED", "Too many requests"],
        ["500", "INTERNAL_ERROR", "Server error"],
      ]
    );
    
    addSubHeader("3.1 Error Response Format");
    addCodeBlock(`{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}`);

    // ========== API ENDPOINTS ==========
    addSectionHeader("4. API ENDPOINTS");
    
    addSubHeader("4.1 List Conversations");
    addText("GET /api/v1/conversations", 9, true);
    yPosition += 2;
    addWrappedText("Retrieve a list of sales conversations.");
    yPosition += 3;
    
    addText("Query Parameters:", 9, true);
    addTable(
      ["Parameter", "Type", "Description"],
      [
        ["limit", "integer", "Results count (default: 50, max: 100)"],
        ["offset", "integer", "Pagination offset"],
        ["startDate", "ISO 8601", "Filter by start date"],
        ["endDate", "ISO 8601", "Filter by end date"],
        ["status", "string", "Filter: active, completed"],
      ]
    );

    // ========== MORE ENDPOINTS ==========
    doc.addPage();
    pageNumber++;
    yPosition = addPageHeader();
    addFooter(pageNumber);

    addSubHeader("4.2 Analyze Transcript");
    addText("POST /api/v1/analyze", 9, true);
    yPosition += 2;
    addWrappedText("Submit a transcript for AI analysis.");
    yPosition += 3;
    
    addText("Request Body:", 9, true);
    addCodeBlock(`{
  "transcript": "Full conversation transcript...",
  "analysisType": "discovery",
  "options": {
    "extractPainPoints": true,
    "extractRequirements": true,
    "generateRecommendations": true
  }
}`);

    addSubHeader("4.3 Generate Battle Card");
    addText("POST /api/v1/battle-card", 9, true);
    yPosition += 2;
    addWrappedText("Generate a competitive battle card with honest positioning.");
    yPosition += 3;
    
    addText("Request Body:", 9, true);
    addCodeBlock(`{
  "yourProduct": "Rev Winner",
  "competitor": "Competitor Name",
  "context": "Enterprise sales team, 50+ reps"
}`);

    addSubHeader("4.4 Generate Meeting Minutes");
    addText("POST /api/v1/meeting-minutes", 9, true);
    yPosition += 2;
    addWrappedText("Generate structured meeting minutes from a transcript with PDF export.");

    // ========== WEBHOOKS ==========
    doc.addPage();
    pageNumber++;
    yPosition = addPageHeader();
    addFooter(pageNumber);

    addSectionHeader("5. WEBHOOKS");
    
    addWrappedText("Rev Winner can send real-time notifications to your systems via webhooks.");
    yPosition += 3;
    
    addSubHeader("5.1 Webhook Events");
    addTable(
      ["Event", "Description"],
      [
        ["conversation.completed", "A conversation has ended"],
        ["analysis.completed", "AI analysis has finished"],
        ["subscription.expiring", "Subscription expires in 7 days"],
      ]
    );
    
    addSubHeader("5.2 Webhook Payload");
    addCodeBlock(`{
  "event": "conversation.completed",
  "timestamp": "2025-01-05T12:00:00Z",
  "data": {
    "conversationId": "conv_abc123",
    "duration": 1845
  },
  "signature": "sha256=..."
}`);
    
    addSubHeader("5.3 Verifying Webhook Signatures");
    addWrappedText("Webhooks include an HMAC-SHA256 signature in the X-RevWinner-Signature header. Verify this signature using your webhook secret.");

    // ========== SDKS ==========
    addSectionHeader("6. SDKs & LIBRARIES");
    
    addSubHeader("6.1 Node.js");
    addCodeBlock(`npm install @revwinner/sdk

const RevWinner = require('@revwinner/sdk');
const client = new RevWinner({
  apiKey: 'rw_your_api_key_here'
});

const analysis = await client.analyze({
  transcript: 'Your conversation...',
  analysisType: 'discovery'
});`);

    addSubHeader("6.2 Python");
    addCodeBlock(`pip install revwinner

from revwinner import RevWinnerClient
client = RevWinnerClient(api_key='rw_your_api_key')

analysis = client.analyze(
    transcript='Your conversation...',
    analysis_type='discovery'
)`);

    // ========== BEST PRACTICES ==========
    doc.addPage();
    pageNumber++;
    yPosition = addPageHeader();
    addFooter(pageNumber);

    addSectionHeader("7. BEST PRACTICES");
    
    addSubHeader("7.1 Secure Your API Key");
    addBullet("Never expose your API key in client-side code");
    addBullet("Use environment variables to store keys");
    addBullet("Rotate keys periodically");
    yPosition += 5;
    
    addSubHeader("7.2 Handle Rate Limits");
    addWrappedText("Implement exponential backoff when receiving 429 responses. Check the X-RateLimit-Reset header to determine when to retry.");
    yPosition += 5;
    
    addSubHeader("7.3 Use IP Whitelisting");
    addWrappedText("For production environments, configure IP whitelisting to restrict API access to known IP addresses only.");
    yPosition += 5;
    
    addSubHeader("7.4 Monitor Usage");
    addWrappedText("Regularly check your API usage to stay within limits and optimize your integration.");

    // ========== SUPPORT ==========
    addSectionHeader("8. SUPPORT & CONTACT");
    
    yPosition += 5;
    addText("Email: sales@revwinner.com", 10, true);
    yPosition += 3;
    addText("Documentation: https://docs.revwinner.com", 10);
    yPosition += 3;
    addText("Status Page: https://status.revwinner.com", 10);
    yPosition += 8;
    
    addText("Phone Support:", 10, true);
    addBullet("India: +91 8130276382");
    addBullet("USA: +1 832 632 8555");
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    doc.text("© 2025 Rev Winner. All rights reserved.", pageWidth / 2, yPosition, { align: "center" });

    // Generate PDF
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=RevWinner_API_Documentation_v1.0.pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error("Error generating API documentation PDF:", error);
    res.status(500).json({ error: "Failed to generate API documentation" });
  }
});

export default router;
