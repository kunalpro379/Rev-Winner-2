# Rev Winner Performance Monitoring Guide

## Quick Health Check

### 1. Check Shift Gears Performance
Look for these log messages in the console:

```
⚡ ShiftGears prep: XXXms | Domain: YYY | HasTraining: true/false
⚡ ShiftGears AI call: XXXms | Model: gpt-4o-mini
```

**Healthy**: prep < 2000ms, AI call < 5000ms  
**Warning**: prep 2000-4000ms, AI call 5000-8000ms  
**Critical**: prep > 4000ms, AI call > 8000ms

### 2. Check Query Pitches Performance
Look for these log messages:

```
⚡ QueryPitches prep: XXXms | Domain: YYY
⚡ QueryPitches AI call: XXXms | Total: XXXms
```

**Healthy**: prep < 2000ms, AI call < 5000ms, total < 8000ms  
**Warning**: prep 2000-4000ms, AI call 5000-8000ms, total 8000-12000ms  
**Critical**: prep > 4000ms, AI call > 8000ms, total > 12000ms

### 3. Check Cache Hit Rate
Look for these log messages:

```
⚡ Using cached AI context for MSP (age: XXXms)
⚡ Skipping knowledge base (using cached AI context with XX entries)
```

**Healthy**: 40-60% cache hits for repeated domain queries  
**Warning**: 20-40% cache hits  
**Critical**: < 20% cache hits (cache not working)

### 4. Check Speaker Labeling
Look for these log messages:

```
🎙️ Deepgram speakers detected: [0, 1, 2]
👤 New speaker mapping: Deepgram 0 -> speaker1
🎤 Using voice fingerprinting: speaker1 (confidence: 75%)
```

**Healthy**: Multiple speakers detected after 30s, consistent mapping  
**Warning**: Only speaker 0 detected after 60s  
**Critical**: Speaker IDs changing mid-session

---

## Performance Troubleshooting

### Shift Gears/Query Pitches Slow (>10 seconds)

**Check 1: Cache Hit Rate**
```
# Look for cache logs
grep "Using cached AI context" logs.txt
```
- If no cache hits → Cache not working, check aiContextCache
- If cache hits but still slow → AI provider latency issue

**Check 2: Context Size**
```
# Look for context size logs
grep "transcriptLength" logs.txt
```
- If > 2000 chars → Context window too large, check slice logic
- If < 500 chars → May not have enough context for quality

**Check 3: Knowledge Base Queries**
```
# Look for knowledge base logs
grep "Skipping knowledge base" logs.txt
```
- If not skipping when should → Check AI context result
- If always skipping → May be missing knowledge base data

**Check 4: AI Provider Response Time**
```
# Look for AI call duration
grep "AI call:" logs.txt
```
- If > 8000ms → AI provider slow, check network/API status
- If < 3000ms but total slow → Prep time is the bottleneck

---

### Speaker Labeling Inconsistent

**Check 1: Deepgram Connection**
```
# Look for Deepgram logs
grep "Deepgram" logs.txt
```
- If "connection opened" but no speakers → Diarization not working
- If "connection closed" frequently → Connection unstable

**Check 2: Speaker Mapping**
```
# Look for speaker mapping logs
grep "speaker mapping" logs.txt
```
- If no mapping logs → Deepgram not detecting speakers
- If mapping changes frequently → Audio quality issue

**Check 3: Audio Quality**
```
# Check for audio warnings
grep "audio" logs.txt
```
- If "No audio track" → User didn't share audio
- If "Permission denied" → Microphone access blocked

**Check 4: Session Reset**
```
# Look for reset logs
grep "reset complete" logs.txt
```
- If no reset logs → resetVersion not incrementing
- If reset but mapping persists → State not clearing

---

### Transcript Not Clearing on New Session

**Check 1: Reset Version**
```
# Look for reset logs
grep "reset complete" logs.txt
```
- If no logs → resetVersion not incrementing
- If logs but state persists → useEffect dependencies issue

