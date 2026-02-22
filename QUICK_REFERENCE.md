# 🚀 Quick Reference - Database Commands

## ✅ Push Complete!

Your database schema is now live on Neon PostgreSQL.

---

## 📋 Common Commands

### Push Schema Changes
```bash
npm run db:push:neon
# or
npx drizzle-kit push
```

### View Database
```bash
npm run db:studio
```

### Generate Migrations
```bash
npx drizzle-kit generate
```

### Test Connection
```bash
node direct-push.mjs
```

---

## 🔗 Quick Links

- **Neon Console**: https://console.neon.tech/
- **Drizzle Studio**: Run `npm run db:studio`
- **Database**: revwinner (us-east-1)

---

## 📊 Your Database

- **Tables**: 73+
- **PostgreSQL**: 17.8
- **Connection**: Pooled with SSL
- **Status**: ✅ Active

---

## 🆘 Troubleshooting

### Schema not updating?
```bash
npx drizzle-kit push --force
```

### Connection issues?
```bash
node direct-push.mjs
```

### Need to rollback?
Use Neon Console → Restore from backup

---

## 📁 Files Created

1. ✅ `drizzle.config.ts` - Configuration
2. ✅ `push-schema.mjs` - Push script
3. ✅ `direct-push.mjs` - Connection test
4. ✅ `DATABASE_PUSH_GUIDE.md` - Full guide
5. ✅ `SUCCESS_REPORT.md` - Push report
6. ✅ `PUSH_NOW.md` - Quick start

---

## 🎯 Next: Start Your App

```bash
npm run dev
```

Your database is ready! 🎉
