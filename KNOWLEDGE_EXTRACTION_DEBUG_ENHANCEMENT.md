# Knowledge Extraction - Enhanced Debug Logging

## Problem
Knowledge base not showing entries after clicking "Update Knowledge" button. No clear error messages to diagnose the issue.

## Solution Applied
Added comprehensive debug logging throughout the knowledge extraction pipeline to identify exactly where the process is failing.

## Changes Made

### 1. Enhanced Route Logging (`server/routes.ts`)
```typescript
// Added detailed logging in /api/domain-expertise/:id/knowledge/rebuild
console.log(`🚀 Starting knowledge rebuild for domain ${req.params.id}, force=${forceFullRebuild}`);
console.log(`✅ Knowledge base updated: ${result.newEntriesAdded} new entries created, ${result.duplicatesSkipped} duplicates skipped`);
console.error("❌ Knowledge base rebuild error:", error.message);
console.error("Stack trace:", error.stack);
```

### 2. Enhanced Extraction Function Logging (`server/services/knowledgeExtraction.ts`)

#### Function Entry
```typescript
console.log(`📚 rebuildKnowledgeBase called: domain=${domainExpertiseId}, force=${forceFullRebuild}`);
console.log(`📄 Found ${documents.length} total documents`);
console.log(`✅ ${completedDocs.length} documents are completed with content`);
console.log(`📊 Found ${existingEntries.length} existing knowledge entries`);
```

#### Document Processing
```typescript
console.log(`📄 Extracting knowledge from: ${doc.fileName} (${doc.content?.length || 0} chars)`);
console.log(`   ✅ Extracted ${extracted.length} entries from ${doc.fileName}`);
console.log(`   💾 Saved ${docEntriesAdded} entries from ${doc.fileName}`);
console.log(`   ✓ Marked ${doc.fileName} as processed`);
```

#### Error Handling
```typescript
console.error(`❌ Error processing document ${doc.fileName}:`, docError.message);
console.error(`   Stack:`, docError.stack);
console.error(`❌ Failed to save knowledge entry "${entry.title}": ${error.message}`);
```

## What to Look For in Logs

### Successful Extraction Flow
```
🚀 Starting knowledge rebuild for domain [id], force=false
📚 rebuildKnowledgeBase called: domain=[id], force=false
📄 Found 5 total documents
✅ 5 documents are completed with content
📊 Found 0 existing knowledge entries
Processing 5 unprocessed documents (0 already done)
📄 Extracting knowledge from: document1.pdf (15000 chars)
Processing document: document1.pdf (15000 chars)
📑 Split into 1 chunks for comprehensive extraction
Chunk 1/1: Sending to DeepSeek (15000 chars)...
Chunk 1/1: Received 25000 chars from DeepSeek
✅ Successfully parsed JSON using pattern: ...
Chunk 1/1: Extracted 45 entries
   ✅ Extracted 45 entries from document1.pdf
   💾 Saved 45 entries from document1.pdf
   ✓ Marked document1.pdf as processed
...
✅ Knowledge base updated: 200 new entries created, 0 duplicates skipped
```

### Common Issues to Diagnose

#### Issue 1: No Completed Documents
```
📄 Found 5 total documents
✅ 0 documents are completed with content
⚠️ No completed documents to process
```
**Solution**: Documents are still processing. Wait for them to complete.

#### Issue 2: All Documents Already Processed
```
All 5 documents already processed. No new extraction needed.
```
**Solution**: Click "Update Knowledge" with force rebuild, or upload new documents.

#### Issue 3: DeepSeek API Error
```
❌ DeepSeek failed for chunk 1: [error message]
Falling back to Claude...
```
**Solution**: Check DeepSeek API key and quota.

#### Issue 4: No Entries Extracted
```
   ✅ Extracted 0 entries from document1.pdf
```
**Solution**: Document content might be too short, or extraction prompt not matching content.

#### Issue 5: Entries Not Saving
```
   ✅ Extracted 45 entries from document1.pdf
   💾 Saved 0 entries from document1.pdf
❌ Failed to save knowledge entry "...": [error]
```
**Solution**: Database issue or validation error.

## Testing Steps

1. **Restart the server** to load the new logging code
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Open browser console** and **server terminal** side by side

3. **Click "Update Knowledge"** button

4. **Watch the server logs** for the detailed flow

5. **Identify the exact point of failure** from the logs

## Expected Timeline

With the enhanced logging, you should see:
- **Immediate**: `🚀 Starting knowledge rebuild...`
- **Within 1 second**: Document count and status
- **Within 5-30 seconds**: Extraction progress per document
- **Within 30-60 seconds**: Final summary with entry counts

If you don't see logs within 1 second, the endpoint isn't being called.
If you see logs but no extraction, check the specific error messages.

## Next Steps

After restarting the server and clicking "Update Knowledge":
1. Copy the complete server log output
2. Share it so we can see exactly where it's failing
3. We'll fix the specific issue identified

---

**Status**: ✅ Enhanced logging deployed
**Action Required**: Restart server and test
**Expected Result**: Clear diagnostic information in logs
