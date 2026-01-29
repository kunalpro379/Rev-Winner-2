import { db } from "./db";
import { callRecordings, callMeetingMinutes, authUsers } from "../shared/schema";
import type { CallRecording, InsertCallRecording, CallMeetingMinutes, InsertCallMeetingMinutes } from "../shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// ========================================
// CALL RECORDINGS & MEETING MINUTES STORAGE
// ========================================

export interface IRecordingsStorage {
  // Call Recording Management
  createCallRecording(data: InsertCallRecording): Promise<CallRecording>;
  getCallRecording(id: string): Promise<CallRecording | null>;
  getUserCallRecordings(userId: string): Promise<CallRecording[]>;
  getActiveCallRecordings(userId: string): Promise<CallRecording[]>;
  deleteCallRecording(id: string): Promise<void>;
  deleteExpiredRecordings(): Promise<number>;
  
  // Meeting Minutes Management
  createMeetingMinutes(data: InsertCallMeetingMinutes): Promise<CallMeetingMinutes>;
  getMeetingMinutes(id: string): Promise<CallMeetingMinutes | null>;
  getUserMeetingMinutes(userId: string): Promise<CallMeetingMinutes[]>;
  getActiveMeetingMinutes(userId: string): Promise<CallMeetingMinutes[]>;
  updateMeetingMinutes(id: string, data: Partial<InsertCallMeetingMinutes>): Promise<CallMeetingMinutes>;
  deleteMeetingMinutes(id: string): Promise<void>;
  deleteExpiredMeetingMinutes(): Promise<number>;
  
  // User Preferences
  toggleCallRecording(userId: string, enabled: boolean): Promise<void>;
  isCallRecordingEnabled(userId: string): Promise<boolean>;
}

export class RecordingsStorage implements IRecordingsStorage {
  // ========================================
  // CALL RECORDING MANAGEMENT
  // ========================================
  
  async createCallRecording(data: InsertCallRecording): Promise<CallRecording> {
    const [recording] = await db.insert(callRecordings).values(data).returning();
    return recording;
  }
  
  async getCallRecording(id: string): Promise<CallRecording | null> {
    const [recording] = await db
      .select()
      .from(callRecordings)
      .where(and(eq(callRecordings.id, id), eq(callRecordings.status, 'active')))
      .limit(1);
    return recording || null;
  }
  
  async getUserCallRecordings(userId: string): Promise<CallRecording[]> {
    return db
      .select()
      .from(callRecordings)
      .where(eq(callRecordings.userId, userId))
      .orderBy(desc(callRecordings.createdAt));
  }
  
  async getActiveCallRecordings(userId: string): Promise<CallRecording[]> {
    const now = new Date();
    return db
      .select()
      .from(callRecordings)
      .where(
        and(
          eq(callRecordings.userId, userId),
          eq(callRecordings.status, 'active'),
          gte(callRecordings.expiresAt, now)
        )
      )
      .orderBy(desc(callRecordings.createdAt));
  }
  
  async deleteCallRecording(id: string): Promise<void> {
    await db
      .update(callRecordings)
      .set({ 
        status: 'deleted',
        deletedAt: new Date()
      })
      .where(eq(callRecordings.id, id));
  }
  
  async deleteExpiredRecordings(): Promise<number> {
    const now = new Date();
    const result = await db
      .update(callRecordings)
      .set({ 
        status: 'deleted',
        deletedAt: now
      })
      .where(
        and(
          eq(callRecordings.status, 'active'),
          lte(callRecordings.expiresAt, now)
        )
      );
    return result.rowCount || 0;
  }
  
  // ========================================
  // MEETING MINUTES MANAGEMENT
  // ========================================
  
  async createMeetingMinutes(data: InsertCallMeetingMinutes): Promise<CallMeetingMinutes> {
    const [minutes] = await db.insert(callMeetingMinutes).values(data).returning();
    return minutes;
  }
  
  async getMeetingMinutes(id: string): Promise<CallMeetingMinutes | null> {
    const [minutes] = await db
      .select()
      .from(callMeetingMinutes)
      .where(and(eq(callMeetingMinutes.id, id), eq(callMeetingMinutes.status, 'active')))
      .limit(1);
    return minutes || null;
  }
  
  async getUserMeetingMinutes(userId: string): Promise<CallMeetingMinutes[]> {
    return db
      .select()
      .from(callMeetingMinutes)
      .where(eq(callMeetingMinutes.userId, userId))
      .orderBy(desc(callMeetingMinutes.createdAt));
  }
  
  async getActiveMeetingMinutes(userId: string): Promise<CallMeetingMinutes[]> {
    const now = new Date();
    return db
      .select()
      .from(callMeetingMinutes)
      .where(
        and(
          eq(callMeetingMinutes.userId, userId),
          eq(callMeetingMinutes.status, 'active'),
          gte(callMeetingMinutes.expiresAt, now)
        )
      )
      .orderBy(desc(callMeetingMinutes.createdAt));
  }
  
  async updateMeetingMinutes(id: string, data: Partial<InsertCallMeetingMinutes>): Promise<CallMeetingMinutes> {
    const [updatedMinutes] = await db
      .update(callMeetingMinutes)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(callMeetingMinutes.id, id))
      .returning();
    return updatedMinutes;
  }
  
  async deleteMeetingMinutes(id: string): Promise<void> {
    await db
      .update(callMeetingMinutes)
      .set({ 
        status: 'deleted',
        deletedAt: new Date()
      })
      .where(eq(callMeetingMinutes.id, id));
  }
  
  async deleteExpiredMeetingMinutes(): Promise<number> {
    const now = new Date();
    const result = await db
      .update(callMeetingMinutes)
      .set({ 
        status: 'deleted',
        deletedAt: now
      })
      .where(
        and(
          eq(callMeetingMinutes.status, 'active'),
          lte(callMeetingMinutes.expiresAt, now)
        )
      );
    return result.rowCount || 0;
  }
  
  // ========================================
  // USER PREFERENCES
  // ========================================
  
  async toggleCallRecording(userId: string, enabled: boolean): Promise<void> {
    await db
      .update(authUsers)
      .set({ 
        callRecordingEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(authUsers.id, userId));
  }
  
  async isCallRecordingEnabled(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ enabled: authUsers.callRecordingEnabled })
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);
    return user?.enabled || false;
  }
}

export const recordingsStorage = new RecordingsStorage();
