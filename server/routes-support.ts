import type { Express } from "express";
import { supportStorage } from "./storage-support";
import { authenticateToken, requireAuthenticated, withAuthenticated } from "./middleware/auth";
import { insertSupportTicketSchema } from "../shared/schema";
import { z } from "zod";

export function setupSupportRoutes(app: Express) {
  
  // Create a new support ticket
  app.post("/api/support/tickets", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      const validatedData = insertSupportTicketSchema.parse({
        ...req.body,
        userId: req.jwtUser.userId
      });

      const ticket = await supportStorage.createSupportTicket(validatedData);

      res.status(201).json(ticket);
    } catch (error: any) {
      console.error("Error creating support ticket:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  }));

  // Get user's support tickets (or all for admins)
  app.get("/api/support/tickets", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      const isAdmin = req.jwtUser.role === 'admin';
      
      let tickets;
      if (isAdmin) {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = req.query.status as string;
        
        if (status) {
          tickets = await supportStorage.getTicketsByStatus(status);
        } else {
          tickets = await supportStorage.getAllSupportTickets(limit, offset);
        }
      } else {
        tickets = await supportStorage.getUserSupportTickets(req.jwtUser.userId);
      }

      res.json(tickets);
    } catch (error: any) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  }));

  // Get a specific support ticket
  app.get("/api/support/tickets/:id", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      const ticket = await supportStorage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      const isAdmin = req.jwtUser.role === 'admin';
      const isTicketOwner = ticket.userId === req.jwtUser.userId;

      if (!isAdmin && !isTicketOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(ticket);
    } catch (error: any) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ message: "Failed to fetch support ticket" });
    }
  }));

  // Update a support ticket (admin only or ticket owner for status updates)
  app.patch("/api/support/tickets/:id", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      const ticket = await supportStorage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      const isAdmin = req.jwtUser.role === 'admin';
      const isTicketOwner = ticket.userId === req.jwtUser.userId;

      if (!isAdmin && !isTicketOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const allowedUpdates = isAdmin 
        ? req.body 
        : { status: req.body.status };

      const updatedTicket = await supportStorage.updateSupportTicket(
        req.params.id,
        allowedUpdates
      );

      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  }));

  // Assign ticket to admin (admin only)
  app.post("/api/support/tickets/:id/assign", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      if (req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { assignedTo } = req.body;

      if (!assignedTo) {
        return res.status(400).json({ message: "assignedTo field is required" });
      }

      const updatedTicket = await supportStorage.assignTicket(req.params.id, assignedTo);

      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Error assigning support ticket:", error);
      res.status(500).json({ message: "Failed to assign support ticket" });
    }
  }));

  // Resolve ticket (admin only)
  app.post("/api/support/tickets/:id/resolve", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      if (req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const updatedTicket = await supportStorage.resolveTicket(req.params.id);

      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Error resolving support ticket:", error);
      res.status(500).json({ message: "Failed to resolve support ticket" });
    }
  }));

  // Get open tickets count (admin only)
  app.get("/api/support/stats/open-count", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      if (req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const count = await supportStorage.getOpenTicketsCount();

      res.json({ count });
    } catch (error: any) {
      console.error("Error fetching open tickets count:", error);
      res.status(500).json({ message: "Failed to fetch open tickets count" });
    }
  }));
}
