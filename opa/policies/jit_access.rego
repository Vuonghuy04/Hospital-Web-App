package healthcare.jit

import rego.v1

# Default decisions
default allow_request := false
default allow_approval := false
default requires_manager_approval := false
default max_duration_hours := 4

# JIT request is allowed
allow_request if {
    # User is authenticated and verified
    input.user.email_verified == true
    
    # Not already having active JIT access
    not has_active_jit_access
    
    # No recent violations
    input.user.policy_violations_last_30_days < 3
    
    # Risk score within acceptable range
    input.user.risk_score < 0.7
}

# JIT approval rules based on resource sensitivity
allow_approval if {
    input.approver.roles[_] == "manager"
    input.request.resource.sensitivity in ["low", "medium"]
    input.request.duration_hours <= 8
    input.requester.risk_score < 0.5
}

# Critical resources require multiple approvals
allow_approval if {
    input.approver.roles[_] == "manager"
    input.request.resource.sensitivity == "critical"
    input.request.duration_hours <= 4
    input.requester.risk_score < 0.3
    count(input.request.existing_approvals) >= 1  # Requires 2 managers
}

# Auto-approval for low-risk scenarios
allow_approval if {
    input.request.resource.sensitivity == "low"
    input.request.duration_hours <= 2
    input.requester.risk_score < 0.2
    input.requester.policy_violations_last_30_days == 0
}

# Manager approval required for sensitive resources
requires_manager_approval if {
    input.request.resource.sensitivity in ["high", "critical"]
}

requires_manager_approval if {
    input.request.duration_hours > 8
}

requires_manager_approval if {
    input.requester.risk_score > 0.4
}

# Maximum duration based on risk and resource
max_duration_hours := 2 if {
    input.requester.risk_score > 0.5
}

max_duration_hours := 4 if {
    input.request.resource.sensitivity == "critical"
}

max_duration_hours := 8 if {
    input.request.resource.sensitivity in ["medium", "low"]
    input.requester.risk_score < 0.3
}

max_duration_hours := 24 if {
    input.requester.roles[_] == "manager"
    input.request.resource.sensitivity == "low"
}

# Deny reasons
deny contains msg if {
    has_active_jit_access
    msg := "User already has an active JIT access grant"
}

deny contains msg if {
    input.requester.risk_score > 0.7
    msg := "Risk score too high for JIT access"
}

deny contains msg if {
    input.requester.policy_violations_last_30_days >= 3
    msg := "Too many recent policy violations"
}

deny contains msg if {
    input.request.resource.type == "financial_data"
    not is_business_hours
    msg := "Financial data JIT access only during business hours"
}

deny contains msg if {
    input.request.resource.sensitivity == "critical"
    input.requester.account_age_days < 90
    msg := "Account too new for critical resource access"
}

# Helper functions
has_active_jit_access if {
    input.user.active_jit_grants[_].expires_at > time.now_ns()
}

is_business_hours if {
    hour := time.clock(time.now_ns())[0]
    hour >= 8
    hour < 18
    day := time.weekday(time.now_ns())
    day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}

# Monitoring requirements
requires_enhanced_monitoring if {
    input.request.resource.sensitivity in ["high", "critical"]
}

requires_enhanced_monitoring if {
    input.requester.risk_score > 0.4
}

# Automatic revocation conditions
should_revoke_access if {
    input.grant.user.risk_score > 0.8  # Risk score spiked
}

should_revoke_access if {
    input.grant.user.suspicious_activity_detected == true
}

should_revoke_access if {
    input.grant.user.location.country != input.grant.original_location.country
}

should_revoke_access if {
    not is_business_hours
    input.grant.resource.requires_business_hours == true
}

