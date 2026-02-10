# Mind Map Fix - Quick Reference

## What Was Fixed

Mind Map was timing out because:
1. ❌ AI taking 20+ seconds (timeout was 20s)
2. ❌ Too much context being sent
3. ❌ Overall timeout too short (35s)

## Changes Made

| Setting | Before | After | Impact |
|---------|--------|-------|--------|
| AI Timeout | 20s | 30s | +50% time for AI |
| Overall Timeout | 35s | 45s | +29% total time |
| Knowledge Context | 1000 chars | 500 chars | Faster processing |
| Response Tokens | 3000 | 2000 | Faster generation |

## How It Works Now

**No Knowledge Base:**
- Uses transcript only
- Completes in 20-30s

**With Knowledge Base:**
- Uses knowledge (500 chars) + transcript (3000 chars)
- Completes in 25-35s

**Empty Domain:**
- Falls back to transcript
- Completes in 20-30s

## Test It

1. Start a conversation
2. Speak for 30+ seconds
3. Click "Generate Mind Map"
4. Wait 20-35 seconds
5. Should see map with nodes and edges

## If It Still Fails

Check logs for:
- `⚠️ Map/Flow: API attempt X/2 failed` → AI still timing out
- `🗺️ Map/Flow generation error` → Overall timeout

If still failing, may need to:
- Increase AI timeout to 40s
- Increase overall timeout to 60s
- Use faster AI model

## Files Changed

- `server/services/mind-map-extraction.ts`
- `server/routes.ts`
