import { db } from './server/db.js';
import { conversations } from './shared/schema.js';

async function checkConversations() {
  try {
    console.log('🔍 Checking conversations in database...');
    
    const allConversations = await db.select().from(conversations).limit(10);
    console.log(`📊 Found ${allConversations.length} conversations in database`);
    
    if (allConversations.length > 0) {
      console.log('✅ Recent conversations:');
      allConversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. Session: ${conv.sessionId}`);
        console.log(`     User ID: ${conv.userId || 'Anonymous'}`);
        console.log(`     Created: ${conv.createdAt}`);
        console.log(`     Status: ${conv.status}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No conversations found in database.');
      console.log('   This means conversations are not being stored properly.');
    }
    
  } catch (error) {
    console.error('❌ Error checking conversations:', error.message);
  }
  
  process.exit(0);
}

checkConversations();