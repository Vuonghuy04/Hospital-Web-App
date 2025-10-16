package healthcare.risk

import rego.v1

# Risk thresholds
low_risk_threshold := 0.3
medium_risk_threshold := 0.5
high_risk_threshold := 0.7
critical_risk_threshold := 0.9

# Default decisions
default allow := false
default requires_mfa := false
default requires_approval := false
default max_session_duration_minutes := 480  # 8 hours

# Risk level calculation
risk_level := "low" if {
    input.user.ml_risk_score < low_risk_threshold
}

risk_level := "medium" if {
    input.user.ml_risk_score >= low_risk_threshold
    input.user.ml_risk_score < medium_risk_threshold
}

risk_level := "high" if {
    input.user.ml_risk_score >= medium_risk_threshold
    input.user.ml_risk_score < high_risk_threshold
}

risk_level := "critical" if {
    input.user.ml_risk_score >= high_risk_threshold
}

# Access decisions based on ML risk score
allow if {
    input.user.ml_risk_score < medium_risk_threshold
    input.resource.sensitivity in ["low", "medium"]
    is_normal_behavior_pattern
}

allow if {
    input.user.ml_risk_score < low_risk_threshold
    input.resource.sensitivity == "high"
    input.user.mfa_verified == true
    is_normal_behavior_pattern
}

# Elevated risk requires additional verification
requires_mfa if {
    input.user.ml_risk_score >= low_risk_threshold
    input.resource.sensitivity in ["high", "critical"]
}

requires_mfa if {
    input.user.ml_risk_score >= medium_risk_threshold
}

requires_mfa if {
    behavior_anomaly_detected
}

# High risk requires manager approval
requires_approval if {
    input.user.ml_risk_score >= medium_risk_threshold
    input.resource.sensitivity in ["high", "critical"]
}

requires_approval if {
    input.user.ml_risk_score >= high_risk_threshold
}

# Session duration based on risk
max_session_duration_minutes := 30 if {
    input.user.ml_risk_score >= high_risk_threshold
}

max_session_duration_minutes := 120 if {
    input.user.ml_risk_score >= medium_risk_threshold
    input.user.ml_risk_score < high_risk_threshold
}

max_session_duration_minutes := 240 if {
    input.user.ml_risk_score >= low_risk_threshold
    input.user.ml_risk_score < medium_risk_threshold
}

max_session_duration_minutes := 480 if {
    input.user.ml_risk_score < low_risk_threshold
}

# Behavior pattern analysis
is_normal_behavior_pattern if {
    # Check if current behavior matches user's baseline
    input.user.behavior.current_hour in input.user.behavior.typical_hours
    input.user.behavior.current_actions_per_hour < input.user.behavior.avg_actions_per_hour * 2
}

behavior_anomaly_detected if {
    # Unusual access time
    not input.user.behavior.current_hour in input.user.behavior.typical_hours
}

behavior_anomaly_detected if {
    # Abnormal activity volume
    input.user.behavior.current_actions_per_hour > input.user.behavior.avg_actions_per_hour * 3
}

behavior_anomaly_detected if {
    # Accessing unusual resources
    count([r | r := input.user.behavior.recent_resources[_]; not r in input.user.behavior.typical_resources]) > 5
}

behavior_anomaly_detected if {
    # Location anomaly
    input.user.location.country != input.user.baseline_location.country
}

behavior_anomaly_detected if {
    # Device anomaly
    not input.user.device.fingerprint in input.user.known_devices
}

# Action restrictions based on risk
allowed_actions contains action if {
    input.user.ml_risk_score < low_risk_threshold
    action := ["read", "write", "delete", "export", "share"]
}

allowed_actions contains action if {
    input.user.ml_risk_score >= low_risk_threshold
    input.user.ml_risk_score < medium_risk_threshold
    action := ["read", "write"]
}

allowed_actions contains action if {
    input.user.ml_risk_score >= medium_risk_threshold
    input.user.ml_risk_score < high_risk_threshold
    action := ["read"]
}

# Deny high-risk actions
deny contains msg if {
    input.user.ml_risk_score >= high_risk_threshold
    msg := sprintf("Access denied: Risk score %.2f exceeds threshold", [input.user.ml_risk_score])
}

deny contains msg if {
    input.action == "delete"
    input.user.ml_risk_score >= medium_risk_threshold
    msg := "Delete action not allowed for users with elevated risk scores"
}

deny contains msg if {
    input.action == "export"
    input.user.ml_risk_score >= low_risk_threshold
    not input.user.mfa_verified
    msg := "Export requires MFA verification for users with elevated risk"
}

# Real-time risk adjustments
risk_adjustment := 0.2 if {
    # Increase risk for failed actions
    input.user.failed_actions_last_hour > 3
}

risk_adjustment := 0.15 if {
    # Increase risk for unusual time
    not is_business_hours
}

risk_adjustment := 0.1 if {
    # Increase risk for new device
    not input.user.device.fingerprint in input.user.known_devices
}

risk_adjustment := -0.1 if {
    # Decrease risk for consistent good behavior
    input.user.successful_sessions_last_30_days > 100
    input.user.policy_violations_last_30_days == 0
}

adjusted_risk_score := input.user.ml_risk_score + sum([r | r := risk_adjustment])

# Monitoring and alerting
should_trigger_alert if {
    input.user.ml_risk_score >= high_risk_threshold
}

should_trigger_alert if {
    behavior_anomaly_detected
    input.resource.sensitivity in ["high", "critical"]
}

should_trigger_alert if {
    # Risk score increased significantly
    input.user.ml_risk_score > input.user.baseline_risk_score * 2
}

alert_severity := "critical" if {
    input.user.ml_risk_score >= critical_risk_threshold
}

alert_severity := "high" if {
    input.user.ml_risk_score >= high_risk_threshold
    input.user.ml_risk_score < critical_risk_threshold
}

alert_severity := "medium" if {
    input.user.ml_risk_score >= medium_risk_threshold
    input.user.ml_risk_score < high_risk_threshold
}

# Automatic response actions
recommended_action := "block_access" if {
    input.user.ml_risk_score >= critical_risk_threshold
}

recommended_action := "require_reverification" if {
    input.user.ml_risk_score >= high_risk_threshold
    input.user.ml_risk_score < critical_risk_threshold
}

recommended_action := "enhanced_monitoring" if {
    input.user.ml_risk_score >= medium_risk_threshold
    input.user.ml_risk_score < high_risk_threshold
}

recommended_action := "normal" if {
    input.user.ml_risk_score < medium_risk_threshold
}

# Helper functions
is_business_hours if {
    hour := time.clock(time.now_ns())[0]
    hour >= 8
    hour < 18
}

