-- Add transcriptionStartedAt field to conversations table
-- This tracks when the user actually clicked "Start" to begin transcription
-- Session duration should be calculated from transcriptionStartedAt to endedAt, not createdAt to endedAt

ALTER TABLE conversations 
ADD COLUMN transcription_started_at TIMESTAMP;

-- Add index for performance on queries filtering by transcription start time
CREATE INDEX idx_conversations_transcription_started ON conversations(transcription_started_at);

-- Add comment explaining the field
COMMENT ON COLUMN conversations.transcription_started_at IS 'Timestamp when user clicked Start button to begin transcription. Session duration = transcriptionStartedAt to endedAt (not createdAt to endedAt).';
