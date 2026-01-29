import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(), // Removed .unique() to allow multiple conversations per session
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }), // Fixed to reference authUsers
  clientName: text("client_name"),
  status: text("status").notNull().default("active"), // active, ended
  discoveryInsights: jsonb("discovery_insights").default({}),
  callSummary: text("call_summary"),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
}, (table) => [
  index("idx_conversations_session").on(table.sessionId),
  index("idx_conversations_user").on(table.userId),
  index("idx_conversations_status").on(table.status),
  index("idx_conversations_created_at").on(table.createdAt),
]);

export const audioSources = pgTable("audio_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  sourceType: text("source_type").notNull(), // device-microphone, teams-meeting, teams-recording
  sourceId: text("source_id"), // teams meeting ID or recording ID
  teamsMeetingId: varchar("teams_meeting_id").references(() => teamsMeetings.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"), // active, paused, disconnected
  metadata: jsonb("metadata").default({}),
  connectedAt: timestamp("connected_at").defaultNow(),
  disconnectedAt: timestamp("disconnected_at"),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // user, assistant
  speakerLabel: text("speaker_label"), // Speaker 1, Speaker 2, Speaker 3, etc.
  audioSourceId: varchar("audio_source_id").references(() => audioSources.id, { onDelete: "set null" }),
  customerIdentification: jsonb("customer_identification"), // AI-identified customers vs sales reps
  discoveryQuestions: jsonb("discovery_questions"), // Smart follow-up questions (array of strings)
  caseStudies: jsonb("case_studies"), // Relevant case study examples
  competitorAnalysis: jsonb("competitor_analysis"), // Competitor comparison insights
  solutionRecommendations: jsonb("solution_recommendations"), // Solution recommendations based on pain points
  productFeatures: jsonb("product_features"), // Relevant product/service features
  nextSteps: jsonb("next_steps"), // Clear, actionable next steps
  bantQualification: jsonb("bant_qualification"), // BANT qualification check
  solutions: jsonb("solutions"), // Technical and non-technical solution recommendations
  problemStatement: text("problem_statement"), // AI-identified problem statement
  recommendedSolutions: jsonb("recommended_solutions"), // Array of solution recommendations
  suggestedNextPrompt: text("suggested_next_prompt"), // AI-suggested next question
  timestamp: timestamp("timestamp").defaultNow(),
});

export const teamsMeetings = pgTable("teams_meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  meetingId: text("meeting_id"),
  meetingTitle: text("meeting_title"),
  organizerId: text("organizer_id"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  recordingUrl: text("recording_url"),
  transcriptUrl: text("transcript_url"),
  status: text("status").notNull().default("active"), // active, ended, recording-available
  participants: jsonb("participants").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});


// Partner Services types
export interface PartnerService {
  id: string;
  name: string;
  type: 'implementation' | 'support' | 'assessment' | 'training' | 'optimization';
  description: string;
  provider: string;
  estimatedDuration: string;
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface PartnerServiceRecommendation {
  service: PartnerService;
  relevanceScore: number;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// User types for Replit Auth
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  sessionId: true,
  userId: true,
  clientName: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  sender: true,
  speakerLabel: true,
  audioSourceId: true,
  customerIdentification: true,
  discoveryQuestions: true,
  caseStudies: true,
  competitorAnalysis: true,
  solutionRecommendations: true,
  productFeatures: true,
  nextSteps: true,
  bantQualification: true,
  solutions: true,
  problemStatement: true,
  recommendedSolutions: true,
  suggestedNextPrompt: true,
});

export const insertTeamsMeetingSchema = createInsertSchema(teamsMeetings).pick({
  conversationId: true,
  meetingId: true,
  meetingTitle: true,
  organizerId: true,
  startTime: true,
  endTime: true,
  participants: true,
});

export const insertAudioSourceSchema = createInsertSchema(audioSources).pick({
  conversationId: true,
  sourceType: true,
  sourceId: true,
  teamsMeetingId: true,
  metadata: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertTeamsMeeting = z.infer<typeof insertTeamsMeetingSchema>;
export type TeamsMeeting = typeof teamsMeetings.$inferSelect;
export type InsertAudioSource = z.infer<typeof insertAudioSourceSchema>;
export type AudioSource = typeof audioSources.$inferSelect;

// Teams integration types - shared constants to prevent enum drift
export const AUDIO_SOURCE_TYPES = {
  DEVICE_MICROPHONE: "device-microphone",
  TEAMS_MEETING: "teams-meeting", 
  TEAMS_RECORDING: "teams-recording"
} as const;

export type TeamsAudioSourceType = typeof AUDIO_SOURCE_TYPES[keyof typeof AUDIO_SOURCE_TYPES];
export type TeamsConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface TeamsConnection {
  status: TeamsConnectionStatus;
  meetingId?: string;
  meetingTitle?: string;
  audioEnabled: boolean;
  participants: string[];
  errorMessage?: string;
}

// Product reference data (generic examples - customize for your specific domain/platform)
export const productReference = [
  // Core Platform Features
  {
    code: "CORE",
    name: "Core Platform",
    description: "Foundation features including workflow automation, data management, and basic integrations"
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise Edition",
    description: "Advanced capabilities with enhanced security, scalability, and enterprise-grade support"
  },
  {
    code: "ANALYTICS",
    name: "Analytics & Reporting",
    description: "Business intelligence, dashboards, custom reports, and data visualization tools"
  },
  {
    code: "AUTOMATION",
    name: "Automation Suite",
    description: "Workflow automation, process orchestration, and business rule engines"
  },
  {
    code: "API",
    name: "API & Integration Platform",
    description: "RESTful APIs, webhooks, pre-built connectors, and custom integration tools"
  },
  
  // Collaboration & Productivity
  {
    code: "COLLAB",
    name: "Team Collaboration",
    description: "Real-time messaging, file sharing, project workspaces, and team coordination"
  },
  {
    code: "DOCS",
    name: "Document Management",
    description: "Version control, secure storage, document workflows, and knowledge base"
  },
  {
    code: "PROJECTS",
    name: "Project Management",
    description: "Task tracking, resource allocation, timeline management, and portfolio planning"
  },
  
  // Customer & Sales
  {
    code: "CRM",
    name: "Customer Relationship Management",
    description: "Contact management, sales pipeline, opportunity tracking, and customer insights"
  },
  {
    code: "SALES",
    name: "Sales Acceleration",
    description: "Lead scoring, quote generation, sales forecasting, and deal management"
  },
  {
    code: "SUPPORT",
    name: "Customer Support",
    description: "Ticketing system, help desk, knowledge base, and multi-channel support"
  },
  {
    code: "MARKETING",
    name: "Marketing Automation",
    description: "Campaign management, email marketing, lead nurturing, and analytics"
  },
  
  // Operations & Management
  {
    code: "WORKFLOW",
    name: "Workflow Engine",
    description: "Visual workflow designer, approval processes, and automated task routing"
  },
  {
    code: "ASSETS",
    name: "Asset Management",
    description: "Resource tracking, lifecycle management, inventory control, and optimization"
  },
  {
    code: "FINANCE",
    name: "Financial Management",
    description: "Budget planning, cost tracking, financial reporting, expense management"
  },
  // Security & Compliance
  {
    code: "SECURITY",
    name: "Security & Compliance",
    description: "Access control, audit logs, compliance reporting, data protection"
  },
  {
    code: "ADMIN",
    name: "Administration Tools",
    description: "User management, permissions, system configuration, backup and restore"
  },
  
  // Advanced Features
  {
    code: "AI",
    name: "AI Assistant",
    description: "AI-powered virtual assistant, intelligent search, automated workflows"
  },
  {
    code: "ML",
    name: "Machine Learning",
    description: "Predictive analytics, anomaly detection, intelligent recommendations"
  },
  {
    code: "MOBILE",
    name: "Mobile Edition",
    description: "Native mobile apps, offline access, push notifications, mobile workflows"
  },
  {
    code: "PREMIUM",
    name: "Premium Support",
    description: "Priority support, dedicated account manager, SLA guarantees, 24/7 assistance"
  }
] as const;

// Product reference type
export interface ProductReference {
  code: string;
  name: string;
  description: string;
}

// ========================================
// CUSTOM AUTHENTICATION & SUBSCRIPTION SYSTEM
// ========================================

// User Role type definition
export const USER_ROLES = ['user', 'license_manager', 'admin', 'super_admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// Auth Users table (custom JWT-based authentication)
export const authUsers = pgTable("auth_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobile: varchar("mobile", { length: 20 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  organization: varchar("organization", { length: 255 }),
  username: varchar("username", { length: 100 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"), // 'user', 'license_manager', 'admin', 'super_admin'
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'active', 'suspended'
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  trainMeSubscriptionDate: timestamp("train_me_subscription_date"), // Train Me add-on purchase date (30-day validity)
  emailVerified: boolean("email_verified").default(false),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  aiEngine: varchar("ai_engine", { length: 50 }), // 'openai', 'grok', 'claude', 'gemini', 'deepseek'
  encryptedApiKey: text("encrypted_api_key"), // Encrypted API key for the selected AI engine
  aiEngineSetupCompleted: boolean("ai_engine_setup_completed").default(false), // Whether user has completed AI setup
  termsAccepted: boolean("terms_accepted").default(false), // Whether user has accepted Terms & Conditions
  termsAcceptedAt: timestamp("terms_accepted_at"), // When user accepted T&C
  sessionVersion: integer("session_version").notNull().default(0), // Incremented on each login for single-device access
  callRecordingEnabled: boolean("call_recording_enabled").default(false), // Whether user has enabled call recording feature
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Super User Overrides table - grants unlimited access to specific emails
// Used for platform administrators, testing, and special access grants
export const superUserOverrides = pgTable("super_user_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  reason: text("reason").notNull(), // Why this email has super access
  grantedBy: varchar("granted_by", { length: 255 }).notNull(), // Who granted this access
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP verification table
export const otps = pgTable("otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: varchar("attempts", { length: 10 }).notNull().default("0"),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Refresh tokens table (for JWT authentication)
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add-ons table (session minutes, train me, etc.)
export const addons = pgTable("addons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // 'session-minutes', 'train-me'
  displayName: varchar("display_name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'usage_bundle', 'service'
  billingInterval: varchar("billing_interval", { length: 20 }), // 'one-time', 'monthly', etc. (null for usage_bundle)
  pricingTiers: jsonb("pricing_tiers"), // For usage_bundle: [{ minutes: 500, price: '6', currency: 'USD' }]
  flatPrice: varchar("flat_price", { length: 20 }), // For service type
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  features: jsonb("features").default([]),
  metadata: jsonb("metadata").default({}), // Additional data, Razorpay IDs, etc.
  isActive: boolean("is_active").default(true),
  publishedOnWebsite: boolean("published_on_website").default(false), // Control visibility on packages page
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  price: varchar("price", { length: 20 }).notNull(), // Store as string to avoid precision issues
  listedPrice: varchar("listed_price", { length: 20 }), // Original/regular price (for showing strikethrough)
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  billingInterval: varchar("billing_interval", { length: 20 }).notNull(), // '3-years'
  features: jsonb("features").default([]),
  isActive: boolean("is_active").default(true),
  publishedOnWebsite: boolean("published_on_website").default(false), // Control visibility on packages page
  availableUntil: timestamp("available_until"), // Plan availability expiration date (for limited-time offers)
  requiredAddons: jsonb("required_addons").default([]), // Required addon IDs: ['addon-id-1', 'addon-id-2']
  razorpayPlanId: varchar("razorpay_plan_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Plans History table
export const subscriptionPlansHistory = pgTable("subscription_plans_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").references(() => subscriptionPlans.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  changeType: varchar("change_type", { length: 20 }).notNull(), // 'create', 'update', 'discontinue', 'restore'
  reasonCode: varchar("reason_code", { length: 50 }).notNull(), // 'price_adjustment', 'feature_update', 'market_change', 'seasonal_offer', 'discontinuation', 'restoration'
  reasonDetail: text("reason_detail"), // Free-text explanation
  // Snapshot of plan at this version
  snapshot: jsonb("snapshot").notNull(), // { name, price, listedPrice, currency, billingInterval, features, requiredAddons, razorpayPlanId }
  effectiveStartAt: timestamp("effective_start_at").notNull(),
  effectiveEndAt: timestamp("effective_end_at"), // null for current version
  committedAt: timestamp("committed_at").defaultNow().notNull(),
  committedBy: varchar("committed_by").references(() => authUsers.id).notNull(), // Admin who made the change
}, (table) => ({
  // Unique constraint: each plan can only have one version with a given version number
  uniquePlanVersion: uniqueIndex("unique_plan_version").on(table.planId, table.versionNumber),
  // Index for efficient history queries
  planHistoryIdx: index("plan_history_idx").on(table.planId, table.effectiveStartAt),
}));

// Add-ons History table
export const addonsHistory = pgTable("addons_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  addonId: varchar("addon_id").references(() => addons.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  changeType: varchar("change_type", { length: 20 }).notNull(), // 'create', 'update', 'discontinue', 'restore'
  reasonCode: varchar("reason_code", { length: 50 }).notNull(), // 'price_adjustment', 'feature_update', 'market_change', 'discontinuation', 'restoration'
  reasonDetail: text("reason_detail"), // Free-text explanation
  // Snapshot of add-on at this version
  snapshot: jsonb("snapshot").notNull(), // { slug, displayName, type, pricingTiers, flatPrice, currency, features, metadata }
  effectiveStartAt: timestamp("effective_start_at").notNull(),
  effectiveEndAt: timestamp("effective_end_at"), // null for current version
  committedAt: timestamp("committed_at").defaultNow().notNull(),
  committedBy: varchar("committed_by").references(() => authUsers.id).notNull(), // Admin who made the change
}, (table) => ({
  // Unique constraint: each addon can only have one version with a given version number
  uniqueAddonVersion: uniqueIndex("unique_addon_version").on(table.addonId, table.versionNumber),
  // Index for efficient history queries
  addonHistoryIdx: index("addon_history_idx").on(table.addonId, table.effectiveStartAt),
}));

// User subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id, { onDelete: "set null" }),
  planType: varchar("plan_type", { length: 20 }).notNull().default("free_trial"), // 'free_trial', 'yearly', 'three_year'
  status: varchar("status", { length: 20 }).notNull().default("trial"), // 'trial', 'active', 'past_due', 'canceled', 'expired'
  sessionsUsed: varchar("sessions_used", { length: 10 }).notNull().default("0"), // Track number of sessions used
  sessionsLimit: varchar("sessions_limit", { length: 10 }), // Limit for free trial (null for unlimited)
  minutesUsed: varchar("minutes_used", { length: 10 }).notNull().default("0"), // Track total minutes used
  minutesLimit: varchar("minutes_limit", { length: 10 }), // 180 minutes for free trial (null for unlimited)
  sessionHistory: jsonb("session_history").default([]), // Array of { sessionId, startTime, endTime, durationMinutes }
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  cancellationReason: text("cancellation_reason"),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 255 }),
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Add unique constraint for active subscriptions per user
  uniqueIndex("unique_active_subscription_per_user").on(table.userId).where(sql`status = 'active'`),
]);

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }), // Added proper FK
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  razorpaySignature: varchar("razorpay_signature", { length: 500 }),
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: varchar("status", { length: 20 }).notNull(), // 'pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'
  paymentMethod: varchar("payment_method", { length: 50 }),
  receiptUrl: varchar("receipt_url", { length: 500 }),
  metadata: jsonb("metadata").default({}),
  // Refund tracking fields
  refundedAt: timestamp("refunded_at"),
  refundAmount: varchar("refund_amount", { length: 20 }), // Amount refunded (can be partial)
  refundReason: text("refund_reason"),
  razorpayRefundId: varchar("razorpay_refund_id", { length: 255 }),
  refundedBy: varchar("refunded_by").references(() => authUsers.id, { onDelete: "set null" }), // Admin who processed refund
  createdAt: timestamp("created_at").defaultNow(),
});

// Promo codes table
export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 50 }), // 'platform_subscription', 'session_minutes', 'train_me', 'dai'
  allowedPlanTypes: jsonb("allowed_plan_types"), // ['yearly', 'three_year', 'monthly', 'six_month'] - null means all plans allowed
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' or 'fixed'
  discountValue: varchar("discount_value", { length: 20 }).notNull(), // e.g., '50' for 50% or '10' for $10
  maxUses: varchar("max_uses", { length: 10 }), // null for unlimited
  usesCount: varchar("uses_count", { length: 10 }).notNull().default("0"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => authUsers.id),
  action: varchar("action", { length: 100 }).notNull(), // 'user.created', 'user.suspended', 'payment.succeeded', etc.
  targetType: varchar("target_type", { length: 50 }), // 'user', 'subscription', 'payment'
  targetId: varchar("target_id", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session usage tracking table
export const sessionUsage = pgTable("session_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(), // Unique identifier for this usage session
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationSeconds: varchar("duration_seconds", { length: 20 }), // Duration in seconds (stored as string for precision)
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' or 'ended'
  createdAt: timestamp("created_at").defaultNow(),
});

