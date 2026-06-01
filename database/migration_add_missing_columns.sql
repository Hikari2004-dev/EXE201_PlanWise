-- Migration: Add missing columns and update enums for new APIs
-- Date: 2026-06-01
-- IMPORTANT: Run this script manually against the database BEFORE starting the app

-- Step 1: Drop views that depend on modified columns (recreate after migration)
DROP VIEW IF EXISTS v_tasks_with_category;

-- Step 2: Add end_time column to focus_sessions
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Step 3: Add updated_at column to focus_sessions
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Step 4: Update notification_tone enum values to uppercase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'indigo' AND enumtypid = 'notification_tone'::regtype) THEN
        ALTER TYPE notification_tone RENAME VALUE 'indigo' TO 'INDIGO';
        ALTER TYPE notification_tone RENAME VALUE 'rose' TO 'ROSE';
        ALTER TYPE notification_tone RENAME VALUE 'amber' TO 'AMBER';
        ALTER TYPE notification_tone RENAME VALUE 'emerald' TO 'EMERALD';
        ALTER TYPE notification_tone RENAME VALUE 'violet' TO 'VIOLET';
    END IF;
END $$;

-- Step 5: Update quick_note_type enum values to uppercase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'text' AND enumtypid = 'quick_note_type'::regtype) THEN
        ALTER TYPE quick_note_type RENAME VALUE 'text' TO 'TEXT';
        ALTER TYPE quick_note_type RENAME VALUE 'voice' TO 'VOICE';
        ALTER TYPE quick_note_type RENAME VALUE 'image' TO 'IMAGE';
    END IF;
END $$;

-- Step 6: Update notifications table default value for tone
ALTER TABLE notifications ALTER COLUMN tone SET DEFAULT 'INDIGO'::notification_tone;

-- Step 7: Update quick_notes table default value for note_type
ALTER TABLE quick_notes ALTER COLUMN note_type SET DEFAULT 'TEXT'::quick_note_type;

-- Step 8: Recreate views
CREATE OR REPLACE VIEW v_tasks_with_category AS
SELECT
    t.*,
    c.name      AS category_name,
    c.color     AS category_color
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id;
