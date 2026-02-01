-- Fix subscription limits for paid users (set to NULL for unlimited)
-- This script fixes subscriptions that have trial limits but are marked as 'active' (paid)

UPDATE subscriptions 
SET 
  "sessionsLimit" = NULL,
  "minutesLimit" = NULL,
  "updatedAt" = NOW()
WHERE 
  status = 'active' 
  AND ("sessionsLimit" IS NOT NULL OR "minutesLimit" IS NOT NULL)
  AND "planType" IN ('monthly', 'annual', 'yearly', 'one_time');

-- Log the changes
SELECT 
  id, 
  "userId", 
  status, 
  "planType",
  "sessionsLimit",
  "minutesLimit",
  "createdAt"
FROM subscriptions 
WHERE 
  status = 'active'
  AND "planType" IN ('monthly', 'annual', 'yearly', 'one_time')
ORDER BY "createdAt" DESC 
LIMIT 20;
