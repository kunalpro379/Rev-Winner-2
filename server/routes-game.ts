import type { Express, Request, Response } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import OpenAI from "openai";

const GMAIL_USER = process.env.GMAIL_USER || 'revwinner2025@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Create Gmail SMTP transporter for game emails
let gameEmailTransporter: nodemailer.Transporter | null = null;

if (GMAIL_APP_PASSWORD) {
  gameEmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
  console.log('📧 Game email transporter configured with:', GMAIL_USER);
} else {
  console.warn('⚠️ GMAIL_APP_PASSWORD not set - game emails will be logged to console only');
}

const generateQuestionsSchema = z.object({
  company: z.string().min(1, "Company name is required"),
});

const submitLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().positive(),
});

const demoRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().positive(),
});

const doorsLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Valid email is required"),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().positive(),
});

function getDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DeepSeek API key not configured");
  }
  return new OpenAI({ 
    apiKey,
    baseURL: "https://api.deepseek.com/v1"
  });
}

interface QuestionWithOptions {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

function shuffleOptions(question: QuestionWithOptions): QuestionWithOptions {
  const indices = [0, 1, 2, 3];
  
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const shuffledOptions = indices.map(i => question.options[i]);
  const newCorrectIndex = indices.indexOf(question.correctIndex);
  
  return {
    ...question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
  };
}

async function generateQuestionsWithAI(company: string): Promise<QuestionWithOptions[]> {
  const prompt = `You are a technical product expert creating a challenging sales certification exam for "${company}".

YOUR TASK: Generate 10 highly technical, domain-specific multiple-choice questions that test deep knowledge of ${company}'s products, platform, architecture, and industry terminology.

CRITICAL REQUIREMENTS:
1. Questions MUST be technical and specific to ${company}'s actual products/services
2. Test knowledge of: platform architecture, APIs, technical features, implementation concepts, industry standards, key terminology, integration patterns, and best practices
3. Each question should require genuine expertise to answer correctly
4. Wrong answers must be plausible technical alternatives that someone unfamiliar would find tempting

EXEMPLAR QUESTIONS (for ServiceNow - use this style and depth for ${company}):

Q1: What is a ServiceNow "Table"?
A. A logical data structure that stores records [CORRECT]
B. A UI component for dashboards
C. A workflow execution engine
D. A virtual machine instance

Q2: Which module controls user access in ServiceNow?
A. Access Control Lists (ACLs) [CORRECT]
B. Event Registry
C. Script Includes
D. MID Server

Q3: What is a "Business Rule" in ServiceNow?
A. A client-side script for UI interactions
B. A rule that executes on server-side based on database operations [CORRECT]
C. A reporting permission
D. A workflow task

Q4: What does ITSM stand for?
A. Information Technology Service Management [CORRECT]
B. Integrated Task and Service Module
C. IT System Monitoring
D. Internal Technology Support Model

Q5: What is GlideRecord used for?
A. Rendering dashboards
B. Managing email notifications
C. Querying and manipulating database records programmatically [CORRECT]
D. Creating MID Servers

Q6: Which component manages integrations?
A. Flow Designer
B. IntegrationHub (IHUB) [CORRECT]
C. MetricBase
D. Knowledge Base

Q7: What is the purpose of the CMDB?
A. Storing customer emails
B. Managing user access
C. Storing configuration items and relationships between IT assets and services [CORRECT]
D. Logging security alerts

Q8: What does the Now Platform primarily provide?
A. ERP system for finance
B. Low-code application development and workflow automation capabilities [CORRECT]
C. Cloud hosting service
D. Email campaign management

Q9: Which scripting language does ServiceNow primarily use?
A. Python
B. Java
C. JavaScript [CORRECT]
D. PHP

Q10: What is an Update Set used for?
A. Migrating configuration changes between instances (Dev → Test → Prod) [CORRECT]
B. Encrypting database records
C. Upgrading to new platform versions
D. Managing licenses

NOW CREATE 10 SIMILAR QUESTIONS FOR ${company.toUpperCase()}:
- Research what ${company} does (SaaS platform, enterprise software, cloud services, etc.)
- Create questions about their SPECIFIC products, features, APIs, architecture
- Use their actual product terminology and technical concepts
- Include questions about deployment models, integrations, pricing tiers, key differentiators
- Make distractors sound like legitimate technical alternatives

Return ONLY a valid JSON array:
[
  {
    "id": 1,
    "question": "Technical question about ${company}?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0
  }
]

VARY correctIndex randomly (0-3) across questions. Generate exactly 10 challenging, technical questions.`;

  try {
    const client = getDeepSeekClient();
    
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "You are a technical product certification expert. Generate highly accurate, domain-specific exam questions that test real knowledge of enterprise software products. Always research the company thoroughly and use their actual product terminology."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions)) {
        const validQuestions = questions.filter((q): q is QuestionWithOptions => 
          q &&
          typeof q.question === 'string' && 
          q.question.length > 0 &&
          Array.isArray(q.options) && 
          q.options.length === 4 &&
          q.options.every((opt: unknown) => typeof opt === 'string' && (opt as string).length > 0) &&
          typeof q.correctIndex === 'number' && 
          q.correctIndex >= 0 && 
          q.correctIndex <= 3
        );
        
        if (validQuestions.length >= 10) {
          return validQuestions.slice(0, 10).map((q, idx) => 
            shuffleOptions({
              id: idx + 1,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
            })
          );
        }
      }
    }
    console.log("AI response did not contain 10 valid questions, using fallback");
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Error generating questions with AI:", error);
    return getFallbackQuestions(company);
  }
}

