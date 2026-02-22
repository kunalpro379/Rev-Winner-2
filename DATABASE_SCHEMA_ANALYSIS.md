# Database Schema Analysis Report

## Analysis Date
February 22, 2026

## Summary
Analyzed server API routes against database schema to identify missing tables and inconsistencies.

## Tables Defined in Schema (shared/schema.ts)

### Core Tables
1. ✅ sessions - Replit Auth session storage
2. ✅ users - Replit Auth users (legacy)
3. ✅ conversations - Conversation sessions
4. ✅ audioSources - Audio source tracking
5. ✅ messages - Conversation messages
6. ✅ teamsMeetings - Teams meeting integration

### Authentication & User Management
7. ✅ authUsers - Custom JWT authentication users
8. ✅ superUserOverrides - Super user access grants
9. ✅ otps - OTP verification codes
10. ✅ passwordResetTokens - Password reset tokens
11. ✅ refreshTokens - JWT refresh tokens

### Subscription & Billing
12. ✅ addons - Add-on packages (session minutes, train me, etc.)
13. ✅ subscriptionPlans - Subscription plan definitions
14. ✅ subscriptionPlansHistory - Plan version history
15. ✅ addonsHistory - Add-on version history
16. ✅ subscriptions - User subscriptions
17. ✅ payments - Payment transactions
18. ✅ promoCodes - Promotional codes
19. ✅ sessionUsage - Session usage tracking
20. ✅ sessionMinutesPurchases - Session minutes purchases
21. ✅ aiTokenUsage - AI token consumption tracking

### Enterprise Features
22. ✅ organizations - Enterprise organizations
23. ✅ organizationMemberships - Organization user memberships
24. ✅ licensePackages - Enterprise license packages
25. ✅ licenseAssignments - License seat assignments
26. ✅ billingAdjustments - Enterprise billing adjustments
27. ✅ enterprisePromoCodes - Enterprise promo codes
28. ✅ enterprisePromoCodeUsages - Enterprise promo usage tracking

### Marketing & Support
29. ✅ leads - Demo requests and contact forms
30. ✅ auditLogs - System audit logs

### Train Me Feature
31. ✅ domainExpertise - Domain expertise profiles
32. ✅ trainingDocuments - Training documents/audio
33. ✅ knowledgeEntries - Structured knowledge base

### Admin Features
34. ✅ systemMetrics - System health metrics
35. ✅ announcements - Admin announcements
36. ✅ supportTickets - Support ticket tracking
37. ✅ refunds - Refund tracking
38. ✅ timeExtensions - Time extension grants

### New Billing System (Enterprise)
39. ✅ gatewayProviders - Payment gateway abstraction
40. ✅ gatewayTransactions - Universal transaction log
41. ✅ gatewayWebhooks - Webhook event log
42. ✅ addonPurchases - Normalized add-on purchases
43. ✅ sessionMinutesUsage - Session minutes usage log
44. ✅ daiUsageLogs - DAI token usage tracking
45. ✅ enterpriseUserAssignments - Enterprise seat management
46. ✅ activationInvites - Enterprise activation invites
47. ✅ adminActionsLog - Admin action audit trail
48. ✅ userEntitlements - User entitlements cache
49. ✅ pendingOrders - Pending payment orders
50. ✅ cartItems - Shopping cart items

### Knowledge Base (AI Quality)
51. ✅ caseStudies - Real customer case studies
52. ✅ products - Product catalog
53. ✅ implementationPlaybooks - Implementation guides
54. ✅ promptTemplates - Centralized prompt management
55. ✅ conversationIntents - Detected conversation intents
56. ✅ buyerStages - Buyer journey tracking
57. ✅ conversationMemories - Session-scoped insights
58. ✅ userProfiles - Long-term user preferences

## Missing Tables (Referenced in Code but Not in Schema)

### CRITICAL MISSING TABLES:
1. ❌ **trafficLogs** - Referenced in server/routes-admin.ts
   - Used for: Traffic analytics and monitoring
   - Fields needed: id, userId, path, method, statusCode, responseTime, ipAddress, userAgent, timestamp

2. ❌ **userFeedback** - Referenced in server/routes.ts
   - Used for: User feedback collection
   - Fields needed: id, userId, conversationId, rating, feedback, createdAt

## Issues Found

### 1. Missing Table: trafficLogs
**Location:** server/routes-admin.ts
**Usage:** `import { auditLogs, authUsers, trafficLogs, insertTrafficLogSchema } from "../shared/schema";`
**Impact:** HIGH - Admin analytics will fail

### 2. Missing Table: userFeedback  
**Location:** server/routes.ts
**Usage:** `import { ... userFeedback } from "../shared/schema";`
**Impact:** MEDIUM - Feedback feature will fail

### 3. Missing Schema: insertTrafficLogSchema
**Location:** server/routes-admin.ts
**Impact:** HIGH - Cannot insert traffic logs

## Recommendations

### Immediate Actions Required:

1. **Add trafficLogs table to schema.ts:**
```typescript
export const trafficLogs = pgTable("traffic_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "set null" }),
  path: text("path").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // milliseconds
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_traffic_logs_user").on(table.userId),
  index("idx_traffic_logs_timestamp").on(table.timestamp),
  index("idx_traffic_logs_path").on(table.path),
]);
```

2. **Add userFeedback table to schema.ts:**
```typescript
export const userFeedback = pgTable("user_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  feedback: text("feedback"),
  category: varchar("category", { length: 50 }), // 'feature_request', 'bug_report', 'general'
  status: varchar("status", { length: 20 }).default("new"), // 'new', 'reviewed', 'resolved'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_feedback_user").on(table.userId),
  index("idx_user_feedback_conversation").on(table.conversationId),
  index("idx_user_feedback_status").on(table.status),
]);
```

3. **Add insert schemas:**
```typescript
export const insertTrafficLogSchema = createInsertSchema(trafficLogs).omit({
  id: true,
  timestamp: true,
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
});

export type TrafficLog = typeof trafficLogs.$inferSelect;
export type InsertTrafficLog = z.infer<typeof insertTrafficLogSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
```

## Database Push Command

After adding missing tables to schema.ts, run:
```bash
npm run db:push
```

## Verification Steps

1. Check all imports in server files resolve correctly
2. Verify no TypeScript errors in schema.ts
3. Test database push to Neon
4. Verify all tables created successfully
5. Test API endpoints that use new tables

## Notes

- The schema is well-structured with proper foreign keys and indexes
- Most tables have proper cascade delete rules
- Good use of JSONB for flexible metadata storage
- Proper use of timestamps for audit trails
- Enterprise features are comprehensive and well-designed

## Status: ⚠️ ACTION REQUIRED

Missing tables must be added before the application can function properly.
