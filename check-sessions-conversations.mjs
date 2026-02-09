import { db } from './server/db.ts';
import { conversations, sessionUsage } from './shared/schema.ts';
import { eq, desc } from 'drizzle-orm';

// Get user ID from command line or use a default
const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node check-sessions-conversations.mjs <userId>');
  process.exit(1);
}

console.log(`\n🔍 Checking sessions and conversations for user: ${userId}\n`);

try {
  // Get all session usage entries
  const sessions = await db.select()
    .from(sessionUsage)
    .where(eq(sessionUsage.userId, userId))
    .orderBy(desc(sessionUsage.startTime));

  console.log(`📊 Total session usage entries: ${sessions.length}\n`);

  // Get all conversations
  const convs = await db.select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt));

  console.log(`💬 Total conversations: ${convs.length}\n`);

  // Create a map of sessionId -> conversation
  const convMap = new Map();
  convs.forEach(conv => {
    convMap.set(conv.sessionId, conv);
  });

  console.log('📋 Session Details:\n');
  console.log('─'.repeat(100));

  sessions.forEach((session, index) => {
    const hasConversation = convMap.has(session.sessionId);
    const conv = convMap.get(session.sessionId);
    
    console.log(`\n${index + 1}. Session ID: ${session.sessionId}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Start: ${session.startTime}`);
    console.log(`   End: ${session.endTime || 'N/A'}`);
    console.log(`   Duration: ${session.durationSeconds ? Math.ceil(parseInt(session.durationSeconds) / 60) : 0} minutes`);
    console.log(`   Has Conversation: ${hasConversation ? '✅ YES' : '❌ NO'}`);
    
    if (hasConversation) {
      console.log(`   Messages: ${conv.messageCount || 0}`);
      console.log(`   Summary: ${conv.callSummary ? 'Yes' : 'No'}`);
    }
    
    console.log(`   Should Show in Profile: ${session.status === 'ended' && session.endTime && hasConversation ? '✅ YES' : '❌ NO'}`);
  });

  console.log('\n' + '─'.repeat(100));
  console.log(`\n📈 Summary:`);
  console.log(`   Total Sessions: ${sessions.length}`);
  console.log(`   Sessions with Conversations: ${sessions.filter(s => convMap.has(s.sessionId)).length}`);
  console.log(`   Sessions that should show: ${sessions.filter(s => s.status === 'ended' && s.endTime && convMap.has(s.sessionId)).length}`);
  console.log(`   Sessions without AI usage: ${sessions.filter(s => !convMap.has(s.sessionId)).length}`);

  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
