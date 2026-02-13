-- Add user feedback table
CREATE TABLE IF NOT EXISTS "user_feedback" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" VARCHAR NOT NULL,
  "category" TEXT NOT NULL CHECK (category IN ('bug_report', 'feature_request', 'improvement', 'general', 'performance', 'ui_ux')),
  "subject" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  "status" TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  "page" VARCHAR(255),
  "user_phone" VARCHAR(20),
  "screenshot_url" TEXT,
  "admin_notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_user_feedback_user_id" ON "user_feedback"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_feedback_status" ON "user_feedback"("status");
CREATE INDEX IF NOT EXISTS "idx_user_feedback_category" ON "user_feedback"("category");
CREATE INDEX IF NOT EXISTS "idx_user_feedback_created_at" ON "user_feedback"("created_at" DESC);