function getFallbackQuestions(company: string): QuestionWithOptions[] {
  const baseQuestions: QuestionWithOptions[] = [
    {
      id: 1,
      question: `When selling ${company}'s solutions, what's the most effective way to handle the objection "We already have a vendor for this"?`,
      options: [
        "Immediately offer a lower price to compete",
        "Ask about their current experience and identify gaps your solution addresses",
        "Tell them their current vendor is inferior",
        "Accept the objection and move on to the next prospect"
      ],
      correctIndex: 1
    },
    {
      id: 2,
      question: `What's the best discovery question to uncover ${company}'s potential customer's budget constraints?`,
      options: [
        "What's your budget for this project?",
        "Can you afford our premium tier?",
        "How are you currently allocating resources for this initiative, and what ROI would justify expanding that investment?",
        "Do you have money to spend right now?"
      ],
      correctIndex: 2
    },
    {
      id: 3,
      question: `In the ${company} industry, what typically drives purchase decisions at the executive level?`,
      options: [
        "The lowest price available in the market",
        "Strategic value, ROI, and alignment with business objectives",
        "The vendor with the most features",
        "Recommendations from junior staff only"
      ],
      correctIndex: 1
    },
    {
      id: 4,
      question: `When presenting ${company}'s value proposition, which approach is most effective?`,
      options: [
        "Start with pricing to filter out unqualified prospects",
        "Focus on technical specifications for 90% of the presentation",
        "Lead with customer success stories and quantified business outcomes",
        "Compare directly to competitors by name"
      ],
      correctIndex: 2
    },
    {
      id: 5,
      question: `What's the optimal timing to discuss pricing when selling ${company}'s solutions?`,
      options: [
        "At the very beginning of the first call",
        "After establishing value and understanding the prospect's specific needs",
        "Only when the customer brings it up",
        "Never - let the proposal speak for itself"
      ],
      correctIndex: 1
    },
    {
      id: 6,
      question: `How should a ${company} sales rep handle a prospect who says "Send me some information and I'll get back to you"?`,
      options: [
        "Send a generic brochure immediately",
        "Agree and send a long email with all product details",
        "Probe for specific interests and schedule a follow-up to discuss relevant materials",
        "Add them to the newsletter list and wait"
      ],
      correctIndex: 2
    },
    {
      id: 7,
      question: `What's the key to building long-term customer relationships in ${company}'s market segment?`,
      options: [
        "Offering the deepest discounts available",
        "Avoiding contact after the sale closes",
        "Providing ongoing value, proactive communication, and exceeding expectations",
        "Focusing only on upselling additional products"
      ],
      correctIndex: 2
    },
    {
      id: 8,
      question: `When a prospect at ${company}'s target customer says "I need to discuss this with my team," what's the best response?`,
      options: [
        "Pressure them to make an immediate decision",
        "Ask who else is involved and offer to present to the full buying committee",
        "Wait passively for them to call back",
        "Assume the deal is lost and move on"
      ],
      correctIndex: 1
    },
    {
      id: 9,
      question: `What's the most important metric for evaluating sales success in ${company}'s industry?`,
      options: [
        "Number of cold calls made per day",
        "Customer lifetime value and retention rate",
        "Volume of proposals sent",
        "Length of sales presentations"
      ],
      correctIndex: 1
    },
    {
      id: 10,
      question: `How should ${company} sales reps prepare for a discovery call with a new prospect?`,
      options: [
        "Wing it and let the conversation flow naturally",
        "Prepare a rigid script and stick to it word-for-word",
        "Research the prospect's business, prepare targeted questions, and identify potential pain points",
        "Focus only on what you want to sell them"
      ],
      correctIndex: 2
    }
  ];

  return baseQuestions.map(q => shuffleOptions(q));
}

