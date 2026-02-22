# Audio Sources Constraint Fix

## Issue
Users were getting a database error when trying to send messages in conversations:

```
error: new row for relation "audio_sources" violates check constraint "audio_sources_source_type_check"
Failing row contains (..., device-microphone, ...)
```

## Root Cause
The `audio_sources` table had a check constraint that only allowed these values:
- `'microphone'`
- `'tab'`
- `'system'`

But the application code was trying to insert:
- `'device-microphone'`
- `'teams-meeting'`
- `'teams-recording'`

This mismatch was caused by the initial table creation script (`create-audio-sources-table.mjs`) using old values that didn't match the schema definition in `shared/schema.ts`.

## Fix Applied
Updated the check constraint to match the actual values used in the code:

```sql
ALTER TABLE audio_sources 
DROP CONSTRAINT IF EXISTS audio_sources_source_type_check;

ALTER TABLE audio_sources 
ADD CONSTRAINT audio_sources_source_type_check 
CHECK (source_type IN ('device-microphone', 'teams-meeting', 'teams-recording'));
```

## Verification
✅ Constraint successfully updated
✅ New constraint allows: `device-microphone`, `teams-meeting`, `teams-recording`
✅ Matches the constants defined in `shared/schema.ts`:
```typescript
export const AUDIO_SOURCE_TYPES = {
  DEVICE_MICROPHONE: "device-microphone",
  TEAMS_MEETING: "teams-meeting", 
  TEAMS_RECORDING: "teams-recording"
}
```

## Impact
- ✅ Users can now send messages in conversations without database errors
- ✅ Audio source tracking works correctly for device microphones
- ✅ Teams meeting integration will work when implemented
- ✅ No data migration needed (constraint only validates new inserts)

## Files
- `fix-audio-sources-constraint.mjs` - Script that fixed the constraint
- `shared/schema.ts` - Contains the correct source type constants
- `server/storage.ts` - Uses the correct constants when creating audio sources
