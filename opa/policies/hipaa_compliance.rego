package healthcare.hipaa

import rego.v1

# HIPAA PHI (Protected Health Information) access rules
default allow := false
default requires_audit := true  # All PHI access must be audited
default minimum_necessary := true

# PHI access is allowed if all conditions are met
allow if {
    is_healthcare_provider
    has_need_to_know
    is_authorized_location
    is_secure_connection
    within_authorized_timeframe
    not is_under_investigation
}

# Healthcare provider roles
is_healthcare_provider if {
    input.user.roles[_] in ["doctor", "nurse", "physician_assistant", "medical_assistant"]
}

is_healthcare_provider if {
    input.user.roles[_] == "manager"
    input.user.department == "Medical"
}

# Need-to-know principle (minimum necessary rule)
has_need_to_know if {
    # Direct care provider can access assigned patients
    input.user.roles[_] in ["doctor", "nurse"]
    input.patient.id in input.user.assigned_patients
}

has_need_to_know if {
    # Emergency access
    input.context.emergency_access == true
    input.user.roles[_] in ["doctor", "nurse"]
    # Emergency access requires post-access review
}

has_need_to_know if {
    # Authorized for research with proper consent
    input.user.roles[_] == "researcher"
    input.patient.research_consent == true
    input.research.irb_approved == true
}

# Location-based access control
is_authorized_location if {
    # Within hospital premises
    input.user.location.type == "hospital_network"
}

is_authorized_location if {
    # VPN access for authorized remote work
    input.user.connection.vpn_connected == true
    input.user.remote_access_approved == true
}

is_authorized_location if {
    # Emergency access from any location
    input.context.emergency_access == true
    input.user.roles[_] in ["doctor", "nurse"]
}

# Secure connection requirement
is_secure_connection if {
    input.connection.encrypted == true
    input.connection.protocol in ["https", "vpn"]
}

# Time-based access
within_authorized_timeframe if {
    # Shift-based access for staff
    input.user.current_shift.active == true
}

within_authorized_timeframe if {
    # 24/7 access for doctors
    input.user.roles[_] == "doctor"
}

within_authorized_timeframe if {
    # Emergency access anytime
    input.context.emergency_access == true
}

# Investigation check
is_under_investigation if {
    input.user.id in data.users_under_investigation
}

# Deny conditions
deny contains msg if {
    not is_secure_connection
    msg := "PHI access requires secure encrypted connection"
}

deny contains msg if {
    is_under_investigation
    msg := "Access suspended during investigation"
}

deny contains msg if {
    input.user.hipaa_training_expired == true
    msg := "HIPAA training certification expired"
}

deny contains msg if {
    input.action == "export"
    input.data.contains_phi == true
    not input.export.encryption_enabled
    msg := "PHI export requires encryption"
}

deny contains msg if {
    input.action in ["print", "download", "export"]
    input.data.contains_phi == true
    not input.context.business_justification
    msg := "PHI disclosure requires documented business justification"
}

# Break-glass emergency access
emergency_access_allowed if {
    input.context.emergency_override == true
    input.user.roles[_] in ["doctor", "nurse", "manager"]
    # This triggers enhanced audit and post-access review
}

# Audit requirements (always true for PHI)
requires_audit if {
    input.data.contains_phi == true
}

requires_enhanced_audit if {
    input.context.emergency_access == true
}

requires_enhanced_audit if {
    input.action in ["export", "print", "download", "share"]
}

requires_enhanced_audit if {
    input.data.classification == "highly_sensitive"
}

# Data minimization - determine what fields can be accessed
accessible_fields contains field if {
    # Basic fields for all healthcare providers
    input.user.roles[_] in ["doctor", "nurse"]
    field := ["name", "date_of_birth", "medical_record_number"]
}

accessible_fields contains field if {
    # Full medical record for treating provider
    input.user.id in input.patient.care_team
    field := input.data.available_fields[_]
}

accessible_fields contains field if {
    # Limited fields for billing
    input.user.roles[_] in ["billing_specialist", "accountant"]
    field := ["name", "date_of_birth", "insurance_info", "billing_codes"]
}

accessible_fields contains field if {
    # De-identified data for research
    input.user.roles[_] == "researcher"
    input.context.deidentified == true
    field := input.data.deidentified_fields[_]
}

# Retention and disposal policies
data_retention_days := 7 if {
    input.data.type == "temporary_notes"
}

data_retention_days := 365 if {
    input.data.type == "clinical_notes"
}

data_retention_days := 2555 if {  # 7 years
    input.data.type in ["medical_records", "billing_records"]
}

should_archive if {
    input.data.age_days > data_retention_days
}

# Breach notification requirements
requires_breach_notification if {
    input.incident.type == "unauthorized_access"
    input.incident.data_compromised.contains_phi == true
    input.incident.affected_records > 0
}

breach_notification_timeline_hours := 24 if {
    input.incident.affected_records > 500
}

breach_notification_timeline_hours := 72 if {
    input.incident.affected_records <= 500
}

# Patient rights
patient_can_access_own_records if {
    input.user.type == "patient"
    input.patient.id == input.user.patient_id
    input.record.patient_id == input.patient.id
}

patient_can_request_amendment if {
    patient_can_access_own_records
}

patient_can_request_restriction if {
    patient_can_access_own_records
}

# Third-party disclosure
allow_third_party_disclosure if {
    # Patient authorization
    input.disclosure.patient_authorization == true
    input.disclosure.authorization_valid == true
}

allow_third_party_disclosure if {
    # Treatment, payment, or healthcare operations
    input.disclosure.purpose in ["treatment", "payment", "operations"]
    has_business_associate_agreement
}

allow_third_party_disclosure if {
    # Required by law
    input.disclosure.legal_requirement == true
    input.disclosure.court_order == true
}

has_business_associate_agreement if {
    input.third_party.baa_signed == true
    input.third_party.baa_expiration > time.now_ns()
}

# Compliance status - simplified
compliance_status := "compliant" if {
    is_secure_connection
    is_authorized_location
    within_authorized_timeframe
}

compliance_status := "non_compliant" if {
    not is_secure_connection
}

compliance_status := "non_compliant" if {
    not is_authorized_location
}

compliance_status := "non_compliant" if {
    not within_authorized_timeframe
}