async function sendLeadEmail(leadData: z.infer<typeof submitLeadSchema>): Promise<void> {
  const scoreEmoji = leadData.score >= 7 ? "🌟" : "📈";
  const performanceNote = leadData.score >= 7 
    ? "High performer - likely strong sales professional" 
    : "Opportunity for improvement - great candidate for Rev Winner";

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Rev Winner Sales Challenge</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #7c3aed;">🎮 New Lead from Sales Knowledge Challenge</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${leadData.name}</p>
          <p><strong>Company:</strong> ${leadData.company}</p>
          <p><strong>Email:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${leadData.phone}">${leadData.phone}</a></p>
        </div>
        
        <div style="background: #7c3aed; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${scoreEmoji} Game Results</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">Score: ${leadData.score}/${leadData.totalQuestions}</p>
          <p style="opacity: 0.9;">${performanceNote}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">This lead was generated from the Rev Winner Sales Knowledge Challenge game.</p>
      </div>
    </div>
  `;

  if (!gameEmailTransporter) {
    console.log('\n====== LEAD EMAIL (DEV MODE - NO SMTP) ======');
    console.log('To: sales@revwinner.com');
    console.log('From:', GMAIL_USER);
    console.log('Subject: 🎮 New Sales Game Lead:', leadData.name, 'from', leadData.company);
    console.log('Lead Data:', JSON.stringify(leadData, null, 2));
    console.log('==============================================\n');
    return;
  }

  const mailOptions = {
    from: `"Rev Winner Sales Challenge" <${GMAIL_USER}>`,
    to: 'sales@revwinner.com',
    subject: `🎮 New Sales Game Lead: ${leadData.name} from ${leadData.company}`,
    html: emailContent,
  };

  try {
    const info = await gameEmailTransporter.sendMail(mailOptions);
    console.log(`✅ Lead email sent for ${leadData.email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error sending lead email:", error);
    throw error;
  }
}

async function sendDoorsLeadEmail(leadData: z.infer<typeof doorsLeadSchema>): Promise<void> {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Rev Winner - Open the Doors</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #7c3aed;">🚪 New Lead from 'Open the Doors' Game</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${leadData.name}</p>
          <p><strong>Company:</strong> ${leadData.company}</p>
          <p><strong>Email:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></p>
        </div>
        
        <div style="background: #7c3aed; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">🎮 Game Started</h3>
          <p>This prospect started the 'Open the Doors of Opportunities' challenge.</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">This lead was generated from the Rev Winner 'Open the Doors' game.</p>
      </div>
    </div>
  `;

  if (!gameEmailTransporter) {
    console.log('\n====== DOORS LEAD EMAIL (DEV MODE - NO SMTP) ======');
    console.log('To: sales@revwinner.com');
    console.log('From:', GMAIL_USER);
    console.log('Subject: 🚪 Open the Doors Lead:', leadData.name, 'from', leadData.company);
    console.log('Lead Data:', JSON.stringify(leadData, null, 2));
    console.log('===================================================\n');
    return;
  }

  const mailOptions = {
    from: `"Rev Winner Open the Doors" <${GMAIL_USER}>`,
    to: 'sales@revwinner.com',
    subject: `🚪 Open the Doors Lead: ${leadData.name} from ${leadData.company}`,
    html: emailContent,
  };

  try {
    const info = await gameEmailTransporter.sendMail(mailOptions);
    console.log(`✅ Doors lead email sent for ${leadData.email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error sending doors lead email:", error);
    throw error;
  }
}

