import { ComplianceRule, ComplianceViolation, ComplianceReport, ComplianceMetrics } from '../types/compliance';

class ComplianceService {
  private baseUrl = 'http://localhost:5002/api/compliance';

  // Mock data for demonstration
  private mockRules: ComplianceRule[] = [
    {
      id: 'rule-1',
      name: 'Patient Data Access Logging',
      description: 'All access to patient data must be logged with user ID, timestamp, and purpose',
      category: 'privacy',
      severity: 'high',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rule-2',
      name: 'JIT Access Time Limits',
      description: 'Just-in-time access must not exceed 2 minutes without manager approval',
      category: 'access',
      severity: 'medium',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rule-3',
      name: 'Off-Hours Access Monitoring',
      description: 'Access to sensitive data outside business hours requires additional approval',
      category: 'security',
      severity: 'high',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rule-4',
      name: 'Data Encryption Requirements',
      description: 'All patient data must be encrypted in transit and at rest',
      category: 'data',
      severity: 'critical',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rule-5',
      name: 'Audit Trail Integrity',
      description: 'All system actions must be recorded in tamper-proof audit logs',
      category: 'audit',
      severity: 'critical',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  private mockViolations: ComplianceViolation[] = [
    {
      id: 'violation-1',
      ruleId: 'rule-2',
      userId: 'user-123',
      username: 'nurse.sarah',
      userRole: 'nurse',
      violationType: 'JIT Access Exceeded',
      description: 'JIT access granted for 8 hours without manager approval',
      severity: 'medium',
      status: 'open',
      detectedAt: '2024-01-15T14:30:00Z',
      evidence: {
        timestamp: '2024-01-15T14:30:00Z',
        action: 'JIT_ACCESS_GRANTED',
        resource: 'patient_records',
        details: { duration: 28800, approvedBy: 'system' }
      },
      remediation: {
        action: 'Revoke access and require manager approval',
        completed: false
      }
    },
    {
      id: 'violation-2',
      ruleId: 'rule-3',
      userId: 'user-456',
      username: 'doctor.mike',
      userRole: 'doctor',
      violationType: 'Off-Hours Access',
      description: 'Accessed patient records at 2:30 AM without proper authorization',
      severity: 'high',
      status: 'acknowledged',
      detectedAt: '2024-01-15T02:30:00Z',
      evidence: {
        timestamp: '2024-01-15T02:30:00Z',
        action: 'DATA_ACCESS',
        resource: 'patient_records',
        details: { ipAddress: '192.168.1.100', location: 'unknown' }
      },
      remediation: {
        action: 'Review access patterns and implement additional monitoring',
        completed: false
      }
    },
    {
      id: 'violation-3',
      ruleId: 'rule-1',
      userId: 'user-789',
      username: 'contractor.john',
      userRole: 'contractor',
      violationType: 'Missing Access Log',
      description: 'Patient data accessed without proper logging entry',
      severity: 'high',
      status: 'resolved',
      detectedAt: '2024-01-14T10:15:00Z',
      resolvedAt: '2024-01-14T16:45:00Z',
      resolvedBy: 'admin.smith',
      evidence: {
        timestamp: '2024-01-14T10:15:00Z',
        action: 'DATA_ACCESS',
        resource: 'financial_data',
        details: { logEntry: 'MISSING' }
      },
      remediation: {
        action: 'Implement additional logging controls',
        completed: true,
        completedAt: '2024-01-14T16:45:00Z'
      }
    }
  ];

  async getComplianceRules(): Promise<ComplianceRule[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rules`);
      if (!response.ok) {
        throw new Error('Failed to fetch compliance rules');
      }
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching compliance rules:', error);
      return this.mockRules;
    }
  }

  async getComplianceViolations(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    userId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<ComplianceViolation[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.dateRange) {
        params.append('startDate', filters.dateRange.start);
        params.append('endDate', filters.dateRange.end);
      }

      const response = await fetch(`${this.baseUrl}/violations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch compliance violations');
      }
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching compliance violations:', error);
      return this.mockViolations;
    }
  }

  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch compliance metrics');
      }
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      return this.generateMockMetrics();
    }
  }

  async generateComplianceReport(period: { start: string; end: string }): Promise<ComplianceReport> {
    try {
      const response = await fetch(`${this.baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(period),
      });
      if (!response.ok) {
        throw new Error('Failed to generate compliance report');
      }
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return this.generateMockReport(period);
    }
  }

  async updateViolationStatus(violationId: string, status: string, resolvedBy?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/violations/${violationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, resolvedBy }),
      });
      if (!response.ok) {
        throw new Error('Failed to update violation status');
      }
    } catch (error) {
      console.error('Error updating violation status:', error);
    }
  }

  private generateMockMetrics(): ComplianceMetrics {
    const violations = this.mockViolations;
    const totalViolations = violations.length;
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;
    const mediumViolations = violations.filter(v => v.severity === 'medium').length;
    const lowViolations = violations.filter(v => v.severity === 'low').length;
    const resolvedViolations = violations.filter(v => v.status === 'resolved').length;

    // Calculate scores (higher is better)
    const overallScore = Math.max(0, 100 - (criticalViolations * 20) - (highViolations * 10) - (mediumViolations * 5) - (lowViolations * 2));
    const securityScore = Math.max(0, 100 - (violations.filter(v => v.ruleId === 'rule-3').length * 15));
    const privacyScore = Math.max(0, 100 - (violations.filter(v => v.ruleId === 'rule-1').length * 15));
    const accessScore = Math.max(0, 100 - (violations.filter(v => v.ruleId === 'rule-2').length * 10));
    const dataScore = Math.max(0, 100 - (violations.filter(v => v.ruleId === 'rule-4').length * 20));
    const auditScore = Math.max(0, 100 - (violations.filter(v => v.ruleId === 'rule-5').length * 20));

    return {
      overallScore: Math.round(overallScore),
      securityScore: Math.round(securityScore),
      privacyScore: Math.round(privacyScore),
      accessScore: Math.round(accessScore),
      dataScore: Math.round(dataScore),
      auditScore: Math.round(auditScore),
      lastUpdated: new Date().toISOString(),
      trends: this.generateMockTrends(),
      recommendations: this.generateRecommendations(violations)
    };
  }

  private generateMockTrends() {
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        score: Math.max(60, 100 - Math.random() * 40),
        date: date.toISOString().split('T')[0]
      });
    }
    return trends;
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations = [];
    
    if (violations.some(v => v.ruleId === 'rule-2')) {
      recommendations.push('Implement stricter JIT access time limits and approval workflows');
    }
    
    if (violations.some(v => v.ruleId === 'rule-3')) {
      recommendations.push('Enhance off-hours access monitoring and require additional approvals');
    }
    
    if (violations.some(v => v.ruleId === 'rule-1')) {
      recommendations.push('Improve access logging mechanisms and implement real-time monitoring');
    }
    
    if (violations.some(v => v.ruleId === 'rule-4')) {
      recommendations.push('Review and strengthen data encryption policies and implementations');
    }
    
    if (violations.some(v => v.ruleId === 'rule-5')) {
      recommendations.push('Implement tamper-proof audit logging and regular integrity checks');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current compliance practices and regular monitoring');
    }

    return recommendations;
  }

  private generateMockReport(period: { start: string; end: string }): ComplianceReport {
    const violations = this.mockViolations;
    const categories = violations.reduce((acc, violation) => {
      const rule = this.mockRules.find(r => r.id === violation.ruleId);
      if (rule) {
        if (!acc[rule.category]) {
          acc[rule.category] = { violations: 0, resolved: 0, open: 0 };
        }
        acc[rule.category].violations++;
        if (violation.status === 'resolved') {
          acc[rule.category].resolved++;
        } else {
          acc[rule.category].open++;
        }
      }
      return acc;
    }, {} as Record<string, { violations: number; resolved: number; open: number }>);

    const topViolators = violations.reduce((acc, violation) => {
      const existing = acc.find(v => v.username === violation.username);
      if (existing) {
        existing.violations++;
      } else {
        acc.push({
          username: violation.username,
          role: violation.userRole,
          violations: 1
        });
      }
      return acc;
    }, [] as { username: string; role: string; violations: number }[]);

    return {
      id: `report-${Date.now()}`,
      title: `Compliance Report - ${period.start} to ${period.end}`,
      period,
      generatedAt: new Date().toISOString(),
      generatedBy: 'system',
      summary: {
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.severity === 'critical').length,
        highViolations: violations.filter(v => v.severity === 'high').length,
        mediumViolations: violations.filter(v => v.severity === 'medium').length,
        lowViolations: violations.filter(v => v.severity === 'low').length,
        resolvedViolations: violations.filter(v => v.status === 'resolved').length,
        openViolations: violations.filter(v => v.status !== 'resolved').length
      },
      categories,
      topViolators: topViolators.sort((a, b) => b.violations - a.violations).slice(0, 5),
      trends: {
        daily: this.generateMockTrends(),
        weekly: this.generateMockTrends().filter((_, i) => i % 7 === 0)
      }
    };
  }
}

export default new ComplianceService();
