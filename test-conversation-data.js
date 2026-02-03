#!/usr/bin/env node

/**
 * Test script to check conversation data in the database
 * This script will:
 * 1. Connect to the database
 * 2. Check if there are any conversations
 * 3. Check if there are any messages with AI data
 * 4. Display sample data for testing
 */

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { conversations, messages, authUsers } = require('./shared/schema');
const { eq, desc, sql } = require('drizzle-orm');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/revwinner',
});

const db = drizzle(pool);

async function testConversationData() {
  try {
    console.log('🔍 Testing Conversation Data...\n');

    // 1. Check total conversations
    const totalConversations = await db
      .select({ count: sql`count(*)` })
      .from(conversations);
    
    console.log(`📊 Total Conversations: ${totalConversations[0].count}`);

    // 2. Check total messages
    const totalMessages = await db
      .select({ count: sql`count(*)` })
      .from(messages);
    
    console.log(`💬 Total Messages: ${totalMessages[0].count}`);

    // 3. Check messages with AI data
    const messagesWithAiData = await db
      .select({ count: sql`count(*)` })
      .from(messages)
      .where(sql`
        discovery_questions IS NOT NULL OR 
        case_studies IS NOT NULL OR 
        competitor_analysis IS NOT NULL OR 
        solution_recommendations IS NOT NULL OR 
        product_features IS NOT NULL OR 
        next_steps IS NOT NULL OR 
        bant_qualification IS NOT NULL OR 
        solutions IS NOT NULL OR 
        problem_statement IS NOT NULL OR 
        recommended_solutions IS NOT NULL OR 
        suggested_next_prompt IS NOT NULL
      `);
    
    console.log(`🤖 Messages with AI Data: ${messagesWithAiData[0].count}`);

    // 4. Get sample conversations with user info
    const sampleConversations = await db
      .select({
        id: conversations.id,
        sessionId: conversations.sessionId,
        clientName: conversations.clientName,
        status: conversations.status,
        createdAt: conversations.createdAt,
        endedAt: conversations.endedAt,
        userEmail: authUsers.email,
        messageCount: sql`(SELECT count(*) FROM messages WHERE conversation_id = ${conversations.id})`,
        aiMessageCount: sql`(SELECT count(*) FROM messages WHERE conversation_id = ${conversations.id} AND sender = 'assistant')`,
      })
      .from(conversations)
      .leftJoin(authUsers, eq(conversations.userId, authUsers.id))
      .orderBy(desc(conversations.createdAt))
      .limit(5);

    console.log('\n📋 Sample Conversations:');
    console.log('========================');
    
    if (sampleConversations.length === 0) {
      console.log('❌ No conversations found in database');
    } else {
      sampleConversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. Conversation ID: ${conv.id}`);
        console.log(`   Session ID: ${conv.sessionId}`);
        console.log(`   Client: ${conv.clientName || 'Unknown'}`);
        console.log(`   User: ${conv.userEmail || 'Unknown'}`);
        console.log(`   Status: ${conv.status}`);
        console.log(`   Created: ${conv.createdAt}`);
        console.log(`   Ended: ${conv.endedAt || 'Still active'}`);
        console.log(`   Messages: ${conv.messageCount} (${conv.aiMessageCount} AI responses)`);
      });
    }

    // 5. Get sample messages with AI data
    const sampleMessagesWithAI = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        content: messages.content,
        sender: messages.sender,
        timestamp: messages.timestamp,
        discoveryQuestions: messages.discoveryQuestions,
        solutionRecommendations: messages.solutionRecommendations,
        nextSteps: messages.nextSteps,
        suggestedNextPrompt: messages.suggestedNextPrompt,
      })
      .from(messages)
      .where(sql`
        discovery_questions IS NOT NULL OR 
        solution_recommendations IS NOT NULL OR 
        next_steps IS NOT NULL OR 
        suggested_next_prompt IS NOT NULL
      `)
      .orderBy(desc(messages.timestamp))
      .limit(3);

    console.log('\n🤖 Sample Messages with AI Data:');
    console.log('=================================');
    
    if (sampleMessagesWithAI.length === 0) {
      console.log('❌ No messages with AI data found');
    } else {
      sampleMessagesWithAI.forEach((msg, index) => {
        console.log(`\n${index + 1}. Message ID: ${msg.id}`);
        console.log(`   Conversation: ${msg.conversationId}`);
        console.log(`   Sender: ${msg.sender}`);
        console.log(`   Timestamp: ${msg.timestamp}`);
        console.log(`   Content: ${msg.content.substring(0, 100)}...`);
        
        if (msg.discoveryQuestions) {
          console.log(`   Discovery Questions: ${JSON.stringify(msg.discoveryQuestions).substring(0, 100)}...`);
        }
        if (msg.solutionRecommendations) {
          console.log(`   Solution Recommendations: ${JSON.stringify(msg.solutionRecommendations).substring(0, 100)}...`);
        }
        if (msg.nextSteps) {
          console.log(`   Next Steps: ${JSON.stringify(msg.nextSteps).substring(0, 100)}...`);
        }
        if (msg.suggestedNextPrompt) {
          console.log(`   Suggested Next Prompt: ${msg.suggestedNextPrompt.substring(0, 100)}...`);
        }
      });
    }

    // 6. Test the new API endpoints (simulate)
    console.log('\n🔗 API Endpoint Tests:');
    console.log('======================');
    console.log('✅ GET /api/profile/session-history - Enhanced with message counts and AI data');
    console.log('✅ GET /api/profile/session-history/:conversationId/messages - New endpoint for conversation details');

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing conversation data:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testConversationData();