// Session minutes purchases table (for add-on packages)
export const sessionMinutesPurchases = pgTable("session_minutes_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }), // Added proper FK
  minutesPurchased: integer("minutes_purchased").notNull(), // 500, 1000, 1500, etc.
  minutesUsed: integer("minutes_used").notNull().default(0), // Track usage
  minutesRemaining: integer("minutes_remaining").notNull(), // Calculated field for convenience
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(), // 30 days from purchase
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'expired', 'exhausted', 'refunded'
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  amountPaid: varchar("amount_paid", { length: 20 }).notNull(), // In dollars ($6, $12, etc.)
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  // Refund tracking fields
  refundedAt: timestamp("refunded_at"),
  refundAmount: varchar("refund_amount", { length: 20 }),
  refundReason: text("refund_reason"),
  razorpayRefundId: varchar("razorpay_refund_id", { length: 255 }),
  refundedBy: varchar("refunded_by").references(() => authUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Provider types for token usage tracking
export const AI_PROVIDERS = ['deepseek', 'gemini', 'claude', 'chatgpt', 'grok', 'kimi'] as const;
export type AIProvider = typeof AI_PROVIDERS[number];

// AI Token Usage table (tracks token consumption per provider)
export const aiTokenUsage = pgTable("ai_token_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }), // Added proper FK
  provider: varchar("provider", { length: 20 }).notNull(), // 'deepseek', 'gemini', 'claude', 'chatgpt', 'grok', 'kimi'
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  requestId: varchar("request_id", { length: 255 }), // Optional unique ID for the AI request
  feature: varchar("feature", { length: 50 }), // 'shift_gears', 'present_to_win', 'conversation_analysis', 'chatbot', etc.
  metadata: jsonb("metadata").default({}), // Additional context (model used, temperature, etc.)
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_token_usage_user").on(table.userId),
  index("idx_ai_token_usage_org").on(table.organizationId),
  index("idx_ai_token_usage_provider").on(table.provider),
  index("idx_ai_token_usage_occurred_at").on(table.occurredAt),
  index("idx_ai_token_usage_user_provider_date").on(table.userId, table.provider, table.occurredAt),
]);

// ========================================
// ENTERPRISE LICENSE MANAGEMENT TABLES
// ========================================

// Organizations table (for enterprise customers)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  billingEmail: varchar("billing_email", { length: 255 }).notNull(),
  primaryManagerId: varchar("primary_manager_id").references(() => authUsers.id), // Main license manager
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'suspended'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_organizations_status").on(table.status),
  index("idx_organizations_primary_manager").on(table.primaryManagerId),
]);

// Organization memberships (tracks users belonging to organizations)
export const organizationMemberships = pgTable("organization_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"), // 'license_manager', 'member'
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'inactive'
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
}, (table) => [
  index("idx_org_memberships_org").on(table.organizationId),
  index("idx_org_memberships_user").on(table.userId),
  index("idx_org_memberships_status").on(table.status),
  // Proper unique constraint: one user can have one active membership per organization
  uniqueIndex("unique_active_org_membership").on(table.organizationId, table.userId).where(sql`status = 'active'`),
]);

// License packages (bulk license purchases for organizations)
export const licensePackages = pgTable("license_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  packageType: varchar("package_type", { length: 50 }).notNull(), // '1-year-enterprise', '3-year-enterprise'
  totalSeats: integer("total_seats").notNull(), // Total licenses purchased
  pricePerSeat: varchar("price_per_seat", { length: 20 }).notNull(), // Price per seat (stored as string like other amounts)
  totalAmount: varchar("total_amount", { length: 20 }).notNull(), // Total package cost
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(), // Package expiration
  previousPackageId: varchar("previous_package_id", { length: 255 }), // Self-reference FK (will be constrained in DB)
  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 255 }), // Optional for subscription-based
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'expired', 'canceled'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_license_packages_org").on(table.organizationId),
  index("idx_license_packages_status").on(table.status),
  index("idx_license_packages_dates").on(table.startDate, table.endDate),
]);

// License assignments (tracks which users are assigned to licenses)
export const licenseAssignments = pgTable("license_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licensePackageId: varchar("license_package_id").references(() => licensePackages.id).notNull(),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'inactive', 'revoked'
  assignedAt: timestamp("assigned_at").defaultNow(),
  unassignedAt: timestamp("unassigned_at"), // Null if currently assigned
  assignedBy: varchar("assigned_by").references(() => authUsers.id), // License manager who assigned
  notes: text("notes"), // Optional reason for assignment/removal
}, (table) => [
  index("idx_license_assignments_package").on(table.licensePackageId),
  index("idx_license_assignments_user").on(table.userId),
  index("idx_license_assignments_status").on(table.status),
  // Ensure one active assignment per user per package
  index("idx_license_assignments_unique_active").on(table.licensePackageId, table.userId, table.status),
]);

// Billing adjustments (tracks enterprise license purchases and seat additions)
export const billingAdjustments = pgTable("billing_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  licensePackageId: varchar("license_package_id").references(() => licensePackages.id),
  adjustmentType: varchar("adjustment_type", { length: 50 }).notNull(), // 'initial_purchase', 'seat_addition', 'seat_refund'
  deltaSeats: integer("delta_seats").notNull(), // Positive for additions, negative for refunds
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  amount: varchar("amount", { length: 20 }).notNull(), // Total charge for this adjustment
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'succeeded', 'failed'
  processedAt: timestamp("processed_at"),
  addedBy: varchar("added_by").references(() => authUsers.id), // License manager who initiated
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_billing_adjustments_org").on(table.organizationId),
  index("idx_billing_adjustments_package").on(table.licensePackageId),
  index("idx_billing_adjustments_status").on(table.status),
]);

