# Check Server Logs

## Restart Server
```bash
Ctrl+C
npm run dev
```

## Start a Session and Ask a Question

Say: "How much does it cost?"

## Check Logs

Look for these log messages:

### 1. Function Called
```
🎯 generateQueryPitches called: transcript=XXX chars, domain="...", userId=...
```
**If you DON'T see this:** The function is not being called at all.

### 2. AI Client
```
🤖 QueryPitches using user AI: engine=..., model=...
🤖 QueryPitches optimized model: ...
```
**If you see error here:** AI client initialization failed.

### 3. Context Loading
```
⚡ QueryPitches prep: XXms | Domain: ...
```

### 4. AI Call
```
⚡ QueryPitches AI call: XXms | Total: XXms
```
**If you DON'T see this:** AI call failed or timed out.

### 5. Response
```
Customer Query Pitches Response: { queriesCount: X, ... }
```
**If queriesCount is 0:** AI returned empty array.

### 6. Error (if any)
```
❌ Query pitch generation error: ...
❌ Error details: { message: ..., stack: ..., name: ... }
```

## Copy and paste the logs here so I can see what's happening.
