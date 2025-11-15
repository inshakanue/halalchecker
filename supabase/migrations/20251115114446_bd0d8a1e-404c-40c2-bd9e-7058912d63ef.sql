-- Fix confidence_score CHECK constraint to allow 0-100 range instead of 0-1
-- This resolves the issue where AI analysis results cannot be saved to the database

-- Drop the old constraint that enforces 0-1 range
ALTER TABLE verdicts DROP CONSTRAINT IF EXISTS verdicts_confidence_score_check;

-- Add new constraint that allows 0-100 range (or NULL)
ALTER TABLE verdicts ADD CONSTRAINT verdicts_confidence_score_check 
CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));