// Enterprise promo codes (for bulk license purchase discounts)
export const enterprisePromoCodes = pgTable("enterprise_promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' or 'fixed_per_seat'
  discountValue: varchar("discount_value", { length: 20 }).notNull(), // e.g., '20' for 20% off or '100' for ₹100 off per seat
  applicablePackages: varchar("applicable_packages", { length: 100 }).array(), // ['1-year-enterprise', '3-year-enterprise'] or null for all
  minimumSeats: integer("minimum_seats"), // Minimum seats required to use this promo (null for any)
  maxUses: varchar("max_uses", { length: 10 }), // null for unlimited
  usesCount: varchar("uses_count", { length: 10 }).notNull().default("0"),
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => authUsers.id), // Admin who created this promo
  notes: text("notes"), // Internal notes about the promo code
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_enterprise_promo_codes_active").on(table.isActive),
  index("idx_enterprise_promo_codes_expires").on(table.expiresAt),
]);

// Enterprise promo code usage tracking
export const enterprisePromoCodeUsages = pgTable("enterprise_promo_code_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promoCodeId: varchar("promo_code_id").references(() => enterprisePromoCodes.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  licensePackageId: varchar("license_package_id").references(() => licensePackages.id).notNull(),
  discountApplied: varchar("discount_applied", { length: 20 }).notNull(), // Actual discount amount applied
  originalAmount: varchar("original_amount", { length: 20 }).notNull(),
  finalAmount: varchar("final_amount", { length: 20 }).notNull(),
  usedBy: varchar("used_by").references(() => authUsers.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
}, (table) => [
  index("idx_enterprise_promo_usage_code").on(table.promoCodeId),
  index("idx_enterprise_promo_usage_org").on(table.organizationId),
]);

// ========================================
// TYPES AND SCHEMAS FOR NEW TABLES
// ========================================

export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;

export const insertAuthUserSchema = createInsertSchema(authUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Phone number must be at least 10 digits"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organization: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms & Conditions to continue",
  }),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export type OTP = typeof otps.$inferSelect;
export type InsertOTP = z.infer<typeof insertOtpSchema>;

export const insertOtpSchema = createInsertSchema(otps).omit({
  id: true,
  createdAt: true,
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Addon = typeof addons.$inferSelect;
export type AddonHistory = typeof addonsHistory.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type SubscriptionPlanHistory = typeof subscriptionPlansHistory.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SessionUsage = typeof sessionUsage.$inferSelect;
export type SessionMinutesPurchase = typeof sessionMinutesPurchases.$inferSelect;
export type AITokenUsage = typeof aiTokenUsage.$inferSelect;

export const insertAITokenUsageSchema = createInsertSchema(aiTokenUsage).omit({
  id: true,
  createdAt: true,
});

export type InsertAITokenUsage = z.infer<typeof insertAITokenUsageSchema>;

export const insertAddonSchema = createInsertSchema(addons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAddon = z.infer<typeof insertAddonSchema>;

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export const insertSubscriptionPlanHistorySchema = createInsertSchema(subscriptionPlansHistory).omit({
  id: true,
  committedAt: true,
});

export type InsertSubscriptionPlanHistory = z.infer<typeof insertSubscriptionPlanHistorySchema>;

export const insertAddonHistorySchema = createInsertSchema(addonsHistory).omit({
  id: true,
  committedAt: true,
});

export type InsertAddonHistory = z.infer<typeof insertAddonHistorySchema>;

// Change type and reason code enums for better type safety and UI display
export const CHANGE_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DISCONTINUE: 'discontinue',
  RESTORE: 'restore',
} as const;

export const REASON_CODES = {
  PRICE_ADJUSTMENT: 'price_adjustment',
  FEATURE_UPDATE: 'feature_update',
  MARKET_CHANGE: 'market_change',
  SEASONAL_OFFER: 'seasonal_offer',
  NEW_LAUNCH: 'new_launch',
  DISCONTINUATION: 'discontinuation',
  RESTORATION: 'restoration',
  BUG_FIX: 'bug_fix',
  CUSTOMER_FEEDBACK: 'customer_feedback',
} as const;

// Human-friendly labels for admin UI
export const REASON_CODE_LABELS: Record<string, string> = {
  price_adjustment: 'Price Adjustment',
  feature_update: 'Features Changed',
  market_change: 'Market Conditions',
  seasonal_offer: 'Seasonal Promotion',
  new_launch: 'New Launch',
  discontinuation: 'Plan Discontinued',
  restoration: 'Plan Restored',
  bug_fix: 'Bug Fix',
  customer_feedback: 'Customer Feedback',
};

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;

export const insertSessionUsageSchema = createInsertSchema(sessionUsage).omit({
  id: true,
  createdAt: true,
});

export type InsertSessionUsage = z.infer<typeof insertSessionUsageSchema>;

export const insertSessionMinutesPurchaseSchema = createInsertSchema(sessionMinutesPurchases).omit({
  id: true,
  createdAt: true,
});

export type InsertSessionMinutesPurchase = z.infer<typeof insertSessionMinutesPurchaseSchema>;

// ========================================
// UNIFIED BILLING TRANSACTION TYPES
// ========================================

export interface BillingTransaction {
  id: string;
  type: 'subscription_payment' | 'minutes_purchase';
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  amount: string;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: Date;
  
  // Refund tracking
  refundedAt?: Date | null;
  refundAmount?: string | null;
  refundReason?: string | null;
  razorpayRefundId?: string | null;
  refundedByName?: string | null;
  
  // Type-specific details
  subscriptionId?: string | null;
  minutesPurchased?: number | null;
  minutesRemaining?: number | null;
  expiryDate?: Date | null;
  
  // Customer Type
  customerType?: string;
  organizationName?: string | null;
}

export interface BillingAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  totalRefunds: number;
  totalRefundAmount: number;
  successfulPayments: number;
  failedPayments: number;
  subscriptionRevenue: number;
  minutesRevenue: number;
  revenueByDay: Array<{ date: string; amount: number; count: number }>;
  transactionsByStatus: Array<{ status: string; count: number; amount: number }>;
  transactionsByType: Array<{ type: string; count: number; amount: number }>;
  // Customer type breakdown
  individualRevenue: number;
  enterpriseRevenue: number;
  individualTransactions: number;
  enterpriseTransactions: number;
}

// Leads table for demo requests, contact form submissions, and business teams
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: varchar("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  message: text("message"),
  leadType: text("lead_type").notNull(), // 'demo_request', 'contact_form', or 'business_teams'
  department: text("department"), // For contact_form: 'sales' or 'support'
  totalSeats: integer("total_seats"), // For business_teams: number of seats needed
  estimatedTimeline: text("estimated_timeline"), // For business_teams: when they plan to buy
  status: text("status").notNull().default("new"), // new, contacted, qualified, closed
  createdAt: timestamp("created_at").defaultNow(),
});

export type Lead = typeof leads.$inferSelect;

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;

// ========================================
// TRAIN ME FEATURE TABLES
// ========================================

// Domain Expertise profiles table
export const domainExpertise = pgTable("domain_expertise", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  companyDomain: varchar("company_domain", { length: 255 }), // Email domain for access control (e.g., 'microsoft.com')
  isShared: boolean("is_shared").default(false), // If true, accessible to all users in the same company domain
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training documents table
export const trainingDocuments = pgTable("training_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainExpertiseId: varchar("domain_expertise_id").references(() => domainExpertise.id).notNull(),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(), // pdf, doc, docx, txt, xls, xlsx, ppt, pptx, url, mp3, wav, m4a, ogg, webm, flac
  fileUrl: text("file_url").notNull(), // Object storage URL or web URL
  content: text("content"), // Extracted text content (or transcription for audio)
  contentSource: varchar("content_source", { length: 20 }).default("extraction"), // 'extraction' for documents, 'transcription' for audio
  audioDuration: integer("audio_duration"), // Duration in seconds for audio files
  summary: jsonb("summary"), // AI-generated summary bullets (array of strings)
  summaryStatus: varchar("summary_status", { length: 20 }).default("not_generated"), // not_generated, generating, completed, failed
  summaryError: text("summary_error"), // Error message if summary generation failed
  lastSummarizedAt: timestamp("last_summarized_at"), // When the summary was last generated
  metadata: jsonb("metadata").default({}), // fileSize, mimeType, transcription confidence, etc.
  processingStatus: varchar("processing_status", { length: 20 }).notNull().default("pending"), // pending, processing, transcribing, completed, failed
  processingError: text("processing_error"), // Error message if processing failed
  knowledgeExtractedAt: timestamp("knowledge_extracted_at"), // When knowledge was extracted from this document
  contentHash: varchar("content_hash", { length: 64 }), // SHA-256 hash of content for change detection
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types and schemas for Train Me feature
export type DomainExpertise = typeof domainExpertise.$inferSelect;
export type TrainingDocument = typeof trainingDocuments.$inferSelect;

export const insertDomainExpertiseSchema = createInsertSchema(domainExpertise).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDomainExpertiseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type InsertDomainExpertise = z.infer<typeof insertDomainExpertiseSchema>;
export type UpdateDomainExpertise = z.infer<typeof updateDomainExpertiseSchema>;

export const insertTrainingDocumentSchema = createInsertSchema(trainingDocuments).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});

export type InsertTrainingDocument = z.infer<typeof insertTrainingDocumentSchema>;

// ========================================
// STRUCTURED KNOWLEDGE BASE TABLES
// ========================================

// Knowledge categories for structured extraction
export const knowledgeCategories = [
  'product',        // Product/service information
  'pricing',        // Pricing details, packages, discounts
  'process',        // Workflows, procedures, how-to
  'faq',            // Frequently asked questions
  'case_study',     // Success stories, customer examples
  'competitor',     // Competitive information
  'pain_point',     // Customer pain points and solutions
  'objection',      // Common objections and responses
  'feature',        // Feature descriptions and benefits
  'integration',    // Integration capabilities
] as const;

export type KnowledgeCategory = typeof knowledgeCategories[number];

// Structured knowledge base entries extracted from documents/audio
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainExpertiseId: varchar("domain_expertise_id").references(() => domainExpertise.id).notNull(),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  category: varchar("category", { length: 30 }).notNull(), // product, pricing, process, faq, etc.
  title: varchar("title", { length: 255 }).notNull(), // Key identifier (e.g., "Enterprise Plan Pricing")
  content: text("content").notNull(), // Main knowledge content
  details: jsonb("details").default({}), // Structured details (e.g., {price: "$99", features: [...]})
  keywords: text("keywords").array(), // Keywords for matching
  sourceDocumentIds: text("source_document_ids").array(), // Document IDs this was extracted from
  contentHash: varchar("content_hash", { length: 64 }), // SHA-256 hash for deduplication
  embedding: jsonb("embedding"), // Vector embedding for semantic search (stored as number array)
  confidence: integer("confidence").default(80), // AI confidence score (0-100)
  isVerified: boolean("is_verified").default(false), // Admin verified
  usageCount: integer("usage_count").default(0), // Times used in AI responses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types and schemas for Knowledge Base
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;

