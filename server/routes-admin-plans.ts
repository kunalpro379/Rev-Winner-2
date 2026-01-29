import { Router, type Request, type Response } from "express";
import { requireAdmin } from "./middleware/auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertSubscriptionPlanSchema, insertAddonSchema } from "../shared/schema";

// Partial schemas for update operations
const updateSubscriptionPlanSchema = insertSubscriptionPlanSchema.partial();
const updateAddonSchema = insertAddonSchema.partial();

export function setupAdminPlansRoutes(app: Router) {

  // GET /api/admin/subscription-plans - List all subscription plans
  app.get("/api/admin/subscription-plans", requireAdmin, async (req: Request, res: Response) => {
  try {
    const plans = await storage.getAllSubscriptionPlans();
    return res.status(200).json({ plans });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return res.status(500).json({ message: "Failed to fetch subscription plans" });
  }
});

  // POST /api/admin/subscription-plans - Create new subscription plan
  app.post("/api/admin/subscription-plans", requireAdmin, async (req: Request, res: Response) => {
  try {
    const planData = insertSubscriptionPlanSchema.parse(req.body);
    
    const newPlan = await storage.createSubscriptionPlan(planData);
    return res.status(201).json({ plan: newPlan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({ message: "Failed to create subscription plan" });
  }
});

  // PATCH /api/admin/subscription-plans/:id - Update subscription plan
  app.patch("/api/admin/subscription-plans/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate update data using partial schema
    const validationResult = updateSubscriptionPlanSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationResult.error.errors 
      });
    }
    
    const updateData = validationResult.data;
    
    const updatedPlan = await storage.updateSubscriptionPlan(id, updateData);
    if (!updatedPlan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    return res.status(200).json({ plan: updatedPlan });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return res.status(500).json({ message: "Failed to update subscription plan" });
  }
});

  // DELETE /api/admin/subscription-plans/:id - Delete subscription plan
  app.delete("/api/admin/subscription-plans/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if plan has active subscriptions
    const hasActiveSubscriptions = await storage.planHasActiveSubscriptions(id);
    if (hasActiveSubscriptions) {
      return res.status(400).json({ 
        message: "Cannot delete plan with active subscriptions. Please deactivate the plan instead." 
      });
    }
    
    const deleted = await storage.deleteSubscriptionPlan(id);
    if (!deleted) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    return res.status(200).json({ message: "Subscription plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return res.status(500).json({ message: "Failed to delete subscription plan" });
  }
});

  // GET /api/admin/addons - List all add-ons
  app.get("/api/admin/addons", requireAdmin, async (req: Request, res: Response) => {
  try {
    const addons = await storage.getAllAddons();
    return res.status(200).json({ addons });
  } catch (error) {
    console.error("Error fetching addons:", error);
    return res.status(500).json({ message: "Failed to fetch addons" });
  }
});

  // POST /api/admin/addons - Create new add-on
  app.post("/api/admin/addons", requireAdmin, async (req: Request, res: Response) => {
  try {
    const addonData = insertAddonSchema.parse(req.body);
    
    const newAddon = await storage.createAddon(addonData);
    return res.status(201).json({ addon: newAddon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating addon:", error);
    return res.status(500).json({ message: "Failed to create addon" });
  }
});

  // PATCH /api/admin/addons/:id - Update add-on
  app.patch("/api/admin/addons/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate update data using partial schema
    const validationResult = updateAddonSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationResult.error.errors 
      });
    }
    
    const updateData = validationResult.data;
    
    const updatedAddon = await storage.updateAddon(id, updateData);
    if (!updatedAddon) {
      return res.status(404).json({ message: "Add-on not found" });
    }
    
    return res.status(200).json({ addon: updatedAddon });
  } catch (error) {
    console.error("Error updating addon:", error);
    return res.status(500).json({ message: "Failed to update addon" });
  }
});

  // DELETE /api/admin/addons/:id - Delete add-on
  app.delete("/api/admin/addons/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if addon is referenced by any plan
    const isReferencedByPlans = await storage.addonIsReferencedByPlans(id);
    if (isReferencedByPlans) {
      return res.status(400).json({ 
        message: "Cannot delete add-on that is referenced by subscription plans. Please update or remove those plans first." 
      });
    }
    
    const deleted = await storage.deleteAddon(id);
    if (!deleted) {
      return res.status(404).json({ message: "Add-on not found" });
    }
    
    return res.status(200).json({ message: "Add-on deleted successfully" });
  } catch (error) {
    console.error("Error deleting addon:", error);
    return res.status(500).json({ message: "Failed to delete addon" });
  }
  });
}
