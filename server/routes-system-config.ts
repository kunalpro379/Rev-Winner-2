import type { Express } from "express";
import { z } from "zod";
import { db } from "./db";
import { systemConfig } from "@shared/schema";
import { eq } from "drizzle-orm";
import { authenticateToken } from "./middleware/auth";
import { sendErrorResponse } from "./utils/error-handler";

export function setupSystemConfigRoutes(app: Express) {
  // Get all system configuration
  app.get("/api/admin/system-config", authenticateToken, async (req: any, res) => {
    try {
      const role = req.jwtUser?.role;
      
      if (role !== 'admin' && role !== 'super_admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Fetch all config entries
      const configs = await db.select().from(systemConfig);
      
      // Group by section
      const grouped: Record<string, any> = {
        email: {},
        payment: {},
        ai: {},
        system: {},
        security: {}
      };
      
      configs.forEach(config => {
        const section = config.section || 'system';
        if (!grouped[section]) {
          grouped[section] = {};
        }
        // Don't send sensitive values, just indicate they exist
        if (config.key.includes('password') || config.key.includes('secret') || config.key.includes('key')) {
          grouped[section][config.key] = config.value ? '••••••••' : '';
        } else {
          grouped[section][config.key] = config.value;
        }
      });

      res.json(grouped);
    } catch (error: any) {
      console.error("[SystemConfig] Get error:", error);
      sendErrorResponse(res, error, "Failed to fetch configuration");
    }
  });

  // Update configuration section
  app.put("/api/admin/system-config/:section", authenticateToken, async (req: any, res) => {
    try {
      const role = req.jwtUser?.role;
      const userId = req.jwtUser?.userId;
      const { section } = req.params;
      
      if (role !== 'admin' && role !== 'super_admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validSections = ['email', 'payment', 'ai', 'system', 'security'];
      if (!validSections.includes(section)) {
        return res.status(400).json({ error: "Invalid configuration section" });
      }

      const data = req.body;
      
      // Update or insert each config key
      for (const [key, value] of Object.entries(data)) {
        // Skip empty password/secret fields (means keep existing)
        if ((key.includes('password') || key.includes('secret') || key.includes('key')) && !value) {
          continue;
        }

        const [existing] = await db
          .select()
          .from(systemConfig)
          .where(eq(systemConfig.key, key))
          .limit(1);

        if (existing) {
          await db
            .update(systemConfig)
            .set({
              value: String(value),
              section,
              updatedAt: new Date(),
              updatedBy: userId
            })
            .where(eq(systemConfig.id, existing.id));
        } else {
          await db.insert(systemConfig).values({
            key,
            value: String(value),
            section,
            updatedBy: userId
          });
        }
      }

      res.json({ success: true, message: "Configuration updated successfully" });
    } catch (error: any) {
      console.error("[SystemConfig] Update error:", error);
      sendErrorResponse(res, error, "Failed to update configuration");
    }
  });

  // Get specific config value
  app.get("/api/admin/system-config/:section/:key", authenticateToken, async (req: any, res) => {
    try {
      const role = req.jwtUser?.role;
      const { section, key } = req.params;
      
      if (role !== 'admin' && role !== 'super_admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const [config] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, key))
        .limit(1);

      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }

      // Don't send sensitive values
      if (key.includes('password') || key.includes('secret') || key.includes('key')) {
        return res.json({ key, value: '••••••••', section: config.section });
      }

      res.json({ key, value: config.value, section: config.section });
    } catch (error: any) {
      console.error("[SystemConfig] Get key error:", error);
      sendErrorResponse(res, error, "Failed to fetch configuration");
    }
  });

  // Delete configuration
  app.delete("/api/admin/system-config/:key", authenticateToken, async (req: any, res) => {
    try {
      const role = req.jwtUser?.role;
      const { key } = req.params;
      
      if (role !== 'super_admin') {
        return res.status(403).json({ error: "Super admin access required" });
      }

      await db.delete(systemConfig).where(eq(systemConfig.key, key));

      res.json({ success: true, message: "Configuration deleted successfully" });
    } catch (error: any) {
      console.error("[SystemConfig] Delete error:", error);
      sendErrorResponse(res, error, "Failed to delete configuration");
    }
  });
}