export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;

// ========================================
// ADMIN PANEL ENHANCEMENT TABLES
// ========================================

// System Metrics table for health monitoring
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'api_response_time', 'error_rate', 'active_users', 'memory_usage', etc.
  value: varchar("value", { length: 100 }).notNull(),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Announcements table for admin messaging
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  targetAudience: varchar("target_audience", { length: 50 }).notNull().default("all"), // 'all', 'trial_users', 'paid_users', 'specific_plan'
  status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft', 'published', 'archived'
  publishedAt: timestamp("published_at"),
  createdBy: varchar("created_by").references(() => authUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Tickets table for customer support tracking
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  assignedTo: varchar("assigned_to").references(() => authUsers.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types and schemas for admin enhancement tables
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// Refunds table for payment refund tracking
export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: varchar("payment_id").references(() => payments.id).notNull(),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'processed', 'failed'
  razorpayRefundId: varchar("razorpay_refund_id", { length: 255 }),
  processedBy: varchar("processed_by").references(() => authUsers.id), // Admin who processed the refund
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time Extensions table for granting temporary access/time to users
export const timeExtensions = pgTable("time_extensions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  extensionType: varchar("extension_type", { length: 20 }).notNull(), // 'trial_extension', 'minutes_addition', 'subscription_extension'
  extensionValue: varchar("extension_value", { length: 20 }).notNull(), // Days or minutes depending on type
  reason: text("reason").notNull(),
  grantedBy: varchar("granted_by").references(() => authUsers.id).notNull(), // Admin who granted the extension
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'expired', 'revoked'
  expiresAt: timestamp("expires_at"), // When this extension expires (if applicable)
  createdAt: timestamp("created_at").defaultNow(),
});

// Types and schemas for new tables
export type Refund = typeof refunds.$inferSelect;
export type TimeExtension = typeof timeExtensions.$inferSelect;

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  createdAt: true,
});

export const insertTimeExtensionSchema = createInsertSchema(timeExtensions).omit({
  id: true,
  createdAt: true,
});

export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type InsertTimeExtension = z.infer<typeof insertTimeExtensionSchema>;

// ========================================
// ENTERPRISE LICENSE MANAGEMENT TYPES AND SCHEMAS
// ========================================

export type Organization = typeof organizations.$inferSelect;
export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type LicensePackage = typeof licensePackages.$inferSelect;
export type LicenseAssignment = typeof licenseAssignments.$inferSelect;
export type BillingAdjustment = typeof billingAdjustments.$inferSelect;

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationMembershipSchema = createInsertSchema(organizationMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertLicensePackageSchema = createInsertSchema(licensePackages).omit({
  id: true,
  createdAt: true,
});

export const insertLicenseAssignmentSchema = createInsertSchema(licenseAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertBillingAdjustmentSchema = createInsertSchema(billingAdjustments).omit({
  id: true,
  createdAt: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertOrganizationMembership = z.infer<typeof insertOrganizationMembershipSchema>;
export type InsertLicensePackage = z.infer<typeof insertLicensePackageSchema>;
export type InsertLicenseAssignment = z.infer<typeof insertLicenseAssignmentSchema>;
export type InsertBillingAdjustment = z.infer<typeof insertBillingAdjustmentSchema>;

// Enterprise promo code types and schemas
export type EnterprisePromoCode = typeof enterprisePromoCodes.$inferSelect;
export type EnterprisePromoCodeUsage = typeof enterprisePromoCodeUsages.$inferSelect;

export const insertEnterprisePromoCodeSchema = createInsertSchema(enterprisePromoCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usesCount: true,
});

export const insertEnterprisePromoCodeUsageSchema = createInsertSchema(enterprisePromoCodeUsages).omit({
  id: true,
  usedAt: true,
});

export type InsertEnterprisePromoCode = z.infer<typeof insertEnterprisePromoCodeSchema>;
export type InsertEnterprisePromoCodeUsage = z.infer<typeof insertEnterprisePromoCodeUsageSchema>;

// Schema for enterprise license purchase
export const purchaseEnterpriseLicenseSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  billingEmail: z.string().email("Invalid billing email"),
  packageType: z.enum(["1-year-enterprise", "3-year-enterprise"]),
  numberOfSeats: z.number().min(1, "Must purchase at least 1 seat").max(1000, "Maximum 1000 seats per purchase"),
  primaryManagerEmail: z.string().email("Invalid primary manager email"),
});

// Schema for adding additional seats
export const addSeatsSchema = z.object({
  licensePackageId: z.string().uuid(),
  numberOfSeats: z.number().min(1, "Must add at least 1 seat").max(100, "Maximum 100 seats per addition"),
});

// Schema for assigning license to user
export const assignLicenseSchema = z.object({
  licensePackageId: z.string().uuid(),
  userEmail: z.string().email("Invalid user email"),
  notes: z.string().optional(),
});

// Schema for reassigning license
export const reassignLicenseSchema = z.object({
  licenseAssignmentId: z.string().uuid(),
  newUserEmail: z.string().email("Invalid user email"),
  notes: z.string().optional(),
});

export type PurchaseEnterpriseLicense = z.infer<typeof purchaseEnterpriseLicenseSchema>;
export type AddSeats = z.infer<typeof addSeatsSchema>;
export type AssignLicense = z.infer<typeof assignLicenseSchema>;
export type ReassignLicense = z.infer<typeof reassignLicenseSchema>;

// Organization Overview DTOs (HTTP serialized - dates as ISO strings)
export interface OrganizationSubscriptionDTO {
  id: string;
  planId: string | null;
  plan: {
    id: string;
    name: string;
    billingInterval: string;
    price: string;
  } | null;
  status: string;
  createdAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export interface OrganizationAddonDTO {
  id: string;
  displayName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  details: any;
}

export interface OrganizationDTO {
  id: string;
  companyName: string;
  billingEmail: string;
  primaryManagerId: string | null;
  razorpayCustomerId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseAssignmentDTO {
  id: string;
  licensePackageId: string;
  userId: string;
  assignedAt: string | null;
  revokedAt: string | null;
  status: string;
  notes: string | null;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface OrganizationMembershipDTO {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string | null;
  leftAt: string | null;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface OrganizationOverviewDTO {
  organization: OrganizationDTO;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  activePackage: {
    id: string;
    packageType: string;
    totalSeats: number;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  subscription: OrganizationSubscriptionDTO | null;
  addons: OrganizationAddonDTO[];
  assignments: LicenseAssignmentDTO[];
  members: OrganizationMembershipDTO[];
}

// ========================================
// ENTERPRISE BILLING & LICENSING SYSTEM
// ========================================

// Payment Gateway Abstraction Layer
// Allows easy switching between payment providers (Razorpay, Stripe, etc.)
export const gatewayProviders = pgTable("gateway_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerName: varchar("provider_name", { length: 50 }).notNull().unique(), // 'razorpay', 'stripe', etc.
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  configuration: jsonb("configuration").default({}), // Provider-specific config (encrypted if sensitive)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Universal transaction log (gateway-agnostic)
export const gatewayTransactions = pgTable("gateway_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").references(() => gatewayProviders.id).notNull(),
  providerTransactionId: varchar("provider_transaction_id", { length: 255 }), // External gateway's ID
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'order', 'subscription', 'payment', 'refund'
  status: varchar("status", { length: 50 }).notNull(), // 'pending', 'success', 'failed', 'refunded'
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  userId: varchar("user_id").references(() => authUsers.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  relatedEntity: varchar("related_entity", { length: 50 }), // 'subscription', 'addon_purchase', etc.
  relatedEntityId: varchar("related_entity_id", { length: 255 }),
  payload: jsonb("payload").default({}), // Full provider response snapshot
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_gateway_transactions_user").on(table.userId),
  index("idx_gateway_transactions_org").on(table.organizationId),
  index("idx_gateway_transactions_status").on(table.status),
  index("idx_gateway_transactions_provider").on(table.providerId, table.providerTransactionId),
]);

// Webhook event log for all gateways
export const gatewayWebhooks = pgTable("gateway_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").references(() => gatewayProviders.id).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'payment.success', 'subscription.created', etc.
  payload: jsonb("payload").notNull(),
  signature: text("signature"),
  verified: boolean("verified").default(false),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_gateway_webhooks_provider").on(table.providerId),
  index("idx_gateway_webhooks_processed").on(table.processed),
]);

// Normalized add-on purchases table (polymorphic design)
// Handles: Platform Access, Session Minutes, Train Me, DAI
export const addonPurchases = pgTable("addon_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }), // For enterprise purchases
  addonType: varchar("addon_type", { length: 50 }).notNull(), // 'platform_access', 'session_minutes', 'train_me', 'dai'
  packageSku: varchar("package_sku", { length: 100 }).notNull(), // 'RW-PA-M2M', 'RW-SM-500', etc.
  billingType: varchar("billing_type", { length: 20 }).notNull(), // 'monthly', 'one_time', '6_months', '12_months', '36_months'
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'expired', 'canceled'
  
  // Financial
  purchaseAmount: varchar("purchase_amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  gatewayTransactionId: varchar("gateway_transaction_id").references(() => gatewayTransactions.id, { onDelete: "set null" }),
  
  // Validity period
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"), // null for perpetual/lifetime
  autoRenew: boolean("auto_renew").default(false),
  
  // Usage tracking (for consumable add-ons)
  totalUnits: integer("total_units").notNull(), // Minutes, tokens, seats, etc.
  usedUnits: integer("used_units").notNull().default(0),
  
  // Add-on specific metadata
  metadata: jsonb("metadata").default({}), // Package-specific details
  
  // Renewal tracking
  parentPurchaseId: varchar("parent_purchase_id", { length: 255 }), // Self-reference FK (will be constrained in DB)
  renewalScheduledAt: timestamp("renewal_scheduled_at"),
  
  // Refund tracking fields
  refundedAt: timestamp("refunded_at"),
  refundAmount: varchar("refund_amount", { length: 20 }), // Amount refunded (can be partial)
  refundReason: text("refund_reason"),
  gatewayRefundId: varchar("gateway_refund_id", { length: 255 }), // Gateway's refund transaction ID
  refundedBy: varchar("refunded_by").references(() => authUsers.id, { onDelete: "set null" }), // Admin who processed refund
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_addon_purchases_user").on(table.userId),
  index("idx_addon_purchases_org").on(table.organizationId),
  index("idx_addon_purchases_type_status").on(table.addonType, table.status),
  index("idx_addon_purchases_expiry").on(table.endDate),
  index("idx_addon_purchases_sku").on(table.packageSku),
  index("idx_addon_purchases_gateway_tx").on(table.gatewayTransactionId),
  // Partial unique constraint: only one active purchase per user per addon type
  uniqueIndex("unique_active_addon_per_user").on(table.userId, table.addonType).where(sql`status = 'active'`),
]);

// Session Minutes usage tracking (detailed log)
export const sessionMinutesUsage = pgTable("session_minutes_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  purchaseId: varchar("purchase_id").references(() => addonPurchases.id).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  minutesConsumed: integer("minutes_consumed").notNull(),
  featureUsed: varchar("feature_used", { length: 100 }), // 'live_transcript', 'shift_gears', 'analysis', etc.
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
}, (table) => [
  index("idx_session_minutes_user").on(table.userId),
  index("idx_session_minutes_purchase").on(table.purchaseId),
  index("idx_session_minutes_consumed_at").on(table.consumedAt),
]);

// DAI (Rev Winner AI) token usage tracking
export const daiUsageLogs = pgTable("dai_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  purchaseId: varchar("purchase_id").references(() => addonPurchases.id).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  featureUsed: varchar("feature_used", { length: 100 }).notNull(), // 'chat', 'analysis', 'shift_gears', etc.
  tokensConsumed: integer("tokens_consumed").notNull(),
  modelUsed: varchar("model_used", { length: 100 }), // 'gpt-4', 'claude-3', etc.
  prompt: text("prompt"), // Optional: store for debugging (consider privacy)
  response: text("response"), // Optional: store for debugging (consider privacy)
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
}, (table) => [
  index("idx_dai_usage_user").on(table.userId),
  index("idx_dai_usage_purchase").on(table.purchaseId),
  index("idx_dai_usage_consumed_at").on(table.consumedAt),
]);

// Enterprise user assignments (seat management)
export const enterpriseUserAssignments = pgTable("enterprise_user_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }), // Made nullable for pending invites
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending_activation"), // 'pending_activation', 'active', 'inactive', 'revoked'
  
  // Activation flow
  activationToken: varchar("activation_token", { length: 255 }), // Secure random token for email activation
  activationTokenExpiresAt: timestamp("activation_token_expires_at"),
  activatedAt: timestamp("activated_at"),
  
  // Feature toggles
  trainMeEnabled: boolean("train_me_enabled").default(false),
  daiEnabled: boolean("dai_enabled").default(false),
  
  // Assignment tracking
  assignedBy: varchar("assigned_by").references(() => authUsers.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  revokedBy: varchar("revoked_by").references(() => authUsers.id, { onDelete: "set null" }),
  revokedAt: timestamp("revoked_at"),
  
  // Notes for license managers
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_enterprise_assignments_org").on(table.organizationId),
  index("idx_enterprise_assignments_user").on(table.userId),
  index("idx_enterprise_assignments_status").on(table.status),
  index("idx_enterprise_assignments_email").on(table.userEmail),
  // Unique constraint for active assignments by email (since userId can be null)
  uniqueIndex("unique_active_enterprise_assignment_email").on(table.organizationId, table.userEmail).where(sql`status = 'active'`),
]);

// Activation invite tracking (for enterprise users)
export const activationInvites = pgTable("activation_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  assignmentId: varchar("assignment_id").references(() => enterpriseUserAssignments.id).notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'accepted', 'expired', 'canceled'
  sentAt: timestamp("sent_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activation_invites_org").on(table.organizationId),
  index("idx_activation_invites_token").on(table.token),
  index("idx_activation_invites_status").on(table.status),
]);

// Admin actions log (for audit trail)
export const adminActionsLog = pgTable("admin_actions_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => authUsers.id).notNull(),
  actionType: varchar("action_type", { length: 100 }).notNull(), // 'license_assign', 'subscription_adjust', 'refund_process', etc.
  targetType: varchar("target_type", { length: 50 }).notNull(), // 'user', 'organization', 'subscription', 'payment'
  targetId: varchar("target_id", { length: 255 }),
  changes: jsonb("changes").default({}), // Before/after snapshot
  reason: text("reason").notNull(), // Required comment from admin
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_admin_actions_admin").on(table.adminId),
  index("idx_admin_actions_type").on(table.actionType),
  index("idx_admin_actions_target").on(table.targetType, table.targetId),
  index("idx_admin_actions_created").on(table.createdAt),
]);

