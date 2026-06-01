-- Migration: Update task_priority enum values to match Java enum names
-- Date: 2026-06-01

-- Step 1: Update task_priority enum values to match Java enum names
DO $$
BEGIN
    -- Check if old values exist and rename them to match Java enum names
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Cao' AND enumtypid = 'task_priority'::regtype) THEN
        ALTER TYPE task_priority RENAME VALUE 'Cao' TO 'HIGH';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Trung bình' AND enumtypid = 'task_priority'::regtype) THEN
        ALTER TYPE task_priority RENAME VALUE 'Trung bình' TO 'MEDIUM';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Thấp' AND enumtypid = 'task_priority'::regtype) THEN
        ALTER TYPE task_priority RENAME VALUE 'Thấp' TO 'LOW';
    END IF;
END $$;

-- Step 2: Update default value
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'MEDIUM'::task_priority;

-- Step 3: Update eisenhower_quadrant enum values to match Java enum names
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'urgent-important' AND enumtypid = 'eisenhower_quadrant'::regtype) THEN
        ALTER TYPE eisenhower_quadrant RENAME VALUE 'urgent-important' TO 'urgent_important';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'not-urgent-important' AND enumtypid = 'eisenhower_quadrant'::regtype) THEN
        ALTER TYPE eisenhower_quadrant RENAME VALUE 'not-urgent-important' TO 'not_urgent_important';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'urgent-not-important' AND enumtypid = 'eisenhower_quadrant'::regtype) THEN
        ALTER TYPE eisenhower_quadrant RENAME VALUE 'urgent-not-important' TO 'urgent_not_important';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'not-urgent-not-important' AND enumtypid = 'eisenhower_quadrant'::regtype) THEN
        ALTER TYPE eisenhower_quadrant RENAME VALUE 'not-urgent-not-important' TO 'not_urgent_not_important';
    END IF;
END $$;
