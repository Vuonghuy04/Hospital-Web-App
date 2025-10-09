-- Enhanced Audit Events Table
-- Comprehensive audit logging for all user activities

CREATE TABLE IF NOT EXISTS enhanced_audit_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    roles TEXT[],
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    session_duration INTEGER DEFAULT 0,
    risk_score DECIMAL(5,2) DEFAULT 0.0,
    risk_level VARCHAR(20) DEFAULT 'low',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    compliance_flags JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_user_id ON enhanced_audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_timestamp ON enhanced_audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_action ON enhanced_audit_events(action);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_risk_level ON enhanced_audit_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_success ON enhanced_audit_events(success);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_session_id ON enhanced_audit_events(session_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_resource ON enhanced_audit_events(resource);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_compliance ON enhanced_audit_events USING GIN(compliance_flags);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_metadata ON enhanced_audit_events USING GIN(metadata);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_user_timestamp ON enhanced_audit_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_risk_timestamp ON enhanced_audit_events(risk_level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_action_timestamp ON enhanced_audit_events(action, timestamp DESC);

-- Comments for documentation
COMMENT ON TABLE enhanced_audit_events IS 'Comprehensive audit log for all user activities across the hospital web application';
COMMENT ON COLUMN enhanced_audit_events.event_id IS 'Unique identifier for the audit event';
COMMENT ON COLUMN enhanced_audit_events.timestamp IS 'When the event occurred';
COMMENT ON COLUMN enhanced_audit_events.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN enhanced_audit_events.username IS 'Username of the user who performed the action';
COMMENT ON COLUMN enhanced_audit_events.email IS 'Email of the user who performed the action';
COMMENT ON COLUMN enhanced_audit_events.roles IS 'Array of roles assigned to the user';
COMMENT ON COLUMN enhanced_audit_events.action IS 'The action that was performed';
COMMENT ON COLUMN enhanced_audit_events.resource IS 'The resource that was accessed or modified';
COMMENT ON COLUMN enhanced_audit_events.resource_id IS 'ID of the specific resource instance';
COMMENT ON COLUMN enhanced_audit_events.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN enhanced_audit_events.user_agent IS 'Browser/user agent information';
COMMENT ON COLUMN enhanced_audit_events.session_id IS 'Session identifier';
COMMENT ON COLUMN enhanced_audit_events.session_duration IS 'Duration of the session in seconds';
COMMENT ON COLUMN enhanced_audit_events.risk_score IS 'Calculated risk score (0-100)';
COMMENT ON COLUMN enhanced_audit_events.risk_level IS 'Risk level classification (low, medium, high, critical)';
COMMENT ON COLUMN enhanced_audit_events.success IS 'Whether the action was successful';
COMMENT ON COLUMN enhanced_audit_events.error_message IS 'Error message if the action failed';
COMMENT ON COLUMN enhanced_audit_events.metadata IS 'Additional context and metadata about the event';
COMMENT ON COLUMN enhanced_audit_events.compliance_flags IS 'Flags indicating compliance-related aspects of the event';