// User entitlements cache (refreshable table for fast access control checks)
// NOTE: This should be refreshed by a background job or materialized view refresh
// Do NOT insert/update manually - use the entitlement calculation service
export const userEntitlements = pgTable("user_entitlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull().unique(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  
  // Platform access
  hasPlatformAccess: boolean("has_platform_access").default(false),
  platformAccessExpiresAt: timestamp("platform_access_expires_at"),
  
  // Session Minutes
  sessionMinutesBalance: integer("session_minutes_balance").default(0),
  sessionMinutesExpiresAt: timestamp("session_minutes_expires_at"),
  
  // Train Me
  hasTrainMe: boolean("has_train_me").default(false),
  trainMeExpiresAt: timestamp("train_me_expires_at"),
  
  // DAI
  hasDai: boolean("has_dai").default(false),
  daiTokensBalance: integer("dai_tokens_balance").default(0),
  daiExpiresAt: timestamp("dai_expires_at"),
  
  // Enterprise overrides
  isEnterpriseUser: boolean("is_enterprise_user").default(false),
  enterpriseTrainMeEnabled: boolean("enterprise_train_me_enabled").default(false),
  enterpriseDaiEnabled: boolean("enterprise_dai_enabled").default(false),
  
  // Last calculated
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_entitlements_user").on(table.userId),
  index("idx_user_entitlements_org").on(table.organizationId),
]);

// Types and schemas for enterprise billing tables
export type GatewayProvider = typeof gatewayProviders.$inferSelect;
export type GatewayTransaction = typeof gatewayTransactions.$inferSelect;
export type GatewayWebhook = typeof gatewayWebhooks.$inferSelect;
export type AddonPurchase = typeof addonPurchases.$inferSelect;
export type SessionMinutesUsage = typeof sessionMinutesUsage.$inferSelect;
export type DaiUsageLog = typeof daiUsageLogs.$inferSelect;
export type EnterpriseUserAssignment = typeof enterpriseUserAssignments.$inferSelect;
export type ActivationInvite = typeof activationInvites.$inferSelect;
export type AdminActionLog = typeof adminActionsLog.$inferSelect;
export type UserEntitlement = typeof userEntitlements.$inferSelect;

export const insertGatewayProviderSchema = createInsertSchema(gatewayProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGatewayTransactionSchema = createInsertSchema(gatewayTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertAddonPurchaseSchema = createInsertSchema(addonPurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionMinutesUsageSchema = createInsertSchema(sessionMinutesUsage).omit({
  id: true,
  consumedAt: true,
});

export const insertDaiUsageLogSchema = createInsertSchema(daiUsageLogs).omit({
  id: true,
  consumedAt: true,
});

export const insertEnterpriseUserAssignmentSchema = createInsertSchema(enterpriseUserAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedAt: true,
});

export const insertActivationInviteSchema = createInsertSchema(activationInvites).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

export const insertAdminActionLogSchema = createInsertSchema(adminActionsLog).omit({
  id: true,
  createdAt: true,
});

export const insertUserEntitlementSchema = createInsertSchema(userEntitlements).omit({
  id: true,
  lastCalculatedAt: true,
  updatedAt: true,
});

export type InsertGatewayProvider = z.infer<typeof insertGatewayProviderSchema>;
export type InsertGatewayTransaction = z.infer<typeof insertGatewayTransactionSchema>;
export type InsertAddonPurchase = z.infer<typeof insertAddonPurchaseSchema>;
export type InsertSessionMinutesUsage = z.infer<typeof insertSessionMinutesUsageSchema>;
export type InsertDaiUsageLog = z.infer<typeof insertDaiUsageLogSchema>;
export type InsertEnterpriseUserAssignment = z.infer<typeof insertEnterpriseUserAssignmentSchema>;
export type InsertActivationInvite = z.infer<typeof insertActivationInviteSchema>;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;
export type InsertUserEntitlement = z.infer<typeof insertUserEntitlementSchema>;

// Pending orders table (for secure payment verification)
export const pendingOrders = pgTable("pending_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  packageSku: varchar("package_sku", { length: 100 }).notNull(),
  addonType: varchar("addon_type", { length: 50 }).notNull(),
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  gatewayOrderId: varchar("gateway_order_id", { length: 255 }).notNull(),
  gatewayProvider: varchar("gateway_provider", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'completed', 'failed', 'expired'
  metadata: jsonb("metadata").default({}),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pending_orders_user").on(table.userId),
  index("idx_pending_orders_gateway").on(table.gatewayOrderId),
  index("idx_pending_orders_status").on(table.status),
]);

export type PendingOrder = typeof pendingOrders.$inferSelect;
export const insertPendingOrderSchema = createInsertSchema(pendingOrders).omit({
  id: true,
  createdAt: true,
});
export type InsertPendingOrder = z.infer<typeof insertPendingOrderSchema>;

// Validation schemas for add-on purchases
export const purchaseSessionMinutesSchema = z.object({
  packageSku: z.enum(['RW-SM-500', 'RW-SM-1000', 'RW-SM-1500', 'RW-SM-2000', 'RW-SM-3000', 'RW-SM-5000']),
  paymentGateway: z.enum(['cashfree', 'stripe', 'razorpay']).default('razorpay'),
});

export const purchasePlatformAccessSchema = z.object({
  packageSku: z.enum(['RW-PA-M2M', 'RW-PA-6M', 'RW-PA-12M', 'RW-PA-36M']),
  paymentGateway: z.enum(['cashfree', 'stripe', 'razorpay']).default('razorpay'),
});

export const purchaseTrainMeSchema = z.object({
  packageSku: z.literal('RW-TM-MONTHLY'),
  paymentGateway: z.enum(['cashfree', 'stripe', 'razorpay']).default('razorpay'),
});

export const purchaseDaiSchema = z.object({
  packageSku: z.enum([
    'RW-DAI-LITE-M', 'RW-DAI-MODERATE-M', 'RW-DAI-PROFESSIONAL-M', 'RW-DAI-POWER-M', 'RW-DAI-ENTERPRISE-M',
    'RW-DAI-REFILL-1M', 'RW-DAI-REFILL-3M', 'RW-DAI-REFILL-6M'
  ]),
  paymentGateway: z.enum(['cashfree', 'stripe', 'razorpay']).default('razorpay'),
});

export type PurchaseSessionMinutes = z.infer<typeof purchaseSessionMinutesSchema>;
export type PurchasePlatformAccess = z.infer<typeof purchasePlatformAccessSchema>;
export type PurchaseTrainMe = z.infer<typeof purchaseTrainMeSchema>;
export type PurchaseDai = z.infer<typeof purchaseDaiSchema>;

// Shopping Cart table (for multi-item checkout)
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  packageSku: varchar("package_sku", { length: 100 }).notNull(),
  addonType: varchar("addon_type", { length: 50 }).notNull(), // 'platform_access', 'session_minutes', 'train_me', 'dai', 'usage_bundle', 'service'
  packageName: varchar("package_name", { length: 255 }).notNull(),
  basePrice: varchar("base_price", { length: 20 }).notNull(), // Price before tax
  currency: varchar("currency", { length: 10 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  metadata: jsonb("metadata").default({}), // Store package details (units, duration, etc.)
  // Purchase mode for User vs Team purchases
  purchaseMode: varchar("purchase_mode", { length: 20 }).notNull().default("user"), // 'user' or 'team'
  // Team purchase fields (only used when purchaseMode = 'team')
  teamManagerName: varchar("team_manager_name", { length: 255 }),
  teamManagerEmail: varchar("team_manager_email", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  // Per-item promo code fields
  promoCodeId: varchar("promo_code_id").references(() => promoCodes.id), // FK to promo_codes
  promoCodeCode: varchar("promo_code_code", { length: 50 }), // Denormalized for display
  appliedDiscountAmount: varchar("applied_discount_amount", { length: 20 }), // Calculated discount amount
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("idx_cart_items_user").on(table.userId),
  index("idx_cart_items_addon_type").on(table.addonType),
  index("idx_cart_items_promo_code").on(table.promoCodeId),
  index("idx_cart_items_purchase_mode").on(table.purchaseMode),
  uniqueIndex("idx_cart_items_user_sku").on(table.userId, table.packageSku), // Prevent duplicate items
]);

export type CartItem = typeof cartItems.$inferSelect;
export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
});
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Cart checkout schema (for multi-item checkout)
export const cartCheckoutSchema = z.object({
  paymentGateway: z.enum(['cashfree', 'stripe', 'razorpay']).default('razorpay'),
  promoCode: z.string().optional(), // Optional promo code for discounts
});
export type CartCheckout = z.infer<typeof cartCheckoutSchema>;

// ========================================
// KNOWLEDGE BASE (AI Quality Improvements)
// ========================================

// Case Studies - Real examples for AI to reference
export const caseStudies = pgTable("case_studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  productCodes: text("product_codes").array(), // Products involved
  problemStatement: text("problem_statement").notNull(),
  solution: text("solution").notNull(),
  implementation: text("implementation"), // How it was done
  outcomes: jsonb("outcomes").notNull(), // { metric: string, value: string }[]
  customerSize: varchar("customer_size", { length: 50 }), // SMB, Mid-Market, Enterprise
  timeToValue: varchar("time_to_value", { length: 100 }), // "3 months", "6 weeks"
  tags: text("tags").array(), // For better retrieval
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_case_studies_industry").on(table.industry),
  index("idx_case_studies_active").on(table.isActive),
]);

