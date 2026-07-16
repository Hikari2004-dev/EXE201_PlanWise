ALTER TABLE goals
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

UPDATE goals g
SET category_id = c.id
FROM categories c
WHERE g.category_id IS NULL
  AND g.user_id = c.user_id
  AND (
    (g.category = 'career' AND lower(c.name) IN ('công việc', 'career')) OR
    (g.category = 'learning' AND lower(c.name) IN ('học tập', 'learning')) OR
    (g.category = 'health' AND lower(c.name) IN ('sức khỏe', 'health')) OR
    (g.category = 'finance' AND lower(c.name) IN ('tài chính', 'finance'))
  );

ALTER TABLE goals
    ALTER COLUMN category_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_goals_category_id ON goals(category_id);

DROP VIEW IF EXISTS v_user_task_stats;
DROP VIEW IF EXISTS v_tasks_with_category;

ALTER TABLE tasks
    ALTER COLUMN due_date TYPE TIMESTAMPTZ USING due_date::timestamptz,
    ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS show_on_calendar BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS habit_repeat_days (
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    day_code VARCHAR(10) NOT NULL CHECK (day_code IN ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')),
    PRIMARY KEY (habit_id, day_code)
);

-- Existing habits with selected weekdays are weekly schedules. Preserve those
-- selections while removing the old contradictory daily/monthly classification.
UPDATE habits AS habit
SET frequency = 'weekly'
WHERE frequency <> 'weekly'
  AND EXISTS (
      SELECT 1
      FROM habit_repeat_days AS repeat_day
      WHERE repeat_day.habit_id = habit.id
  );

-- Habit.completedDates is mapped as a JPA ElementCollection, so Hibernate only
-- supplies habit_id and completed_date. Keep the denormalized user_id column in
-- sync for its index/RLS use without requiring it in every collection insert.
CREATE OR REPLACE FUNCTION populate_habit_completion_user_id()
RETURNS TRIGGER AS '
BEGIN
    IF NEW.user_id IS NULL THEN
        SELECT user_id INTO NEW.user_id
        FROM habits
        WHERE id = NEW.habit_id;
    END IF;

    RETURN NEW;
END;
' LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_habit_completion_user_id ON habit_completions;
CREATE TRIGGER trg_habit_completion_user_id
    BEFORE INSERT OR UPDATE OF habit_id ON habit_completions
    FOR EACH ROW
    EXECUTE FUNCTION populate_habit_completion_user_id();

CREATE OR REPLACE VIEW v_tasks_with_category AS
SELECT
    t.*,
    c.name      AS category_name,
    c.color     AS category_color
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id;

CREATE OR REPLACE VIEW v_user_task_stats AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE completed = FALSE)           AS pending_count,
    COUNT(*) FILTER (WHERE completed = TRUE)            AS completed_count,
    COUNT(*) FILTER (WHERE priority::text IN ('HIGH', 'Cao') AND completed = FALSE) AS high_priority_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP AND completed = FALSE) AS overdue_count
FROM tasks
GROUP BY user_id;

CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON tasks(milestone_id);

CREATE TABLE IF NOT EXISTS task_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_task_id ON task_checklist_items(task_id);

--CREATE TYPE ai_goal_draft_status AS ENUM ('CREATED', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS ai_goal_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_json JSONB NOT NULL,
    status ai_goal_draft_status NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_goal_drafts_user_status ON ai_goal_drafts(user_id, status);

-- CREATE TYPE ai_planner_draft_status AS ENUM ('CREATED', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS ai_planner_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_json JSONB NOT NULL,
    status ai_planner_draft_status NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_planner_drafts_user_status ON ai_planner_drafts(user_id, status);
