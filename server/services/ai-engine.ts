import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { authStorage } from "../storage-auth";
import { decryptApiKey } from "../utils/crypto";

// Unified interface for AI responses
interface AICompletionResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

interface AIClient {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        response_format?: { type: string };
        max_tokens?: number;
        temperature?: number;
      }) => Promise<AICompletionResponse>;
    };
  };
}

const ENGINE_CONFIGS = {
  default: {
    model: "deepseek-chat",
  },
  openai: {
    model: "gpt-4o-mini",
  },
  grok: {
    model: "grok-3",
  },
  claude: {
    model: "claude-sonnet-4-5",
  },
  gemini: {
    model: "gemini-2.5-flash",
  },
  deepseek: {
    model: "deepseek-chat",
  },
  kimi: {
    model: "kimi-k2-instruct",
  },
};

// Create provider-specific wrapper for Anthropic Claude
function createClaudeWrapper(apiKey: string): AIClient {
  const client = new Anthropic({ apiKey });

  return {
    chat: {
      completions: {
        create: async (params) => {
          // Convert OpenAI format to Claude format
          const systemMessage = params.messages.find(m => m.role === 'system');
          const userMessages = params.messages.filter(m => m.role !== 'system');

          // Build system prompt with JSON instructions if needed
          let systemPrompt = systemMessage?.content || '';
          if (params.response_format?.type === 'json_object') {
            systemPrompt += '\n\nYou must respond with valid JSON only. Do not include any text outside the JSON object.';
          }

          const response = await client.messages.create({
            model: params.model,
            max_tokens: params.max_tokens || 1024,
            temperature: params.temperature,
            system: systemPrompt,
            messages: userMessages.map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            })),
          });

          // Convert Claude response to OpenAI format
          // Handle both text and tool_use content blocks
          let textContent = '';
          for (const block of response.content) {
            if (block.type === 'text') {
              textContent += block.text;
            } else if (block.type === 'tool_use' && params.response_format?.type === 'json_object') {
              // If we get tool_use in JSON mode, try to extract input as JSON
              try {
                textContent += JSON.stringify((block as any).input);
              } catch {
                // Ignore if we can't stringify
              }
            }
          }

          if (!textContent && params.response_format?.type === 'json_object') {
            // Fallback empty JSON if we got nothing
            textContent = '{}';
          }

          return {
            choices: [{
              message: {
                content: textContent || null,
              },
            }],
          };
        },
      },
    },
  };
}

// Create provider-specific wrapper for Google Gemini
function createGeminiWrapper(apiKey: string): AIClient {
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    chat: {
      completions: {
        create: async (params) => {
          try {
            // Convert messages to Gemini format with proper chat history
            const systemMessage = params.messages.find(m => m.role === 'system');
            const chatMessages = params.messages.filter(m => m.role !== 'system');

            // Build system instruction with JSON requirements if needed
            let systemInstruction = systemMessage?.content || '';
            if (params.response_format?.type === 'json_object') {
              systemInstruction += '\n\nIMPORTANT: You must respond with ONLY valid JSON. No additional text, explanations, or markdown. Just the raw JSON object.';
            }

            const model = genAI.getGenerativeModel({
              model: params.model,
              systemInstruction,
              generationConfig: {
                temperature: params.temperature,
                maxOutputTokens: params.max_tokens || 2048,
                responseMimeType: params.response_format?.type === 'json_object' ? 'application/json' : 'text/plain',
              },
            });

            // Convert chat history to Gemini's format
            const geminiHistory = [];
            for (let i = 0; i < chatMessages.length - 1; i++) {
              const content = typeof chatMessages[i].content === 'string' 
                ? chatMessages[i].content 
                : JSON.stringify(chatMessages[i].content);
              geminiHistory.push({
                role: chatMessages[i].role === 'user' ? 'user' : 'model',
                parts: [{ text: content }],
              });
            }

            // Last message is the current prompt
            const lastMessage = chatMessages[chatMessages.length - 1];
            const lastMessageContent = typeof lastMessage.content === 'string'
              ? lastMessage.content
              : JSON.stringify(lastMessage.content);

            const chat = model.startChat({
              history: geminiHistory,
            });

            const result = await chat.sendMessage(lastMessageContent);
            const response = await result.response;
            let responseText = response.text();

            console.log(' Gemini raw response:', responseText.substring(0, 200));

            // Clean up markdown code blocks if present
            if (params.response_format?.type === 'json_object') {
              responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              
              // Validate it's actually JSON
              try {
                JSON.parse(responseText);
                console.log('Gemini JSON validation passed');
              } catch (parseError) {
                console.error('❌ Gemini JSON parse error:', parseError);
                console.error('Raw text:', responseText);
                
                // If it's not valid JSON, try to extract JSON from the response
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  responseText = jsonMatch[0];
                  console.log('🔧 Extracted JSON from response');
                  
                  // Try parsing the extracted JSON
                  try {
                    JSON.parse(responseText);
                    console.log('Extracted JSON is valid');
                  } catch {
                    console.error('❌ Extracted JSON still invalid');
                    responseText = '{}';
                  }
                } else {
                  // Last resort: return empty JSON object
                  console.error('❌ No JSON found in Gemini response, returning empty object');
                  responseText = '{}';
                }
              }
            }

            return {
              choices: [{
                message: {
                  content: responseText,
                },
              }],
            };
          } catch (error: any) {
            console.error('❌ Gemini API Error:', error);
            console.error('Error details:', {
              message: error.message,
              status: error.status,
              statusText: error.statusText,
            });
            throw error;
          }
        },
      },
    },
  };
}