export type CaseStudy = typeof caseStudies.$inferSelect;
export const insertCaseStudySchema = createInsertSchema(caseStudies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;

// Products - Actual products/services catalog
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // CRM, Analytics, Integration, etc.
  description: text("description").notNull(),
  keyFeatures: text("key_features").array(),
  useCases: text("use_cases").array(),
  targetIndustries: text("target_industries").array(),
  pricingModel: varchar("pricing_model", { length: 100 }), // "Per user/month", "Flat fee", etc.
  typicalPrice: varchar("typical_price", { length: 100 }), // "$99/user/month"
  implementationTime: varchar("implementation_time", { length: 100 }), // "2-4 weeks"
  integratesWith: text("integrates_with").array(), // Other product codes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_category").on(table.category),
  index("idx_products_active").on(table.isActive),
]);

export type Product = typeof products.$inferSelect;
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Implementation Playbooks - "How it's done" guides
export const implementationPlaybooks = pgTable("implementation_playbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  productCodes: text("product_codes").array(),
  scenario: text("scenario").notNull(), // When to use this playbook
  steps: jsonb("steps").notNull(), // Array of { step: number, title: string, description: string, duration: string }
  prerequisites: text("prerequisites").array(),
  commonChallenges: jsonb("common_challenges"), // { challenge: string, solution: string }[]
  successMetrics: text("success_metrics").array(),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_playbooks_active").on(table.isActive),
]);

export type ImplementationPlaybook = typeof implementationPlaybooks.$inferSelect;
export const insertImplementationPlaybookSchema = createInsertSchema(implementationPlaybooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationPlaybook = z.infer<typeof insertImplementationPlaybookSchema>;

// Prompt Templates - Centralized prompt management
export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  feature: varchar("feature", { length: 50 }).notNull(), // shift_gears, analysis, present_to_win, etc.
  systemPrompt: text("system_prompt").notNull(),
  exampleInputs: jsonb("example_inputs"), // Multi-shot examples
  exampleOutputs: jsonb("example_outputs"), // Expected output format
  outputSchema: jsonb("output_schema"), // JSON schema for structured outputs
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_prompts_feature").on(table.feature),
  index("idx_prompts_active").on(table.isActive),
]);

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;

// Conversation Intents - Track detected intents for analysis
export const conversationIntents = pgTable("conversation_intents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  messageId: varchar("message_id").references(() => messages.id),
  intent: varchar("intent", { length: 100 }).notNull(), // pricing_question, implementation_query, feature_request, etc.
  confidence: varchar("confidence", { length: 10 }), // High, Medium, Low
  entities: jsonb("entities"), // Extracted entities (products, industries, etc.)
  detectedAt: timestamp("detected_at").defaultNow(),
}, (table) => [
  index("idx_intents_conversation").on(table.conversationId),
  index("idx_intents_type").on(table.intent),
]);

export type ConversationIntent = typeof conversationIntents.$inferSelect;
export const insertConversationIntentSchema = createInsertSchema(conversationIntents).omit({
  id: true,
  detectedAt: true,
});
export type InsertConversationIntent = z.infer<typeof insertConversationIntentSchema>;

// Buyer Stages - Track buyer journey progression
export const buyerStages = pgTable("buyer_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  stage: varchar("stage", { length: 50 }).notNull(), // awareness, consideration, decision, negotiation
  confidence: varchar("confidence", { length: 10 }),
  signals: text("signals").array(), // What indicated this stage
  detectedAt: timestamp("detected_at").defaultNow(),
}, (table) => [
  index("idx_buyer_stages_conversation").on(table.conversationId),
  index("idx_buyer_stages_stage").on(table.stage),
]);

export type BuyerStage = typeof buyerStages.$inferSelect;
export const insertBuyerStageSchema = createInsertSchema(buyerStages).omit({
  id: true,
  detectedAt: true,
});
export type InsertBuyerStage = z.infer<typeof insertBuyerStageSchema>;

// Conversation Memories - Session-scoped structured insights
export const conversationMemories = pgTable("conversation_memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(), // Fixed to reference authUsers
  
  // SPIN Framework tracking
  spinSituation: text("spin_situation"),
  spinProblems: text("spin_problems").array(),
  spinImplications: text("spin_implications").array(),
  spinNeedPayoff: text("spin_need_payoff").array(),
  
  // MEDDIC Framework tracking
  meddicMetrics: jsonb("meddic_metrics"),
  meddicEconomicBuyer: text("meddic_economic_buyer"),
  meddicDecisionCriteria: text("meddic_decision_criteria").array(),
  meddicDecisionProcess: text("meddic_decision_process"),
  meddicPain: text("meddic_pain").array(),
  meddicChampion: text("meddic_champion"),
  
  // Challenger Framework insights
  challengerTeachings: text("challenger_teachings").array(),
  challengerTailoring: jsonb("challenger_tailoring"),
  challengerControl: text("challenger_control"),
  
  // BANT Qualification
  bantBudget: text("bant_budget"),
  bantAuthority: text("bant_authority"),
  bantNeed: text("bant_need"),
  bantTimeline: text("bant_timeline"),
  
  // Call Flow Psychology
  buyerStage: varchar("buyer_stage", { length: 50 }),
  conversationTone: varchar("conversation_tone", { length: 50 }),
  objections: text("objections").array(),
  urgencyLevel: varchar("urgency_level", { length: 20 }),
  engagementScore: integer("engagement_score"),
  
  // Key insights and learnings
  keyInsights: text("key_insights").array(),
  customerPersona: jsonb("customer_persona"),
  competitiveLandscape: jsonb("competitive_landscape"),
  successMetrics: jsonb("success_metrics"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_memories_conversation").on(table.conversationId),
  index("idx_memories_user").on(table.userId),
  index("idx_memories_stage").on(table.buyerStage),
]);

export type ConversationMemory = typeof conversationMemories.$inferSelect;
export const insertConversationMemorySchema = createInsertSchema(conversationMemories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConversationMemory = z.infer<typeof insertConversationMemorySchema>;

// User Profiles - Long-term user preferences and learning patterns
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull().unique(), // Fixed to reference authUsers
  
  // Sales approach preferences
  preferredMethodology: varchar("preferred_methodology", { length: 50 }),
  conversationStyle: varchar("conversation_style", { length: 50 }),
  
  // Industry and domain expertise
  primaryIndustries: text("primary_industries").array(),
  productExpertise: text("product_expertise").array(),
  
  // Customer interaction patterns
  avgDealSize: text("avg_deal_size"),
  avgSalesCycle: text("avg_sales_cycle"),
  successfulPatterns: jsonb("successful_patterns"),
  commonObjections: text("common_objections").array(),
  
  // AI coaching preferences
  coachingIntensity: varchar("coaching_intensity", { length: 20 }),
  focusAreas: text("focus_areas").array(),
  
  // Performance metrics
  totalConversations: integer("total_conversations").default(0),
  avgConversionRate: integer("avg_conversion_rate"),
  strongestFramework: varchar("strongest_framework", { length: 50 }),
  improvementAreas: text("improvement_areas").array(),
  
  // Learning and adaptation
  learnings: jsonb("learnings"),
  customPreferences: jsonb("custom_preferences"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_profiles_user").on(table.userId),
  index("idx_profiles_methodology").on(table.preferredMethodology),
]);

export type UserProfile = typeof userProfiles.$inferSelect;
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

// ========================================
// CALL RECORDINGS & MEETING MINUTES (7-DAY RETENTION)
// ========================================

// Call Recordings table - stores audio recordings of calls with 7-day auto-delete
export const callRecordings = pgTable("call_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"), // Size in bytes
  duration: integer("duration"), // Duration in seconds
  recordingUrl: text("recording_url"), // URL or path to the stored audio file
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, deleted
  expiresAt: timestamp("expires_at").notNull(), // Auto-delete after 7 days
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("idx_recordings_user").on(table.userId),
  index("idx_recordings_expires").on(table.expiresAt),
  index("idx_recordings_status").on(table.status),
]);

export type CallRecording = typeof callRecordings.$inferSelect;
export const insertCallRecordingSchema = createInsertSchema(callRecordings).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
}).extend({
  expiresAt: z.date().optional(), // Allow server to set expiry date
});
export type InsertCallRecording = z.infer<typeof insertCallRecordingSchema>;

// Call Meeting Minutes table - stores AI-generated meeting minutes with 7-day auto-delete
export const callMeetingMinutes = pgTable("call_meeting_minutes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  recordingId: varchar("recording_id").references(() => callRecordings.id),
  title: varchar("title", { length: 255 }),
  summary: text("summary"),
  keyPoints: jsonb("key_points").default([]), // Array of key discussion points
  actionItems: jsonb("action_items").default([]), // Array of action items
  participants: jsonb("participants").default([]), // Array of participant names/roles
  painPoints: jsonb("pain_points").default([]), // Identified customer pain points
  recommendations: jsonb("recommendations").default([]), // AI recommendations
  nextSteps: jsonb("next_steps").default([]), // Recommended next steps
  fullTranscript: text("full_transcript"), // Complete transcript text
  structuredMinutes: jsonb("structured_minutes"), // Full UI-formatted meeting minutes (companyName, attendees, bant, discoveryQA, etc.)
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, deleted
  expiresAt: timestamp("expires_at").notNull(), // Auto-delete after 7 days
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("idx_minutes_user").on(table.userId),
  index("idx_minutes_recording").on(table.recordingId),
  index("idx_minutes_expires").on(table.expiresAt),
  index("idx_minutes_status").on(table.status),
]);

