# Knowledge Update & Pitch Sharing Improvements

## Issue 1: Knowledge Update Delay After Document Upload

### Current Behavior
- When users upload training documents, there's a delay before the knowledge is available
- Users need to delete old documents to see better results
- Cache invalidation happens but knowledge extraction is async

### Root Cause Analysis

**Location**: `server/routes.ts` (lines 3400-3600)

1. **Cache Invalidation** (Line 3570):
   ```typescript
   invalidateTrainingContextCache(userId);
   ```
   ✅ This works correctly - cache is cleared immediately

2. **Async Knowledge Extraction** (Line 3573-3583):
   ```typescript
   setImmediate(async () => {
     try {
       const { processDocumentForKnowledge } = await import("./services/knowledgeExtraction");
       for (const doc of results) {
         await processDocumentForKnowledge(doc, req.params.id, userId);
       }
     } catch (error) {
       console.error("Knowledge extraction error:", error.message);
     }
   });
   ```
   ⚠️ **Problem**: Knowledge extraction runs in background, not blocking the response
   - User gets success response before knowledge is fully processed
   - Next AI request may not have the new knowledge yet

3. **Cache TTL** (Line 142 in `server/services/openai.ts`):
   ```typescript
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
   ```
   ⚠️ **Problem**: Even after invalidation, if another request comes in before knowledge extraction completes, it caches empty/old results for 5 minutes

### Recommended Solutions

