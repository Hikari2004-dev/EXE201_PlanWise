CREATE TABLE IF NOT EXISTS calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    external_calendar_id VARCHAR(1024) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS calendar_event_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
    internal_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    external_event_id VARCHAR(1024) NOT NULL,
    external_etag VARCHAR(255),
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('SYNCED', 'FAILED')),
    last_synced_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (calendar_connection_id, internal_event_id),
    UNIQUE (calendar_connection_id, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user
    ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_mappings_internal
    ON calendar_event_mappings(internal_event_id);
