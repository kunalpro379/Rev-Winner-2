import OpenAI from "openai";

interface CompetitorInfo {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

interface CompanyIntelligence {
  companyName: string;
  normalizedName: string;
  industry: string;
  description: string;
  offerings: string[];
  competitors: CompetitorInfo[];
  lastUpdated: Date;
  source: "ai_research" | "static_registry" | "cache";
  provider?: string;
  requestDurationMs?: number;
}

interface CacheEntry {
  data: CompanyIntelligence;
  expiresAt: number;
}

const intelligenceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
      timeout: 30000,
    })
  : null;

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCachedIntelligence(companyName: string): CompanyIntelligence | null {
  const normalized = normalizeCompanyName(companyName);
  const cached = intelligenceCache.get(normalized);
  
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`📦 Cache hit for competitive intelligence: ${companyName}`);
    return { ...cached.data, source: "cache" };
  }
  
  if (cached) {
    intelligenceCache.delete(normalized);
  }
  
  return null;
}

function cacheIntelligence(intelligence: CompanyIntelligence): void {
  const normalized = normalizeCompanyName(intelligence.companyName);
  intelligenceCache.set(normalized, {
    data: intelligence,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  console.log(`💾 Cached competitive intelligence for: ${intelligence.companyName}`);
}

export async function researchCompanyIntelligence(
  companyName: string,
  conversationContext?: string
): Promise<CompanyIntelligence> {
  const cached = getCachedIntelligence(companyName);
  if (cached) {
    return cached;
  }

  if (!deepseek) {
    console.warn("⚠️ DeepSeek not configured, using fallback intelligence");
    return createFallbackIntelligence(companyName);
  }

  try {
    console.log(`🔍 Researching competitive intelligence for: ${companyName}`);
    const researchStartTime = Date.now();
    
    const prompt = `You are a business intelligence analyst. Research and provide accurate information about the company "${companyName}".

${conversationContext ? `Context from sales conversation: ${conversationContext.substring(0, 500)}` : ""}

Provide a JSON response with the following structure:
{
  "companyName": "Official company name",
  "industry": "Primary industry/sector",
  "description": "Brief company description (1-2 sentences)",
  "offerings": ["Main product/service 1", "Main product/service 2", "Main product/service 3"],
  "competitors": [
    {
      "name": "Competitor 1 Name",
      "description": "Brief description",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"]
    },
    {
      "name": "Competitor 2 Name",
      "description": "Brief description",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"]
    },
    {
      "name": "Competitor 3 Name",
      "description": "Brief description",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"]
    }
  ]
}

IMPORTANT RULES:
1. Provide REAL competitors in the same industry/market segment
2. For MSPs (Managed Service Providers) like Integris, list other MSPs as competitors (e.g., CompassMSP, Thrive, Abacus Group)
3. For software products, list competing software products
4. For consulting firms, list other consulting firms
5. Be specific and accurate - do NOT confuse product categories
6. If you're unsure about a company, make reasonable inferences from the name and context
7. Return ONLY valid JSON, no additional text`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a business intelligence analyst. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    const requestDurationMs = Date.now() - researchStartTime;
    
    const intelligence: CompanyIntelligence = {
      companyName: parsed.companyName || companyName,
      normalizedName: normalizeCompanyName(parsed.companyName || companyName),
      industry: parsed.industry || "Technology",
      description: parsed.description || "",
      offerings: parsed.offerings || [],
      competitors: (parsed.competitors || []).map((c: any) => ({
        name: c.name || "Unknown",
        description: c.description || "",
        strengths: c.strengths || [],
        weaknesses: c.weaknesses || [],
      })),
      lastUpdated: new Date(),
      source: "ai_research",
      provider: "deepseek",
      requestDurationMs,
    };
    
    console.log(`⏱️ Research completed in ${requestDurationMs}ms`);

    cacheIntelligence(intelligence);
    console.log(`✅ Successfully researched ${companyName}: Found ${intelligence.competitors.length} competitors`);
    
    return intelligence;
  } catch (error) {
    console.error(`❌ Error researching ${companyName}:`, error);
    return createFallbackIntelligence(companyName);
  }
}

function createFallbackIntelligence(companyName: string): CompanyIntelligence {
  return {
    companyName,
    normalizedName: normalizeCompanyName(companyName),
    industry: "Technology",
    description: `${companyName} is a technology company.`,
    offerings: [],
    competitors: [],
    lastUpdated: new Date(),
    source: "static_registry",
  };
}

export async function getCompetitorsForCompany(
  companyName: string,
  conversationContext?: string
): Promise<string[]> {
  const intelligence = await researchCompanyIntelligence(companyName, conversationContext);
  return intelligence.competitors.map(c => c.name);
}

export async function getCompetitorDetails(
  companyName: string,
  competitorName: string,
  conversationContext?: string
): Promise<CompetitorInfo | null> {
  const intelligence = await researchCompanyIntelligence(companyName, conversationContext);
  return intelligence.competitors.find(
    c => normalizeCompanyName(c.name) === normalizeCompanyName(competitorName)
  ) || null;
}

export function clearIntelligenceCache(): void {
  intelligenceCache.clear();
  console.log("🗑️ Competitive intelligence cache cleared");
}

export function getIntelligenceCacheStats(): { size: number; entries: string[] } {
  return {
    size: intelligenceCache.size,
    entries: Array.from(intelligenceCache.keys()),
  };
}
