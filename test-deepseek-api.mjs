import 'dotenv/config';
import OpenAI from 'openai';

async function testDeepSeek() {
  try {
    console.log('\n🔍 Testing DeepSeek API...\n');
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.log('❌ DEEPSEEK_API_KEY not found in .env');
      return;
    }
    
    console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);
    
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com'
    });
    
    console.log('⚙️  Sending test request to DeepSeek API...\n');
    
    const startTime = Date.now();
    
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond in JSON format.' },
        { role: 'user', content: 'Say hello in JSON format with a "message" field' }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 100,
      temperature: 0.5
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ DeepSeek API responded in ${duration}ms\n`);
    console.log('Response:', response.choices[0].message.content);
    console.log('\nToken usage:');
    console.log(`  - Prompt tokens: ${response.usage?.prompt_tokens}`);
    console.log(`  - Completion tokens: ${response.usage?.completion_tokens}`);
    console.log(`  - Total tokens: ${response.usage?.total_tokens}\n`);
    
    console.log('🎉 DeepSeek API is working correctly!\n');
    
  } catch (error) {
    console.error('❌ DeepSeek API Error:', error.message);
    if (error.status) {
      console.error(`   Status: ${error.status}`);
    }
    if (error.response) {
      console.error(`   Response:`, error.response);
    }
    console.error('\n   Full error:', error);
  }
}

testDeepSeek();
