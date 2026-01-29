import { Router, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { apiKeys, apiKeyUsageLogs, authUsers } from "@shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { authenticateToken, requireAdmin } from "./middleware/auth";
import crypto from "crypto";

const router = Router();

const API_KEY_PREFIX = "rw_";
const API_KEY_LENGTH = 32;

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function getWindowDuration(window: string): number {
  switch (window) {
    case "minute": return 60 * 1000;
    case "hour": return 60 * 60 * 1000;
    case "day": return 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function checkRateLimit(keyId: string, limit: number, window: string): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = getWindowDuration(window);
  const now = Date.now();
  const entry = rateLimitStore.get(keyId);
  
  if (!entry || (now - entry.windowStart) >= windowMs) {
    rateLimitStore.set(keyId, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  
  if (entry.count >= limit) {
    const resetAt = entry.windowStart + windowMs;
    return { allowed: false, remaining: 0, resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.windowStart + windowMs };
}

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const keyBody = randomBytes.toString("base64url").substring(0, API_KEY_LENGTH);
  const fullKey = `${API_KEY_PREFIX}${keyBody}`;
  const prefix = fullKey.substring(0, 10);
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");
  return { key: fullKey, prefix, hash };
}

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; keyData?: any; error?: string }> {
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: "Invalid API key format" };
  }

  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  
  const [keyRecord] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!keyRecord) {
    return { valid: false, error: "API key not found" };
  }

  if (keyRecord.status !== "active") {
    return { valid: false, error: "API key is not active" };
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  return { valid: true, keyData: keyRecord };
}

async function incrementUsageCount(keyId: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      usageCount: sql`${apiKeys.usageCount} + 1`,
    })
    .where(eq(apiKeys.id, keyId));
}

export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: "API key required", code: "API_KEY_MISSING" });
  }

  const startTime = Date.now();
  const result = await validateApiKey(apiKey);
  
  if (!result.valid) {
    return res.status(401).json({ error: result.error, code: "API_KEY_INVALID" });
  }

  const keyData = result.keyData;

  if (keyData?.ipWhitelist?.length > 0) {
    const clientIp = req.ip || req.socket.remoteAddress;
    if (!keyData.ipWhitelist.includes(clientIp)) {
      return res.status(403).json({ error: "IP not whitelisted", code: "IP_NOT_ALLOWED" });
    }
  }

  const rateCheck = checkRateLimit(keyData.id, keyData.rateLimit || 1000, keyData.rateLimitWindow || "hour");
  
  res.setHeader("X-RateLimit-Limit", keyData.rateLimit || 1000);
  res.setHeader("X-RateLimit-Remaining", rateCheck.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(rateCheck.resetAt / 1000));
  
  if (!rateCheck.allowed) {
    return res.status(429).json({ 
      error: "Rate limit exceeded", 
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
    });
  }

  await incrementUsageCount(keyData.id);

  (req as any).apiKey = keyData;

  res.on("finish", async () => {
    try {
      await db.insert(apiKeyUsageLogs).values({
        apiKeyId: keyData.id,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: Date.now() - startTime,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
      });
    } catch (err) {
      console.error("Failed to log API key usage:", err);
    }
  });

  next();
}

router.get("/", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdBy: apiKeys.createdBy,
        organizationId: apiKeys.organizationId,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        rateLimitWindow: apiKeys.rateLimitWindow,
        status: apiKeys.status,
        lastUsedAt: apiKeys.lastUsedAt,
        usageCount: apiKeys.usageCount,
        expiresAt: apiKeys.expiresAt,
        ipWhitelist: apiKeys.ipWhitelist,
        createdAt: apiKeys.createdAt,
        revokedAt: apiKeys.revokedAt,
        creatorEmail: authUsers.email,
        creatorFirstName: authUsers.firstName,
        creatorLastName: authUsers.lastName,
      })
      .from(apiKeys)
      .leftJoin(authUsers, eq(apiKeys.createdBy, authUsers.id))
      .orderBy(desc(apiKeys.createdAt));

    res.json(keys);
  } catch (error: any) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

router.post("/", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, scopes, rateLimit, rateLimitWindow, expiresAt, ipWhitelist, organizationId, metadata } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "API key name is required" });
    }

    const { key, prefix, hash } = generateApiKey();

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        name: name.trim(),
        keyPrefix: prefix,
        keyHash: hash,
        createdBy: req.jwtUser!.userId,
        organizationId: organizationId || null,
        scopes: scopes || ["read", "write"],
        rateLimit: rateLimit || 1000,
        rateLimitWindow: rateLimitWindow || "hour",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        ipWhitelist: ipWhitelist || null,
        metadata: metadata || {},
      })
      .returning();

    res.status(201).json({
      message: "API key created successfully",
      apiKey: key,
      keyId: newKey.id,
      name: newKey.name,
      prefix: prefix,
      warning: "Store this API key securely. It will not be shown again.",
    });
  } catch (error: any) {
    console.error("Error creating API key:", error);
    res.status(500).json({ error: "Failed to create API key" });
  }
});

