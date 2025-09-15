// Policy enforcement service for JIT access control
export interface PolicyViolation {
  userId: string;
  username: string;
  userRole: string;
  violationType: string;
  resourceType: string;
  resourceId: string;
  actionAttempted: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AccessPolicy {
  role: string;
  allowedResources: string[];
  allowedActions: string[];
  requiresApproval: boolean;
}

// Define access policies for different roles
export const ACCESS_POLICIES: AccessPolicy[] = [
  {
    role: 'admin',
    allowedResources: ['patient_record', 'prescription', 'finance', 'lab_results', 'user_management'],
    allowedActions: ['read', 'write', 'admin'],
    requiresApproval: false
  },
  {
    role: 'manager',
    allowedResources: ['patient_record', 'prescription', 'lab_results', 'user_management'],
    allowedActions: ['read', 'write'],
    requiresApproval: false
  },
  {
    role: 'doctor',
    allowedResources: ['patient_record', 'prescription', 'lab_results'],
    allowedActions: ['read', 'write'],
    requiresApproval: false
  },
  {
    role: 'nurse',
    allowedResources: ['patient_record', 'prescription'],
    allowedActions: ['read'],
    requiresApproval: true // Nurses need approval for write access
  },
  {
    role: 'accountant',
    allowedResources: ['finance'],
    allowedActions: ['read', 'write'],
    requiresApproval: false
  },
  {
    role: 'user',
    allowedResources: [],
    allowedActions: [],
    requiresApproval: true
  }
];

// Check if a user can access a resource
export const checkAccessPermission = (
  userRole: string,
  resourceType: string,
  action: string
): { allowed: boolean; requiresApproval: boolean; reason?: string } => {
  const policy = ACCESS_POLICIES.find(p => p.role === userRole);
  
  if (!policy) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Unknown user role'
    };
  }

  // Check if resource is allowed
  if (!policy.allowedResources.includes(resourceType)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Role '${userRole}' is not authorized to access '${resourceType}' resources`
    };
  }

  // Check if action is allowed
  if (!policy.allowedActions.includes(action)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Role '${userRole}' is not authorized to perform '${action}' actions on '${resourceType}' resources`
    };
  }

  // Check if approval is required
  if (policy.requiresApproval) {
    return {
      allowed: true,
      requiresApproval: true,
      reason: `Role '${userRole}' requires approval for '${action}' access to '${resourceType}' resources`
    };
  }

  return {
    allowed: true,
    requiresApproval: false
  };
};

// Create a policy violation
export const createPolicyViolation = async (violation: PolicyViolation): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:5002/api/jit/violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(violation),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to create policy violation:', error);
    return false;
  }
};

// Simulate access attempt and enforce policies
export const attemptAccess = async (
  userId: string,
  username: string,
  userRole: string,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<{
  success: boolean;
  requiresApproval: boolean;
  violationCreated: boolean;
  message: string;
}> => {
  const permission = checkAccessPermission(userRole, resourceType, action);
  
  if (!permission.allowed) {
    // Create policy violation
    const violation: PolicyViolation = {
      userId,
      username,
      userRole,
      violationType: 'unauthorized_access_attempt',
      resourceType,
      resourceId,
      actionAttempted: action,
      reason: permission.reason || 'Unauthorized access attempt',
      severity: getSeverityLevel(userRole, resourceType, action)
    };

    const violationCreated = await createPolicyViolation(violation);

    return {
      success: false,
      requiresApproval: false,
      violationCreated,
      message: `Access denied: ${permission.reason}`
    };
  }

  if (permission.requiresApproval) {
    return {
      success: false,
      requiresApproval: true,
      violationCreated: false,
      message: `Access requires approval: ${permission.reason}`
    };
  }

  return {
    success: true,
    requiresApproval: false,
    violationCreated: false,
    message: 'Access granted'
  };
};

// Determine severity level based on role and resource
const getSeverityLevel = (userRole: string, resourceType: string, action: string): 'low' | 'medium' | 'high' | 'critical' => {
  // Critical: Admin/Manager trying to access restricted resources
  if (['admin', 'manager'].includes(userRole) && resourceType === 'finance' && action === 'write') {
    return 'critical';
  }

  // High: Unauthorized access to sensitive data
  if (resourceType === 'patient_record' || resourceType === 'prescription') {
    return 'high';
  }

  // Medium: Unauthorized access to lab results
  if (resourceType === 'lab_results') {
    return 'medium';
  }

  // Low: Other unauthorized access
  return 'low';
};

// Demo scenarios for testing
export const DEMO_SCENARIOS = [
  {
    name: 'Nurse tries to access finance files',
    userRole: 'nurse',
    resourceType: 'finance',
    action: 'read',
    expectedResult: 'denied',
    description: 'A nurse attempts to view financial records, which should be denied and create a policy violation.'
  },
  {
    name: 'Accountant tries to view patient prescription',
    userRole: 'accountant',
    resourceType: 'prescription',
    action: 'read',
    expectedResult: 'denied',
    description: 'An accountant attempts to view patient prescriptions, which should be denied and create a policy violation.'
  },
  {
    name: 'Nurse requests to edit prescription',
    userRole: 'nurse',
    resourceType: 'prescription',
    action: 'write',
    expectedResult: 'requires_approval',
    description: 'A nurse requests to edit a prescription, which should require approval from a doctor.'
  },
  {
    name: 'Doctor accesses patient record',
    userRole: 'doctor',
    resourceType: 'patient_record',
    action: 'read',
    expectedResult: 'allowed',
    description: 'A doctor accesses a patient record, which should be automatically approved.'
  },
  {
    name: 'Admin accesses financial data',
    userRole: 'admin',
    resourceType: 'finance',
    action: 'write',
    expectedResult: 'allowed',
    description: 'An admin accesses financial data, which should be automatically approved.'
  }
];

// Run demo scenarios
export const runDemoScenarios = async (userId: string, username: string) => {
  const results = [];
  
  for (const scenario of DEMO_SCENARIOS) {
    const result = await attemptAccess(
      userId,
      username,
      scenario.userRole,
      scenario.resourceType,
      'DEMO-RESOURCE-123',
      scenario.action
    );
    
    results.push({
      ...scenario,
      actualResult: result.success ? 'allowed' : (result.requiresApproval ? 'requires_approval' : 'denied'),
      violationCreated: result.violationCreated,
      message: result.message
    });
  }
  
  return results;
};