#### Option 1: Synchronous Knowledge Extraction (Best UX)
**Pros**: Immediate availability, no confusion
**Cons**: Slower upload response (but user knows it's processing)

```typescript
// In server/routes.ts - Upload endpoint
const results: any[] = [];
const errors: any[] = [];

for (const file of files) {
  try {
    // ... existing file processing ...
    
    // IMMEDIATE knowledge extraction (not async)
    const { processDocumentForKnowledge } = await import("./services/knowledgeExtraction");
    await processDocumentForKnowledge(doc, req.params.id, userId);
    
    results.push(doc);
  } catch (processError: any) {
    console.error(`Failed to process ${file.originalname}:`, processError);
    errors.push({ fileName: file.originalname, error: processError.message });
  }
}

// Invalidate cache AFTER knowledge extraction
const { invalidateTrainingContextCache } = await import("./services/openai");
invalidateTrainingContextCache(userId);

res.json({ 
  success: true, 
  documents: results, 
  errors,
  message: `${results.length} document(s) processed and ready to use`
});
```

#### Option 2: Processing Status with Polling (Better for large files)
**Pros**: Non-blocking upload, clear status
**Cons**: Requires frontend polling

```typescript
// Add processing status to response
res.json({ 
  success: true, 
  documents: results.map(doc => ({
    ...doc,
    knowledgeStatus: 'processing' // or 'ready'
  })),
  errors,
  message: `${results.length} document(s) uploaded. Knowledge extraction in progress...`
});

// Frontend polls: GET /api/domain-expertise/:id/documents/status
```

#### Option 3: Reduce Cache TTL for Training Context
**Pros**: Simple fix, no code changes needed
**Cons**: More DB queries, doesn't solve async extraction delay

```typescript
// In server/services/openai.ts
const CACHE_TTL = 30 * 1000; // Reduce from 5 minutes to 30 seconds
```

### Recommended Implementation: Hybrid Approach

1. **Synchronous extraction for small files** (< 5MB)
2. **Async extraction with status for large files** (>= 5MB)
3. **Reduce cache TTL to 1 minute** (balance between performance and freshness)
4. **Add "Processing" indicator in UI** when knowledge is being extracted

---

## Issue 2: Ways to Share the Pitch Deck/Battle Card/Case Study

### Current State
- Meeting Minutes has PDF export functionality ✅
- Pitch Deck, Battle Card, and Case Study have NO sharing options ❌
- Users can only view content in the app

### Recommended Sharing Features

#### 1. Export to PDF (Priority: HIGH)
Similar to Meeting Minutes export, create PDF versions of:
- **Pitch Deck**: 5-slide presentation format
- **Battle Card**: Comparison table with branding
- **Case Study**: Professional case study document

**Implementation**:
```typescript
// In client/src/components/present-to-win.tsx
import { exportPitchDeckToPDF, exportBattleCardToPDF, exportCaseStudyToPDF } from '@/utils/pdfExport';

const handleExportPDF = async () => {
  if (!generatedContent) return;
  
  try {
    if (selectedType === 'pitch-deck') {
      await exportPitchDeckToPDF(generatedContent, domainExpertise);
    } else if (selectedType === 'battle-card') {
      await exportBattleCardToPDF(generatedContent, domainExpertise);
    } else if (selectedType === 'case-study') {
      await exportCaseStudyToPDF(generatedContent, domainExpertise);
    }
    
    toast({
      title: "Export Successful",
      description: `${selectedType} exported as PDF`,
    });
  } catch (error) {
    toast({
      title: "Export Failed",
      description: "Failed to export. Please try again.",
      variant: "destructive"
    });
  }
};
```

#### 2. Copy to Clipboard (Priority: MEDIUM)
Copy formatted text version for pasting into emails, Slack, etc.

```typescript
const handleCopyToClipboard = () => {
  const formattedText = formatContentAsText(generatedContent, selectedType);
  navigator.clipboard.writeText(formattedText);
  
  toast({
    title: "Copied to Clipboard",
    description: "Content copied as formatted text",
  });
};
```

#### 3. Share via Email (Priority: MEDIUM)
Generate shareable link or email draft

```typescript
const handleShareEmail = () => {
  const subject = `${domainExpertise} - ${selectedType === 'pitch-deck' ? 'Pitch Deck' : selectedType === 'battle-card' ? 'Battle Card' : 'Case Study'}`;
  const body = formatContentAsText(generatedContent, selectedType);
  
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
```

#### 4. Save to Library (Priority: LOW)
Save generated content for reuse

```typescript
// Backend: POST /api/saved-content
// Store pitch decks, battle cards, case studies for later retrieval
```

#### 5. Generate Shareable Link (Priority: LOW)
Create public/private link to view content

```typescript
// Backend: POST /api/present-to-win/share
// Generate unique URL: https://revwinner.com/shared/abc123
```

### UI Implementation

Add action buttons to Present to Win component:

```tsx
{generatedContent && (
  <div className="flex items-center gap-2 mt-4">
    <Button
      onClick={handleExportPDF}
      variant="outline"
      size="sm"
      className="border-purple-300 text-purple-600 hover:bg-purple-50"
    >
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
    
    <Button
      onClick={handleCopyToClipboard}
      variant="outline"
      size="sm"
      className="border-purple-300 text-purple-600 hover:bg-purple-50"
    >
      <Copy className="h-4 w-4 mr-2" />
      Copy Text
    </Button>
    
    <Button
      onClick={handleShareEmail}
      variant="outline"
      size="sm"
      className="border-purple-300 text-purple-600 hover:bg-purple-50"
    >
      <Mail className="h-4 w-4 mr-2" />
      Email
    </Button>
  </div>
)}
```

---

## Priority Implementation Order

### Phase 1 (Immediate - High Impact)
1. ✅ Fix knowledge update delay (Hybrid approach)
2. ✅ Add PDF export for Pitch Deck
3. ✅ Add PDF export for Battle Card
4. ✅ Add PDF export for Case Study

### Phase 2 (Short-term - Medium Impact)
5. ✅ Add Copy to Clipboard functionality
6. ✅ Add Email sharing
7. ✅ Add processing status indicator in UI

### Phase 3 (Long-term - Nice to Have)
8. Save to Library feature
9. Generate shareable links
10. Social media sharing

---

## Testing Checklist

### Knowledge Update Testing
- [ ] Upload new document
- [ ] Verify immediate cache invalidation
- [ ] Check knowledge extraction completes before response
- [ ] Test AI response uses new knowledge immediately
- [ ] Verify no stale cache issues
- [ ] Test with multiple documents uploaded simultaneously

### Sharing Testing
- [ ] Export Pitch Deck to PDF - verify formatting
- [ ] Export Battle Card to PDF - verify table layout
- [ ] Export Case Study to PDF - verify readability
- [ ] Copy to clipboard - verify formatting preserved
- [ ] Email sharing - verify content in email body
- [ ] Test on mobile devices
- [ ] Test with multi-product content

---

## Files to Modify

### Knowledge Update Fix
1. `server/routes.ts` (lines 3400-3600) - Upload endpoint
2. `server/services/openai.ts` (line 142) - Cache TTL
3. `client/src/pages/train-me.tsx` - Add processing indicator

### Sharing Features
1. `client/src/components/present-to-win.tsx` - Add share buttons
2. `client/src/utils/pdfExport.ts` - Add PDF export functions
3. `client/src/components/pitch-deck.tsx` - Export support
4. `client/src/components/battle-card.tsx` - Export support
5. `client/src/components/case-study.tsx` - Export support

---

## Estimated Development Time

- Knowledge Update Fix: 2-3 hours
- PDF Export (all 3 types): 4-6 hours
- Copy/Email Sharing: 2-3 hours
- Testing & QA: 2-3 hours

**Total: 10-15 hours**
