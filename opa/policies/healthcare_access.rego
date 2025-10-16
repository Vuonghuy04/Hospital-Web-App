package healthcare.authorization

import rego.v1

# Default deny
default allow := false

# Admin users have full access during business hours
allow if {
    input.user.roles[_] == "manager"
    is_business_hours
    input.user.risk_score < 0.7
}

# Doctors can access patient records
allow if {
    input.user.roles[_] == "doctor"
    input.resource.type == "patient_record"
    is_business_hours
    input.user.risk_score < 0.5
    not is_suspicious_behavior
}

# Nurses have limited patient record access
allow if {
    input.user.roles[_] == "nurse"
    input.resource.type == "patient_record"
    input.action == "read"
    is_business_hours
    input.user.risk_score < 0.6
}

# Financial data access with enhanced checks
allow if {
    input.user.roles[_] in ["accountant", "contractor"]
    input.resource.type == "financial_data"
    is_business_hours
    input.user.risk_score < 0.4
    not is_high_value_transaction
}

# JIT access - temporary elevated permissions
allow if {
    input.user.jit_access.approved == true
    input.user.jit_access.expires_at > time.now_ns()
    input.resource.type == input.user.jit_access.resource_type
    input.user.risk_score < 0.5
}

# Helper rules
is_business_hours if {
    hour := time.clock(time.now_ns())[0]
    hour >= 8
    hour < 18
}

is_suspicious_behavior if {
    input.user.risk_score > 0.7
}

is_suspicious_behavior if {
    input.user.failed_attempts > 3
}

is_suspicious_behavior if {
    input.user.location.country != "expected_country"
}

is_high_value_transaction if {
    input.resource.amount > 10000
}

# Audit requirement - specific actions require audit logging
requires_enhanced_audit if {
    input.action in ["delete", "export", "modify_permissions"]
}

requires_enhanced_audit if {
    input.resource.sensitivity == "high"
}

requires_enhanced_audit if {
    input.user.risk_score > 0.5
}

# Rate limiting
deny contains msg if {
    input.user.requests_last_hour > 1000
    msg := "Rate limit exceeded"
}

# Time-based restrictions
deny contains msg if {
    input.resource.type == "financial_data"
    not is_business_hours
    not user_is_manager
    msg := "Financial data access only allowed during business hours"
}

user_is_manager if {
    input.user.roles[_] == "manager"
}

# Risk-based restrictions
deny contains msg if {
    input.user.risk_score > 0.8
    msg := "Access denied due to high risk score"
}

# Location-based restrictions
deny contains msg if {
    input.resource.sensitivity == "critical"
    input.user.location.country != "US"
    msg := "Critical resources can only be accessed from US locations"
}

