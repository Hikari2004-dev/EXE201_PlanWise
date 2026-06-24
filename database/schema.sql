-- =============================================================================
-- PlanWise - Production PostgreSQL Database Schema
-- Version: 1.0.0
-- Description: Schema cho ứng dụng quản lý kế hoạch cá nhân PlanWise
--              Dựa trên phân tích FE: mockData.ts, DataContext.tsx và các components
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE event_color AS ENUM (
    'indigo', 'blue', 'emerald', 'amber', 'rose', 'purple', 'teal', 'orange'
);

CREATE TYPE task_priority AS ENUM (
    'Cao', 'Trung bình', 'Thấp'
);

CREATE TYPE eisenhower_quadrant AS ENUM (
    'urgent_important',
    'not_urgent_important',
    'urgent_not_important',
    'not_urgent_not_important'
);

CREATE TYPE goal_category AS ENUM (
    'career', 'learning', 'health', 'finance'
);

CREATE TYPE goal_type AS ENUM (
    'SMART', 'OKR'
);

CREATE TYPE goal_period AS ENUM (
    'week', 'month', 'year'
);

CREATE TYPE habit_frequency AS ENUM (
    'daily', 'weekly', 'monthly'
);

CREATE TYPE focus_session_type AS ENUM (
    'pomodoro', 'flowtime', 'sprint', 'deep'
);

CREATE TYPE quick_note_type AS ENUM (
    'TEXT', 'VOICE', 'IMAGE'
);

CREATE TYPE mood_type AS ENUM (
    'great', 'good', 'okay', 'bad', 'terrible'
);

CREATE TYPE notification_type AS ENUM (
    'time', 'deadline', 'habit', 'progress', 'goal'
);

CREATE TYPE notification_tone AS ENUM (
    'INDIGO', 'ROSE', 'AMBER', 'EMERALD', 'VIOLET'
);

CREATE TYPE user_role AS ENUM (
    'user', 'admin'
);

-- =============================================================================
-- TABLE: users
-- Người dùng của ứng dụng PlanWise
-- =============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),                          -- NULL nếu dùng OAuth
    full_name       VARCHAR(100),
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'user',
    language        VARCHAR(10) NOT NULL DEFAULT 'vi',     -- 'vi' | 'en'
    timezone        VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Bảng người dùng hệ thống PlanWise';
COMMENT ON COLUMN users.password_hash IS 'NULL nếu người dùng đăng nhập qua OAuth (Google, Github)';
COMMENT ON COLUMN users.language IS 'Ngôn ngữ giao diện: vi (tiếng Việt) hoặc en (tiếng Anh)';

-- =============================================================================
-- TABLE: email_verification_tokens
-- Token xác thực email cho tài khoản đăng ký bằng email/password
-- =============================================================================
CREATE TABLE email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);

COMMENT ON TABLE email_verification_tokens IS 'Lưu token xác thực email cho user đăng ký local';

-- =============================================================================
-- TABLE: oauth_providers
-- Tích hợp OAuth (Google, GitHub, Facebook)
-- =============================================================================
CREATE TABLE oauth_providers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,                  -- 'google', 'github', 'facebook'
    provider_uid    VARCHAR(255) NOT NULL,                 -- ID từ provider
    access_token    TEXT,
    refresh_token   TEXT,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_uid)
);

COMMENT ON TABLE oauth_providers IS 'Thông tin OAuth của người dùng';

-- =============================================================================
-- TABLE: categories
-- Danh mục phân loại Task và CalendarEvent
-- (FE: Category { id, name, color })
-- =============================================================================
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    color       event_color NOT NULL DEFAULT 'indigo',
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,           -- Danh mục mặc định của hệ thống
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

COMMENT ON TABLE categories IS 'Danh mục phân loại công việc và sự kiện (Công việc, Học tập, Sức khỏe,...)';
COMMENT ON COLUMN categories.is_default IS 'TRUE nếu đây là danh mục được tạo mặc định khi user đăng ký';

-- =============================================================================
-- TABLE: calendar_events
-- Sự kiện lịch (FE: CalendarEvent interface)
-- =============================================================================
CREATE TABLE calendar_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    event_date      DATE NOT NULL,                         -- Ngày diễn ra sự kiện
    start_hour      SMALLINT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
    start_min       SMALLINT NOT NULL DEFAULT 0 CHECK (start_min BETWEEN 0 AND 59),
    duration        NUMERIC(4,2) NOT NULL CHECK (duration > 0),  -- Tính bằng giờ (e.g. 1.5 = 1h30m)
    color           event_color NOT NULL DEFAULT 'indigo',
    location        VARCHAR(255),
    notes           TEXT,
    is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule VARCHAR(255),                          -- iCal RRULE string (FREQ=WEEKLY;BYDAY=MO)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_event_date ON calendar_events(event_date);
CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, event_date);

COMMENT ON TABLE calendar_events IS 'Sự kiện trên lịch tuần/tháng của người dùng';
COMMENT ON COLUMN calendar_events.duration IS 'Thời lượng tính bằng giờ thập phân (1.5 = 1 giờ 30 phút)';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'Chuỗi lặp lịch theo chuẩn iCalendar RRULE';

-- =============================================================================
-- TABLE: tasks
-- Công việc cần làm (FE: Task interface)
-- =============================================================================
CREATE TABLE tasks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    goal_id             UUID REFERENCES goals(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    due_date            DATE,                              -- Hạn chót
    scheduled_at        TIMESTAMPTZ,                       -- Thời gian diễn ra nếu có
    priority            task_priority NOT NULL DEFAULT 'Trung bình',
    color               event_color NOT NULL DEFAULT 'indigo',
    completed           BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at        TIMESTAMPTZ,                       -- Thời điểm hoàn thành
    eisenhower_matrix   eisenhower_quadrant,               -- Ma trận Eisenhower
    estimated_time      SMALLINT,                          -- Ước tính thời gian (phút)
    actual_time         SMALLINT,                          -- Thời gian thực tế (phút, tính từ focus sessions)
    show_on_calendar    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order          INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_priority ON tasks(user_id, priority) WHERE completed = FALSE;

COMMENT ON TABLE tasks IS 'Công việc cần làm của người dùng với hỗ trợ Ma trận Eisenhower';
COMMENT ON COLUMN tasks.scheduled_at IS 'Thời gian diễn ra của task nếu người dùng lên lịch cụ thể';
COMMENT ON COLUMN tasks.estimated_time IS 'Thời gian ước tính hoàn thành (phút)';
COMMENT ON COLUMN tasks.actual_time IS 'Thời gian thực tế đã bỏ ra (phút), tổng hợp từ focus_sessions';
COMMENT ON COLUMN tasks.show_on_calendar IS 'Có hiển thị task trên calendar hay không';

-- =============================================================================
-- TABLE: task_contexts
-- Ngữ cảnh làm việc của Task (FE: Task.context: string[])
-- Tách thành bảng riêng để chuẩn hóa
-- =============================================================================
CREATE TABLE task_contexts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    context     VARCHAR(100) NOT NULL  -- 'Tại máy tính', 'Di chuyển', 'Tập trung sâu', 'Nhà'
);

CREATE INDEX idx_task_contexts_task_id ON task_contexts(task_id);

COMMENT ON TABLE task_contexts IS 'Ngữ cảnh thực hiện task (Tại máy tính, Di chuyển, Tập trung sâu,...)';

-- =============================================================================
-- TABLE: task_checklist_items
-- Checklist đơn giản của Task
-- =============================================================================
CREATE TABLE task_checklist_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    item        VARCHAR(255) NOT NULL
);

CREATE INDEX idx_task_checklist_items_task_id ON task_checklist_items(task_id);

COMMENT ON TABLE task_checklist_items IS 'Các mục checklist dạng text của task';

-- =============================================================================
-- TABLE: goals
-- Mục tiêu dài hạn (FE: Goal interface - SMART/OKR)
-- =============================================================================
CREATE TABLE goals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        goal_category NOT NULL DEFAULT 'career',
    goal_type       goal_type NOT NULL DEFAULT 'SMART',
    period          goal_period NOT NULL DEFAULT 'year',    -- Tuần, Tháng, Năm
    target_date     DATE,
    progress        SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    color           event_color NOT NULL DEFAULT 'indigo',
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_user_period ON goals(user_id, period);

COMMENT ON TABLE goals IS 'Mục tiêu dài hạn theo mô hình SMART hoặc OKR, phân chia theo tuần/tháng/năm';

-- =============================================================================
-- TABLE: milestones
-- Cột mốc của Goal (FE: Milestone interface)
-- =============================================================================
CREATE TABLE milestones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    target_date     DATE,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);

COMMENT ON TABLE milestones IS 'Cột mốc (milestone) trong tiến trình đạt mục tiêu';

-- =============================================================================
-- TABLE: vision_items
-- Bảng tầm nhìn (FE: VisionItem interface)
-- =============================================================================
CREATE TABLE vision_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),                           -- 'career', 'health', 'finance', 'learning'
    image_url       TEXT,
    quote           TEXT,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vision_items_user_id ON vision_items(user_id);

