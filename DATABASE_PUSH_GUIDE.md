# 🚀 Database Push Guide - Rev Winner to Neon PostgreSQL

This guide explains how to push your complete database schema to Neon PostgreSQL.

## 📋 Prerequisites

- Node.js installed
- Database URL configured
- `drizzle-kit` installed (already in devDependencies)

## 🎯 Quick Start

### Method 1: Using npm scripts (Recommended)

```bash
# Push schema directly to Neon
npm run db:push:neon
```

### Method 2: Using drizzle-kit directly

```bash
# Generate migration files
npx drizzle-kit generate

# Push to database
npx drizzle-kit push
```

### Method 3: Manual execution

```bash
# Run the push script directly
node push-schema.mjs
```

## 📁 Files Created

1. **drizzle.config.ts** - Drizzle Kit configuration
2. **push-schema.mjs** - Automated push script with progress tracking
3. **direct-push.mjs** - Direct connection test script
4. **push-to-neon.mjs** - Alternative push method

## 🔧 Configuration

The database URL is configured in `drizzle.config.ts`:

```typescript
{
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require',
  },
}
```

## 📊 What Gets Created

The push will create **80+ tables** including:

### Core Tables
- `auth_users` - User authentication
- `sessions` - Session management
- `conversations` - Conversation tracking
- `messages` - Message storage

### Subscription & Billing
- `subscription_plans` - Plan definitions
- `subscriptions` - User subscriptions
- `payments` - Payment records
- `addon_purchases` - Add-on purchases
- `promo_codes` - Promotional codes

### Enterprise Features
- `organizations` - Company accounts
- `license_packages` - Bulk licenses
- `license_assignments` - License distribution
- `enterprise_user_assignments` - User assignments

### AI & Analytics
- `ai_token_usage` - Token consumption tracking
- `sales_intelligence_knowledge` - Sales AI knowledge base
- `conversation_memories` - AI conversation context
- `user_profiles` - User behavior patterns

### Marketing & Content
- `marketing_access` - Marketing add-on access
- `marketing_generated_content` - Generated content
- `case_studies` - Success stories
- `products` - Product catalog

### Admin & Management
- `api_keys` - API key management
- `audit_logs` - System audit trail
- `user_feedback` - User feedback system
- `traffic_logs` - Traffic analytics

## ✅ Verification Steps

After pushing, verify the schema:

```bash
# Open Drizzle Studio to browse tables
npm run db:studio

# Or check in Neon Console
# https://console.neon.tech/
```

## 🔍 Troubleshooting

### Error: "drizzle-kit not found"
```bash
npm install -D drizzle-kit
```

### Error: "Connection refused"
- Check if DATABASE_URL is correct
- Verify Neon database is running
- Check firewall/network settings

### Error: "Permission denied"
- Verify database user has CREATE permissions
- Check if user is database owner

### Error: "Table already exists"
- This is normal if tables exist
- drizzle-kit will update existing tables
- Use `--force` flag to recreate: `npx drizzle-kit push --force`

## 🎨 Database Studio

Launch the visual database browser:

```bash
npm run db:studio
```

This opens a web interface at `https://local.drizzle.studio` where you can:
- Browse all tables
- View table schemas
- Run queries
- Inspect relationships

## 📝 Migration Files

Generated migrations are stored in `./drizzle/` directory:
- `0000_*.sql` - Initial schema
- `0001_*.sql` - Subsequent changes
- `meta/` - Migration metadata

## 🔐 Security Notes

⚠️ **Important**: The database URL contains credentials. In production:

1. Use environment variables:
```typescript
dbCredentials: {
  url: process.env.DATABASE_URL,
}
```

2. Add to `.gitignore`:
```
.env
drizzle.config.ts  # If it contains credentials
```

3. Use Neon's connection pooler for better performance

## 🚀 Next Steps

After successful push:

1. ✅ Verify tables in Neon Console
2. ✅ Test database connections
3. ✅ Run your application
4. ✅ Set up backups in Neon
5. ✅ Configure monitoring

## 📞 Support

- Neon Docs: https://neon.tech/docs
- Drizzle Docs: https://orm.drizzle.team/
- Rev Winner Support: [Your support channel]

---

**Last Updated**: February 2026
**Database**: Neon PostgreSQL (AWS us-east-1)
**Schema Version**: Latest from shared/schema.ts