// Create provider-specific wrapper for Grok (X.AI's API - OpenAI-compatible)
function createGrokWrapper(apiKey: string): AIClient {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });

  return client as unknown as AIClient;
}

// Create provider-specific wrapper for DeepSeek (OpenAI-compatible)
function createDeepSeekWrapper(apiKey: string): AIClient {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });

  return client as unknown as AIClient;
}

// Create provider-specific wrapper for Kimi K2 (OpenAI-compatible)
// Supports both OpenRouter keys (sk-or-v1-...) and official Moonshot keys (sk-...)
function createKimiWrapper(apiKey: string): AIClient {
  // Detect if this is an OpenRouter key (sk-or-v1-...) or official Moonshot key (sk-...)
  const isOpenRouter = apiKey.startsWith('sk-or-v1-');
  
  const client = new OpenAI({
    apiKey,
    baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.moonshot.ai/v1',
  });
  
  console.log(`🔧 Kimi wrapper created for ${isOpenRouter ? 'OpenRouter' : 'Moonshot'} API`);

  return client as unknown as AIClient;
}

// Create provider-specific wrapper for OpenAI
function createOpenAIWrapper(apiKey: string): AIClient {
  const client = new OpenAI({ apiKey });
  return client as unknown as AIClient;
}

export async function getAIClient(userId: string): Promise<{ client: AIClient; model: string; engine: string }> {
  const user = await authStorage.getUserById(userId);
  
  if (!user || !user.aiEngine || !user.encryptedApiKey) {
    throw new Error("AI engine not configured. Please set up your AI preferences in settings.");
  }

  const engine = user.aiEngine;
  
  let decryptedApiKey: string;
  try {
    decryptedApiKey = decryptApiKey(user.encryptedApiKey);
  } catch (decryptError: any) {
    console.error(`❌ API key decryption failed for user ${userId}, engine: ${engine}: ${decryptError.message}`);
    throw new Error("Your API key needs to be re-entered. Please go to Settings and save your API key again.");
  }
  
  // For default engine, use environment variable API key
  let apiKey = decryptedApiKey;
  if (engine === 'default') {
    apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!apiKey) {
      throw new Error("Rev Winner's default AI engine is not configured. Please contact support.");
    }
    console.log('Using Rev Winner Default AI Engine (DeepSeek)');
  } else {
    // Debug logging for API key issues (only log length and first/last chars for security)
    console.log(`AI Engine: ${engine}, API Key Length: ${apiKey.length}, Preview: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
  }
  
  const config = ENGINE_CONFIGS[engine as keyof typeof ENGINE_CONFIGS];
  
  if (!config) {
    throw new Error(`Unsupported AI engine: ${engine}`);
  }

  let client: AIClient;
  let model = config.model;

  switch (engine) {
    case 'default':
      client = createDeepSeekWrapper(apiKey);
      break;
    case 'openai':
      client = createOpenAIWrapper(apiKey);
      break;
    case 'grok':
      client = createGrokWrapper(apiKey);
      break;
    case 'claude':
      client = createClaudeWrapper(apiKey);
      break;
    case 'gemini':
      client = createGeminiWrapper(apiKey);
      break;
    case 'deepseek':
      client = createDeepSeekWrapper(apiKey);
      break;
    case 'kimi':
      client = createKimiWrapper(apiKey);
      // Use different model name for OpenRouter vs official Moonshot
      if (apiKey.startsWith('sk-or-v1-')) {
        model = 'moonshotai/kimi-k2';
        console.log('🔧 Using OpenRouter model: moonshotai/kimi-k2');
      }
      break;
    default:
      throw new Error(`Unsupported AI engine: ${engine}`);
  }

  return {
    client,
    model,
    engine,
  };
}

// Validate API key by making a test request
export async function validateAPIKey(
  engine: 'default' | 'openai' | 'grok' | 'claude' | 'gemini' | 'deepseek' | 'kimi',
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  // Default engine doesn't need validation - it uses the backend API key
  if (engine === 'default') {
    return { valid: true };
  }
  try {
    const config = ENGINE_CONFIGS[engine];
    if (!config) {
      return { valid: false, error: `Unsupported AI engine: ${engine}` };
    }

    let client: AIClient;

    // Create client based on engine
    switch (engine) {
      case 'openai':
        client = createOpenAIWrapper(apiKey);
        break;
      case 'grok':
        client = createGrokWrapper(apiKey);
        break;
      case 'claude':
        client = createClaudeWrapper(apiKey);
        break;
      case 'gemini':
        client = createGeminiWrapper(apiKey);
        break;
      case 'deepseek':
        client = createDeepSeekWrapper(apiKey);
        break;
      case 'kimi':
        client = createKimiWrapper(apiKey);
        break;
    }

    // Make a minimal test request with timeout
    // Use provider-specific prompts that are more likely to succeed
    console.log(`🔐 Validating ${engine} API key...`);
    
    const messages = engine === 'gemini' || engine === 'kimi'
      ? [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say 'ok'" }
        ]
      : [{ role: "user", content: "Say 'ok'" }];
    
    // For Kimi, use different model based on key type
    let modelToUse = config.model;
    if (engine === 'kimi' && apiKey.startsWith('sk-or-v1-')) {
      modelToUse = 'moonshotai/kimi-k2';
      console.log('🔧 Validation using OpenRouter model: moonshotai/kimi-k2');
    }
    
    console.log(`📤 Testing ${engine} with model: ${modelToUse}, messages:`, JSON.stringify(messages));
    
    const testPromise = client.chat.completions.create({
      model: modelToUse,
      messages,
      max_tokens: 10,
      temperature: 0,
    });

    // Add 15 second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('API key validation timeout')), 15000)
    );

    await Promise.race([testPromise, timeoutPromise]);
    
    console.log(`${engine} API key is valid`);
    return { valid: true };
  } catch (error: any) {
    console.error(`❌ ${engine} API key validation failed:`, error);
    console.error(`Error status: ${error?.status}, message: ${error?.message}`);
    console.error(`Full error object:`, JSON.stringify(error, null, 2));
    
    // Extract meaningful error message
    let errorMessage = 'Invalid API key';
    
    // Only fail on clear authentication errors (401/403)
    // Other errors might be transient or configuration issues
    if (error?.status === 401 || error?.status === 403) {
      errorMessage = `Authentication failed: ${error?.message || 'Invalid or unauthorized API key'}`;
      console.log(`🔴 Rejecting ${engine} key due to auth error: ${error?.status} ${error?.message}`);
      return { valid: false, error: errorMessage };
    } else if (error?.message?.toLowerCase().includes('unauthorized') || 
               error?.message?.toLowerCase().includes('invalid api key') ||
               error?.message?.toLowerCase().includes('authentication failed')) {
      errorMessage = 'Invalid or unauthorized API key';
      console.log(`🔴 Rejecting ${engine} key due to auth keywords in message`);
      return { valid: false, error: errorMessage };
    } else if (error?.message?.toLowerCase().includes('timeout')) {
      // Timeout could mean slow network, accept the key
      console.log(`⚠️  ${engine} validation timeout, accepting key`);
      return { valid: true };
    } else {
      // For other errors (rate limits, model not found, etc), accept the key
      // These are provider-side issues, not invalid API keys
      console.log(`⚠️  ${engine} validation had non-auth error, accepting key: ${error?.message}`);
      return { valid: true };
    }
  }
}
