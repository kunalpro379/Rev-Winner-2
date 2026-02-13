# Present to Win PDF Export - UI Screenshot Implementation

## Summary
Updated the PDF export functionality for Present to Win section to capture the actual UI as images instead of just text content. This ensures the PDF looks exactly like what users see on screen.

## Changes Made

### 1. Added html2canvas Library
- Installed `html2canvas` package for capturing DOM elements as images
- Enables high-quality screenshot capture of React components

### 2. New Export Function: `exportPresentToWinToPDF()`
Located in: `client/src/utils/pdfExport.ts`

**Features:**
- Captures the entire Present to Win content area as a high-resolution image
- Automatically handles multi-page PDFs when content is too tall
- Maintains aspect ratio and quality
- Includes Rev Winner branding (banner, logo, footer)
- Supports all three content types:
  - Pitch Deck
  - Case Study  
  - Battle Card

**Technical Details:**
- Uses `html2canvas` with scale=2 for high quality
- Temporarily removes scrollbars during capture
- Splits large images across multiple pages intelligently
- Preserves all styling, colors, gradients, and visual elements

### 3. Updated Present to Win Component
Located in: `client/src/components/present-to-win.tsx`

**Changes:**
- Replaced old text-based PDF export with new UI capture method
- Added support for multi-product exports (exports each tab separately)
- Improved error handling with user-friendly messages
- Auto-switches between tabs for multi-product PDFs

**Export Flow:**
1. User clicks "Export PDF" button
2. For multi-product: Automatically cycles through each product tab
3. Captures visible UI content as high-res image
4. Generates professional PDF with branding
5. Downloads with descriptive filename

### 4. Multi-Product Support
- Detects when multiple products are present
- Exports each product as a separate PDF
- Automatically clicks tabs and waits for rendering
- Shows progress in toast notifications

## Benefits

✅ **Exact UI Replication**: PDF looks identical to on-screen display
✅ **All Visual Elements**: Captures colors, gradients, icons, badges
✅ **Professional Quality**: High-resolution images (2x scale)
✅ **Multi-Page Support**: Automatically splits long content
✅ **Brand Consistency**: Rev Winner header, footer, contact info
✅ **Multi-Product Ready**: Handles complex scenarios seamlessly

## Usage

Users simply click the "Export PDF" button in Present to Win section:
- Single product → One PDF downloaded
- Multiple products → Multiple PDFs downloaded (one per product)

## Technical Notes

- Uses `data-testid` attributes to locate content elements
- Requires content to be visible in DOM (not hidden)
- Handles both single and multi-product scenarios
- Maintains backward compatibility with old export functions
- Error handling for missing content or capture failures

## Files Modified

1. `client/src/utils/pdfExport.ts` - Added new export function
2. `client/src/components/present-to-win.tsx` - Updated export handler
3. `package.json` - Added html2canvas dependency

## Testing Recommendations

1. Test with single product pitch deck
2. Test with multi-product battle card
3. Test with long case study (multi-page)
4. Verify all visual elements appear correctly
5. Check PDF quality and readability
6. Test on different screen sizes

---

**Implementation Date**: February 13, 2026
**Status**: ✅ Complete and Ready for Testing