COMMENT ON TABLE vision_items IS 'Bảng tầm nhìn cá nhân (Vision Board) của người dùng';

-- =============================================================================
-- TABLE: habits
-- Thói quen hàng ngày (FE: Habit interface)
-- =============================================================================
CREATE TABLE habits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    frequency       habit_frequency NOT NULL DEFAULT 'daily',
    target_count    SMALLINT NOT NULL DEFAULT 1,            -- Số lần cần thực hiện trong kỳ
    current_streak  SMALLINT NOT NULL DEFAULT 0,
    best_streak     SMALLINT NOT NULL DEFAULT 0,
    color           event_color NOT NULL DEFAULT 'indigo',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);

COMMENT ON TABLE habits IS 'Thói quen cần theo dõi hàng ngày/tuần/tháng của người dùng';

-- =============================================================================
-- TABLE: habit_completions
-- Lịch sử hoàn thành thói quen (FE: Habit.completedDates: string[])
-- Tách thành bảng riêng thay vì lưu mảng trong JSON
-- =============================================================================
CREATE TABLE habit_completions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id        UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_date  DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (habit_id, completed_date)
);

CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_date);

COMMENT ON TABLE habit_completions IS 'Lịch sử các ngày đã hoàn thành thói quen';

-- =============================================================================
-- TABLE: daily_focus
-- Kế hoạch tập trung hàng ngày (FE: DailyFocus interface)
-- =============================================================================
CREATE TABLE daily_focus (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    focus_date  DATE NOT NULL,
    notes       TEXT,                                       -- Ghi chú tổng hợp cho ngày
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, focus_date)
);

CREATE INDEX idx_daily_focus_user_date ON daily_focus(user_id, focus_date);

COMMENT ON TABLE daily_focus IS 'Kế hoạch tập trung hàng ngày, liên kết top tasks và focus sessions';

-- =============================================================================
-- TABLE: daily_focus_tasks
-- Top Tasks của ngày (FE: DailyFocus.topTasks: number[])
-- =============================================================================
CREATE TABLE daily_focus_tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_focus_id  UUID NOT NULL REFERENCES daily_focus(id) ON DELETE CASCADE,
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (daily_focus_id, task_id)
);

CREATE INDEX idx_daily_focus_tasks_focus_id ON daily_focus_tasks(daily_focus_id);

COMMENT ON TABLE daily_focus_tasks IS 'Top 3 công việc được chọn tập trung trong ngày';

-- =============================================================================
-- TABLE: focus_sessions
-- Phiên tập trung Pomodoro/Flowtime (FE: FocusSession interface)
-- =============================================================================
CREATE TABLE focus_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_focus_id  UUID REFERENCES daily_focus(id) ON DELETE SET NULL,
    task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    duration        SMALLINT NOT NULL CHECK (duration > 0),  -- Phút
    session_type    focus_session_type NOT NULL DEFAULT 'pomodoro',
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    end_time        TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX idx_focus_sessions_start_time ON focus_sessions(user_id, start_time);

COMMENT ON TABLE focus_sessions IS 'Phiên làm việc tập trung (Pomodoro 25p, Sprint 50p, Deep Work 90p)';

-- =============================================================================
-- TABLE: quick_notes
-- Ghi chú nhanh trong ngày (FE: QuickNote interface)
-- =============================================================================
CREATE TABLE quick_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_focus_id  UUID REFERENCES daily_focus(id) ON DELETE SET NULL,
    content         TEXT NOT NULL,
    note_type       quick_note_type NOT NULL DEFAULT 'text',
    media_url       TEXT,                                   -- URL cho voice/image
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quick_notes_user_id ON quick_notes(user_id);
CREATE INDEX idx_quick_notes_daily_focus ON quick_notes(daily_focus_id);

COMMENT ON TABLE quick_notes IS 'Ghi chú nhanh trong ngày (text, voice, image)';

-- =============================================================================
-- TABLE: daily_reflections
-- Nhật ký cuối ngày (FE: DailyReflection interface)
-- =============================================================================
CREATE TABLE daily_reflections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    completed       TEXT,                                   -- Đã hoàn thành gì hôm nay?
    obstacles       TEXT,                                   -- Điều gì làm trì hoãn?
    improvements    TEXT,                                   -- Cải thiện gì cho ngày mai?
    energy_level    SMALLINT CHECK (energy_level BETWEEN 1 AND 10),
    mood            mood_type,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, reflection_date)
);

