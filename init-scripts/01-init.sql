-- Create database if not exists (for docker initialization)
-- Note: This runs automatically when container starts with empty data directory

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add any initial setup here if needed
-- Drizzle ORM will handle schema creation via migrations

-- Create a comment to track initialization
COMMENT ON DATABASE ielts_practice IS 'IELTS Practice Platform Database - Initialized via Docker';
