import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import revWinnerLogoUrl from '@assets/rev-winner-logo.png';
import pdfBannerUrl from '@assets/IMG_20251213_202308_1765637622298.jpg';


// Rev Winner Brand Colors
const BRAND_COLORS = {
  primary: { r: 139, g: 92, b: 246 },      // Purple #8B5CF6
  secondary: { r: 236, g: 72, b: 153 },    // Pink #EC4899
  dark: { r: 30, g: 30, b: 46 },           // Dark navy
  text: { r: 60, g: 60, b: 60 },           // Dark gray
  lightText: { r: 100, g: 100, b: 100 },   // Light gray
  accent: { r: 168, g: 85, b: 247 },       // Light purple
  white: { r: 255, g: 255, b: 255 }
};

// Contact Information
const CONTACT_INFO = {
  website: 'https://revwinner.com',
  email: 'sales@revwinner.com',
  phoneIndia: '+91 8130276382',
  phoneUSA: '+1 832 632 8555'
};

// Image data with dimensions for proper aspect ratio
interface ImageData {
  base64: string;
  width: number;
  height: number;
  aspectRatio: number;
}

// Helper function to load image as base64 with dimensions
async function loadImageAsBase64(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({
          base64: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

// Helper function to add header with logo and branding
function addHeader(doc: jsPDF, pageWidth: number, title: string, subtitle: string, logoData?: ImageData) {
  // Draw gradient-like header bar
  doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Add subtle gradient effect with overlapping rectangles
  doc.setFillColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
  doc.setGState(doc.GState({ opacity: 0.3 }));
  doc.rect(pageWidth * 0.5, 0, pageWidth * 0.5, 45, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));
  
  // Add logo image if available - maintain original aspect ratio
  let logoEndX = 20;
  if (logoData) {
    try {
      // Calculate logo dimensions preserving aspect ratio
      // Set height to fit in header (28mm max) and calculate width from aspect ratio
      const logoHeight = 28;
      const logoWidth = logoHeight * logoData.aspectRatio;
      const logoX = 12;
      const logoY = 8;
      
      doc.addImage(logoData.base64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      logoEndX = logoX + logoWidth + 5;
    } catch (e) {
      // Fallback to text if image fails
      console.warn('Logo image failed to load, using text fallback');
    }
  }
  
  // Logo text (positioned after image)
  const textStartX = logoData ? logoEndX : 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(BRAND_COLORS.white.r, BRAND_COLORS.white.g, BRAND_COLORS.white.b);
  doc.text('Rev Winner', textStartX, 20);
  
  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('AI-Powered Sales Assistant', textStartX, 29);
  
  // Document title on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, pageWidth - 20, 20, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, pageWidth - 20, 29, { align: 'right' });
  
  return 55; // Return starting Y position after header
}

// Helper function to add banner header using the Rev Winner banner image
function addBannerHeader(doc: jsPDF, pageWidth: number, bannerData?: ImageData): number {
  if (bannerData) {
    try {
      // Calculate banner dimensions to fit full page width
      const bannerWidth = pageWidth;
      const bannerHeight = bannerWidth / bannerData.aspectRatio;
      
      // Add banner image at top of page
      doc.addImage(bannerData.base64, 'JPEG', 0, 0, bannerWidth, bannerHeight);
      
      return bannerHeight + 8; // Return starting Y position after banner with some padding
    } catch (e) {
      console.warn('Banner image failed to load, using fallback header');
    }
  }
  
  // Fallback: draw simple purple header bar if banner fails
  doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(BRAND_COLORS.white.r, BRAND_COLORS.white.g, BRAND_COLORS.white.b);
  doc.text('Rev Winner', pageWidth / 2, 22, { align: 'center' });
  
  return 45; // Return starting Y position after fallback header
}

// Helper function to add footer with contact info
function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  const footerY = pageHeight - 15;
  
  // Footer line
  doc.setDrawColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  // Contact info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(BRAND_COLORS.lightText.r, BRAND_COLORS.lightText.g, BRAND_COLORS.lightText.b);
  
  // Left side - website and email
  doc.text(`${CONTACT_INFO.website}  |  ${CONTACT_INFO.email}`, 20, footerY);
  
  // Center - page number
  doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
  
  // Right side - phone numbers
  doc.setTextColor(BRAND_COLORS.lightText.r, BRAND_COLORS.lightText.g, BRAND_COLORS.lightText.b);
  doc.text(`India: ${CONTACT_INFO.phoneIndia}  |  USA: ${CONTACT_INFO.phoneUSA}`, pageWidth - 20, footerY, { align: 'right' });
}

// Helper function to add section header with decorative element
function addSectionHeader(doc: jsPDF, title: string, x: number, y: number, contentWidth: number): number {
  // Draw accent line
  doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.rect(x, y - 1, 4, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.text(title, x + 8, y + 5);
  
  return y + 12;
}

// Helper function to draw a feature box
function addFeatureBox(doc: jsPDF, x: number, y: number, width: number, height: number) {
  // Light purple background
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');
  
  // Left accent bar
  doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.rect(x, y, 3, height, 'F');
}

export async function exportDocumentationToPDF() {
  // Load banner image for professional header
  let bannerData: ImageData | undefined;
  try {
    bannerData = await loadImageAsBase64(pdfBannerUrl);
  } catch (e) {
    console.warn('Could not load banner image');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = addBannerHeader(doc, pageWidth, bannerData);

  const addNewPage = () => {
    doc.addPage();
    yPosition = addBannerHeader(doc, pageWidth, bannerData);
  };

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 25) {
      addNewPage();
    }
  };

  // Introduction
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
  const introText = 'This comprehensive guide covers all Rev Winner features to help you close more deals with AI-powered sales intelligence.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, yPosition);
  yPosition += introLines.length * 5 + 10;

  const features = [
    {
      title: '1. Domain Expertise',
      description: 'Train AI on your specific product knowledge, case studies, and documentation.',
      benefits: [
        'Accurate AI responses grounded in your actual product information',
        'Domain-specific focus avoiding generic responses',
        'Customizable for different products or market segments',
        'Build comprehensive knowledge repository'
      ],
      usage: 'Navigate to Train Me -> Create Domain -> Upload documents/URLs -> Select domain before calls'
    },
    {
      title: '2. Live Transcripts',
      description: 'Real-time speech-to-text conversion with speaker identification and timestamps.',
      benefits: [
        'Focus on conversation without manual note-taking',
        'Accurate record of every word spoken',
        'Context preservation for later review',
        'Foundation for all AI analysis features'
      ],
      usage: 'Sales Assistant -> Start Recording -> Speak naturally -> AI captures everything'
    },
    {
      title: '3. Shift Gears',
      description: 'Real-time sales coach providing instant strategic guidance during live conversations.',
      benefits: [
        'Real-time coaching while conversation happens',
        'AI-powered insights into best next moves',
        'Objection handling suggestions',
        'Closure-focused recommendations'
      ],
      usage: 'Automatically appears during calls -> Review tips -> Use Query Pitch Generator for quick responses'
    },
    {
      title: '4. Conversation Analysis',
      description: 'Comprehensive AI analysis delivering insights into pain points, requirements, and BANT qualification.',
      benefits: [
        'Deep understanding of prospect needs',
        'BANT qualification clarity',
        '5-10 strategic discovery questions',
        'Product/service recommendations'
      ],
      usage: 'Click "Analyze Conversation" -> Review insights -> Use discovery questions -> Regenerate as needed'
    },
    {
      title: '5. Sales Assistant Q&A',
      description: 'Always-available AI companion for instant answers during sales calls.',
      benefits: [
        'Instant answers without leaving call',
        'Expert-level responses from training materials',
        'Objection handling in real-time',
        'Product details on-demand'
      ],
      usage: 'Type question during call -> Get instant AI response -> Use guidance in conversation'
    },
    {
      title: '6. Present to Win',
      description: 'AI-powered sales collateral generator creating Pitch Deck, Case Study, and Battle Card.',
      benefits: [
        'Personalized materials for each prospect',
        'Generate in seconds vs hours manually',
        'Conversation-driven content',
        'Professional quality every time'
      ],
      usage: 'Select tab -> Generate content -> Review -> Regenerate as conversation evolves -> Share with prospect'
    },
    {
      title: '7. Product/Service Reference',
      description: 'Searchable catalog of products and services with AI-recommended highlighting.',
      benefits: [
        'Quick access to any product in seconds',
        'AI guidance on best-fit solutions',
        'Professional reference of exact names/codes',
        'Discover cross-selling opportunities'
      ],
      usage: 'Search by name/code/description -> Review highlighted AI recommendations -> Reference during calls'
    },
    {
      title: '8. Product/Service Recommendation',
      description: 'Intelligent AI matching engine suggesting relevant products based on conversation.',
      benefits: [
        'Perfect product-to-need matching',
        'Data-driven recommendations',
        'Relevant case study suggestions',
        'Instant vs manual catalog search'
      ],
      usage: 'Conversation triggers automatic analysis -> AI recommends after 4+ messages -> Review in multiple panels'
    },
    {
      title: '9. Meeting Minutes',
      description: 'AI-generated comprehensive meeting documentation with professional PDF export.',
      benefits: [
        'No manual note-taking required',
        'Professional structured format',
        'Stakeholder-ready documentation',
        'Complete record for compliance'
      ],
      usage: 'After call -> Generate Minutes -> Review -> Export PDF -> Send to prospect/team'
    }
  ];

  features.forEach((feature, index) => {
    checkPageBreak(55);

    // Feature box background
    const boxHeight = 48;
    addFeatureBox(doc, margin, yPosition - 2, contentWidth, boxHeight);

    // Feature title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.text(feature.title, margin + 8, yPosition + 5);
    yPosition += 10;

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    const descLines = doc.splitTextToSize(feature.description, contentWidth - 12);
    doc.text(descLines, margin + 8, yPosition);
    yPosition += descLines.length * 4 + 4;

    // Key Benefits label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.accent.r, BRAND_COLORS.accent.g, BRAND_COLORS.accent.b);
    doc.text('KEY BENEFITS:', margin + 8, yPosition);
    yPosition += 4;

    // Benefits (inline format to save space)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    feature.benefits.forEach((benefit, i) => {
      const bulletText = `  * ${benefit}`;
      const benefitLines = doc.splitTextToSize(bulletText, contentWidth - 15);
      doc.text(benefitLines, margin + 8, yPosition);
      yPosition += benefitLines.length * 3.5;
    });
    yPosition += 2;

    // Quick Usage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
    doc.text('HOW TO USE:', margin + 8, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    const usageText = `  ${feature.usage}`;
    doc.text(usageText, margin + 28, yPosition);
    
    yPosition += 12;
  });

  // Feature Integration Workflow Section
  addNewPage();
  yPosition = addSectionHeader(doc, 'Feature Integration Workflow', margin, yPosition, contentWidth);
  yPosition += 5;

  const workflow = [
    '1. Domain Expertise - Trains AI on your products',
    '2. Live Transcripts - Captures conversation',
    '3. Shift Gears & Sales Q&A - Real-time assistance',
    '4. Conversation Analysis - Extracts insights',
    '5. Product Recommendations - Suggests solutions',
    '6. Present to Win - Creates sales materials',
    '7. Meeting Minutes - Documents everything'
  ];

  // Draw workflow box
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, yPosition - 2, contentWidth, workflow.length * 6 + 8, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
  workflow.forEach((step, i) => {
    doc.text(step, margin + 8, yPosition + 4 + (i * 6));
  });

  // Add page numbers and footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  doc.save('Rev_Winner_Complete_Guide.pdf');
}

export async function exportQuickReferenceToPDF() {
  // Load banner image for professional header
  let bannerData: ImageData | undefined;
  try {
    bannerData = await loadImageAsBase64(pdfBannerUrl);
  } catch (e) {
    console.warn('Could not load banner image');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = addBannerHeader(doc, pageWidth, bannerData);

  const addNewPage = () => {
    doc.addPage();
    yPosition = addBannerHeader(doc, pageWidth, bannerData);
  };

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 25) {
      addNewPage();
    }
  };

  const features = [
    {
      num: '01',
      name: 'Domain Expertise',
      what: 'Train AI on your product knowledge',
      how: 'Train Me > Create Domain > Upload docs',
      tip: 'Set once, use forever'
    },
    {
      num: '02',
      name: 'Live Transcripts',
      what: 'Real-time speech-to-text',
      how: 'Start Recording > Speak naturally',
      tip: 'Auto-scrolls, no manual notes'
    },
    {
      num: '03',
      name: 'Shift Gears',
      what: 'Real-time sales coaching',
      how: 'Auto-appears during calls',
      tip: 'Always keep visible'
    },
    {
      num: '04',
      name: 'Conversation Analysis',
      what: 'Deep AI analysis (on-demand)',
      how: 'Click Analyze button',
      tip: 'Regenerate as call evolves'
    },
    {
      num: '05',
      name: 'Sales Assistant Q&A',
      what: 'Ask AI anything during calls',
      how: 'Type question > Instant answer',
      tip: 'No stupid questions'
    },
    {
      num: '06',
      name: 'Present to Win',
      what: 'Generate Pitch/Case Study/Battle Card',
      how: 'Click tab > Generate',
      tip: 'Regenerate each independently'
    },
    {
      num: '07',
      name: 'Product Reference',
      what: 'Searchable product catalog',
      how: 'Search by name/code',
      tip: 'AI highlights recommendations'
    },
    {
      num: '08',
      name: 'Product Recommendations',
      what: 'AI auto-suggests best products',
      how: 'AI analyzes conversation',
      tip: 'Gold border = recommended'
    },
    {
      num: '09',
      name: 'Meeting Minutes',
      what: 'Auto-generate meeting notes',
      how: 'Generate > Export PDF',
      tip: 'Send within 24 hours'
    }
  ];

  features.forEach((feature, index) => {
    checkPageBreak(28);

    // Feature row with number badge
    // Number badge
    doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.circle(margin + 6, yPosition + 4, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.white.r, BRAND_COLORS.white.g, BRAND_COLORS.white.b);
    doc.text(feature.num, margin + 6, yPosition + 5.5, { align: 'center' });

    // Feature name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.text(feature.name, margin + 16, yPosition + 5);
    yPosition += 10;

    // What/How/Tip in a compact format
    doc.setFontSize(8);
    
    // What
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_COLORS.accent.r, BRAND_COLORS.accent.g, BRAND_COLORS.accent.b);
    doc.text('WHAT:', margin + 16, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    doc.text(feature.what, margin + 32, yPosition);
    yPosition += 4;

    // How
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
    doc.text('HOW:', margin + 16, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    doc.text(feature.how, margin + 30, yPosition);
    yPosition += 4;

    // Tip
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(BRAND_COLORS.lightText.r, BRAND_COLORS.lightText.g, BRAND_COLORS.lightText.b);
    doc.text(`TIP: ${feature.tip}`, margin + 16, yPosition);
    yPosition += 6;

    // Separator line
    if (index < features.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(margin + 16, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
    }
  });

  // Typical Call Flow Section
  checkPageBreak(55);
  yPosition += 8;
  yPosition = addSectionHeader(doc, 'Typical Call Flow', margin, yPosition, contentWidth);
  yPosition += 3;

  const callFlow = [
    { phase: 'BEFORE', action: 'Set Domain Expertise' },
    { phase: 'START', action: 'Enable Live Transcripts' },
    { phase: 'DURING', action: 'Check Shift Gears + Use Q&A' },
    { phase: 'MID-CALL', action: 'Generate Conversation Analysis' },
    { phase: 'LATE', action: 'Review Recommendations + Present to Win' },
    { phase: 'POST-CALL', action: 'Generate Minutes > Export PDF' }
  ];

  // Draw call flow box
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(margin, yPosition - 2, contentWidth, callFlow.length * 7 + 6, 3, 3, 'F');

  callFlow.forEach((step, i) => {
    // Phase badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.text(step.phase, margin + 5, yPosition + 3 + (i * 7));
    
    // Arrow
    doc.setTextColor(BRAND_COLORS.lightText.r, BRAND_COLORS.lightText.g, BRAND_COLORS.lightText.b);
    doc.text('>', margin + 35, yPosition + 3 + (i * 7));
    
    // Action
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    doc.text(step.action, margin + 40, yPosition + 3 + (i * 7));
  });

  yPosition += callFlow.length * 7 + 12;

  // Power User Tips Section
  checkPageBreak(50);
  yPosition = addSectionHeader(doc, 'Power User Tips', margin, yPosition, contentWidth);
  yPosition += 3;

  const tips = [
    'Set Domain First before any calls',
    'Keep Shift Gears visible during calls',
    'Regenerate Analysis as conversation evolves',
    'Use Q&A liberally - ask anything',
    'Export Minutes immediately post-call',
    'Trust AI recommendations (gold borders)',
    'Send PDFs within 24 hours',
    'Copy Query Pitch one-liners'
  ];

  // Tips in two columns
  const colWidth = (contentWidth - 10) / 2;
  const leftCol = tips.slice(0, 4);
  const rightCol = tips.slice(4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);

  leftCol.forEach((tip, i) => {
    doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.circle(margin + 3, yPosition + 2 + (i * 6), 1.5, 'F');
    doc.text(tip, margin + 8, yPosition + 3 + (i * 6));
  });

  rightCol.forEach((tip, i) => {
    doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.circle(margin + colWidth + 8, yPosition + 2 + (i * 6), 1.5, 'F');
    doc.text(tip, margin + colWidth + 13, yPosition + 3 + (i * 6));
  });

  // Add page numbers and footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  doc.save('Rev_Winner_Quick_Reference.pdf');
}


// Helper function to capture DOM element as image
async function captureElementAsImage(element: HTMLElement): Promise<ImageData | null> {
  try {
    // Temporarily remove any scrollbars and set fixed dimensions
    const originalOverflow = element.style.overflow;
    const originalHeight = element.style.height;
    const originalMaxHeight = element.style.maxHeight;
    
    element.style.overflow = 'visible';
    element.style.height = 'auto';
    element.style.maxHeight = 'none';
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    // Restore original styles
    element.style.overflow = originalOverflow;
    element.style.height = originalHeight;
    element.style.maxHeight = originalMaxHeight;
    
    return {
      base64: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      aspectRatio: canvas.width / canvas.height
    };
  } catch (error) {
    console.error('Failed to capture element as image:', error);
    return null;
  }
}

// Export Present to Win content with UI screenshots
export async function exportPresentToWinToPDF(
  contentType: 'pitch-deck' | 'case-study' | 'battle-card',
  domainExpertise: string
) {
  // Find the Present to Win content container
  const contentElement = document.querySelector('[data-testid^="slide-"]') as HTMLElement;
  
  if (!contentElement) {
    throw new Error('Content not found. Please ensure the content is visible before exporting.');
  }

  // Load banner image
  let bannerData: ImageData | undefined;
  try {
    bannerData = await loadImageAsBase64(pdfBannerUrl);
  } catch (e) {
    console.warn('Could not load banner image');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Add header
  let yPosition = addBannerHeader(doc, pageWidth, bannerData);

  // Add title
  const titles = {
    'pitch-deck': 'Pitch Deck',
    'case-study': 'Case Study',
    'battle-card': 'Battle Card'
  };
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.text(`${domainExpertise} - ${titles[contentType]}`, margin, yPosition);
  yPosition += 10;

  // Capture the UI as image
  const contentImage = await captureElementAsImage(contentElement);
  
  if (contentImage) {
    // Calculate dimensions to fit page width
    const imageWidth = contentWidth;
    const imageHeight = imageWidth / contentImage.aspectRatio;
    
    // Available height on first page
    const availableHeight = pageHeight - yPosition - 20; // Leave space for footer
    
    if (imageHeight <= availableHeight) {
      // Image fits on one page
      doc.addImage(
        contentImage.base64,
        'PNG',
        margin,
        yPosition,
        imageWidth,
        imageHeight,
        undefined,
        'FAST'
      );
    } else {
      // Image needs multiple pages - split it
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = contentImage.base64;
      });
      
      // Calculate how many pixels per mm
      const pixelsPerMm = contentImage.width / imageWidth;
      let remainingPixels = contentImage.height;
      let sourceY = 0;
      let currentPage = 1;
      
      while (remainingPixels > 0) {
        const availableHeightMm = currentPage === 1 ? availableHeight : (pageHeight - 35); // Less space on first page
        const heightPixels = Math.min(remainingPixels, availableHeightMm * pixelsPerMm);
        const heightMm = heightPixels / pixelsPerMm;
        
        // Create a canvas slice
        canvas.width = contentImage.width;
        canvas.height = heightPixels;
        
        if (ctx) {
          ctx.drawImage(img, 0, sourceY, contentImage.width, heightPixels, 0, 0, contentImage.width, heightPixels);
          const sliceDataUrl = canvas.toDataURL('image/png');
          
          const yPos = currentPage === 1 ? yPosition : 25;
          doc.addImage(sliceDataUrl, 'PNG', margin, yPos, imageWidth, heightMm, undefined, 'FAST');
        }
        
        remainingPixels -= heightPixels;
        sourceY += heightPixels;
        
        if (remainingPixels > 0) {
          doc.addPage();
          yPosition = addBannerHeader(doc, pageWidth, bannerData);
          currentPage++;
        }
      }
    }
  } else {
    // Fallback: show error message
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    doc.text('Failed to capture content. Please try again.', margin, yPosition);
  }

  // Update page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  // Save the PDF
  const fileName = `${domainExpertise.replace(/[^a-z0-9]/gi, '_')}_${contentType.replace('-', '_')}.pdf`;
  doc.save(fileName);
}

// Export Pitch Deck to PDF
export async function exportPitchDeckToPDF(pitchData: any, domainExpertise: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Load logo
  let logoData: ImageData | undefined;
  try {
    logoData = await loadImageAsBase64(revWinnerLogoUrl);
  } catch (e) {
    console.warn('Failed to load logo for pitch deck PDF');
  }
  
  const slides = pitchData.slides || [];
  
  // Generate each slide as a page
  slides.forEach((slide: any, index: number) => {
    if (index > 0) {
      doc.addPage();
    }
    
    // Add header
    addHeader(doc, pageWidth, `${domainExpertise} - Pitch Deck`, `Slide ${index + 1}: ${slide.title}`, logoData);
    
    let yPosition = 55;
    
    // Slide title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.text(slide.title, 20, yPosition);
    yPosition += 12;
    
    // Highlight (if present)
    if (slide.highlight) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
      doc.text(`>> ${slide.highlight}`, 20, yPosition);
      yPosition += 10;
    }
    
    // Content points
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    
    if (slide.content && Array.isArray(slide.content)) {
      slide.content.forEach((point: string) => {
        const lines = doc.splitTextToSize(`• ${point}`, pageWidth - 40);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            addHeader(doc, pageWidth, `${domainExpertise} - Pitch Deck`, `Slide ${index + 1}: ${slide.title} (continued)`, logoData);
            yPosition = 55;
          }
          doc.text(line, 25, yPosition);
          yPosition += 7;
        });
        yPosition += 3;
      });
    }
    
    // Add footer
    addFooter(doc, pageWidth, pageHeight, index + 1, slides.length);
  });
  
  // Save the PDF
  const fileName = `${domainExpertise.replace(/[^a-z0-9]/gi, '_')}_Pitch_Deck.pdf`;
  doc.save(fileName);
}