CREATE INDEX idx_daily_reflections_user_date ON daily_reflections(user_id, reflection_date DESC);

COMMENT ON TABLE daily_reflections IS 'Nhật ký phản tư cuối ngày: việc đã làm, trở ngại, cải thiện, năng lượng và tâm trạng';

-- =============================================================================
-- TABLE: ai_chat_messages
-- Lịch sử chat với Coach AI (FE: Chatbot.tsx - Message type)
-- =============================================================================
CREATE TABLE ai_chat_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender      VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    content     TEXT NOT NULL,
    metadata    JSONB,                                      -- Lưu action đã thực hiện (addTask, addEvent,...)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_user_id ON ai_chat_messages(user_id, created_at DESC);

COMMENT ON TABLE ai_chat_messages IS 'Lịch sử hội thoại với Coach AI (Planner AI Chatbot)';

-- =============================================================================
-- TABLE: notifications
-- Thông báo hệ thống (FE: NotificationCenter.tsx - NotificationItem type)
-- =============================================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    tone            notification_tone NOT NULL DEFAULT 'INDIGO',
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    cta_label       VARCHAR(100),
    task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
    habit_id        UUID REFERENCES habits(id) ON DELETE SET NULL,
    goal_id         UUID REFERENCES goals(id) ON DELETE SET NULL,
    event_id        UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    is_dismissed    BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_for   TIMESTAMPTZ,                            -- Khi nào hiển thị thông báo
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read, is_dismissed);
CREATE INDEX idx_notifications_scheduled ON notifications(user_id, scheduled_for) WHERE is_dismissed = FALSE;

COMMENT ON TABLE notifications IS 'Thông báo nhắc nhở từ lịch, task, habit và mục tiêu';

-- =============================================================================
-- TABLE: user_settings
-- Cài đặt cá nhân hóa của người dùng
-- =============================================================================
CREATE TABLE user_settings (
    user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme                   VARCHAR(20) NOT NULL DEFAULT 'light',        -- 'light', 'dark', 'system'
    default_focus_type      focus_session_type NOT NULL DEFAULT 'pomodoro',
    pomodoro_duration       SMALLINT NOT NULL DEFAULT 25,                -- phút
    short_break_duration    SMALLINT NOT NULL DEFAULT 5,                 -- phút
    long_break_duration     SMALLINT NOT NULL DEFAULT 15,                -- phút
    daily_task_limit        SMALLINT NOT NULL DEFAULT 5,                 -- Số task tối đa mỗi ngày
    notification_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    email_digest_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    email_digest_time       TIME,                                        -- Giờ gửi digest email
    onboarding_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_settings IS 'Cài đặt cá nhân hóa: theme, thời gian Pomodoro, thông báo,...';

-- =============================================================================
-- TABLE: weekly_analytics_snapshots
-- Snapshot phân tích tuần (FE: AnalyticsView - weeklyProgress data)
-- Denormalized để query nhanh
-- =============================================================================
CREATE TABLE weekly_analytics_snapshots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start          DATE NOT NULL,                                   -- Thứ 2 đầu tuần
    total_tasks         SMALLINT NOT NULL DEFAULT 0,
    completed_tasks     SMALLINT NOT NULL DEFAULT 0,
    total_focus_minutes INT NOT NULL DEFAULT 0,
    average_energy      NUMERIC(3,1),
    dominant_mood       mood_type,
    top_category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    top_category_pct    SMALLINT,                                        -- % thời gian cho category đó
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_start)
);

CREATE INDEX idx_weekly_snapshots_user_week ON weekly_analytics_snapshots(user_id, week_start DESC);

COMMENT ON TABLE weekly_analytics_snapshots IS 'Snapshot thống kê tuần được tính toán định kỳ để hiển thị Analytics nhanh';

-- =============================================================================
-- TRIGGERS: auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho tất cả bảng có updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'users', 'oauth_providers', 'categories', 'calendar_events', 'tasks',
        'goals', 'milestones', 'vision_items', 'habits',
        'daily_focus', 'quick_notes', 'daily_reflections', 'user_settings'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- =============================================================================
-- TRIGGER: Tự động tạo user_settings khi tạo user mới
-- =============================================================================
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_create_settings
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- =============================================================================
-- TRIGGER: Tự động cập nhật actual_time của task khi focus_session hoàn thành
-- =============================================================================
CREATE OR REPLACE FUNCTION update_task_actual_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_id IS NOT NULL AND NEW.completed = TRUE THEN
        UPDATE tasks
        SET actual_time = COALESCE(actual_time, 0) + NEW.duration
        WHERE id = NEW.task_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_focus_session_update_task
    AFTER INSERT OR UPDATE OF completed ON focus_sessions
    FOR EACH ROW EXECUTE FUNCTION update_task_actual_time();

