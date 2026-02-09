-- Fix active sessions that were never properly ended
-- This script will:
-- 1. Find all sessions with status='active' and no endTime
-- 2. Calculate duration based on startTime to now (or cap at 4 hours)
-- 3. Update them with endTime, durationSeconds, and status='ended'

-- Update active sessions without end time
UPDATE session_usage
SET 
  end_time = CASE 
    WHEN (EXTRACT(EPOCH FROM (NOW() - start_time)) / 3600) > 4 
    THEN start_time + INTERVAL '4 hours'  -- Cap at 4 hours
    ELSE NOW()
  END,
  duration_seconds = CASE 
    WHEN (EXTRACT(EPOCH FROM (NOW() - start_time))) > 14400 
    THEN '14400'  -- Cap at 4 hours (14400 seconds)
    ELSE FLOOR(EXTRACT(EPOCH FROM (NOW() - start_time)))::TEXT
  END,
  status = 'ended'
WHERE 
  status = 'active' 
  AND end_time IS NULL;

-- Show results
SELECT 
  COUNT(*) as fixed_sessions,
  'Sessions have been fixed' as message
FROM session_usage
WHERE status = 'ended' AND end_time IS NOT NULL;