export type CallMeetingMinutes = typeof callMeetingMinutes.$inferSelect;
export const insertCallMeetingMinutesSchema = createInsertSchema(callMeetingMinutes).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
}).extend({
  expiresAt: z.date().optional(), // Allow server to set expiry date
});
export type InsertCallMeetingMinutes = z.infer<typeof insertCallMeetingMinutesSchema>;

// ==================== MULTI-PRODUCT RESPONSE SCHEMA ====================

// Section types for flexible rendering
export type SectionType = 
  | 'discovery'      // Discovery questions
  | 'solutions'      // Recommended solutions
  | 'salesScript'    // Sales script with talking points
  | 'caseStudies'    // Case studies
  | 'closingPitch'   // Closing pitch
  | 'nextSteps'      // Next steps
  | 'pitchDeck'      // Pitch deck
  | 'battleCard'     // Battle card
  | 'genericText'    // Generic text content
  | 'kpiTable'       // KPI/metrics table
  | 'bulletList';    // Bullet list

export type SectionLayout = 
  | 'tabs' 
  | 'accordion' 
  | 'hero' 
  | 'list' 
  | 'grid' 
  | 'card';

// Base section interface
export interface Section {
  id: string;
  title: string;
  type: SectionType;
  layout?: SectionLayout;
  variant?: string;
  data: SectionData;
  confidenceScore?: number;
  evidence?: string[]; // Knowledge base references
}

// Discriminated union for section data types
export type SectionData = 
  | TextSectionData
  | ListSectionData
  | TableSectionData
  | CardSectionData
  | ScriptSectionData
  | BattleCardSectionData
  | ClosingPitchSectionData;

export interface TextSectionData {
  type: 'text';
  content: string;
}

export interface ListSectionData {
  type: 'list';
  items: string[];
}

export interface TableSectionData {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface CardSectionData {
  type: 'card';
  cards: Array<{
    title: string;
    content: string;
    metadata?: Record<string, any>;
  }>;
}

export interface ScriptSectionData {
  type: 'script';
  solutions?: string[];
  valueProposition?: string[];
  technicalAnswers?: string[];
  caseStudies?: string[];
  competitorAnalysis?: string[];
  whyBetter?: string[];
}

export interface BattleCardSectionData {
  type: 'battleCard';
  competitor: string;
  ourAdvantages: string[];
  theirWeaknesses: string[];
  talkingPoints: string[];
}

export interface ClosingPitchSectionData {
  type: 'closingPitch';
  urgencyBuilder: string;
  objectionHandling: string[];
  finalValue: string;
  callToAction: string;
}

// Product-specific response
export interface ProductResponse {
  productId: string;
  productName: string;
  confidence: number;
  sections: Section[];
}

// Multi-product analysis response
export interface MultiProductAnalysisResponse {
  products: ProductResponse[];
  globalInsights?: Section[];
}

// Zod validation schemas for multi-product responses
// These schemas match the exact structure required by frontend rendering

export const discoveryInsightsSchema = z.object({
  painPoints: z.array(z.string()).min(1, "At least one pain point required"),
  currentEnvironment: z.string().min(1, "Current environment description required"),
  requirements: z.array(z.string()).min(1, "At least one requirement required")
});

export const closingPitchSchema = z.object({
  urgencyBuilder: z.string().min(1, "Urgency builder required"),
  objectionHandling: z.array(z.string()).min(1, "At least one objection handling point required"),
  finalValue: z.string().min(1, "Final value statement required"),
  callToAction: z.string().min(1, "Call to action required")
});

export const productAnalysisSchema = z.object({
  painPoints: z.array(z.string()).optional(),
  currentEnvironment: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  discoveryInsights: discoveryInsightsSchema,  // REQUIRED for frontend rendering
  nextQuestions: z.array(z.string()).min(1, "At least one next question required"),
  recommendedSolutions: z.array(z.string()).optional(),
  caseStudies: z.array(z.string()).optional(),  // Simple string array for case study titles/references
  closingPitch: closingPitchSchema,  // REQUIRED for frontend rendering
  nextSteps: z.array(z.string()).min(2, "At least two next steps required")  // Tightened from min(1)
});

export const salesScriptSchema = z.object({
  solutions: z.array(z.string()).min(1, "At least one solution required"),
  valueProposition: z.array(z.string()).min(1, "At least one value proposition required"),
  technicalAnswers: z.array(z.string()).optional(),
  caseStudies: z.array(z.string()).optional(),
  competitorAnalysis: z.array(z.string()).optional(),
  whyBetter: z.array(z.string()).optional()
});

export const productResponseItemSchema = z.object({
  productName: z.string().min(1, "Product name required"),
  productId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  analysis: productAnalysisSchema,
  salesScript: salesScriptSchema
});

export const multiProductResponseSchema = z.object({
  products: z.array(productResponseItemSchema).min(1, "At least one product required")
});

export type ProductResponseItem = z.infer<typeof productResponseItemSchema>;
export type MultiProductResponse = z.infer<typeof multiProductResponseSchema>;

// Traffic Analytics table
export const trafficLogs = pgTable("traffic_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: varchar("ip_address"),
  country: varchar("country"),
  state: varchar("state"),
  city: varchar("city"),
  deviceType: varchar("device_type"),
  browser: varchar("browser"),
  visitedPage: text("visited_page"),
  visitTime: timestamp("visit_time").defaultNow(),
});

export type TrafficLog = typeof trafficLogs.$inferSelect;
export const insertTrafficLogSchema = createInsertSchema(trafficLogs).omit({ id: true, visitTime: true });
export type InsertTrafficLog = z.infer<typeof insertTrafficLogSchema>;

// ========================================
// ADMIN ACCOUNT MANAGEMENT DTOs
// ========================================

// License Manager details for admin view (aligned with authUsers table)
export interface LicenseManagerDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  organization: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

// Enhanced addon details with start and renewal dates (aligned with addonPurchases table)
export interface EnhancedAddonDTO {
  id: string;
  addonId: string | null;
  slug: string;
  displayName: string;
  type: string;
  billingType: string | null;
  status: string;
  startDate: string | null;
  renewalDate: string | null;
  endDate: string | null;
  totalUnits: number;
  usedUnits: number;
  pricePerUnit: string | null;
  totalPrice: string | null;
  currency: string;
  autoRenew: boolean;
  purchaseId: string | null;
  metadata: Record<string, any> | null;
}

// License package with enhanced details (aligned with licensePackages table)
export interface EnhancedLicensePackageDTO {
  id: string;
  packageType: string;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  autoRenew: boolean;
  pricePerSeat: string | null;
  currency: string;
}

// Organization list item for admin panel
export interface AdminOrganizationListItemDTO {
  id: string;
  companyName: string;
  billingEmail: string;
  status: string;
  createdAt: string | null;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  activePackageType: string | null;
  packageEndDate: string | null;
  licenseManagerName: string | null;
  licenseManagerEmail: string | null;
}

// User details for organization view (aligned with authUsers + license assignments)
export interface OrganizationUserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  organization: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  licenseStatus: 'assigned' | 'revoked' | 'none';
  assignmentId: string | null;
  assignedAt: string | null;
  revokedAt: string | null;
  lastActive: string | null;
  trainMeEnabled: boolean;
  daiEnabled: boolean;
}

// Complete organization detail for admin view
export interface AdminOrganizationDetailDTO {
  organization: OrganizationDTO;
  licenseManager: LicenseManagerDTO | null;
  licensePackage: EnhancedLicensePackageDTO | null;
  addons: EnhancedAddonDTO[];
  users: OrganizationUserDTO[];
  assignments: LicenseAssignmentDTO[];
  members: OrganizationMembershipDTO[];
  billingHistory: {
    id: string;
    amount: string;
    currency: string;
    status: string;
    description: string;
    createdAt: string | null;
  }[];
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
}

// Schema for admin updating organization
export const adminUpdateOrganizationSchema = z.object({
  companyName: z.string().min(1, "Company name is required").optional(),
  billingEmail: z.string().email("Invalid billing email").optional(),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
});

export type AdminUpdateOrganization = z.infer<typeof adminUpdateOrganizationSchema>;

// Schema for admin adding seats
export const adminAddSeatsSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  numberOfSeats: z.number().min(1, "Must add at least 1 seat").max(500, "Maximum 500 seats per addition"),
  reason: z.string().min(1, "Reason is required"),
});

export type AdminAddSeats = z.infer<typeof adminAddSeatsSchema>;

// Schema for admin assigning license
export const adminAssignLicenseSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  userEmail: z.string().email("Invalid user email"),
  notes: z.string().optional(),
});

export type AdminAssignLicense = z.infer<typeof adminAssignLicenseSchema>;

// Schema for admin revoking license
export const adminRevokeLicenseSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  reason: z.string().min(1, "Reason is required"),
});

export type AdminRevokeLicense = z.infer<typeof adminRevokeLicenseSchema>;

// Schema for admin extending subscription
export const adminExtendSubscriptionSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  extensionDays: z.number().min(1, "Must extend by at least 1 day").max(365, "Maximum 365 days extension"),
  reason: z.string().min(1, "Reason is required"),
});

export type AdminExtendSubscription = z.infer<typeof adminExtendSubscriptionSchema>;

// Schema for license manager renewal/seat management
export const licenseRenewalSchema = z.object({
  licensePackageId: z.string().uuid("Invalid license package ID"),
  action: z.enum(["renew", "add_seats", "update_auto_renew"]),
  numberOfSeats: z.number().min(1).optional(),
  autoRenew: z.boolean().optional(),
});

export type LicenseRenewal = z.infer<typeof licenseRenewalSchema>;

// ==================== CONVERSATION MINUTES BACKUP ====================
// Stores conversation data in Meeting Minutes format for analysis and marketing

export const conversationMinutesBackup = pgTable("conversation_minutes_backup", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }), // Fixed to reference authUsers
  
  // Meeting metadata
  clientName: text("client_name"),
  companyName: text("company_name"),
  industry: text("industry"),
  meetingDate: timestamp("meeting_date"),
  meetingDuration: integer("meeting_duration_minutes"),
  
  // Structured content in Meeting Minutes format
  executiveSummary: text("executive_summary"),
  keyTopicsDiscussed: jsonb("key_topics_discussed").default([]),
  clientPainPoints: jsonb("client_pain_points").default([]),
  clientRequirements: jsonb("client_requirements").default([]),
  solutionsProposed: jsonb("solutions_proposed").default([]),
  competitorsDiscussed: jsonb("competitors_discussed").default([]),
  objections: jsonb("objections").default([]),
  actionItems: jsonb("action_items").default([]),
  nextSteps: jsonb("next_steps").default([]),
  
  // Full transcript and messages
  fullTranscript: text("full_transcript"),
  messageCount: integer("message_count").default(0),
  
  // Marketing and analysis metadata
  keyQuotes: jsonb("key_quotes").default([]),
  marketingHooks: jsonb("marketing_hooks").default([]),
  bestPractices: jsonb("best_practices").default([]),
  challengesIdentified: jsonb("challenges_identified").default([]),
  successIndicators: jsonb("success_indicators").default([]),
  
  // Raw data for flexible analysis
  rawMinutesData: jsonb("raw_minutes_data").default({}),
  discoveryInsights: jsonb("discovery_insights").default({}),
  
  // Backup metadata
  backupStatus: text("backup_status").default("pending"), // pending, completed, failed
  backupSource: text("backup_source").default("manual"), // manual, scheduled, api
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationMinutesBackupSchema = createInsertSchema(conversationMinutesBackup).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ConversationMinutesBackup = typeof conversationMinutesBackup.$inferSelect;
export type InsertConversationMinutesBackup = z.infer<typeof insertConversationMinutesBackupSchema>;