-- =============================================================================
-- TRIGGER: Auto-cập nhật completed_at khi task.completed thay đổi
-- =============================================================================
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = FALSE AND OLD.completed = TRUE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_completed_at
    BEFORE UPDATE OF completed ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View: Tasks với thông tin category
CREATE OR REPLACE VIEW v_tasks_with_category AS
SELECT
    t.*,
    c.name      AS category_name,
    c.color     AS category_color
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id;

COMMENT ON VIEW v_tasks_with_category IS 'Tasks kèm thông tin danh mục để tránh JOIN trong các query đơn giản';

-- View: Habits với tình trạng hôm nay
CREATE OR REPLACE VIEW v_habits_today AS
SELECT
    h.*,
    EXISTS (
        SELECT 1 FROM habit_completions hc
        WHERE hc.habit_id = h.id
          AND hc.completed_date = CURRENT_DATE
    ) AS completed_today,
    (
        SELECT COUNT(*)
        FROM habit_completions hc
        WHERE hc.habit_id = h.id
          AND hc.completed_date >= CURRENT_DATE - INTERVAL '7 days'
    ) AS completions_last_7_days
FROM habits h
WHERE h.is_active = TRUE;

COMMENT ON VIEW v_habits_today IS 'Habits kèm trạng thái hoàn thành hôm nay và thống kê 7 ngày gần nhất';

-- View: Analytics tổng hợp đơn giản
CREATE OR REPLACE VIEW v_user_task_stats AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE completed = FALSE)           AS pending_count,
    COUNT(*) FILTER (WHERE completed = TRUE)            AS completed_count,
    COUNT(*) FILTER (WHERE priority = 'Cao' AND completed = FALSE) AS high_priority_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND completed = FALSE) AS overdue_count
FROM tasks
GROUP BY user_id;

COMMENT ON VIEW v_user_task_stats IS 'Thống kê nhanh số lượng task của người dùng';

-- =============================================================================
-- SEED DATA: Danh mục mặc định (được tạo khi user mới đăng ký)
-- Không insert trực tiếp ở đây - sử dụng application logic hoặc stored procedure
-- =============================================================================

-- Hàm tạo danh mục mặc định cho user mới
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO categories (user_id, name, color, sort_order, is_default) VALUES
        (p_user_id, 'Công việc',       'indigo',  1, TRUE),
        (p_user_id, 'Dự án cá nhân',   'blue',    2, TRUE),
        (p_user_id, 'Sức khỏe',        'emerald', 3, TRUE),
        (p_user_id, 'Học tập',         'purple',  4, TRUE),
        (p_user_id, 'Gia đình',        'rose',    5, TRUE),
        (p_user_id, 'Tài chính',       'amber',   6, TRUE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_default_categories IS 'Tạo 6 danh mục mặc định cho người dùng mới đăng ký';

-- Trigger tự động seed danh mục khi user mới được tạo
CREATE OR REPLACE FUNCTION on_user_created_seed_categories()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM seed_default_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_seed_categories
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION on_user_created_seed_categories();

-- =============================================================================
-- INDEXES BỔ SUNG cho hiệu năng query
-- =============================================================================

-- Full-text search cho tasks
CREATE INDEX idx_tasks_title_fts ON tasks USING GIN (to_tsvector('simple', title));
CREATE INDEX idx_tasks_desc_fts ON tasks USING GIN (to_tsvector('simple', COALESCE(description, '')));

-- Full-text search cho calendar events
CREATE INDEX idx_events_title_fts ON calendar_events USING GIN (to_tsvector('simple', title));

-- Index cho habit completion stats
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date);

-- Partial index: notifications chưa đọc
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC)
    WHERE is_read = FALSE AND is_dismissed = FALSE;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Đảm bảo user chỉ đọc/sửa được dữ liệu của mình
-- =============================================================================

ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_contexts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits                ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_focus           ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_focus_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: user chỉ thấy dữ liệu của mình (giả sử app set current_user_id qua session variable)
-- Ví dụ với Supabase / PostgREST: dùng auth.uid()
-- Với custom backend: dùng current_setting('app.current_user_id', TRUE)::UUID

-- Ví dụ policy (uncomment nếu dùng Supabase):
-- CREATE POLICY "users_own_data" ON categories
--     USING (user_id = auth.uid());

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