router.get("/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [keyData] = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdBy: apiKeys.createdBy,
        organizationId: apiKeys.organizationId,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        rateLimitWindow: apiKeys.rateLimitWindow,
        status: apiKeys.status,
        lastUsedAt: apiKeys.lastUsedAt,
        usageCount: apiKeys.usageCount,
        expiresAt: apiKeys.expiresAt,
        ipWhitelist: apiKeys.ipWhitelist,
        metadata: apiKeys.metadata,
        createdAt: apiKeys.createdAt,
        revokedAt: apiKeys.revokedAt,
        revokedBy: apiKeys.revokedBy,
        creatorEmail: authUsers.email,
        creatorFirstName: authUsers.firstName,
        creatorLastName: authUsers.lastName,
      })
      .from(apiKeys)
      .leftJoin(authUsers, eq(apiKeys.createdBy, authUsers.id))
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!keyData) {
      return res.status(404).json({ error: "API key not found" });
    }

    res.json(keyData);
  } catch (error: any) {
    console.error("Error fetching API key:", error);
    res.status(500).json({ error: "Failed to fetch API key" });
  }
});

router.patch("/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, scopes, rateLimit, rateLimitWindow, expiresAt, ipWhitelist, metadata } = req.body;

    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "API key not found" });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (scopes !== undefined) updates.scopes = scopes;
    if (rateLimit !== undefined) updates.rateLimit = rateLimit;
    if (rateLimitWindow !== undefined) updates.rateLimitWindow = rateLimitWindow;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (ipWhitelist !== undefined) updates.ipWhitelist = ipWhitelist;
    if (metadata !== undefined) updates.metadata = metadata;

    const [updated] = await db
      .update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating API key:", error);
    res.status(500).json({ error: "Failed to update API key" });
  }
});

router.post("/:id/revoke", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "API key not found" });
    }

    if (existing.status === "revoked") {
      return res.status(400).json({ error: "API key is already revoked" });
    }

    const [updated] = await db
      .update(apiKeys)
      .set({
        status: "revoked",
        revokedAt: new Date(),
        revokedBy: req.jwtUser!.userId,
      })
      .where(eq(apiKeys.id, id))
      .returning();

    res.json({ message: "API key revoked successfully", key: updated });
  } catch (error: any) {
    console.error("Error revoking API key:", error);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
});

router.post("/:id/reactivate", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "API key not found" });
    }

    if (existing.status === "active") {
      return res.status(400).json({ error: "API key is already active" });
    }

    const [updated] = await db
      .update(apiKeys)
      .set({
        status: "active",
        revokedAt: null,
        revokedBy: null,
      })
      .where(eq(apiKeys.id, id))
      .returning();

    res.json({ message: "API key reactivated successfully", key: updated });
  } catch (error: any) {
    console.error("Error reactivating API key:", error);
    res.status(500).json({ error: "Failed to reactivate API key" });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "API key not found" });
    }

    await db.delete(apiKeyUsageLogs).where(eq(apiKeyUsageLogs.apiKeyId, id));

    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    res.json({ message: "API key deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting API key:", error);
    res.status(500).json({ error: "Failed to delete API key" });
  }
});

router.get("/:id/usage", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    let query = db
      .select()
      .from(apiKeyUsageLogs)
      .where(eq(apiKeyUsageLogs.apiKeyId, id))
      .orderBy(desc(apiKeyUsageLogs.createdAt))
      .limit(Number(limit));

    const logs = await query;

    const stats = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        avgResponseTime: sql<number>`avg(${apiKeyUsageLogs.responseTime})`,
        successCount: sql<number>`sum(case when ${apiKeyUsageLogs.statusCode} < 400 then 1 else 0 end)`,
        errorCount: sql<number>`sum(case when ${apiKeyUsageLogs.statusCode} >= 400 then 1 else 0 end)`,
      })
      .from(apiKeyUsageLogs)
      .where(eq(apiKeyUsageLogs.apiKeyId, id));

    res.json({
      logs,
      stats: stats[0],
    });
  } catch (error: any) {
    console.error("Error fetching API key usage:", error);
    res.status(500).json({ error: "Failed to fetch API key usage" });
  }
});

router.post("/validate", async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers["x-api-key"] as string || req.body.apiKey;

    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "API key required" });
    }

    const result = await validateApiKey(apiKey);

    if (result.valid) {
      res.json({
        valid: true,
        name: result.keyData.name,
        scopes: result.keyData.scopes,
        rateLimit: result.keyData.rateLimit,
        rateLimitWindow: result.keyData.rateLimitWindow,
      });
    } else {
      res.status(401).json({ valid: false, error: result.error });
    }
  } catch (error: any) {
    console.error("Error validating API key:", error);
    res.status(500).json({ valid: false, error: "Failed to validate API key" });
  }
});

export default router;