// ==================== SALES INTELLIGENCE AGENT ====================
// Additive intelligence layer for real-time sales response enhancement

// Sales Intent Types
export const SALES_INTENT_TYPES = {
  DISCOVERY_QUESTION: "discovery_question",
  OBJECTION_HANDLING: "objection_handling",
  PRICING_BUDGET: "pricing_budget",
  COMPETITOR_COMPARISON: "competitor_comparison",
  SECURITY_COMPLIANCE: "security_compliance",
  VALUE_JUSTIFICATION: "value_justification",
  CLOSING_NEXT_STEPS: "closing_next_steps",
} as const;

export type SalesIntentType = typeof SALES_INTENT_TYPES[keyof typeof SALES_INTENT_TYPES];

// Knowledge Store - Validated high-performing responses
export const salesIntelligenceKnowledge = pgTable("sales_intelligence_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Intent and context matching
  intentType: text("intent_type").notNull(), // discovery_question, objection_handling, etc.
  industry: text("industry"), // Optional industry filter
  persona: text("persona"), // Optional customer persona
  salesStage: text("sales_stage"), // Optional sales stage filter
  
  // Trigger patterns
  triggerKeywords: jsonb("trigger_keywords").default([]), // Keywords that trigger this response
  triggerPatterns: jsonb("trigger_patterns").default([]), // Regex patterns for matching
  
  // Response content
  suggestedResponse: text("suggested_response").notNull(),
  followUpPrompt: text("follow_up_prompt"), // Optional follow-up question
  
  // Performance metrics
  usageCount: integer("usage_count").default(0),
  acceptanceCount: integer("acceptance_count").default(0), // Times rep used the suggestion
  rejectionCount: integer("rejection_count").default(0), // Times rep ignored
  performanceScore: integer("performance_score").default(50), // 0-100 score
  
  // Validation status
  isValidated: boolean("is_validated").default(false),
  validatedBy: varchar("validated_by").references(() => authUsers.id, { onDelete: "set null" }), // Fixed to reference authUsers
  validatedAt: timestamp("validated_at"),
  
  // Metadata
  source: text("source").default("manual"), // manual, ai_generated, imported
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suggestions made during live calls
export const salesIntelligenceSuggestions = pgTable("sales_intelligence_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Context
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }), // Fixed to reference authUsers
  knowledgeId: varchar("knowledge_id").references(() => salesIntelligenceKnowledge.id, { onDelete: "set null" }),
  
  // Detection data
  detectedIntent: text("detected_intent").notNull(),
  intentConfidence: integer("intent_confidence").notNull(), // 0-100
  customerQuestion: text("customer_question").notNull(),
  
  // Context assembled
  assembledContext: jsonb("assembled_context").default({}), // industry, persona, stage, product
  
  // Response delivered
  suggestedResponse: text("suggested_response").notNull(),
  followUpPrompt: text("follow_up_prompt"),
  retrievalConfidence: integer("retrieval_confidence").notNull(), // 0-100
  
  // Outcome tracking
  wasDisplayed: boolean("was_displayed").default(true),
  wasUsed: boolean("was_used"), // null = unknown, true = used, false = ignored
  responseLatencyMs: integer("response_latency_ms"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// Post-call learning logs for research and marketing
export const salesIntelligenceLearningLogs = pgTable("sales_intelligence_learning_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Reference to suggestion
  suggestionId: varchar("suggestion_id").references(() => salesIntelligenceSuggestions.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }), // Fixed to reference authUsers
  
  // Learning data
  customerQuestion: text("customer_question").notNull(),
  detectedIntent: text("detected_intent").notNull(),
  suggestedResponse: text("suggested_response").notNull(),
  
  // Rep behavior
  repUsedSuggestion: boolean("rep_used_suggestion"),
  repModifiedResponse: text("rep_modified_response"), // If rep used but modified
  
  // Outcome signals
  outcomeSignals: jsonb("outcome_signals").default({}), // call_continued, objection_resolved, deal_progressed
  
  // Context for analysis
  industry: text("industry"),
  persona: text("persona"),
  salesStage: text("sales_stage"),
  productDiscussed: text("product_discussed"),
  
  // Research metadata
  isAnonymized: boolean("is_anonymized").default(false),
  canUseForMarketing: boolean("can_use_for_marketing").default(true),
  canUseForTraining: boolean("can_use_for_training").default(true),
  
  // Processing status
  processingStatus: text("processing_status").default("pending"), // pending, processed, promoted
  promotedToKnowledge: boolean("promoted_to_knowledge").default(false),
  promotedKnowledgeId: varchar("promoted_knowledge_id").references(() => salesIntelligenceKnowledge.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Research data exports table for marketing team
export const salesIntelligenceExports = pgTable("sales_intelligence_exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Export details
  exportName: text("export_name").notNull(),
  exportType: text("export_type").notNull(), // knowledge, suggestions, learning_logs, analytics
  
  // Filters applied
  dateRangeStart: timestamp("date_range_start"),
  dateRangeEnd: timestamp("date_range_end"),
  intentFilter: text("intent_filter"),
  industryFilter: text("industry_filter"),
  
  // Export data
  recordCount: integer("record_count").default(0),
  exportData: jsonb("export_data").default([]),
  
  // Metadata
  exportedBy: varchar("exported_by").references(() => authUsers.id, { onDelete: "set null" }), // Fixed to reference authUsers
  purpose: text("purpose"), // research, marketing, training, analytics
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertSalesIntelligenceKnowledgeSchema = createInsertSchema(salesIntelligenceKnowledge).omit({
  id: true,
  usageCount: true,
  acceptanceCount: true,
  rejectionCount: true,
  performanceScore: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesIntelligenceSuggestionSchema = createInsertSchema(salesIntelligenceSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertSalesIntelligenceLearningLogSchema = createInsertSchema(salesIntelligenceLearningLogs).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertSalesIntelligenceExportSchema = createInsertSchema(salesIntelligenceExports).omit({
  id: true,
  createdAt: true,
});

// Marketing Add-On Access table - tracks users with marketing add-on access
export const marketingAccess = pgTable("marketing_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  grantedBy: varchar("granted_by").references(() => authUsers.id).notNull(), // License Manager who granted access
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'revoked', 'expired'
  accessToken: varchar("access_token", { length: 255 }), // Secure access token for direct link access
  passwordSetup: boolean("password_setup").default(false), // Whether user has set up their marketing-specific password
  hashedPassword: varchar("hashed_password", { length: 255 }), // Marketing-specific password
  expiresAt: timestamp("expires_at"), // Optional expiry
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketing User Settings - stores contact details and preferences
export const marketingUserSettings = pgTable("marketing_user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull().unique(),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactWebsite: varchar("contact_website", { length: 255 }),
  preferredTone: varchar("preferred_tone", { length: 50 }).default("professional"), // professional, bold, thought-leadership, conversational, analytical
  defaultHashtagMode: varchar("default_hashtag_mode", { length: 20 }).default("auto"), // manual, auto, both
  dataBankMode: boolean("data_bank_mode").default(true), // Default to data bank mode
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketing Generated Content - stores generated posts, scripts, research
export const marketingGeneratedContent = pgTable("marketing_generated_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id).notNull(),
  contentType: varchar("content_type", { length: 30 }).notNull(), // 'post', 'video_script', 'research', 'infographic'
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  length: varchar("length", { length: 20 }), // short, medium, long
  tone: varchar("tone", { length: 50 }),
  hashtags: text("hashtags").array(),
  contactDetailsIncluded: boolean("contact_details_included").default(false),
  dataSource: varchar("data_source", { length: 20 }).default("data_bank"), // 'data_bank', 'universal'
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types and schemas
export type MarketingAccess = typeof marketingAccess.$inferSelect;
export type InsertMarketingAccess = typeof marketingAccess.$inferInsert;
export type MarketingUserSettings = typeof marketingUserSettings.$inferSelect;
export type InsertMarketingUserSettings = typeof marketingUserSettings.$inferInsert;
export type MarketingGeneratedContent = typeof marketingGeneratedContent.$inferSelect;
export type InsertMarketingGeneratedContent = typeof marketingGeneratedContent.$inferInsert;

export const insertMarketingAccessSchema = createInsertSchema(marketingAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketingUserSettingsSchema = createInsertSchema(marketingUserSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketingGeneratedContentSchema = createInsertSchema(marketingGeneratedContent).omit({
  id: true,
  createdAt: true,
});

// Types
export type SalesIntelligenceKnowledge = typeof salesIntelligenceKnowledge.$inferSelect;
export type InsertSalesIntelligenceKnowledge = z.infer<typeof insertSalesIntelligenceKnowledgeSchema>;
export type SalesIntelligenceSuggestion = typeof salesIntelligenceSuggestions.$inferSelect;
export type InsertSalesIntelligenceSuggestion = z.infer<typeof insertSalesIntelligenceSuggestionSchema>;
export type SalesIntelligenceLearningLog = typeof salesIntelligenceLearningLogs.$inferSelect;
export type InsertSalesIntelligenceLearningLog = z.infer<typeof insertSalesIntelligenceLearningLogSchema>;
export type SalesIntelligenceExport = typeof salesIntelligenceExports.$inferSelect;
export type InsertSalesIntelligenceExport = z.infer<typeof insertSalesIntelligenceExportSchema>;

// API Keys table - allows clients to integrate Rev Winner into their platforms
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  createdBy: varchar("created_by").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  scopes: text("scopes").array().default([]),
  rateLimit: integer("rate_limit").default(1000),
  rateLimitWindow: varchar("rate_limit_window", { length: 20 }).default("hour"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  expiresAt: timestamp("expires_at"),
  ipWhitelist: text("ip_whitelist").array(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => authUsers.id, { onDelete: "set null" }),
});

// API Key Usage Logs - tracks API key usage for analytics
export const apiKeyUsageLogs = pgTable("api_key_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id, { onDelete: "cascade" }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestBody: jsonb("request_body"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type ApiKeyUsageLog = typeof apiKeyUsageLogs.$inferSelect;

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  lastUsedAt: true,
  usageCount: true,
  createdAt: true,
  revokedAt: true,
  revokedBy: true,
});

export const insertApiKeyUsageLogSchema = createInsertSchema(apiKeyUsageLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertApiKeyUsageLog = z.infer<typeof insertApiKeyUsageLogSchema>;