// Export Battle Card to PDF
export async function exportBattleCardToPDF(battleData: any, domainExpertise: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Load logo
  let logoData: ImageData | undefined;
  try {
    logoData = await loadImageAsBase64(revWinnerLogoUrl);
  } catch (e) {
    console.warn('Failed to load logo for battle card PDF');
  }
  
  // Add header
  addHeader(doc, pageWidth, `${domainExpertise} - Battle Card`, 'Competitive Analysis', logoData);
  
  let yPosition = 55;
  
  // Your Product vs Competitors
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.text(`${battleData.yourProduct} vs Competition`, 20, yPosition);
  yPosition += 10;
  
  // Technical Advantages
  if (battleData.technicalAdvantages && battleData.technicalAdvantages.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
    doc.text('>> Technical Edge', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    
    battleData.technicalAdvantages.forEach((adv: string) => {
      const lines = doc.splitTextToSize(`+ ${adv}`, pageWidth - 40);
      lines.forEach((line: string) => {
        doc.text(line, 25, yPosition);
        yPosition += 6;
      });
    });
    yPosition += 5;
  }
  
  // Feature Comparison Table
  if (battleData.slides && battleData.slides.length > 0 && battleData.slides[0].comparison) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.text('Feature Comparison', 20, yPosition);
    yPosition += 8;
    
    // Table headers
    const colWidth = (pageWidth - 40) / 3;
    doc.setFillColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Feature', 22, yPosition);
    doc.text(battleData.yourProduct, 22 + colWidth, yPosition);
    doc.text(battleData.competitor1 || 'Competitor', 22 + colWidth * 2, yPosition);
    yPosition += 10;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    
    battleData.slides[0].comparison.forEach((row: any, index: number) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        addHeader(doc, pageWidth, `${domainExpertise} - Battle Card`, 'Competitive Analysis (continued)', logoData);
        yPosition = 55;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
      }
      
      doc.text(row.feature, 22, yPosition);
      doc.text(String(row.yourProduct === true ? 'YES' : row.yourProduct === false ? 'NO' : row.yourProduct), 22 + colWidth, yPosition);
      doc.text(String(row.competitor1 === true ? 'YES' : row.competitor1 === false ? 'NO' : row.competitor1 || '-'), 22 + colWidth * 2, yPosition);
      yPosition += 8;
    });
    yPosition += 5;
  }
  
  // Why Choose Us
  if (battleData.whyChooseUs) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      addHeader(doc, pageWidth, `${domainExpertise} - Battle Card`, 'Competitive Analysis (continued)', logoData);
      yPosition = 55;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
    doc.text('Why Choose Us', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
    const lines = doc.splitTextToSize(battleData.whyChooseUs, pageWidth - 40);
    lines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
  }
  
  // Add footer
  addFooter(doc, pageWidth, pageHeight, 1, 1);
  
  // Save the PDF
  const fileName = `${domainExpertise.replace(/[^a-z0-9]/gi, '_')}_Battle_Card.pdf`;
  doc.save(fileName);
}