async function sendDemoRequestEmail(leadData: z.infer<typeof demoRequestSchema>): Promise<void> {
  const scoreEmoji = leadData.score >= 7 ? "🌟" : "📈";
  const percentage = Math.round((leadData.score / leadData.totalQuestions) * 100);
  const badge = percentage >= 90 ? "Sales Master" : percentage >= 70 ? "Sales Expert" : percentage >= 50 ? "Sales Professional" : "Sales Challenger";

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Rev Winner Demo Request</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #7c3aed;">📞 Demo Request from Sales Challenge Player</h2>
        
        <div style="background: #faf5ff; border: 2px solid #7c3aed; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">🔥 Hot Lead - Requested Demo!</h3>
          <p>This prospect completed the Sales Challenge and is interested in seeing Rev Winner in action.</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${leadData.name}</p>
          <p><strong>Company:</strong> ${leadData.company}</p>
          <p><strong>Email:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></p>
          ${leadData.phone ? `<p><strong>Phone:</strong> <a href="tel:${leadData.phone}">${leadData.phone}</a></p>` : ''}
        </div>
        
        <div style="background: #7c3aed; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${scoreEmoji} Challenge Performance</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">Score: ${leadData.score}/${leadData.totalQuestions} (${percentage}%)</p>
          <p style="font-size: 18px; margin: 5px 0;">Badge Earned: ${badge}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 10px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;"><strong>⚡ Action Required:</strong> Contact this prospect within 24 hours for best conversion.</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">This demo request was submitted from the Rev Winner Sales Knowledge Challenge game.</p>
      </div>
    </div>
  `;

  if (!gameEmailTransporter) {
    console.log('\n====== DEMO REQUEST EMAIL (DEV MODE - NO SMTP) ======');
    console.log('To: sales@revwinner.com');
    console.log('From:', GMAIL_USER);
    console.log('Subject: 📞 Demo Request:', leadData.name, 'from', leadData.company);
    console.log('Lead Data:', JSON.stringify(leadData, null, 2));
    console.log('====================================================\n');
    return;
  }

  const mailOptions = {
    from: `"Rev Winner Demo Request" <${GMAIL_USER}>`,
    to: 'sales@revwinner.com',
    subject: `📞 Demo Request: ${leadData.name} from ${leadData.company} - ${badge}`,
    html: emailContent,
  };

  try {
    const info = await gameEmailTransporter.sendMail(mailOptions);
    console.log(`✅ Demo request email sent for ${leadData.email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error sending demo request email:", error);
    throw error;
  }
}

export function setupGameRoutes(app: Express) {
  app.post("/api/game/generate-questions", async (req: Request, res: Response) => {
    try {
      const validation = generateQuestionsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      const { company } = validation.data;
      const questions = await generateQuestionsWithAI(company);

      res.json({
        success: true,
        questions,
      });
    } catch (error: any) {
      console.error("Error generating questions:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate questions",
      });
    }
  });

  app.post("/api/game/submit-lead", async (req: Request, res: Response) => {
    try {
      const validation = submitLeadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      await sendLeadEmail(validation.data);

      res.json({
        success: true,
        message: "Lead submitted successfully",
      });
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit lead",
      });
    }
  });

  app.post("/api/game/request-demo", async (req: Request, res: Response) => {
    try {
      const validation = demoRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      await sendDemoRequestEmail(validation.data);

      res.json({
        success: true,
        message: "Demo request submitted successfully",
      });
    } catch (error: any) {
      console.error("Error requesting demo:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit demo request",
      });
    }
  });

  app.post("/api/game/doors-lead", async (req: Request, res: Response) => {
    try {
      const validation = doorsLeadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      await sendDoorsLeadEmail(validation.data);

      res.json({
        success: true,
        message: "Lead submitted successfully",
      });
    } catch (error: any) {
      console.error("Error submitting doors lead:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit lead",
      });
    }
  });
}
