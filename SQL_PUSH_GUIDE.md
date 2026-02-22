# 🚀 SQL File Push Guide

## Quick Start

Push your `download.sql` file to Neon PostgreSQL:

```bash
# Method 1: Simple execution (Recommended)
node execute-sql.mjs

# Method 2: Smart push (tries multiple methods)
node push-sql.mjs

# Method 3: Using npm script
npm run db:push:sql

# Method 4: Direct with psql (if installed)
node push-sql-psql.mjs

# Method 5: Detailed execution
node push-sql-file.mjs
```

---

## 📁 Files Created

1. **execute-sql.mjs** - Simple, fast execution (RECOMMENDED)
2. **push-sql.mjs** - Smart push with fallback methods
3. **push-sql-file.mjs** - Detailed execution with progress
4. **push-sql-psql.mjs** - Uses native psql command

---

## 🎯 Recommended Method

```bash
node execute-sql.mjs
```

This script:
- ✅ Connects to Neon
- ✅ Reads download.sql (18,846 lines)
- ✅ Executes SQL statements
- ✅ Handles errors gracefully
- ✅ Verifies table creation
- ⏱️ Takes 1-3 minutes

---

## 📊 What's in download.sql?

Your SQL file contains:
- Database schema definitions
- Table structures
- Indexes and constraints
- Foreign key relationships
- Initial data (if any)

**File Size**: ~1-2 MB  
**Lines**: 18,846  
**Tables**: 70+ tables

---

## ⚙️ Execution Methods Explained

### Method 1: execute-sql.mjs (Fastest)
```bash
node execute-sql.mjs
```
- Executes entire file as one query
- Falls back to statement-by-statement if needed
- Best for clean SQL dumps

### Method 2: push-sql.mjs (Smartest)
```bash
node push-sql.mjs
```
- Tries psql first (fastest)
- Falls back to Node.js pg client
- Handles various SQL formats

### Method 3: push-sql-file.mjs (Most Detailed)
```bash
node push-sql-file.mjs
```
- Statement-by-statement execution
- Progress tracking
- Detailed error reporting
- Best for debugging

### Method 4: push-sql-psql.mjs (Native)
```bash
node push-sql-psql.mjs
```
- Uses native PostgreSQL psql command
- Fastest for large files
- Requires psql installed

---

## 🔍 Verification

After pushing, verify success:

### Check Table Count
```bash
node -e "
import pg from 'pg';
const client = new pg.Client({
  connectionString: 'postgresql://neondb_owner:npg_dPfct7i1jHml@ep-silent-lake-aiivq0an-pooler.c-4.us-east-1.aws.neon.tech/revwinner?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
await client.connect();
const res = await client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \\'public\\'');
console.log('Tables:', res.rows[0].count);
await client.end();
"
```

### Use Drizzle Studio
```bash
npm run db:studio
```

### Check Neon Console
https://console.neon.tech/

---

## ⚠️ Common Issues

### Issue: "syntax error at or near"
**Solution**: Use `execute-sql.mjs` which handles this automatically

### Issue: "already exists"
**Solution**: This is normal - tables already exist. Script continues.

### Issue: "permission denied"
**Solution**: Check database user permissions in Neon Console

### Issue: "connection timeout"
**Solution**: 
```bash
# Increase timeout in script or try smaller batches
node push-sql-file.mjs
```

### Issue: "out of memory"
**Solution**: Use statement-by-statement execution:
```bash
node push-sql-file.mjs
```

---

## 🎨 Progress Tracking

All scripts show progress:
- ✅ Connection status
- 📊 File size and line count
- ⚙️ Execution progress
- 📈 Success/error counts
- ⏱️ Execution time

---

## 🔐 Security Notes

The scripts use:
- SSL connection (required by Neon)
- Connection pooling
- Timeout protection
- Error handling

**Important**: Never commit database credentials to git!

---

## 📝 What Happens During Push

1. **Connect** to Neon PostgreSQL
2. **Read** download.sql file
3. **Parse** SQL statements
4. **Execute** statements in order
5. **Handle** errors (skip "already exists")
6. **Verify** table creation
7. **Report** results

---

## ✅ Success Indicators

You'll see:
```
✅ Connected
✅ Loaded X MB
⚙️  Executing SQL...
✅ Success! Completed in X seconds
📊 Tables in database: 70+
🎉 Done!
```

---

## 🚀 After Successful Push

1. **Verify tables**:
   ```bash
   npm run db:studio
   ```

2. **Test application**:
   ```bash
   npm run dev
   ```

3. **Check Neon Console**:
   - View tables
   - Check indexes
   - Monitor queries

4. **Set up backups**:
   - Configure in Neon Console
   - Set retention policy

---

## 🆘 Troubleshooting

### Script hangs?
- Press Ctrl+C
- Try: `node execute-sql.mjs`
- Check Neon Console for active queries

### Partial execution?
- Check which tables were created
- Re-run script (it will skip existing tables)
- Or drop database and start fresh

### Need to start over?
```sql
-- In Neon Console SQL Editor:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then re-run the push script.

---

## 📞 Support

- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Node.js pg**: https://node-postgres.com/

---

## 🎯 Quick Reference

| Command | Speed | Reliability | Use Case |
|---------|-------|-------------|----------|
| `execute-sql.mjs` | ⚡⚡⚡ | ⭐⭐⭐ | First try |
| `push-sql.mjs` | ⚡⚡ | ⭐⭐⭐⭐ | Smart fallback |
| `push-sql-file.mjs` | ⚡ | ⭐⭐⭐⭐⭐ | Debugging |
| `push-sql-psql.mjs` | ⚡⚡⚡⚡ | ⭐⭐⭐ | If psql available |

---

**Last Updated**: February 2026  
**Database**: Neon PostgreSQL 17.8  
**SQL File**: download.sql (18,846 lines)
