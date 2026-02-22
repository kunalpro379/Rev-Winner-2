# Fix Neon Database Endpoint Disabled Error

## Problem
Your Neon database endpoint has been disabled, causing all database operations to fail with:
```
error: The endpoint has been disabled. Enable it using Neon API and retry.
```

## Solution

### Option 1: Enable via Neon Console (Recommended)

1. **Visit Neon Console**: https://console.neon.tech
2. **Login** to your account
3. **Select your project** (the one used in your DATABASE_URL)
4. **Check project status**:
   - Look for any warnings or suspension notices
   - Check if the endpoint is paused/disabled
5. **Enable the endpoint**:
   - Click on "Settings" or "Compute"
   - Look for "Resume" or "Enable" button
   - Click to reactivate

### Option 2: Check Free Tier Limits

If you're on the free tier:
- **Compute hours**: Free tier has limited compute hours per month
- **Storage**: Check if you've exceeded storage limits
- **Connections**: Too many concurrent connections can cause issues

**Actions:**
- Upgrade to paid tier if needed
- Delete old/unused data to free up space
- Optimize connection pooling

### Option 3: Enable via Neon API

If you have API access:

```bash
# Get your API key from https://console.neon.tech/app/settings/api-keys

# List your projects
curl -X GET https://console.neon.tech/api/v2/projects \
  -H "Authorization: Bearer YOUR_API_KEY"

# Enable endpoint (replace PROJECT_ID and ENDPOINT_ID)
curl -X PATCH https://console.neon.tech/api/v2/projects/PROJECT_ID/endpoints/ENDPOINT_ID \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"disabled": false}'
```

### Option 4: Create New Database (Last Resort)

If you can't enable the existing endpoint:

1. **Create new Neon project**: https://console.neon.tech
2. **Get new DATABASE_URL**
3. **Update .env file**:
   ```
   DATABASE_URL=postgresql://user:pass@new-endpoint.neon.tech/dbname
   ```
4. **Push schema**:
   ```bash
   npm run db:push
   ```
5. **Restart server**:
   ```bash
   npm run dev
   ```

## Temporary Workaround (Development Only)

While fixing the database, you can disable scheduled jobs to reduce errors:

### Edit `server/index.ts`:

Find this line (around line 150):
```typescript
await initializeScheduledJobs();
```

Comment it out:
```typescript
// await initializeScheduledJobs(); // Disabled until database is fixed
```

This will prevent the maintenance jobs from running and spamming errors.

## After Fixing

Once your database is back online:

1. **Restart your server**:
   ```bash
   npm run dev
   ```

2. **Test database connection**:
   ```bash
   # Try registering a user or any database operation
   ```

3. **Check logs** - You should see:
   ```
   ✓ Application started successfully in development mode
   ```
   Without any database errors.

4. **Re-enable scheduled jobs** if you disabled them

## Prevention

To avoid this in the future:

1. **Monitor usage**: Check Neon dashboard regularly
2. **Set up alerts**: Enable email notifications in Neon
3. **Upgrade plan**: If you're hitting limits frequently
4. **Backup data**: Regular backups to prevent data loss
5. **Use connection pooling**: Optimize database connections

## Common Causes

- **Inactivity**: Free tier projects auto-suspend after inactivity
- **Exceeded limits**: Storage or compute hours exceeded
- **Billing issues**: Payment failed or card expired
- **Manual suspension**: You or team member disabled it
- **Maintenance**: Neon performing maintenance (rare)

## Need Help?

- **Neon Support**: https://neon.tech/docs/introduction/support
- **Neon Discord**: https://discord.gg/neon
- **Neon Status**: https://neonstatus.com

## Quick Check

Run this to test your database connection:

```bash
node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0])).catch(e => console.error('❌ Error:', e.message));
"
```

If you see "The endpoint has been disabled", follow the steps above.
