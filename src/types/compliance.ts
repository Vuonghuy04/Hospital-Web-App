export interface ComplianceRule {
  id: number;
  rule_id: string;
  name: string;
  description: string;
  category: 'Security' | 'Privacy' | 'Access Control' | 'Data Management' | 'Audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceViolation {
  id: number;
  violation_id: string;
  rule_id: string;
  user_id: string;
  username: string;
  user_role: string;
  violation_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  detected_at: string;
  resolved_at?: string;
  resolved_by?: string;
  evidence: Record<string, any>;
  remediation: Record<string, any>;
  created_at: string;
  updated_at: string;
  rule_name?: string;
  rule_category?: string;
}

export interface ComplianceReport {
  id: string;
  title: string;
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
  generatedBy: string;
  summary: {
    totalViolations: number;
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
    resolvedViolations: number;
    openViolations: number;
  };
  categories: {
    [key: string]: {
      violations: number;
      resolved: number;
      open: number;
    };
  };
  topViolators: {
    username: string;
    role: string;
    violations: number;
  }[];
  trends: {
    daily: { date: string; violations: number }[];
    weekly: { week: string; violations: number }[];
  };
}

export interface ComplianceMetrics {
  overallScore: number; // 0-100
  securityScore: number;
  privacyScore: number;
  accessScore: number;
  dataScore: number;
  auditScore: number;
  lastUpdated: string;
  trends: {
    score: number;
    date: string;
  }[];
  recommendations: string[];
}
