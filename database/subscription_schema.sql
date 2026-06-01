-- =============================================================================
-- PlanWise - Subscription & Payment Tables Schema
-- =============================================================================

-- Table 1: subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    price           NUMERIC(12,2) NOT NULL,
    duration_months INT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES subscription_plans(id),
    start_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date        TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'CANCELLED'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Table 3: payment_transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id               UUID NOT NULL REFERENCES subscription_plans(id),
    order_id              VARCHAR(100) NOT NULL UNIQUE,       -- Momo partnerRefId/orderId
    request_id            VARCHAR(100) NOT NULL,              -- Momo requestId
    amount                NUMERIC(12,2) NOT NULL,
    payment_method        VARCHAR(20) NOT NULL DEFAULT 'MOMO',
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED'
    trans_id              VARCHAR(100),                       -- Momo transId khi thành công
    raw_callback_response TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_trans_order_id ON payment_transactions(order_id);

-- Seed mặc định các gói hội viên (Nếu chưa tồn tại)
INSERT INTO subscription_plans (id, name, price, duration_months, description)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'Gói 1 Tháng', 19000.00, 1, 'Hội viên Premium 1 tháng, giới hạn cơ bản được mở khóa'),
    ('10000000-0000-0000-0000-000000000002', 'Gói 3 Tháng', 49000.00, 3, 'Hội viên Premium 3 tháng (Tiết kiệm 14%)'),
    ('10000000-0000-0000-0000-000000000003', 'Gói 6 Tháng', 89000.00, 6, 'Hội viên Premium 6 tháng (Tiết kiệm 22%)'),
    ('10000000-0000-0000-0000-000000000004', 'Gói 12 Tháng', 149000.00, 12, 'Hội viên Premium 12 tháng (Tiết kiệm tốt nhất 35%)')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, price = EXCLUDED.price, duration_months = EXCLUDED.duration_months, description = EXCLUDED.description;
