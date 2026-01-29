import { db } from "../db";
import { 
  conversationMinutesBackup,
  organizationMemberships,
  marketingUserSettings,
  marketingGeneratedContent,
  authUsers,
  type ConversationMinutesBackup
} from "@shared/schema";
import { eq, and, inArray, desc, like, sql } from "drizzle-orm";
import OpenAI from "openai";

// Super admin email with unrestricted access to all domain data
const MARKETING_SUPER_ADMIN_EMAIL = "urhead1508@gmail.com";

// Extract domain from email address
function getEmailDomain(email: string): string {
  const parts = email.toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

interface DiscoverQuery {
  queryType: "challenges" | "faqs" | "unique_queries" | "unanswered" | "custom";
  customQuestion?: string;
  organizationId?: string;
  companyName?: string;
  dataMode: "data_bank" | "universal";
  userEmail?: string; // For domain-based data filtering
}

interface DiscoverResponse {
  success: boolean;
  query: string;
  answer: string;
  insights: string[];
  supportingQuotes: string[];
  dataPoints: {
    conversationsAnalyzed: number;
    totalMessages: number;
    industries: string[];
    timeRange?: { earliest: Date; latest: Date };
  };
  error?: string;
}

interface PostGenerationRequest {
  userId: string;
  topic: string;
  length: "short" | "medium" | "long";
  tone: "professional" | "bold" | "thought-leadership" | "conversational" | "analytical";
  hashtagMode: "manual" | "auto" | "both";
  manualHashtags?: string[];
  includeContact: boolean;
  contactDetails?: { email?: string; phone?: string; website?: string };
  dataMode: "data_bank" | "universal";
  organizationId?: string;
  companyName?: string;
  userEmail?: string; // For domain-based data filtering
}

interface VideoScriptRequest {
  userId: string;
  topic: string;
  length: "short" | "medium" | "long";
  tone: "professional" | "bold" | "thought-leadership" | "conversational" | "analytical";
  hashtagMode: "manual" | "auto" | "both";
  manualHashtags?: string[];
  dataMode: "data_bank" | "universal";
  organizationId?: string;
  companyName?: string;
  userEmail?: string; // For domain-based data filtering
}

interface ResearchRequest {
  userId: string;
  topic: string;
  outputType: "research_paper" | "newsletter" | "blog" | "strategy";
  dataMode: "data_bank" | "universal";
  organizationId?: string;
  companyName?: string;
  userEmail?: string; // For domain-based data filtering
}

interface InfographicRequest {
  userId: string;
  topic: string;
  outputType: "infographic" | "chart" | "numbers" | "summary";
  dataMode: "data_bank" | "universal";
  organizationId?: string;
  companyName?: string;
  userEmail?: string; // For domain-based data filtering
}

interface GeneratedContent {
  success: boolean;
  content: string;
  hashtags?: string[];
  title?: string;
  metadata?: Record<string, any>;
  error?: string;
}

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

export class MarketingInsightsService {
  
  // Check if user is the marketing super admin with access to all domain data
  private isSuperAdmin(userEmail?: string): boolean {
    return userEmail?.toLowerCase() === MARKETING_SUPER_ADMIN_EMAIL.toLowerCase();
  }
  
  // Get backups filtered by email domain (or all for super admin)
  async getOrganizationBackups(organizationId?: string, companyName?: string, userEmail?: string): Promise<ConversationMinutesBackup[]> {
    
    // Super admin gets access to ALL backup data across all domains
    if (this.isSuperAdmin(userEmail)) {
      console.log(`🔓 Super admin access: Fetching all domain backups for ${userEmail}`);
      const allBackups = await db.select()
        .from(conversationMinutesBackup)
        .where(eq(conversationMinutesBackup.backupStatus, "completed"))
        .orderBy(desc(conversationMinutesBackup.createdAt))
        .limit(200);
      return allBackups;
    }
    
    // STRICT DOMAIN ISOLATION: When userEmail is provided, ONLY return domain-scoped data
    // No fallback to organization/company data to prevent data leaks
    if (userEmail) {
      const domain = getEmailDomain(userEmail);
      if (domain) {
        console.log(`🔐 Domain-based access: Fetching backups for domain "${domain}" (user: ${userEmail})`);
        
        // Get all users from the same email domain using case-insensitive comparison
        const domainUsers = await db.select({ id: authUsers.id })
          .from(authUsers)
          .where(sql`LOWER(${authUsers.email}) LIKE LOWER(${'%@' + domain})`);
        
        const domainUserIds = domainUsers.map(u => u.id);
        
        if (domainUserIds.length > 0) {
          const backups = await db.select()
            .from(conversationMinutesBackup)
            .where(and(
              inArray(conversationMinutesBackup.userId, domainUserIds),
              eq(conversationMinutesBackup.backupStatus, "completed")
            ))
            .orderBy(desc(conversationMinutesBackup.createdAt))
            .limit(100);
          
          return backups;
        }
        
        // No users found in domain - return empty array (no fallback for security)
        console.log(`🔐 No users found for domain "${domain}" - returning empty result set`);
        return [];
      }
      
      // Invalid email format - return empty array for security
      console.log(`⚠️ Invalid email format for domain filtering: ${userEmail} - returning empty result set`);
      return [];
    }
    
    // Legacy fallback only when NO userEmail is provided (for backward compatibility)
    // This should only be used by internal/admin functions that don't pass userEmail
    let userIds: string[] = [];
    
    if (organizationId) {
      const memberships = await db.select({ userId: organizationMemberships.userId })
        .from(organizationMemberships)
        .where(and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.status, "active")
        ));
      
      userIds = memberships.map(m => m.userId);
    }
    
    if (userIds.length > 0) {
      const backups = await db.select()
        .from(conversationMinutesBackup)
        .where(and(
          inArray(conversationMinutesBackup.userId, userIds),
          eq(conversationMinutesBackup.backupStatus, "completed")
        ))
        .orderBy(desc(conversationMinutesBackup.createdAt))
        .limit(100);
      
      return backups;
    }
    
    if (companyName) {
      const backups = await db.select()
        .from(conversationMinutesBackup)
        .where(and(
          eq(conversationMinutesBackup.companyName, companyName),
          eq(conversationMinutesBackup.backupStatus, "completed")
        ))
        .orderBy(desc(conversationMinutesBackup.createdAt))
        .limit(100);
      
      return backups;
    }
    
    return [];
  }
  
  private aggregateData(backups: ConversationMinutesBackup[]) {
    const allChallenges: string[] = [];
    const allPainPoints: string[] = [];
    const allRequirements: string[] = [];
    const allObjections: string[] = [];
    const allQuotes: string[] = [];
    const allTopics: string[] = [];
    const industries = new Set<string>();
    let totalMessages = 0;
    let earliest: Date | undefined;
    let latest: Date | undefined;
    
    for (const backup of backups) {
      if (backup.challengesIdentified && Array.isArray(backup.challengesIdentified)) {
        allChallenges.push(...(backup.challengesIdentified as string[]));
      }
      
      if (backup.clientPainPoints && Array.isArray(backup.clientPainPoints)) {
        allPainPoints.push(...(backup.clientPainPoints as string[]));
      }
      
      if (backup.clientRequirements && Array.isArray(backup.clientRequirements)) {
        allRequirements.push(...(backup.clientRequirements as string[]));
      }
      
      if (backup.objections && Array.isArray(backup.objections)) {
        allObjections.push(...(backup.objections as string[]));
      }
      
      if (backup.keyQuotes && Array.isArray(backup.keyQuotes)) {
        allQuotes.push(...(backup.keyQuotes as string[]));
      }
      
      if (backup.keyTopicsDiscussed && Array.isArray(backup.keyTopicsDiscussed)) {
        allTopics.push(...(backup.keyTopicsDiscussed as string[]));
      }
      
      if (backup.industry) {
        industries.add(backup.industry);
      }
      
      totalMessages += backup.messageCount || 0;
      
      if (backup.meetingDate) {
        const date = new Date(backup.meetingDate);
        if (!earliest || date < earliest) earliest = date;
        if (!latest || date > latest) latest = date;
      }
    }
    
    return {
      challenges: Array.from(new Set(allChallenges)),
      painPoints: Array.from(new Set(allPainPoints)),
      requirements: Array.from(new Set(allRequirements)),
      objections: Array.from(new Set(allObjections)),
      quotes: Array.from(new Set(allQuotes)),
      topics: Array.from(new Set(allTopics)),
      industries: Array.from(industries),
      totalMessages,
      timeRange: earliest && latest ? { earliest, latest } : undefined
    };
  }
  
  private buildDataContext(aggregatedData: ReturnType<typeof this.aggregateData>, includeInPrompt: boolean): string {
    if (!includeInPrompt) {
      return "";
    }
    
    return `
CONVERSATION DATA BANK (From Real Customer Conversations):
- Total unique challenges identified: ${aggregatedData.challenges.length}
- Total pain points: ${aggregatedData.painPoints.length}
- Total requirements discussed: ${aggregatedData.requirements.length}
- Industries covered: ${aggregatedData.industries.join(", ") || "Various"}

KEY CHALLENGES & PAIN POINTS:
${aggregatedData.challenges.slice(0, 20).map((c, i) => `${i + 1}. ${c}`).join("\n")}

CLIENT PAIN POINTS:
${aggregatedData.painPoints.slice(0, 15).map((p, i) => `${i + 1}. ${p}`).join("\n")}

KEY REQUIREMENTS:
${aggregatedData.requirements.slice(0, 10).map((r, i) => `${i + 1}. ${r}`).join("\n")}

KEY QUOTES FROM CUSTOMERS:
${aggregatedData.quotes.slice(0, 8).map((q, i) => `${i + 1}. "${q}"`).join("\n")}

IMPORTANT: Base your response primarily on this real customer data. Use universal knowledge only for context and structure.
`;
  }
  
  private buildPromptForQuery(queryType: string, aggregatedData: ReturnType<typeof this.aggregateData>, customQuestion?: string): string {
    const dataContext = this.buildDataContext(aggregatedData, true);

    let specificQuestion = "";
    
    switch (queryType) {
      case "challenges":
        specificQuestion = "Analyze the data and identify the TOP 5 most significant challenges that customers are facing. For each challenge, explain why it matters and its frequency/impact based on the data.";
        break;
      case "faqs":
        specificQuestion = "Based on the conversation data, identify the TOP 5 most frequently asked questions by customers. Include the types of answers or solutions typically discussed.";
        break;
      case "unique_queries":
        specificQuestion = "Identify 5 unique or interesting questions that customers have asked that were successfully answered. Highlight what made these queries unique and the solutions provided.";
        break;
      case "unanswered":
        specificQuestion = "Analyze the objections, pain points, and requirements to identify the TOP 5 queries or concerns that seem to remain unanswered or unresolved. Suggest potential approaches to address them.";
        break;
      case "custom":
        specificQuestion = customQuestion || "Provide a general analysis of the customer conversation patterns and key insights.";
        break;
      default:
        specificQuestion = "Provide a comprehensive analysis of the key themes and patterns in customer conversations.";
    }

    return `You are a marketing insights analyst for a B2B sales platform. You have access to aggregated data from customer sales conversations.

${dataContext}

ANALYSIS REQUEST:
${specificQuestion}

Provide your response in the following format:
1. Start with a clear, actionable summary (2-3 sentences)
2. List the top insights as numbered points
3. For each point, include specific evidence or quotes from the data when available
4. End with 1-2 actionable recommendations for the marketing team

Keep your response focused, data-driven, and actionable. Use specific numbers and examples where possible.`;
  }
  
  async discover(query: DiscoverQuery): Promise<DiscoverResponse> {
    try {
      const backups = await this.getOrganizationBackups(query.organizationId, query.companyName, query.userEmail);
      
      if (query.dataMode === "data_bank" && backups.length === 0) {
        return {
          success: false,
          query: query.queryType,
          answer: "No conversation data available for analysis. Start some sales conversations to build your Data Bank.",
          insights: [],
          supportingQuotes: [],
          dataPoints: {
            conversationsAnalyzed: 0,
            totalMessages: 0,
            industries: []
          },
          error: "No data available in Data Bank"
        };
      }
      
      const aggregatedData = this.aggregateData(backups);
      
      const prompt = this.buildPromptForQuery(
        query.queryType, 
        aggregatedData, 
        query.customQuestion
      );
      
      const deepseek = getDeepSeekClient();
      
      const systemPrompt = query.dataMode === "data_bank"
        ? "You are a marketing insights analyst. Provide clear, data-driven analysis based PRIMARILY on the customer conversation data provided. Use universal knowledge only for context, not as the primary source."
        : "You are a marketing insights analyst. You may freely use your universal knowledge base to provide comprehensive analysis. Customer data, if provided, should be used as supporting evidence.";
      
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });
      
      const aiResponse = completion.choices[0]?.message?.content || "Unable to generate insights";
      
      const insights = this.extractInsights(aiResponse);
      
      return {
        success: true,
        query: query.customQuestion || query.queryType,
        answer: aiResponse,
        insights,
        supportingQuotes: aggregatedData.quotes.slice(0, 5),
        dataPoints: {
          conversationsAnalyzed: backups.length,
          totalMessages: aggregatedData.totalMessages,
          industries: aggregatedData.industries,
          timeRange: aggregatedData.timeRange
        }
      };
      
    } catch (error: any) {
      console.error("Marketing discover error:", error);
      return {
        success: false,
        query: query.queryType,
        answer: "Failed to analyze conversation data",
        insights: [],
        supportingQuotes: [],
        dataPoints: {
          conversationsAnalyzed: 0,
          totalMessages: 0,
          industries: []
        },
        error: error.message || "Unknown error"
      };
    }
  }
  
  private extractInsights(response: string): string[] {
    const lines = response.split("\n");
    const insights: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d+[\.\)]\s/.test(trimmed)) {
        insights.push(trimmed.replace(/^\d+[\.\)]\s*/, ""));
      }
    }
    
    return insights.slice(0, 10);
  }
  
  async generatePost(request: PostGenerationRequest): Promise<GeneratedContent> {
    try {
      const backups = await this.getOrganizationBackups(request.organizationId, request.companyName, request.userEmail);
      const aggregatedData = this.aggregateData(backups);
      
      const dataContext = request.dataMode === "data_bank" 
        ? this.buildDataContext(aggregatedData, true)
        : "";
      
      const lengthGuide = {
        short: "50-100 words, punchy and impactful",
        medium: "150-250 words, balanced depth",
        long: "300-500 words, comprehensive coverage"
      };
      
      const toneGuide = {
        professional: "formal, credible, authoritative",
        bold: "confident, assertive, attention-grabbing",
        "thought-leadership": "insightful, forward-thinking, expert perspective",
        conversational: "friendly, approachable, relatable",
        analytical: "data-driven, logical, evidence-based"
      };
      
      let contactSection = "";
      if (request.includeContact && request.contactDetails) {
        const parts = [];
        if (request.contactDetails.email) parts.push(`Email: ${request.contactDetails.email}`);
        if (request.contactDetails.phone) parts.push(`Phone: ${request.contactDetails.phone}`);
        if (request.contactDetails.website) parts.push(`Website: ${request.contactDetails.website}`);
        if (parts.length > 0) {
          contactSection = `\n\nInclude a call-to-action with these contact details at the end:\n${parts.join("\n")}`;
        }
      }
      
      const prompt = `You are a B2B marketing content creator.

${dataContext}

Create a LinkedIn/social media marketing post about: "${request.topic}"

REQUIREMENTS:
- Length: ${lengthGuide[request.length]}
- Tone: ${toneGuide[request.tone]}
${request.dataMode === "data_bank" ? "- Must incorporate insights and pain points from the customer data provided" : "- Use your universal knowledge to create compelling content"}
${contactSection}

${request.hashtagMode !== "manual" ? "- Generate 5-8 relevant hashtags at the end" : ""}

Provide the post content followed by hashtags (if applicable).`;

      const deepseek = getDeepSeekClient();
      
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert B2B marketing copywriter. Create engaging, professional content." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const content = completion.choices[0]?.message?.content || "";
      
      let hashtags: string[] = [];
      if (request.hashtagMode === "auto" || request.hashtagMode === "both") {
        const hashtagMatch = content.match(/#\w+/g);
        if (hashtagMatch) {
          hashtags = hashtagMatch;
        }
      }
      if (request.hashtagMode === "manual" || request.hashtagMode === "both") {
        if (request.manualHashtags) {
          hashtags = [...hashtags, ...request.manualHashtags.map(h => h.startsWith("#") ? h : `#${h}`)];
        }
      }
      
      await db.insert(marketingGeneratedContent).values({
        userId: request.userId,
        contentType: "post",
        title: request.topic,
        content,
        length: request.length,
        tone: request.tone,
        hashtags: hashtags.length > 0 ? hashtags : null,
        contactDetailsIncluded: request.includeContact,
        dataSource: request.dataMode,
      });
      
      return {
        success: true,
        content,
        hashtags,
        title: request.topic
      };
      
    } catch (error: any) {
      console.error("Post generation error:", error);
      return {
        success: false,
        content: "",
        error: error.message || "Failed to generate post"
      };
    }
  }
  
  async generateVideoScript(request: VideoScriptRequest): Promise<GeneratedContent> {
    try {
      const backups = await this.getOrganizationBackups(request.organizationId, request.companyName, request.userEmail);
      const aggregatedData = this.aggregateData(backups);
      
      const dataContext = request.dataMode === "data_bank" 
        ? this.buildDataContext(aggregatedData, true)
        : "";
      
      const lengthGuide = {
        short: "30-60 seconds (approximately 75-150 words)",
        medium: "2-3 minutes (approximately 300-450 words)",
        long: "5-7 minutes (approximately 750-1050 words)"
      };
      
      const toneGuide = {
        professional: "formal, credible, corporate",
        bold: "energetic, assertive, dynamic",
        "thought-leadership": "insightful, visionary, expert",
        conversational: "friendly, relatable, engaging",
        analytical: "data-driven, logical, methodical"
      };
      
      const prompt = `You are a B2B video script writer.

${dataContext}

Create a video script about: "${request.topic}"

REQUIREMENTS:
- Duration: ${lengthGuide[request.length]}
- Tone: ${toneGuide[request.tone]}
${request.dataMode === "data_bank" ? "- Must incorporate real customer insights and pain points from the data provided" : "- Use universal knowledge to create compelling content"}

FORMAT:
1. HOOK (attention-grabbing opening)
2. PROBLEM (address the pain point)
3. SOLUTION (present your value proposition)
4. PROOF (evidence/examples)
5. CALL TO ACTION

Include speaker directions in [brackets] where helpful.

${request.hashtagMode !== "manual" ? "Add 5-8 relevant hashtags at the end for social media distribution." : ""}`;

      const deepseek = getDeepSeekClient();
      
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert video script writer for B2B marketing. Create engaging, well-structured scripts." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      
      const content = completion.choices[0]?.message?.content || "";
      
      let hashtags: string[] = [];
      if (request.hashtagMode === "auto" || request.hashtagMode === "both") {
        const hashtagMatch = content.match(/#\w+/g);
        if (hashtagMatch) {
          hashtags = hashtagMatch;
        }
      }
      if (request.hashtagMode === "manual" || request.hashtagMode === "both") {
        if (request.manualHashtags) {
          hashtags = [...hashtags, ...request.manualHashtags.map(h => h.startsWith("#") ? h : `#${h}`)];
        }
      }
      
      await db.insert(marketingGeneratedContent).values({
        userId: request.userId,
        contentType: "video_script",
        title: request.topic,
        content,
        length: request.length,
        tone: request.tone,
        hashtags: hashtags.length > 0 ? hashtags : null,
        dataSource: request.dataMode,
      });
      
      return {
        success: true,
        content,
        hashtags,
        title: request.topic
      };
      
    } catch (error: any) {
      console.error("Video script generation error:", error);
      return {
        success: false,
        content: "",
        error: error.message || "Failed to generate video script"
      };
    }
  }
  
  async generateResearch(request: ResearchRequest): Promise<GeneratedContent> {
    try {
      const backups = await this.getOrganizationBackups(request.organizationId, request.companyName, request.userEmail);
      const aggregatedData = this.aggregateData(backups);
      
      const dataContext = request.dataMode === "data_bank" 
        ? this.buildDataContext(aggregatedData, true)
        : "";
      
      const outputGuide = {
        research_paper: "formal research paper with abstract, methodology, findings, and conclusions",
        newsletter: "engaging newsletter with sections, highlights, and actionable takeaways",
        blog: "SEO-friendly blog post with headers, subheaders, and conversational tone",
        strategy: "strategic document with executive summary, analysis, recommendations, and action items"
      };
      
      const prompt = `You are a B2B marketing research analyst.

${dataContext}

Create a ${outputGuide[request.outputType]} about: "${request.topic}"

${request.dataMode === "data_bank" ? `
IMPORTANT: Base your research primarily on the customer conversation data provided. Extract patterns, trends, and insights directly from real customer interactions. Use universal knowledge only to provide context and structure.
` : `
You may freely use your universal knowledge to provide comprehensive research and insights.
`}

Structure your output appropriately for the ${request.outputType} format.
Include specific data points, statistics, and quotes where available.
Make it actionable and valuable for marketing strategy.`;

      const deepseek = getDeepSeekClient();
      
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert marketing research analyst. Provide thorough, well-structured research content." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2500
      });
      
      const content = completion.choices[0]?.message?.content || "";
      
      await db.insert(marketingGeneratedContent).values({
        userId: request.userId,
        contentType: "research",
        title: request.topic,
        content,
        dataSource: request.dataMode,
        metadata: { outputType: request.outputType },
      });
      
      return {
        success: true,
        content,
        title: request.topic,
        metadata: { outputType: request.outputType }
      };
      
    } catch (error: any) {
      console.error("Research generation error:", error);
      return {
        success: false,
        content: "",
        error: error.message || "Failed to generate research"
      };
    }
  }
  
  async generateInfographic(request: InfographicRequest): Promise<GeneratedContent> {
    try {
      const backups = await this.getOrganizationBackups(request.organizationId, request.companyName, request.userEmail);
      const aggregatedData = this.aggregateData(backups);
      
      const dataContext = request.dataMode === "data_bank" 
        ? this.buildDataContext(aggregatedData, true)
        : "";
      
      const outputGuide = {
        infographic: "structured data points for an infographic with clear sections, statistics, and visual hierarchy",
        chart: "chart-ready data with labels, categories, and numerical values in a structured format",
        numbers: "key numerical insights, percentages, and metrics formatted for visual display",
        summary: "executive summary with bullet points, key metrics, and actionable insights"
      };
      
      const prompt = `You are a data visualization specialist for B2B marketing.

${dataContext}

Create ${outputGuide[request.outputType]} about: "${request.topic}"

${request.dataMode === "data_bank" ? `
IMPORTANT: Extract real data points, patterns, and statistics from the customer conversation data provided. Present authentic insights from actual customer interactions.
` : `
Use your universal knowledge to provide relevant statistics, trends, and data points.
`}

FORMAT YOUR OUTPUT AS:
${request.outputType === "chart" ? `
CHART DATA:
- Title: [Chart title]
- Type: [bar/line/pie/donut recommended]
- Categories: [List of categories]
- Values: [Corresponding values]
- Key Insight: [Main takeaway]
` : request.outputType === "numbers" ? `
KEY METRICS:
1. [Metric Name]: [Value] - [Brief context]
2. [Metric Name]: [Value] - [Brief context]
...
` : request.outputType === "infographic" ? `
INFOGRAPHIC SECTIONS:
SECTION 1: [Title]
- Key stat: [value]
- Supporting points: [bullets]

SECTION 2: [Title]
...
` : `
EXECUTIVE SUMMARY:
- Headline: [Main finding]
- Key Metrics: [3-5 important numbers]
- Insights: [Bullet points]
- Recommendations: [Action items]
`}`;

      const deepseek = getDeepSeekClient();
      
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a data visualization and analytics specialist. Present data in clear, structured formats ready for visual representation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });
      
      const content = completion.choices[0]?.message?.content || "";
      
      await db.insert(marketingGeneratedContent).values({
        userId: request.userId,
        contentType: "infographic",
        title: request.topic,
        content,
        dataSource: request.dataMode,
        metadata: { outputType: request.outputType },
      });
      
      return {
        success: true,
        content,
        title: request.topic,
        metadata: { outputType: request.outputType }
      };
      
    } catch (error: any) {
      console.error("Infographic generation error:", error);
      return {
        success: false,
        content: "",
        error: error.message || "Failed to generate infographic data"
      };
    }
  }
  
  async getUserSettings(userId: string) {
    const [settings] = await db.select()
      .from(marketingUserSettings)
      .where(eq(marketingUserSettings.userId, userId))
      .limit(1);
    
    return settings || null;
  }
  
  async saveUserSettings(userId: string, settings: {
    contactEmail?: string;
    contactPhone?: string;
    contactWebsite?: string;
    preferredTone?: string;
    defaultHashtagMode?: string;
    dataBankMode?: boolean;
  }) {
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      await db.update(marketingUserSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(marketingUserSettings.userId, userId));
    } else {
      await db.insert(marketingUserSettings).values({
        userId,
        ...settings
      });
    }
    
    return await this.getUserSettings(userId);
  }
  
  async getQuickStats(organizationId?: string, userEmail?: string): Promise<{
    totalConversations: number;
    totalChallenges: number;
    topIndustries: string[];
    recentActivity: Date | null;
  }> {
    const backups = await this.getOrganizationBackups(organizationId, undefined, userEmail);
    const aggregatedData = this.aggregateData(backups);
    
    return {
      totalConversations: backups.length,
      totalChallenges: aggregatedData.challenges.length + aggregatedData.painPoints.length,
      topIndustries: aggregatedData.industries.slice(0, 5),
      recentActivity: aggregatedData.timeRange?.latest || null
    };
  }
}

export const marketingInsightsService = new MarketingInsightsService();
