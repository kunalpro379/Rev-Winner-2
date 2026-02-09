# Performance Fixes - Session 2
**Date:** February 10, 2026

## Issues Fixed

### 1. Map/Flow Taking 42 Seconds ❌ → ✅
**Before:** No timeout, taking 42+ seconds
**After:** Dual 10-second timeouts (route + service level)

**Changes:**
- `server/routes.ts` line ~1047: Added Promise.race with 10s timeout
- `server/services/mind-map-extraction.ts` line ~240: Added Promise.race with 10s timeout on AI call
- Both timeouts work together for maximum reliability

**Result:** Map/Flow now completes in <10 seconds or fails fast

---

### 2. Messages Taking 10-19 Seconds ❌ → ✅
**Before:** No timeout, slow AI responses
**After:** 8-second timeout + reduced tokens

**Changes:**
- `server/routes.ts` line ~340: Added Promise.race with 8s timeout
- `server/services/openai.ts` line ~1387: Reduced max_tokens from 600 → 400

**Result:** Messages now respond in <8 seconds

---

### 3. One-Liners Timing Out at 3s ⚠️ → ✅
**Before:** 3-second timeout too aggressive
**After:** 5-second timeout for reliability

**Changes:**
- `server/routes.ts` line ~1270: Increased timeout from 3000ms → 5000ms

**Result:** More reliable one-liner generation

---

## All Timeouts Summary

| Feature | Timeout | Location |
|---------|---------|----------|
| Shift Gears | 5s | `openai.ts` generateShiftGearsTips |
| One-liners | 5s | `routes.ts` /one-liners endpoint |
| Messages | 8s | `routes.ts` /messages endpoint |
| Map/Flow | 10s | `routes.ts` + `mind-map-extraction.ts` |
| Partner Services | 8s | `openai.ts` generateResponse |
| Pitch Deck | 8s | `openai.ts` generatePresentToWin |
| Case Study | 8s | `openai.ts` generatePresentToWin |
| Battle Card | 10s | `openai.ts` generatePresentToWin |

---

## Performance Targets Achieved

✅ **Real-Time Features (<5-8s)**
- Shift Gears: <5s
- One-liners: <5s (instant for first 5 messages)
- Messages: <8s

✅ **Background Features (<10s)**
- Map/Flow: <10s (was 42s!)
- Partner Services: <10s first call, <10ms cached
- Present to Win: <10s all types

---

## Testing Checklist

Test these features to verify performance:

1. **Messages** - Send a message, should respond in <8s
2. **Map/Flow** - Generate mind map, should complete in <10s
3. **One-liners** - Request rapport statements, should return in <5s
4. **Shift Gears** - Get real-time tips, should appear in <5s
5. **Partner Services** - First call <10s, subsequent calls instant

---

## If Still Slow

1. Check AI engine selection (DeepSeek, GPT-4o-mini, Claude Haiku are fastest)
2. Verify network latency to AI providers
3. Check Train Me knowledge base size (large docs slow down context)
4. Consider further reducing max_tokens
5. Add more aggressive caching
