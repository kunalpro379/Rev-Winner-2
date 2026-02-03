#!/usr/bin/env node

// Test script to verify conversation storage is working
import { db } from './server/db.js';
import { conversations, messages } from './shared/schema.js';
import { eq, desc } from 'drizzle-orm';

async function testConversationStorage() {
  try {
    console.log('🔍 Testing conversation storage...');
    
    // Check if we can query conversations table
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
      
      // Test message retrieval for first conversation
      const firstConv = allConversations[0];
      const convMessages = await db.select().from(messages)
        .where(eq(messages.conversationId, firstConv.id))
        .limit(5);
      
      console.log(`💬 Found ${convMessages.length} messages for conversation ${firstConv.sessionId}`);
      convMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.sender}: ${msg.content.substring(0, 100)}...`);
      });
    } else {
      console.log('ℹ️  No conversations found. This is expected if no conversations have been created yet.');
    }
    
    console.log('✅ Conversation storage test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing conversation storage:', error);
    process.exit(1);
  }
}

// Run the test
testConversationStorage().then(() => {
  console.log('🎉 Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});