-- Hospital Web Application Database Schema
-- PostgreSQL Schema for ML Training Data

-- Main behavior tracking table (matches actual system)
CREATE TABLE IF NOT EXISTS user_behavior (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    roles TEXT[],
    ip_address VARCHAR(45) DEFAULT 'unknown',
    user_agent TEXT DEFAULT '',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    session_period INTEGER DEFAULT 0,
    risk_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    risk_level VARCHAR(20) DEFAULT 'low',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables for comprehensive ML features
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    primary_role VARCHAR(50),
    department VARCHAR(100),
    hire_date DATE,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_count INTEGER DEFAULT 0,
    account_status VARCHAR(20) DEFAULT 'active',
    risk_profile VARCHAR(20) DEFAULT 'low'
);

CREATE TABLE IF NOT EXISTS session_analytics (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    page_views INTEGER DEFAULT 0,
    actions_count INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    device_type VARCHAR(50),
    location_country VARCHAR(100),
    location_region VARCHAR(100),
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_events INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS risk_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    risk_score DECIMAL(3,2) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_username_timestamp 
ON user_behavior(username, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id 
ON user_behavior(user_id);

CREATE INDEX IF NOT EXISTS idx_user_behavior_session_id 
ON user_behavior(session_id);

CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp 
ON user_behavior(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_behavior_risk_score 
ON user_behavior(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_behavior_action 
ON user_behavior(action);

CREATE INDEX IF NOT EXISTS idx_user_behavior_risk_level 
ON user_behavior(risk_level);

-- ML Training View - Aggregated features for better model performance
CREATE OR REPLACE VIEW ml_training_data AS
SELECT 
    ub.id,
    ub.username,
    ub.user_id,
    ub.user_role,
    -- Time features
    EXTRACT(HOUR FROM ub.timestamp) as hour,
    EXTRACT(DOW FROM ub.timestamp) as day_of_week,
    EXTRACT(MONTH FROM ub.timestamp) as month,
    CASE WHEN EXTRACT(DOW FROM ub.timestamp) IN (0, 6) THEN true ELSE false END as is_weekend,
    CASE WHEN EXTRACT(HOUR FROM ub.timestamp) BETWEEN 9 AND 17 THEN true ELSE false END as is_business_hours,
    
    -- Action features
    ub.action,
    CASE 
        WHEN ub.action LIKE '%failed%' OR ub.action LIKE '%unauthorized%' THEN true 
        ELSE false 
    END as is_failed_action,
    CASE 
        WHEN ub.action LIKE '%admin%' OR ub.action LIKE '%audit%' OR ub.action LIKE '%financial%' THEN true 
        ELSE false 
    END as is_sensitive_action,
    
    -- Geographic features
    ub.ip_region,
    CASE 
        WHEN ub.ip_region IN ('Vietnam', 'US', 'UK', 'Canada') THEN 'trusted'
        ELSE 'other'
    END as location_trust_level,
    
    -- Device features
    ub.device_type,
    CASE 
        WHEN ub.device_type = 'new' THEN true 
        ELSE false 
    END as is_new_device,
    
    -- Session features
    ub.session_period,
    CASE 
        WHEN ub.session_period < 30 THEN 'short'
        WHEN ub.session_period < 120 THEN 'medium'
        ELSE 'long'
    END as session_length_category,
    
    -- User behavior patterns (aggregated over last 24 hours)
    (SELECT COUNT(*) 
     FROM user_behavior ub2 
     WHERE ub2.user_id = ub.user_id 
       AND ub2.timestamp >= ub.timestamp - INTERVAL '24 hours'
       AND ub2.timestamp <= ub.timestamp
    ) as actions_last_24h,
    
    (SELECT COUNT(*) 
     FROM user_behavior ub2 
     WHERE ub2.user_id = ub.user_id 
       AND ub2.timestamp >= ub.timestamp - INTERVAL '24 hours'
       AND ub2.timestamp <= ub.timestamp
       AND (ub2.action LIKE '%failed%' OR ub2.action LIKE '%unauthorized%')
    ) as failed_actions_last_24h,
    
    -- Target variables
    ub.risk_score,
    ub.risk_level,
    
    -- Additional metadata
    ub.timestamp,
    ub.metadata
    
FROM user_behavior ub
LEFT JOIN (
    SELECT DISTINCT 
        user_id,
        FIRST_VALUE(roles) OVER (PARTITION BY user_id ORDER BY timestamp DESC) as user_role
    FROM user_behavior 
    WHERE array_length(roles, 1) > 0
) ur ON ub.user_id = ur.user_id
WHERE ub.timestamp >= NOW() - INTERVAL '90 days'  -- Last 90 days for training
ORDER BY ub.timestamp DESC;

-- Sample queries for ML feature engineering

-- 1. User risk profile over time
/*
SELECT 
    user_id,
    username,
    DATE(timestamp) as date,
    AVG(risk_score) as avg_daily_risk,
    MAX(risk_score) as max_daily_risk,
    COUNT(*) as daily_actions,
    COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_actions
FROM user_behavior 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY user_id, username, DATE(timestamp)
ORDER BY user_id, date;
*/

-- 2. Action risk patterns
/*
SELECT 
    action,
    COUNT(*) as frequency,
    AVG(risk_score) as avg_risk_score,
    STDDEV(risk_score) as risk_score_stddev,
    COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count
FROM user_behavior 
GROUP BY action
ORDER BY avg_risk_score DESC;
*/

-- 3. Geographic risk analysis
/*
SELECT 
    ip_region,
    device_type,
    COUNT(*) as frequency,
    AVG(risk_score) as avg_risk_score,
    COUNT(CASE WHEN risk_level IN ('high', 'critical') THEN 1 END) as high_risk_count
FROM user_behavior 
GROUP BY ip_region, device_type
ORDER BY avg_risk_score DESC;
*/

-- 4. Time-based risk patterns
/*
SELECT 
    EXTRACT(HOUR FROM timestamp) as hour,
    EXTRACT(DOW FROM timestamp) as day_of_week,
    COUNT(*) as frequency,
    AVG(risk_score) as avg_risk_score,
    COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count
FROM user_behavior 
GROUP BY EXTRACT(HOUR FROM timestamp), EXTRACT(DOW FROM timestamp)
ORDER BY hour, day_of_week;
*/