**Check 2: Component State**
```
# Check React DevTools
- transcriptSegments should be []
- speakerMapping should be Map(0)
- fullTranscript should be ""
```

**Check 3: Stop Transcription**
```
# Look for stop logs
grep "Transcription stopped" logs.txt
```
- If no logs → stopTranscription not called
- If logs but still transcribing → State not updating

---

## Cache Management

### View Cache Status
```javascript
// In browser console
console.log('Cache size:', aiContextCache.size);
console.log('Cache entries:', Array.from(aiContextCache.keys()));
```

### Clear Cache Manually
```javascript
// In browser console (server-side)
aiContextCache.clear();
console.log('Cache cleared');
```

### Adjust Cache TTL
```typescript
// In server/services/openai.ts
const CACHE_TTL_MS = 30000; // Change to 60000 for 60s, 120000 for 120s
```

**Recommendations**:
- 30s: Good for rapidly changing conversations
- 60s: Good for stable domain queries
- 120s: Good for repeated testing/demos

---

## Performance Optimization Tips

### 1. Reduce Context Window Further
If still slow, reduce context window:
```typescript
// In generateShiftGearsTips
transcript: conversationText.slice(-1000), // Was 1500
```

### 2. Increase Cache TTL
If cache hit rate is low:
```typescript
const CACHE_TTL_MS = 60000; // Increase to 60s
```

### 3. Skip Knowledge Base More Aggressively
If knowledge base queries are slow:
```typescript
if (trainingContext && trainingContext.length > 50) { // Was 100
  // Skip knowledge base
}
```

### 4. Use Faster AI Models
If AI calls are slow:
```typescript
// In generateShiftGearsTips
const fastModel = 'gpt-4o-mini'; // Always use fastest model
```

---

## Alerts & Thresholds

### Set Up Alerts For:

**Performance Degradation**:
- Shift Gears > 10s for 5 consecutive requests
- Query Pitches > 12s for 5 consecutive requests
- Cache hit rate < 20% over 1 hour

**Speaker Labeling Issues**:
- No Deepgram speakers detected after 60s
- Speaker mapping changes > 5 times in 1 minute
- Connection drops > 3 times in 5 minutes

**System Health**:
- Cache size > 100 entries (memory leak)
- AI provider timeout rate > 10%
- WebSocket disconnects > 5 per hour

---

## Common Issues & Solutions

### Issue: "Cache not working"
**Symptoms**: No cache hit logs, always slow  
**Solution**: Check aiContextCache is defined, verify cacheKey format

### Issue: "Speaker IDs keep changing"
**Symptoms**: Speaker mapping logs show frequent changes  
**Solution**: Check audio quality, verify Deepgram connection stable

### Issue: "Transcript not clearing"
**Symptoms**: Old transcript visible in new session  
**Solution**: Verify resetVersion incrementing, check useEffect dependencies

### Issue: "AI calls timing out"
**Symptoms**: Timeout errors in logs  
**Solution**: Increase timeout to 10s, check AI provider status

### Issue: "Knowledge base queries slow"
**Symptoms**: Prep time > 4s  
**Solution**: Skip knowledge base more aggressively, reduce keyword count

---

## Performance Benchmarks

### Target Metrics (95th percentile):
- Shift Gears (cold): < 8s
- Shift Gears (warm): < 4s
- Query Pitches (cold): < 8s
- Query Pitches (warm): < 4s
- Cache hit rate: > 40%
- Speaker detection: < 30s warmup
- Transcript clear: < 1s

### Acceptable Metrics (99th percentile):
- Shift Gears (cold): < 12s
- Shift Gears (warm): < 6s
- Query Pitches (cold): < 12s
- Query Pitches (warm): < 6s
- Cache hit rate: > 20%
- Speaker detection: < 60s warmup
- Transcript clear: < 2s

---

**Last Updated**: February 10, 2026  
**Maintained By**: Rev Winner Engineering Team
