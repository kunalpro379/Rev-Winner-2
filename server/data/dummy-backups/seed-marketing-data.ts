import { db } from "../../db";
import { conversationMinutesBackup, users, conversations } from "@shared/schema";
import { dummyMarketingBackups } from "./marketing-test-data";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function getOrCreateDummyUser(companyDomain: string, companyName: string): Promise<string | null> {
  try {
    const testEmail = `testuser@${companyDomain}.com`;
    
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    if (existingUser) {
      return existingUser.id;
    }
    
    const [newUser] = await db.insert(users).values({
      email: testEmail,
      firstName: "Test",
      lastName: companyName,
    }).returning();
    
    console.log(`  👤 Created test user: ${testEmail}`);
    return newUser.id;
  } catch (error) {
    console.error(`  ⚠️ Could not create user for ${companyName}:`, error);
    return null;
  }
}

async function createDummyConversation(userId: string, clientName: string): Promise<string | null> {
  try {
    const sessionId = `marketing-test-${uuidv4()}`;
    
    const [newConv] = await db.insert(conversations).values({
      sessionId,
      userId,
      clientName,
      status: "ended",
      createdAt: new Date(),
    }).returning();
    
    return newConv.id;
  } catch (error) {
    console.error(`  ⚠️ Could not create conversation:`, error);
    return null;
  }
}

export async function seedMarketingDummyData(): Promise<{ success: boolean; backupsCreated: number; domainsCreated: number }> {
  console.log("🌱 Starting marketing dummy data seeding...");
  
  const domainUserMap: Record<string, string> = {};
  let backupsCreated = 0;
  
  for (const backup of dummyMarketingBackups) {
    try {
      const domain = backup.companyName.toLowerCase().replace(/\s+/g, "");
      
      if (!domainUserMap[domain]) {
        const userId = await getOrCreateDummyUser(domain, backup.companyName);
        if (userId) {
          domainUserMap[domain] = userId;
        } else {
          continue;
        }
      }
      
      const userId = domainUserMap[domain];
      const conversationId = await createDummyConversation(userId, backup.clientName);
      
      if (!conversationId) {
        continue;
      }
      
      await db.insert(conversationMinutesBackup).values({
        conversationId,
        userId,
        clientName: backup.clientName,
        companyName: backup.companyName,
        industry: backup.industry,
        meetingDate: backup.meetingDate,
        meetingDuration: backup.meetingDurationMinutes,
        executiveSummary: backup.executiveSummary,
        keyTopicsDiscussed: backup.keyTopicsDiscussed,
        clientPainPoints: backup.clientPainPoints,
        clientRequirements: backup.clientRequirements,
        challengesIdentified: backup.clientPainPoints,
        solutionsProposed: backup.solutionsProposed,
        competitorsDiscussed: backup.competitorsDiscussed,
        objections: backup.objections,
        actionItems: backup.actionItems,
        nextSteps: backup.nextSteps,
        fullTranscript: backup.fullTranscript,
        messageCount: backup.messageCount,
        keyQuotes: backup.keyQuotes,
        marketingHooks: backup.marketingHooks,
        bestPractices: backup.bestPractices,
        backupStatus: "completed",
        createdAt: new Date(),
      });
      
      backupsCreated++;
      console.log(`  ✅ Created backup for ${backup.companyName} - ${backup.clientName}`);
    } catch (error) {
      console.error(`  ❌ Error creating backup for ${backup.companyName}:`, error);
    }
  }
  
  console.log("✨ Marketing dummy data seeding completed!");
  console.log(`📊 Created ${backupsCreated} conversation backups across ${Object.keys(domainUserMap).length} domains`);
  
  return {
    success: true,
    backupsCreated,
    domainsCreated: Object.keys(domainUserMap).length,
  };
}

export async function clearMarketingDummyData(): Promise<{ success: boolean; backupsDeleted: number }> {
  console.log("🧹 Clearing marketing dummy data...");
  
  let backupsDeleted = 0;
  
  for (const backup of dummyMarketingBackups) {
    const domain = backup.companyName.toLowerCase().replace(/\s+/g, "");
    const testEmail = `testuser@${domain}.com`;
    
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    if (user) {
      await db.delete(conversationMinutesBackup)
        .where(eq(conversationMinutesBackup.userId, user.id));
      backupsDeleted++;
      console.log(`  🗑️ Deleted backups for ${backup.companyName}`);
    }
  }
  
  console.log("✨ Marketing dummy data cleared!");
  return { success: true, backupsDeleted };
}

export async function getAvailableDomains(): Promise<{ domain: string; companyName: string }[]> {
  const backups = await db.selectDistinct({ companyName: conversationMinutesBackup.companyName })
    .from(conversationMinutesBackup)
    .where(eq(conversationMinutesBackup.backupStatus, "completed"));
  
  return backups
    .filter(b => b.companyName)
    .map(b => {
      const companyName = b.companyName as string;
      const domain = companyName.toLowerCase().replace(/\s+/g, "") + ".com";
      return { domain, companyName };
    });
}
