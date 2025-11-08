-- Fix confidence_score column to support values 0-100
ALTER TABLE verdicts 
ALTER COLUMN confidence_score TYPE numeric(5,2);