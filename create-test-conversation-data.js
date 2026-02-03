#!/usr/bin/env node

/**
 * Script to create test conversation data for testing the new conversation features
 * This will create sample conversations and messages with AI data
 */

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { conversations, messages, authUsers } = require('./shared/schema');
const { eq } = require('drizzle-orm');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/revwinner',
});

const db = drizzle(pool);

async function createTestData() {
  try {
    console.log('🚀 Creating test conversation data...\n');

    // 1. Get the first user from the database
    const users = await db.select().from(authUsers).limit(1);
    
    if (users.length === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Using test user: ${testUser.email} (${testUser.id})`);

    // 2. Create test conversations
    const testConversations = [
      {
        sessionId: `test_session_${Date.now()}_1`,
        userId: testUser.id,
        clientName: 'Acme Corp',
        status: 'ended',
        callSummary: 'Discussed their CRM integration needs and pricing concerns.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 minutes later
      },
      {
        sessionId: `test_session_${Date.now()}_2`,
        userId: testUser.id,
        clientName: 'TechStart Inc',
        status: 'ended',
        callSummary: 'Initial discovery call about their sales automation requirements.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000), // 22 minutes later
      },
      {
        sessionId: `test_session_${Date.now()}_3`,
        userId: testUser.id,
        clientName: 'Global Solutions Ltd',
        status: 'active',
        callSummary: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endedAt: null,
      },
    ];

    const createdConversations = [];
    for (const conv of testConversations) {
      const [created] = await db.insert(conversations).values(conv).returning();
      createdConversations.push(created);
      console.log(`✅ Created conversation: ${created.id} (${conv.clientName})`);
    }

    // 3. Create test messages with AI data
    const testMessages = [
      // Conversation 1 - Acme Corp
      {
        conversationId: createdConversations[0].id,
        content: 'Hi, I\'m interested in learning more about your CRM integration capabilities.',
        sender: 'user',
        speakerLabel: 'Client',
        timestamp: new Date(createdConversations[0].createdAt.getTime() + 1000),
      },
      {
        conversationId: createdConversations[0].id,
        content: 'Great! I\'d be happy to help you with that. Can you tell me about your current CRM system and what specific integrations you\'re looking for?',
        sender: 'assistant',
        speakerLabel: 'AI Assistant',
        discoveryQuestions: [
          'What CRM system are you currently using?',
          'What specific data do you need to sync?',
          'How many users would need access to this integration?'
        ],
        solutionRecommendations: [
          'API-based integration for real-time sync',
          'Batch processing for large data volumes',
          'Custom webhook setup for instant notifications'
        ],
        nextSteps: [
          'Schedule technical discovery call',
          'Provide API documentation',
          'Set up demo environment'
        ],
        suggestedNextPrompt: 'Would you like to see a demo of our CRM integration in action?',
        timestamp: new Date(createdConversations[0].createdAt.getTime() + 2000),
      },
      {
        conversationId: createdConversations[0].id,
        content: 'We\'re using Salesforce and need to sync contact data and deal information. We have about 50 sales reps.',
        sender: 'user',
        speakerLabel: 'Client',
        timestamp: new Date(createdConversations[0].createdAt.getTime() + 3000),
      },
      {
        conversationId: createdConversations[0].id,
        content: 'Perfect! Salesforce is one of our most popular integrations. For 50 users with contact and deal sync, I\'d recommend our Professional plan with real-time API integration.',
        sender: 'assistant',
        speakerLabel: 'AI Assistant',
        bantQualification: {
          budget: 'Professional plan pricing discussed',
          authority: 'Speaking with decision maker',
          need: 'CRM integration for 50 sales reps',
          timeline: 'Not specified yet'
        },
        productFeatures: [
          'Real-time Salesforce sync',
          'Contact and deal management',
          'Multi-user support up to 100 users',
          '24/7 technical support'
        ],
        competitorAnalysis: {
          advantages: ['Better pricing than HubSpot', 'More flexible than Pipedrive'],
          differentiators: ['Real-time sync', 'Custom field mapping']
        },
        timestamp: new Date(createdConversations[0].createdAt.getTime() + 4000),
      },

      // Conversation 2 - TechStart Inc
      {
        conversationId: createdConversations[1].id,
        content: 'We\'re a startup looking for sales automation tools. What can you offer?',
        sender: 'user',
        speakerLabel: 'Prospect',
        timestamp: new Date(createdConversations[1].createdAt.getTime() + 1000),
      },
      {
        conversationId: createdConversations[1].id,
        content: 'Excellent! As a startup, you\'ll want to focus on scalable solutions that grow with you. Let me understand your current sales process first.',
        sender: 'assistant',
        speakerLabel: 'AI Assistant',
        discoveryQuestions: [
          'How many people are on your sales team currently?',
          'What\'s your average deal size?',
          'How do you currently track leads and opportunities?',
          'What\'s your biggest sales challenge right now?'
        ],
        caseStudies: [
          {
            company: 'StartupX',
            industry: 'SaaS',
            challenge: 'Manual lead tracking',
            solution: 'Automated lead scoring and nurturing',
            result: '300% increase in qualified leads'
          }
        ],
        solutions: [
          'Lead automation and scoring',
          'Email sequence automation',
          'Pipeline management',
          'Analytics and reporting'
        ],
        timestamp: new Date(createdConversations[1].createdAt.getTime() + 2000),
      },
      {
        conversationId: createdConversations[1].id,
        content: 'We have 3 sales people, average deal is $5K, and we\'re using spreadsheets right now. Our biggest challenge is lead follow-up.',
        sender: 'user',
        speakerLabel: 'Prospect',
        timestamp: new Date(createdConversations[1].createdAt.getTime() + 3000),
      },
      {
        conversationId: createdConversations[1].id,
        content: 'That\'s a common challenge for growing startups! With 3 sales people and $5K deals, automated follow-up will be a game-changer for you.',
        sender: 'assistant',
        speakerLabel: 'AI Assistant',
        problemStatement: 'Manual lead follow-up process causing lost opportunities for 3-person sales team with $5K average deals',
        recommendedSolutions: [
          {
            solution: 'Automated Email Sequences',
            benefit: 'Never miss a follow-up again',
            roi: 'Typically 40% increase in conversion'
          },
          {
            solution: 'Lead Scoring System',
            benefit: 'Focus on hottest prospects first',
            roi: 'Save 10+ hours per week per rep'
          }
        ],
        nextSteps: [
          'Set up 14-day free trial',
          'Import existing lead data',
          'Configure automated sequences',
          'Schedule training session'
        ],
        suggestedNextPrompt: 'Would you like to start with a free trial to see how this works with your current leads?',
        timestamp: new Date(createdConversations[1].createdAt.getTime() + 4000),
      },

      // Conversation 3 - Global Solutions Ltd (Active)
      {
        conversationId: createdConversations[2].id,
        content: 'Hello, I\'d like to discuss enterprise solutions for our global team.',
        sender: 'user',
        speakerLabel: 'Enterprise Client',
        timestamp: new Date(createdConversations[2].createdAt.getTime() + 1000),
      },
      {
        conversationId: createdConversations[2].id,
        content: 'Welcome! I\'d be delighted to help you explore our enterprise solutions. Global teams have unique requirements, and I want to make sure we address all your needs.',
        sender: 'assistant',
        speakerLabel: 'AI Assistant',
        discoveryQuestions: [
          'How many countries/regions does your team span?',
          'What\'s your total team size?',
          'Do you need multi-language support?',
          'What compliance requirements do you have?',
          'What\'s your current tech stack?'
        ],
        solutionRecommendations: [
          'Enterprise plan with unlimited users',
          'Multi-region data centers',
          'Advanced security and compliance',
          'Custom integrations and APIs',
          'Dedicated customer success manager'
        ],
        timestamp: new Date(createdConversations[2].createdAt.getTime() + 2000),
      },
    ];

    // Insert messages
    for (const msg of testMessages) {
      await db.insert(messages).values(msg);
    }

    console.log(`✅ Created ${testMessages.length} test messages with AI data`);

    console.log('\n🎉 Test data creation completed!');
    console.log('\n📊 Summary:');
    console.log(`   - ${createdConversations.length} conversations created`);
    console.log(`   - ${testMessages.length} messages created`);
    console.log(`   - ${testMessages.filter(m => m.sender === 'assistant').length} messages with AI data`);
    
    console.log('\n🔗 You can now test the APIs:');
    console.log('   - GET /api/profile/session-history');
    console.log(`   - GET /api/profile/session-history/${createdConversations[0].id}/messages`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createTestData();