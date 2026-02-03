import { authStorage } from "../storage-auth";

/**
 * Token Tracker Service
 * 
 * Centralized service for tracking AI token usage across all providers.
 * Automatically records token consumption after each AI API call.
 */

interface TokenUsageData {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface AIResponse {
  usage?: TokenUsageData;
  [key: string]: any;
}

/**
 * Record AI token usage from an API response
 * 
 * @param userId - User ID making the request
 * @param provider - AI provider name (deepseek, gemini, claude, chatgpt, grok, kimi)
 * @param response - AI API response containing usage data
 * @param feature - Feature using the AI (e.g., 'shift_gears', 'present_to_win')
 * @param organizationId - Optional organization ID for enterprise users
 */
export async function recordTokenUsage(
  userId: string,
  provider: string,
  response: AIResponse,
  feature: string,
  organizationId?: string
): Promise<void> {
  try {
    // Extract token usage from response
    const usage = response.usage;
    
    if (!usage) {
      console.warn(`⚠️ No usage data in ${provider} response for feature: ${feature}`);
      return;
    }

    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);

    // Only record if we have actual token usage
    if (totalTokens === 0) {
      console.warn(`⚠️ Zero tokens in ${provider} response for feature: ${feature}`);
      return;
    }

    // Record to database
    await authStorage.recordAITokenUsage({
      userId,
      organizationId,
      provider,
      promptTokens,
      completionTokens,
      totalTokens,
      feature,
      metadata: {
        recordedAt: new Date().toISOString(),
      },
    });

    console.log(`Recorded ${totalTokens} tokens (${promptTokens} prompt + ${completionTokens} completion) for ${provider} - ${feature}`);
  } catch (error) {
    // Don't fail the request if token tracking fails
    console.error(`❌ Failed to record token usage for ${provider}:`, error);
  }
}

/**
 * Map AI engine names to provider names for token tracking
 */
export function mapEngineToProvider(engine: string): string {
  const mapping: Record<string, string> = {
    'default': 'deepseek',
    'openai': 'chatgpt',
    'grok': 'grok',
    'claude': 'claude',
    'gemini': 'gemini',
    'deepseek': 'deepseek',
    'kimi': 'kimi',
  };
  
  return mapping[engine] || engine;
}

/**
 * Wrapper for AI completion calls that automatically tracks token usage
 * 
 * @param client - AI client instance
 * @param params - Parameters for the completion call
 * @param userId - User ID making the request
 * @param engine - AI engine name
 * @param feature - Feature using the AI
 * @param organizationId - Optional organization ID
 * @returns AI response with token tracking
 */
export async function trackableCompletion(
  client: any,
  params: {
    model: string;
    messages: any[];
    response_format?: { type: string };
    max_tokens?: number;
    temperature?: number;
  },
  userId: string | undefined,
  engine: string,
  feature: string,
  organizationId?: string
): Promise<any> {
  const response = await client.chat.completions.create(params);
  
  // Track token usage if userId is provided
  if (userId && response) {
    await recordTokenUsage(userId, mapEngineToProvider(engine), response, feature, organizationId);
  }
  
  return response;
}
