import type { Express, Request, Response } from "express";
import { meetingMinutesBackupService } from "./services/meeting-minutes-backup";
import { authenticateToken } from "./middleware/auth";

export function registerBackupRoutes(app: Express) {
  app.post("/api/admin/backup/run-all", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      console.log(` Starting full conversation backup requested by ${user.email}`);
      const stats = await meetingMinutesBackupService.backupAllConversations("manual");
      
      res.json({
        success: true,
        message: "Backup completed",
        stats,
      });
    } catch (error: any) {
      console.error("Error running backup:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to run backup",
      });
    }
  });

  app.post("/api/admin/backup/conversation/:conversationId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const { conversationId } = req.params;
      const result = await meetingMinutesBackupService.backupSingleConversation(conversationId, "manual");
      
      if (result.success) {
        res.json({ success: true, backup: result });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error: any) {
      console.error("Error backing up conversation:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to backup conversation",
      });
    }
  });

  app.get("/api/admin/backup/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const stats = await meetingMinutesBackupService.getBackupStats();
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error("Error getting backup stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get backup stats",
      });
    }
  });

  app.get("/api/admin/backup/list", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const backups = await meetingMinutesBackupService.getAllBackups(limit, offset);
      res.json({ success: true, backups, count: backups.length });
    } catch (error: any) {
      console.error("Error listing backups:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to list backups",
      });
    }
  });

  app.get("/api/admin/backup/:backupId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const { backupId } = req.params;
      const backup = await meetingMinutesBackupService.getBackupById(backupId);
      
      if (backup) {
        res.json({ success: true, backup });
      } else {
        res.status(404).json({ success: false, message: "Backup not found" });
      }
    } catch (error: any) {
      console.error("Error getting backup:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get backup",
      });
    }
  });

  app.get("/api/admin/backup/export/json", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const exportData = await meetingMinutesBackupService.exportToJSON();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="meeting-minutes-backup-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error: any) {
      console.error("Error exporting backups:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to export backups",
      });
    }
  });

  app.get("/api/admin/backup/marketing-insights", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).jwtUser;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const insights = await meetingMinutesBackupService.getMarketingInsights();
      res.json({ success: true, insights });
    } catch (error: any) {
      console.error("Error getting marketing insights:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get marketing insights",
      });
    }
  });

  console.log(' Backup routes registered');
}
