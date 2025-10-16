import fetch from 'node-fetch';

const OPA_URL = process.env.OPA_URL || 'http://localhost:8181';

/**
 * OPA Authorization Middleware
 * Enforces policies defined in OPA Rego files
 */
export default class OPAMiddleware {
  
  /**
   * Main authorization middleware
   */
  static authorize(policyPath = 'healthcare/authorization') {
    return async (req, res, next) => {
      try {
        // Build input for OPA policy evaluation
        const input = OPAMiddleware.buildInput(req);
        
        // Query OPA
        const decision = await OPAMiddleware.queryOPA(policyPath, input);
        
        // Check decision
        if (!decision.result?.allow) {
          const reasons = decision.result?.deny || ['Access denied by policy'];
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied',
            reasons: reasons,
            policy: policyPath
          });
        }
        
        // Attach OPA decision to request for downstream use
        req.opaDecision = decision.result;
        
        // Check if enhanced audit is required
        if (decision.result?.requires_enhanced_audit) {
          req.enhancedAudit = true;
        }
        
        // Check if MFA is required
        if (decision.result?.requires_mfa && !req.user?.mfa_verified) {
          return res.status(403).json({
            error: 'MFA Required',
            message: 'Multi-factor authentication required for this action',
            mfa_required: true
          });
        }
        
        next();
      } catch (error) {
        console.error('OPA authorization error:', error);
        // Fail closed - deny access on error
        return res.status(500).json({
          error: 'Authorization Error',
          message: 'Unable to verify authorization'
        });
      }
    };
  }
  
  /**
   * JIT Access Policy Middleware
   */
  static jitAccess() {
    return async (req, res, next) => {
      try {
        const input = {
          user: req.user,
          request: req.body,
          resource: req.params,
          action: req.method
        };
        
        const decision = await OPAMiddleware.queryOPA('healthcare/jit', input);
        
        if (!decision.result?.allow_request && !decision.result?.allow_approval) {
          return res.status(403).json({
            error: 'JIT Access Denied',
            reasons: decision.result?.deny || ['Request not allowed'],
            max_duration: decision.result?.max_duration_hours
          });
        }
        
        req.opaDecision = decision.result;
        next();
      } catch (error) {
        console.error('OPA JIT policy error:', error);
        return res.status(500).json({
          error: 'Policy Evaluation Error'
        });
      }
    };
  }
  
  /**
   * ML Risk-Based Access Control
   */
  static riskBasedAccess() {
    return async (req, res, next) => {
      try {
        // Get user's ML risk score
        const mlRiskScore = await OPAMiddleware.getMLRiskScore(req.user.id);
        
        const input = {
          user: {
            ...req.user,
            ml_risk_score: mlRiskScore.risk_score,
            behavior: mlRiskScore.behavior_metrics
          },
          resource: {
            type: req.params.resourceType,
            sensitivity: req.resourceSensitivity || 'medium',
            id: req.params.id
          },
          action: OPAMiddleware.mapMethodToAction(req.method),
          context: {
            time: Date.now(),
            ip: req.ip,
            user_agent: req.get('user-agent')
          }
        };
        
        const decision = await OPAMiddleware.queryOPA('healthcare/risk', input);
        
        if (!decision.result?.allow) {
          // Check if we should trigger an alert
          if (decision.result?.should_trigger_alert) {
            await OPAMiddleware.triggerSecurityAlert(req.user, decision.result);
          }
          
          return res.status(403).json({
            error: 'Access Denied',
            message: 'Risk-based policy violation',
            risk_level: decision.result?.risk_level,
            reasons: decision.result?.deny,
            recommended_action: decision.result?.recommended_action
          });
        }
        
        // Attach risk information
        req.riskLevel = decision.result?.risk_level;
        req.requiresMFA = decision.result?.requires_mfa;
        req.maxSessionDuration = decision.result?.max_session_duration_minutes;
        
        next();
      } catch (error) {
        console.error('OPA risk policy error:', error);
        return res.status(500).json({
          error: 'Risk Evaluation Error'
        });
      }
    };
  }
  
  /**
   * HIPAA Compliance Check
   */
  static hipaaCompliance() {
    return async (req, res, next) => {
      try {
        const input = {
          user: req.user,
          patient: req.patient,
          data: {
            contains_phi: req.containsPHI || true,
            type: req.dataType || 'medical_records',
            classification: req.dataClassification || 'sensitive'
          },
          action: OPAMiddleware.mapMethodToAction(req.method),
          connection: {
            encrypted: req.secure || req.get('x-forwarded-proto') === 'https',
            protocol: req.protocol,
            vpn_connected: req.headers['x-vpn-connected'] === 'true'
          },
          context: {
            emergency_access: req.emergencyAccess || false,
            business_justification: req.body?.justification
          }
        };
        
        const decision = await OPAMiddleware.queryOPA('healthcare/hipaa', input);
        
        if (!decision.result?.allow) {
          // Log HIPAA violation attempt
          await OPAMiddleware.logHIPAAViolation(req, decision.result);
          
          return res.status(403).json({
            error: 'HIPAA Policy Violation',
            reasons: decision.result?.deny,
            compliance_status: decision.result?.compliance_status
          });
        }
        
        // Enforce minimum necessary principle
        if (decision.result?.accessible_fields) {
          req.allowedFields = decision.result.accessible_fields;
        }
        
        // All HIPAA access requires audit
        req.enhancedAudit = true;
        
        next();
      } catch (error) {
        console.error('HIPAA policy error:', error);
        return res.status(500).json({
          error: 'Compliance Check Error'
        });
      }
    };
  }
  
  /**
   * Build input object for OPA from request
   */
  static buildInput(req) {
    return {
      user: {
        id: req.user?.id || req.user?.user_id,
        username: req.user?.username,
        email: req.user?.email,
        roles: req.user?.roles || [],
        risk_score: req.user?.risk_score || 0,
        mfa_verified: req.user?.mfa_verified || false,
        location: {
          country: req.geoip?.country || 'US',
          ip: req.ip
        },
        device: {
          fingerprint: req.deviceFingerprint
        },
        failed_attempts: req.user?.failed_login_count || 0,
        jit_access: req.user?.active_jit_access || {},
        policy_violations_last_30_days: req.user?.recent_violations || 0
      },
      resource: {
        type: req.params.resourceType || req.baseUrl.split('/')[2],
        id: req.params.id,
        sensitivity: req.resourceSensitivity || 'medium'
      },
      action: OPAMiddleware.mapMethodToAction(req.method),
      context: {
        time: Date.now(),
        path: req.path,
        ip: req.ip,
        user_agent: req.get('user-agent')
      }
    };
  }
  
  /**
   * Query OPA policy
   */
  static async queryOPA(policyPath, input) {
    const response = await fetch(`${OPA_URL}/v1/data/${policyPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });
    
    if (!response.ok) {
      throw new Error(`OPA query failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Map HTTP method to action
   */
  static mapMethodToAction(method) {
    const mapping = {
      'GET': 'read',
      'POST': 'write',
      'PUT': 'write',
      'PATCH': 'write',
      'DELETE': 'delete'
    };
    return mapping[method] || 'read';
  }
  
  /**
   * Get ML risk score for user
   */
  static async getMLRiskScore(userId) {
    try {
      const mlServiceUrl = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5001';
      const response = await fetch(`${mlServiceUrl}/predict-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Default to medium risk if ML service unavailable
      return { risk_score: 0.5, behavior_metrics: {} };
    } catch (error) {
      console.error('Error fetching ML risk score:', error);
      return { risk_score: 0.5, behavior_metrics: {} };
    }
  }
  
  /**
   * Trigger security alert
   */
  static async triggerSecurityAlert(user, decision) {
    // Implementation would send alerts to security team
    console.log('SECURITY ALERT:', {
      user_id: user.id,
      username: user.username,
      risk_level: decision.risk_level,
      alert_severity: decision.alert_severity,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log HIPAA violation attempt
   */
  static async logHIPAAViolation(req, decision) {
    // Implementation would log to audit system
    console.log('HIPAA VIOLATION ATTEMPT:', {
      user_id: req.user?.id,
      reasons: decision.deny,
      compliance_score: decision.compliance_score,
      timestamp: new Date().toISOString()
    });
  }
}

// Export individual middleware functions
export const authorize = OPAMiddleware.authorize;
export const jitAccess = OPAMiddleware.jitAccess;
export const riskBasedAccess = OPAMiddleware.riskBasedAccess;
export const hipaaCompliance = OPAMiddleware.hipaaCompliance;

