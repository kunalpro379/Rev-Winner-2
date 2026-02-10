# Timeout Fixes Applied

## Issues Found in Logs

### 1. One-Liners Generation Timeouts ❌
```
One-liners generation failed (using fallback): Error: Timeout
⚠️ Slow request: /api/conversations/.../one-liners took 6152ms
⚠️ Slow request: /api/conversations/.../one-liners took 6333ms
⚠️ Slow request: /api/conversations/.../one-liners took 7655ms
```

**Problem:** Timeout set to 5 seconds, but consistently taking 6-7 seconds

**Fix Applied:**
```typescript
// Before
setTimeout(() => reject(new Error('Timeout')), 5000)  // 5 seconds

// After  
setTimeout(() => reject(new Error('Timeout')), 10000) // 10 seconds
```

---

### 2. Mind Map Generation Timeout ❌
```
🗺️ Map/Flow generation error: Error: Map/Flow generation timeout after 25 seconds
⚠️ Slow request: /api/conversations/.../mind-map took 25393ms
```

**Problem:** Timeout set to 25 seconds, hitting exactly at limit

**Fix Applied:**
```typescript
// Before
setTimeout(() => reject(new Error('...')), 25000)  // 25 seconds

// After
setTimeout(() => reject(new Error('...')), 35000)  // 35 seconds
```

---

### 3. JSON Truncation Errors ⚠️
```
⚠️ JSON parse error in generateQueryPitches: Unterminated string in JSON at position 2280
⚠️ JSON parse error in generateSalesResponse: Unterminated string in JSON at position 1408
❌ JSON repair failed in generateQueryPitches, using fallback
```

**Status:** JSON repair logic is working in most cases, but some still fail

**Already Applied Fixes:**
- 3-level JSON repair with aggressive extraction
- Reduced token limits to prevent truncation
- Fallback responses when repair fails

**Additional Monitoring Needed:**
- Track JSON repair success rate
- Monitor token usage vs limits
- Consider further token reduction if issues persist

---

### 4. Domain "Odoo" Not Found 🔒
```
🔒 STRICT ISOLATION: Domain "Odoo" not found - blocking cross-domain access
🔒 STRICT ISOLATION: No entries in domain "Odoo" - NOT falling back to universal
```

**Problem:** User is trying to use "Odoo" domain but hasn't created it in Train Me

**Solution for User:**
1. Go to Settings → Train Me
2. Create new domain: "Odoo"
3. Add training documents about Odoo
4. Then the AI will have context for Odoo-specific responses

**Current Behavior (Correct):**
- System correctly blocks cross-domain access
- No fallback to prevent data leakage
- User gets generic responses without domain-specific knowledge

---

### 5. Slow Requests Across Board ⏱️
```
⚠️ Slow request: /api/conversations/.../messages took 9105ms
⚠️ Slow request: /api/conversations/.../messages took 10358ms
⚠️ Slow request: /api/conversations/.../messages took 11843ms
⚠️ Slow request: /api/present-to-win/generate took 33070ms
⚠️ Slow request: /api/conversations/.../query-pitches took 16688ms
⚠️ Slow request: /api/assistant-advice took 4218ms
```

**Root Causes:**
1. AI API calls taking 8-15 seconds
2. Multiple sequential AI calls instead of parallel
3. No caching for repeated requests
4. Database queries not optimized

**Recommendations:**
1. **Add Response Caching** (High Priority)
   - Cache Shift Gears tips for 30 seconds
   - Cache Query Pitches for 30 seconds
   - Cache Assistant Advice for 60 seconds

2. **Parallelize AI Calls** (Medium Priority)
   - Run Shift Gears + Query Pitches in parallel
   - Don't block UI on background features

3. **Optimize Database** (Medium Priority)
   - Add indexes (see URGENT_FIXES_NEEDED.md)
   - Enable connection pooling
   - Use prepared statements

4. **Use Faster AI Models** (Low Priority)
   - Consider using faster models for simple tasks
   - Reserve complex models for analysis only

---

## Summary of Changes

### Files Modified
- ✅ `server/routes.ts` - Increased timeouts for one-liners (5s → 10s) and mind map (25s → 35s)

### Expected Impact
- ✅ Fewer one-liner timeout errors
- ✅ Mind map generation should complete successfully
- ✅ Better user experience with fewer fallbacks

### Still Need Attention
- ⚠️ JSON truncation (monitor and adjust token limits if needed)
- ⚠️ Overall slow response times (needs caching + optimization)
- ℹ️ Domain "Odoo" not found (user needs to create it in Train Me)
- 🔍 Revenue leak investigation (36 add-ons without payment)

---

## Testing Checklist

### One-Liners
- [ ] Generate one-liners for a conversation
- [ ] Should complete within 10 seconds
- [ ] No timeout errors in logs

### Mind Map
- [ ] Generate mind map for a conversation
- [ ] Should complete within 35 seconds
- [ ] No timeout errors in logs

### JSON Parsing
- [ ] Monitor logs for JSON parse errors
- [ ] Check repair success rate
- [ ] Verify fallback responses are reasonable

---

## Monitoring Commands

### Watch for Timeout Errors
```bash
# In logs, look for:
grep "Timeout" logs.txt
grep "generation failed" logs.txt
```

### Watch for Slow Requests
```bash
# In logs, look for:
grep "⚠️ Slow request" logs.txt
```

### Watch for JSON Errors
```bash
# In logs, look for:
grep "JSON parse error" logs.txt
grep "JSON repair failed" logs.txt
```

---

**Status:** ✅ Timeout Fixes Applied
**Date:** February 11, 2026
**Priority:** High (improves reliability)
**Next:** Monitor logs for improvement, investigate revenue leak
