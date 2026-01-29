import { db } from "./db";
import {
  supportTickets,
  authUsers,
  type SupportTicket,
  type InsertSupportTicket
} from "../shared/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";

export interface ISupportStorage {
  // Support Ticket CRUD operations
  createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: string): Promise<SupportTicket | null>;
  getUserSupportTickets(userId: string): Promise<SupportTicket[]>;
  getAllSupportTickets(limit?: number, offset?: number): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket>;
  assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket>;
  resolveTicket(ticketId: string): Promise<SupportTicket>;
  getOpenTicketsCount(): Promise<number>;
  getTicketsByStatus(status: string): Promise<SupportTicket[]>;
}

export class SupportStorage implements ISupportStorage {
  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values(data).returning();
    return ticket;
  }

  async getSupportTicket(id: string): Promise<SupportTicket | null> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket || null;
  }

  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(limit = 100, offset = 0): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const [ticket] = await db.update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket;
  }

  async assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket> {
    const [ticket] = await db.update(supportTickets)
      .set({ 
        assignedTo, 
        status: 'in_progress',
        updatedAt: new Date() 
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    return ticket;
  }

  async resolveTicket(ticketId: string): Promise<SupportTicket> {
    const [ticket] = await db.update(supportTickets)
      .set({ 
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();
    return ticket;
  }

  async getOpenTicketsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(supportTickets)
      .where(or(
        eq(supportTickets.status, 'open'),
        eq(supportTickets.status, 'in_progress')
      ));
    return Number(result[0]?.count) || 0;
  }

  async getTicketsByStatus(status: string): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.status, status))
      .orderBy(desc(supportTickets.createdAt));
  }
}

export const supportStorage = new SupportStorage();
