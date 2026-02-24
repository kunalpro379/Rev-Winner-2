-- Add fields for proper session timer tracking
-- This enables pause/resume and survives page refreshes

ALTER TABLE "session_usage" 
ADD COLUMN IF NOT EXISTS "last_resume_time" timestamp,
ADD COLUMN IF NOT EXISTS "accumulated_duration_ms" bigint DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS "is_paused" boolean DEFAULT false NOT NULL;

-- Update existing active sessions to have proper values
UPDATE "session_usage" 
SET 
  "last_resume_time" = "start_time",
  "accumulated_duration_ms" = 0,
  "is_paused" = false
WHERE "status" = 'active' AND "last_resume_time" IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN "session_usage"."last_resume_time" IS 'Timestamp when session was last resumed (for calculating running time)';
COMMENT ON COLUMN "session_usage"."accumulated_duration_ms" IS 'Total accumulated time in milliseconds (updated on pause)';
COMMENT ON COLUMN "session_usage"."is_paused" IS 'Whether the session is currently paused';
