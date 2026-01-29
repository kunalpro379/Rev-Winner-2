import { type Conversation, type InsertConversation, type Message, type InsertMessage, type TeamsMeeting, type InsertTeamsMeeting, type AudioSource, type InsertAudioSource, type User, type UpsertUser, type SessionUsage, type InsertSessionUsage, type Lead, type InsertLead, type DomainExpertise, type InsertDomainExpertise, type UpdateDomainExpertise, type TrainingDocument, type InsertTrainingDocument, type SubscriptionPlan, type InsertSubscriptionPlan, type Addon, type InsertAddon, type ConversationMemory, type InsertConversationMemory, type UserProfile, type InsertUserProfile, type KnowledgeEntry, type InsertKnowledgeEntry, AUDIO_SOURCE_TYPES } from "../shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations - IMPORTANT: these are mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Conversation management
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(sessionId: string): Promise<Conversation | undefined>;
  updateConversation(sessionId: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  endConversation(sessionId: string, summary: string): Promise<Conversation | undefined>;
  
  // Message management
  addMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
  
  // Teams meeting management
  createTeamsMeeting(meeting: InsertTeamsMeeting): Promise<TeamsMeeting>;
  getTeamsMeeting(conversationId: string): Promise<TeamsMeeting | undefined>;
  updateTeamsMeeting(id: string, updates: Partial<TeamsMeeting>): Promise<TeamsMeeting | undefined>;
  
  // Audio source management
  createAudioSource(source: InsertAudioSource): Promise<AudioSource>;
  getAudioSources(conversationId: string): Promise<AudioSource[]>;
  updateAudioSource(id: string, updates: Partial<AudioSource>): Promise<AudioSource | undefined>;
  getDefaultAudioSource(conversationId: string): Promise<AudioSource>;
  
  // Discovery insights
  updateDiscoveryInsights(sessionId: string, insights: any): Promise<void>;
  
  // Session usage tracking
  createSessionUsage(usage: InsertSessionUsage): Promise<SessionUsage>;
  getSessionUsage(sessionId: string, userId: string): Promise<SessionUsage | undefined>;
  updateSessionUsage(sessionId: string, userId: string, updates: Partial<SessionUsage>): Promise<SessionUsage | undefined>;
  getUserSessionUsage(userId: string): Promise<SessionUsage[]>;
  
  // Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Train Me feature - Domain Expertise management
  createDomainExpertise(domain: InsertDomainExpertise): Promise<DomainExpertise>;
  getUserDomainExpertises(userId: string): Promise<DomainExpertise[]>;
  getDomainExpertise(id: string, userId: string): Promise<DomainExpertise | undefined>;
  getDomainExpertiseByName(name: string, userId: string): Promise<DomainExpertise | undefined>;
  updateDomainExpertise(id: string, userId: string, updates: UpdateDomainExpertise): Promise<DomainExpertise | undefined>;
  deleteDomainExpertise(id: string, userId: string): Promise<void>;
  
  // Train Me feature - Training Documents management
  createTrainingDocument(document: InsertTrainingDocument): Promise<TrainingDocument>;
  getTrainingDocumentsByDomain(domainId: string, userId: string): Promise<TrainingDocument[]>;
  getAllUserTrainingDocuments(userId: string): Promise<TrainingDocument[]>;
  countUserTrainingDocuments(userId: string): Promise<number>;
  getTrainingDocument(id: string, userId: string): Promise<TrainingDocument | undefined>;
  updateTrainingDocument(id: string, userId: string, updates: Partial<TrainingDocument>): Promise<TrainingDocument | undefined>;
  deleteTrainingDocument(id: string, userId: string): Promise<void>;
  searchTrainingDocuments(userId: string, query: string, domainId?: string): Promise<TrainingDocument[]>;
  
  // Knowledge Base management
  createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry>;
  getKnowledgeEntriesByDomain(domainId: string, userId: string): Promise<KnowledgeEntry[]>;
  getAllUserKnowledgeEntries(userId: string): Promise<KnowledgeEntry[]>;
  getKnowledgeEntry(id: string, userId: string): Promise<KnowledgeEntry | undefined>;
  updateKnowledgeEntry(id: string, userId: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry | undefined>;
  updateKnowledgeEntryEmbedding(id: string, embedding: number[]): Promise<void>;
  deleteKnowledgeEntry(id: string, userId: string): Promise<void>;
  deleteKnowledgeEntriesByDomain(domainId: string, userId: string): Promise<void>;
  searchKnowledgeEntries(userId: string, query: string, category?: string): Promise<KnowledgeEntry[]>;
  
  // Subscription Plan management
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: string): Promise<boolean>;
  planHasActiveSubscriptions(planId: string): Promise<boolean>;
  
  // Add-on management
  getAllAddons(): Promise<Addon[]>;
  createAddon(addon: InsertAddon): Promise<Addon>;
  updateAddon(id: string, updates: Partial<Addon>): Promise<Addon | undefined>;
  deleteAddon(id: string): Promise<boolean>;
  addonIsReferencedByPlans(addonId: string): Promise<boolean>;
  
  // Conversation Memory management
  createConversationMemory(memory: InsertConversationMemory): Promise<ConversationMemory>;
  getConversationMemory(conversationId: string): Promise<ConversationMemory | undefined>;
  updateConversationMemory(conversationId: string, updates: Partial<ConversationMemory>): Promise<ConversationMemory | undefined>;
  
  // User Profile management
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile & { userId: string }): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message[]>;
  private teamsMeetings: Map<string, TeamsMeeting>;
  private audioSources: Map<string, AudioSource[]>;
  private sessionUsage: Map<string, SessionUsage>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.teamsMeetings = new Map();
    this.audioSources = new Map();
    this.sessionUsage = new Map();
  }

  // User operations - IMPORTANT: these are mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      userId: insertConversation.userId || null,
      status: "active",
      discoveryInsights: {},
      callSummary: null,
      createdAt: new Date(),
      endedAt: null,
      clientName: insertConversation.clientName || null,
    };
    
    this.conversations.set(insertConversation.sessionId, conversation);
    this.messages.set(id, []);
    
    return conversation;
  }

  async getConversation(sessionId: string): Promise<Conversation | undefined> {
    return this.conversations.get(sessionId);
  }

  async updateConversation(sessionId: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates };
    this.conversations.set(sessionId, updated);
    return updated;
  }

  async endConversation(sessionId: string, summary: string): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return undefined;
    
    const updated = {
      ...conversation,
      status: "ended" as const,
      callSummary: summary,
      endedAt: new Date(),
    };
    
    this.conversations.set(sessionId, updated);
    return updated;
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      audioSourceId: insertMessage.audioSourceId || null,
      speakerLabel: insertMessage.speakerLabel ?? null,
      timestamp: new Date(),
    };
    
    const conversationMessages = this.messages.get(insertMessage.conversationId) || [];
    conversationMessages.push(message);
    this.messages.set(insertMessage.conversationId, conversationMessages);
    
    return message;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messages.get(conversationId) || [];
  }

  async updateDiscoveryInsights(sessionId: string, insights: any): Promise<void> {
    const conversation = this.conversations.get(sessionId);
    if (conversation) {
      conversation.discoveryInsights = insights;
      this.conversations.set(sessionId, conversation);
    }
  }

  // Teams meeting management
  async createTeamsMeeting(insertMeeting: InsertTeamsMeeting): Promise<TeamsMeeting> {
    const id = randomUUID();
    const meeting: TeamsMeeting = {
      id,
      conversationId: insertMeeting.conversationId,
      meetingId: insertMeeting.meetingId || null,
      meetingTitle: insertMeeting.meetingTitle || null,
      organizerId: insertMeeting.organizerId || null,
      startTime: insertMeeting.startTime || null,
      endTime: insertMeeting.endTime || null,
      recordingUrl: null,
      transcriptUrl: null,
      status: "active",
      participants: insertMeeting.participants || [],
      metadata: {},
      createdAt: new Date(),
    };
    
    this.teamsMeetings.set(insertMeeting.conversationId, meeting);
    return meeting;
  }

  async getTeamsMeeting(conversationId: string): Promise<TeamsMeeting | undefined> {
    return this.teamsMeetings.get(conversationId);
  }

  async updateTeamsMeeting(id: string, updates: Partial<TeamsMeeting>): Promise<TeamsMeeting | undefined> {
    // Find meeting by ID across all conversations
    for (const [conversationId, meeting] of Array.from(this.teamsMeetings.entries())) {
      if (meeting.id === id) {
        const updated = { ...meeting, ...updates };
        this.teamsMeetings.set(conversationId, updated);
        return updated;
      }
    }
    return undefined;
  }

  // Audio source management
  async createAudioSource(insertSource: InsertAudioSource): Promise<AudioSource> {
    const id = randomUUID();
    const source: AudioSource = {
      id,
      conversationId: insertSource.conversationId,
      sourceType: insertSource.sourceType,
      sourceId: insertSource.sourceId || null,
      teamsMeetingId: insertSource.teamsMeetingId || null,
      status: "active",
      metadata: insertSource.metadata || {},
      connectedAt: new Date(),
      disconnectedAt: null,
    };
    
    const conversationSources = this.audioSources.get(insertSource.conversationId) || [];
    conversationSources.push(source);
    this.audioSources.set(insertSource.conversationId, conversationSources);
    
    return source;
  }

  async getAudioSources(conversationId: string): Promise<AudioSource[]> {
    return this.audioSources.get(conversationId) || [];
  }

  async updateAudioSource(id: string, updates: any): Promise<AudioSource | undefined> {
    // Find source by ID across all conversations
    for (const [conversationId, sources] of Array.from(this.audioSources.entries())) {
      const sourceIndex = sources.findIndex((s: AudioSource) => s.id === id);
      if (sourceIndex !== -1) {
        const current = sources[sourceIndex];
        
        // Handle metadata merging separately to preserve existing data
        let mergedMetadata = current.metadata;
        if (updates.metadataUpdates) {
          mergedMetadata = {
            ...(current.metadata as object || {}),
            ...(updates.metadataUpdates || {})
          };
          // Remove metadataUpdates from main updates object
          const { metadataUpdates, ...restUpdates } = updates;
          updates = restUpdates;
        }
        
        const updated = { 
          ...current, 
          ...(updates || {}),
          metadata: mergedMetadata
        };
        
        sources[sourceIndex] = updated;
        this.audioSources.set(conversationId, sources);
        return updated;
      }
    }
    return undefined;
  }

  async getDefaultAudioSource(conversationId: string): Promise<AudioSource> {
    // Get or create default device microphone audio source
    const sources = await this.getAudioSources(conversationId);
    const deviceSource = sources.find(s => s.sourceType === AUDIO_SOURCE_TYPES.DEVICE_MICROPHONE);
    
    if (deviceSource) {
      return deviceSource;
    }
    
    // Create default device microphone source
    return this.createAudioSource({
      conversationId,
      sourceType: AUDIO_SOURCE_TYPES.DEVICE_MICROPHONE,
      sourceId: "device-microphone",
      metadata: { name: "Device Microphone" }
    });
  }

  // Session usage tracking
  async createSessionUsage(insertUsage: InsertSessionUsage): Promise<SessionUsage> {
    const { db } = await import("./db");
    const { sessionUsage: sessionUsageTable } = await import("@shared/schema");
    
    // Insert into database for persistence
    const [usage] = await db.insert(sessionUsageTable).values({
      userId: insertUsage.userId,
      sessionId: insertUsage.sessionId,
      startTime: insertUsage.startTime,
      endTime: insertUsage.endTime || null,
      durationSeconds: insertUsage.durationSeconds || null,
      status: insertUsage.status || "active",
    }).returning();
    
    // Also keep in memory for fast access
    this.sessionUsage.set(`${insertUsage.userId}_${insertUsage.sessionId}`, usage);
    return usage;
  }

  async getSessionUsage(sessionId: string, userId: string): Promise<SessionUsage | undefined> {
    // Try memory first
    const memoryUsage = this.sessionUsage.get(`${userId}_${sessionId}`);
    if (memoryUsage) return memoryUsage;
    
    // Fallback to database
    const { db } = await import("./db");
    const { sessionUsage: sessionUsageTable } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [usage] = await db.select()
      .from(sessionUsageTable)
      .where(and(
        eq(sessionUsageTable.userId, userId),
        eq(sessionUsageTable.sessionId, sessionId)
      ))
      .limit(1);
    
    if (usage) {
      this.sessionUsage.set(`${userId}_${sessionId}`, usage);
    }
    return usage;
  }

  async updateSessionUsage(sessionId: string, userId: string, updates: Partial<SessionUsage>): Promise<SessionUsage | undefined> {
    const { db } = await import("./db");
    const { sessionUsage: sessionUsageTable } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    // Update in database
    const [updated] = await db.update(sessionUsageTable)
      .set(updates)
      .where(and(
        eq(sessionUsageTable.userId, userId),
        eq(sessionUsageTable.sessionId, sessionId)
      ))
      .returning();
    
    if (updated) {
      // Update memory cache
      const key = `${userId}_${sessionId}`;
      this.sessionUsage.set(key, updated);
    }
    
    return updated;
  }

  async getUserSessionUsage(userId: string): Promise<SessionUsage[]> {
    const { db } = await import("./db");
    const { sessionUsage: sessionUsageTable } = await import("@shared/schema");
    const { eq, desc } = await import("drizzle-orm");
    
    // Get from database (source of truth)
    const allUsage = await db.select()
      .from(sessionUsageTable)
      .where(eq(sessionUsageTable.userId, userId))
      .orderBy(desc(sessionUsageTable.startTime));
    
    return allUsage;
  }
  
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const { db } = await import("./db");
    const { leads } = await import("@shared/schema");
    
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }
  
  // Train Me feature - Domain Expertise management
  async createDomainExpertise(insertDomain: InsertDomainExpertise): Promise<DomainExpertise> {
    const { db } = await import("./db");
    const { domainExpertise } = await import("@shared/schema");
    
    const [domain] = await db.insert(domainExpertise).values(insertDomain).returning();
    return domain;
  }
  
  async getUserDomainExpertises(userId: string): Promise<DomainExpertise[]> {
    const { db } = await import("./db");
    const { domainExpertise } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const domains = await db.select()
      .from(domainExpertise)
      .where(and(
        eq(domainExpertise.userId, userId),
        eq(domainExpertise.isActive, true)
      ));
    return domains;
  }
  
  async getDomainExpertise(id: string, userId: string): Promise<DomainExpertise | undefined> {
    const { db } = await import("./db");
    const { domainExpertise } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [domain] = await db.select()
      .from(domainExpertise)
      .where(and(
        eq(domainExpertise.id, id),
        eq(domainExpertise.userId, userId)
      ));
    return domain;
  }
  
  async getDomainExpertiseByName(name: string, userId: string): Promise<DomainExpertise | undefined> {
    const { db } = await import("./db");
    const { domainExpertise } = await import("@shared/schema");
    const { eq, and, ilike } = await import("drizzle-orm");
    
    const [domain] = await db.select()
      .from(domainExpertise)
      .where(and(
        ilike(domainExpertise.name, name),
        eq(domainExpertise.userId, userId),
        eq(domainExpertise.isActive, true)
      ));
    return domain;
  }
  
  async updateDomainExpertise(id: string, userId: string, updates: UpdateDomainExpertise): Promise<DomainExpertise | undefined> {
    const { db } = await import("./db");
    const { domainExpertise } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [updated] = await db.update(domainExpertise)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(domainExpertise.id, id),
        eq(domainExpertise.userId, userId)
      ))
      .returning();
    return updated;
  }
  
  async deleteDomainExpertise(id: string, userId: string): Promise<void> {
    const { db } = await import("./db");
    const { domainExpertise } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    await db.update(domainExpertise)
      .set({ isActive: false })
      .where(and(
        eq(domainExpertise.id, id),
        eq(domainExpertise.userId, userId)
      ));
  }
  
  // Train Me feature - Training Documents management
  async createTrainingDocument(insertDoc: InsertTrainingDocument): Promise<TrainingDocument> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    
    const [document] = await db.insert(trainingDocuments).values(insertDoc).returning();
    return document;
  }
  
  async getTrainingDocumentsByDomain(domainId: string, userId: string): Promise<TrainingDocument[]> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const documents = await db.select()
      .from(trainingDocuments)
      .where(and(
        eq(trainingDocuments.domainExpertiseId, domainId),
        eq(trainingDocuments.userId, userId)
      ));
    return documents;
  }
  
  async getAllUserTrainingDocuments(userId: string): Promise<TrainingDocument[]> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const documents = await db.select()
      .from(trainingDocuments)
      .where(eq(trainingDocuments.userId, userId));
    return documents;
  }
  
  async countUserTrainingDocuments(userId: string): Promise<number> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    const { eq, count } = await import("drizzle-orm");
    
    const result = await db.select({ count: count() })
      .from(trainingDocuments)
      .where(eq(trainingDocuments.userId, userId));
    // Convert BigInt to Number for JavaScript arithmetic
    const countValue = result[0]?.count;
    return countValue ? Number(countValue) : 0;
  }
  
  async getTrainingDocument(id: string, userId: string): Promise<TrainingDocument | undefined> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [document] = await db.select()
      .from(trainingDocuments)
      .where(and(
        eq(trainingDocuments.id, id),
        eq(trainingDocuments.userId, userId)
      ));
    return document;
  }
  
  async updateTrainingDocument(id: string, userId: string, updates: Partial<TrainingDocument>): Promise<TrainingDocument | undefined> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [updated] = await db.update(trainingDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(trainingDocuments.id, id),
        eq(trainingDocuments.userId, userId)
      ))
      .returning();
    return updated;
  }
  
  async deleteTrainingDocument(id: string, userId: string): Promise<void> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    await db.delete(trainingDocuments)
      .where(and(
        eq(trainingDocuments.id, id),
        eq(trainingDocuments.userId, userId)
      ));
  }
  
  async searchTrainingDocuments(userId: string, query: string, domainId?: string): Promise<TrainingDocument[]> {
    const { db } = await import("./db");
    const { trainingDocuments } = await import("@shared/schema");
    const { eq, and, ilike, or } = await import("drizzle-orm");
    
    const conditions = [eq(trainingDocuments.userId, userId)];
    
    if (domainId) {
      conditions.push(eq(trainingDocuments.domainExpertiseId, domainId));
    }
    
    // Search in fileName, content, and summary
    const searchPattern = `%${query}%`;
    conditions.push(
      or(
        ilike(trainingDocuments.fileName, searchPattern),
        ilike(trainingDocuments.content, searchPattern),
        ilike(trainingDocuments.summary, searchPattern)
      )!
    );
    
    const documents = await db.select()
      .from(trainingDocuments)
      .where(and(...conditions));
    return documents;
  }
  
  // Knowledge Base management
  async createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    
    const [created] = await db.insert(knowledgeEntries).values(entry).returning();
    return created;
  }
  
  async getKnowledgeEntriesByDomain(domainId: string, userId: string): Promise<KnowledgeEntry[]> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const entries = await db.select()
      .from(knowledgeEntries)
      .where(and(
        eq(knowledgeEntries.domainExpertiseId, domainId),
        eq(knowledgeEntries.userId, userId)
      ));
    return entries;
  }
  
  async getAllUserKnowledgeEntries(userId: string): Promise<KnowledgeEntry[]> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const entries = await db.select()
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.userId, userId));
    return entries;
  }
  
  async getKnowledgeEntry(id: string, userId: string): Promise<KnowledgeEntry | undefined> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [entry] = await db.select()
      .from(knowledgeEntries)
      .where(and(
        eq(knowledgeEntries.id, id),
        eq(knowledgeEntries.userId, userId)
      ));
    return entry;
  }
  
  async updateKnowledgeEntry(id: string, userId: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry | undefined> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const [updated] = await db.update(knowledgeEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(knowledgeEntries.id, id),
        eq(knowledgeEntries.userId, userId)
      ))
      .returning();
    return updated;
  }

  async updateKnowledgeEntryEmbedding(id: string, embedding: number[]): Promise<void> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(knowledgeEntries)
      .set({ embedding, updatedAt: new Date() })
      .where(eq(knowledgeEntries.id, id));
  }
  
  async deleteKnowledgeEntry(id: string, userId: string): Promise<void> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    await db.delete(knowledgeEntries)
      .where(and(
        eq(knowledgeEntries.id, id),
        eq(knowledgeEntries.userId, userId)
      ));
  }
  
  async deleteKnowledgeEntriesByDomain(domainId: string, userId: string): Promise<void> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    await db.delete(knowledgeEntries)
      .where(and(
        eq(knowledgeEntries.domainExpertiseId, domainId),
        eq(knowledgeEntries.userId, userId)
      ));
  }
  
  async searchKnowledgeEntries(userId: string, query: string, category?: string): Promise<KnowledgeEntry[]> {
    const { db } = await import("./db");
    const { knowledgeEntries } = await import("@shared/schema");
    const { eq, and, ilike, or } = await import("drizzle-orm");
    
    const conditions = [eq(knowledgeEntries.userId, userId)];
    
    if (category) {
      conditions.push(eq(knowledgeEntries.category, category));
    }
    
    const searchPattern = `%${query}%`;
    conditions.push(
      or(
        ilike(knowledgeEntries.title, searchPattern),
        ilike(knowledgeEntries.content, searchPattern)
      )!
    );
    
    const entries = await db.select()
      .from(knowledgeEntries)
      .where(and(...conditions));
    return entries;
  }
  
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { db } = await import("./db");
    const { subscriptionPlans } = await import("@shared/schema");
    
    const plans = await db.select().from(subscriptionPlans);
    return plans;
  }
  
  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const { db } = await import("./db");
    const { subscriptionPlans } = await import("@shared/schema");
    
    const [newPlan] = await db.insert(subscriptionPlans)
      .values(planData)
      .returning();
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const { db } = await import("./db");
    const { subscriptionPlans } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }
  
  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    const { db } = await import("./db");
    const { subscriptionPlans } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return result.length > 0;
  }
  
  async planHasActiveSubscriptions(planId: string): Promise<boolean> {
    const { db } = await import("./db");
    const { subscriptions } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const activeSubscriptions = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.planId, planId),
        eq(subscriptions.status, "active")
      ))
      .limit(1);
    
    return activeSubscriptions.length > 0;
  }
  
  async getAllAddons(): Promise<Addon[]> {
    const { db } = await import("./db");
    const { addons } = await import("@shared/schema");
    
    const allAddons = await db.select().from(addons);
    return allAddons;
  }
  
  async createAddon(addonData: InsertAddon): Promise<Addon> {
    const { db } = await import("./db");
    const { addons } = await import("@shared/schema");
    
    const [newAddon] = await db.insert(addons)
      .values(addonData)
      .returning();
    return newAddon;
  }
  
  async updateAddon(id: string, updates: Partial<Addon>): Promise<Addon | undefined> {
    const { db } = await import("./db");
    const { addons } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [updated] = await db.update(addons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(addons.id, id))
      .returning();
    return updated;
  }
  
  async deleteAddon(id: string): Promise<boolean> {
    const { db } = await import("./db");
    const { addons } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.delete(addons)
      .where(eq(addons.id, id))
      .returning();
    return result.length > 0;
  }
  
  async addonIsReferencedByPlans(addonId: string): Promise<boolean> {
    const { db } = await import("./db");
    const { subscriptionPlans } = await import("@shared/schema");
    const { sql } = await import("drizzle-orm");
    
    // Check if any plan references this addon in their requiredAddons JSON array
    const referencingPlans = await db.select()
      .from(subscriptionPlans)
      .where(sql`${subscriptionPlans.requiredAddons}::text LIKE ${'%' + addonId + '%'}`)
      .limit(1);
    
    return referencingPlans.length > 0;
  }
  
  async createConversationMemory(memory: InsertConversationMemory): Promise<ConversationMemory> {
    throw new Error("MemStorage does not support conversation memory. Use PostgreSQL storage.");
  }
  
  async getConversationMemory(conversationId: string): Promise<ConversationMemory | undefined> {
    return undefined;
  }
  
  async updateConversationMemory(conversationId: string, updates: Partial<ConversationMemory>): Promise<ConversationMemory | undefined> {
    return undefined;
  }
  
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return undefined;
  }
  
  async upsertUserProfile(profile: InsertUserProfile & { userId: string }): Promise<UserProfile> {
    throw new Error("MemStorage does not support user profiles. Use PostgreSQL storage.");
  }
  
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    return undefined;
  }
}

export const storage = new MemStorage();
