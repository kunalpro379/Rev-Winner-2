# 📦 RevWinner Packages & Pricing Summary

## ✅ Database Status
All packages have been successfully seeded into the Neon database.

---

## 🎯 SUBSCRIPTION PLANS (Main Platform Access)

### 1. **3 Months Plan** - $149 USD (One-time)
- **Listed Price**: $199 (Save $50!)
- **Billing**: One-time payment
- **Features**:
  - Unlimited sessions
  - Unlimited time
  - Free upgrades
  - 24x5 support
  - Bring your own AI key
  - 90 days access
  - All AI features included
  - Priority support

### 2. **6 Months Plan** - $220 USD
- **Billing**: 6-months
- **Razorpay Plan ID**: plan_6month_200
- **Features**:
  - Unlimited sessions
  - Unlimited time
  - Free upgrades
  - 24x5 support
  - Bring your own AI key

### 3. **12 Months Plan** - $399 USD
- **Listed Price**: $799 (Save $400!)
- **Billing**: 1-year
- **Razorpay Plan ID**: plan_yearly_399
- **Features**:
  - Unlimited sessions
  - Unlimited time
  - Free upgrades
  - 24x5 support
  - Bring your own AI key

### 4. **36 Months Plan** - $499 USD
- **Listed Price**: $999 (Save $500!)
- **Billing**: 3-years
- **Razorpay Plan ID**: plan_3year_499
- **Features**:
  - Unlimited sessions
  - Unlimited time
  - Free upgrades
  - 24x5 support
  - Bring your own AI key

---

## 🔌 DAI ADDONS (Dedicated AI Token Packages)

These are monthly subscription addons that provide AI tokens for users who don't want to bring their own AI keys.

### 1. **DAI Lite** - $10/month
- **Tokens**: 100,000 tokens/month
- **Best For**: Light usage
- **Validity**: 30 days
- **Features**:
  - Access to all AI models
  - Perfect for light usage
  - Monthly renewal

### 2. **DAI Moderate** - $25/month
- **Tokens**: 300,000 tokens/month
- **Best For**: Regular usage
- **Validity**: 30 days
- **Features**:
  - Access to all AI models
  - Great for regular usage
  - Monthly renewal

### 3. **DAI Professional** - $50/month
- **Tokens**: 750,000 tokens/month
- **Best For**: Power users
- **Validity**: 30 days
- **Features**:
  - Access to all AI models
  - Ideal for power users
  - Monthly renewal

### 4. **DAI Power** - $100/month
- **Tokens**: 1,500,000 tokens/month
- **Best For**: Heavy users
- **Validity**: 30 days
- **Features**:
  - Access to all AI models
  - For heavy users
  - Monthly renewal

### 5. **DAI Enterprise** - $200/month
- **Tokens**: 3,000,000 tokens/month
- **Best For**: Enterprise-grade usage
- **Validity**: 30 days
- **Features**:
  - Access to all AI models
  - Enterprise-grade usage
  - Monthly renewal

---

## 📚 TRAIN ME ADDON - $20/month

Special addon that allows users to train the AI on their specific domain knowledge.

**Features**:
- Create up to 5 domain expertise profiles
- Upload up to 100 documents per domain
- Support for multiple formats: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT
- Train AI with specific product knowledge and pricing
- Get domain-specific answers during sales calls
- Monthly renewal (30 days validity)

---

## ⏱️ SESSION MINUTES BUNDLES (One-time Purchase)

These are one-time purchase packages that add session minutes to user accounts. They never expire!

| Package | Price | Minutes | Cost per Minute |
|---------|-------|---------|-----------------|
| **500 Minutes** | $8 | 500 | 1.60¢/min |
| **1000 Minutes** | $16 | 1,000 | 1.60¢/min |
| **1500 Minutes** | $24 | 1,500 | 1.60¢/min |
| **2000 Minutes** | $32 | 2,000 | 1.60¢/min |
| **3000 Minutes** | $48 | 3,000 | 1.60¢/min |
| **5000 Minutes** | $80 | 5,000 | 1.60¢/min |

**Features**:
- Never expires
- One-time purchase
- Add to any subscription plan

---

## 💡 PRICING STRATEGY INSIGHTS

### Subscription Plans
- **Best Value**: 36 Months Plan (50% off - $499 vs $999)
- **Most Popular**: 12 Months Plan (50% off - $399 vs $799)
- **Quick Start**: 3 Months Plan (25% off - $149 vs $199)

### DAI Token Packages
- **Cost per 1K tokens**:
  - Lite: $0.10/1K tokens
  - Moderate: $0.083/1K tokens
  - Professional: $0.067/1K tokens
  - Power: $0.067/1K tokens
  - Enterprise: $0.067/1K tokens

### Session Minutes
- **Flat rate**: 1.60¢ per minute across all packages
- **Recommendation**: Larger packages for better value (no price difference per minute, but fewer transactions)

---

## 🎯 TYPICAL USER JOURNEYS

### Journey 1: Budget-Conscious User
1. Start with **3 Months Plan** ($149)
2. Bring own AI key (OpenAI/Anthropic)
3. Buy **500 Minutes Bundle** ($8) if needed

### Journey 2: Professional User
1. Subscribe to **12 Months Plan** ($399)
2. Add **DAI Professional** ($50/month) for convenience
3. Add **Train Me** ($20/month) for domain expertise

### Journey 3: Enterprise User
1. Subscribe to **36 Months Plan** ($499)
2. Add **DAI Enterprise** ($200/month) for heavy usage
3. Add **Train Me** ($20/month) for product knowledge
4. Buy **5000 Minutes Bundle** ($80) for extra capacity

---

## 📊 DATABASE TABLES

All package data is stored in:
- **subscription_plans** - Main subscription plans
- **addons** - All addon packages (DAI, Train Me, Session Minutes)
- **addon_purchases** - User purchases of addons
- **subscriptions** - User subscriptions to plans

---

## 🔧 NEXT STEPS

1. ✅ Database schema verified (73 tables)
2. ✅ All tables created in Neon
3. ✅ Packages seeded successfully
4. ✅ Gateway providers configured
5. ✅ Admin user created
6. 🎯 Server should now start without errors!

Run the server:
```bash
npm run dev
```

Access admin panel:
```
http://localhost:5000/admin
```

Admin credentials in: `ADMIN_CREDENTIALS.md`