// Export Case Study to PDF
export async function exportCaseStudyToPDF(caseData: any, domainExpertise: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Load logo
  let logoData: ImageData | undefined;
  try {
    logoData = await loadImageAsBase64(revWinnerLogoUrl);
  } catch (e) {
    console.warn('Failed to load logo for case study PDF');
  }
  
  // Add header
  addHeader(doc, pageWidth, `${domainExpertise} - Case Study`, caseData.title || 'Customer Success Story', logoData);
  
  let yPosition = 55;
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  const titleLines = doc.splitTextToSize(caseData.title, pageWidth - 40);
  titleLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 8;
  });
  yPosition += 5;
  
  // Customer & Industry
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
  doc.text(`Customer: ${caseData.customer}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Industry: ${caseData.industry}`, 20, yPosition);
  yPosition += 10;
  
  // Challenge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.text('The Challenge', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
  const challengeLines = doc.splitTextToSize(caseData.challenge, pageWidth - 40);
  challengeLines.forEach((line: string) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      addHeader(doc, pageWidth, `${domainExpertise} - Case Study`, 'Customer Success Story (continued)', logoData);
      yPosition = 55;
    }
    doc.text(line, 20, yPosition);
    yPosition += 6;
  });
  yPosition += 8;
  
  // Solution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
  doc.text('The Solution', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
  const solutionLines = doc.splitTextToSize(caseData.solution, pageWidth - 40);
  solutionLines.forEach((line: string) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      addHeader(doc, pageWidth, `${domainExpertise} - Case Study`, 'Customer Success Story (continued)', logoData);
      yPosition = 55;
    }
    doc.text(line, 20, yPosition);
    yPosition += 6;
  });
  yPosition += 8;
  
  // Outcomes
  if (caseData.outcomes && caseData.outcomes.length > 0) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      addHeader(doc, pageWidth, `${domainExpertise} - Case Study`, 'Customer Success Story (continued)', logoData);
      yPosition = 55;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.primary.r, BRAND_COLORS.primary.g, BRAND_COLORS.primary.b);
    doc.text('Results Achieved', 20, yPosition);
    yPosition += 8;
    
    caseData.outcomes.forEach((outcome: any) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(BRAND_COLORS.secondary.r, BRAND_COLORS.secondary.g, BRAND_COLORS.secondary.b);
      doc.text(`${outcome.value}`, 25, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(BRAND_COLORS.text.r, BRAND_COLORS.text.g, BRAND_COLORS.text.b);
      doc.text(outcome.metric, 25, yPosition);
      yPosition += 8;
    });
  }
  
  // Verification label
  if (caseData.verificationLabel) {
    yPosition += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.lightText.r, BRAND_COLORS.lightText.g, BRAND_COLORS.lightText.b);
    doc.text(caseData.verificationLabel, 20, yPosition);
  }
  
  // Add footer
  addFooter(doc, pageWidth, pageHeight, 1, 1);
  
  // Save the PDF
  const fileName = `${domainExpertise.replace(/[^a-z0-9]/gi, '_')}_Case_Study.pdf`;
  doc.save(fileName);
}
