import express from 'express';
import { authorize, jitAccess, riskBasedAccess, hipaaCompliance } from '../middleware/opa.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * Example 1: Basic authorization with OPA
 * Checks if user has access to patient records
 */
router.get('/patients/:id/records',
  authMiddleware,  // First authenticate with Keycloak
  authorize('healthcare/authorization'),  // Then check OPA policy
  async (req, res) => {
    try {
      // If we reach here, OPA policy allowed access
      const patientRecords = await getPatientRecords(req.params.id);
      
      // Filter fields based on OPA decision (minimum necessary)
      if (req.opaDecision?.accessible_fields) {
        const filteredRecords = filterFields(patientRecords, req.opaDecision.accessible_fields);
        return res.json(filteredRecords);
      }
      
      res.json(patientRecords);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Example 2: ML Risk-Based Access Control
 * Access automatically adjusts based on user's ML risk score
 */
router.get('/financial-data/:id',
  authMiddleware,
  riskBasedAccess(),  // Evaluates ML risk score and applies dynamic policies
  async (req, res) => {
    try {
      const financialData = await getFinancialData(req.params.id);
      
      // Session duration adjusted based on risk
      res.setHeader('X-Session-Max-Duration', req.maxSessionDuration);
      
      // Log with risk level
      await logAccess({
        user: req.user,
        resource: 'financial_data',
        risk_level: req.riskLevel,
        timestamp: new Date()
      });
      
      res.json(financialData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Example 3: HIPAA Compliance Check
 * Enforces HIPAA rules for PHI access
 */
router.get('/patients/:patientId/phi',
  authMiddleware,
  async (req, res, next) => {
    // Attach patient info for HIPAA policy
    req.patient = await getPatient(req.params.patientId);
    req.containsPHI = true;
    req.dataType = 'medical_records';
    next();
  },
  hipaaCompliance(),  // HIPAA policy check
  async (req, res) => {
    try {
      let patientData = await getPatientPHI(req.params.patientId);
      
      // Apply minimum necessary rule - only return allowed fields
      if (req.allowedFields) {
        patientData = filterToAllowedFields(patientData, req.allowedFields);
      }
      
      // Enhanced audit logging (required by HIPAA)
      await auditPHIAccess({
        user: req.user,
        patient: req.patient,
        fields_accessed: Object.keys(patientData),
        justification: req.query.justification,
        timestamp: new Date()
      });
      
      res.json(patientData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Example 4: JIT Access Request
 * User requests temporary elevated access
 */
router.post('/jit-access/request',
  authMiddleware,
  jitAccess(),  // JIT policy evaluation
  async (req, res) => {
    try {
      const { resource_type, duration_hours, justification } = req.body;
      
      // OPA decision includes max allowed duration
      const maxDuration = req.opaDecision?.max_duration_hours || 4;
      const requestedDuration = Math.min(duration_hours, maxDuration);
      
      // Create JIT access request
      const jitRequest = await createJITRequest({
        user_id: req.user.id,
        resource_type,
        duration_hours: requestedDuration,
        justification,
        requires_manager_approval: req.opaDecision?.requires_manager_approval,
        auto_approved: req.opaDecision?.allow_approval === true
      });
      
      res.json({
        request_id: jitRequest.id,
        status: jitRequest.status,
        max_duration_hours: maxDuration,
        requires_approval: req.opaDecision?.requires_manager_approval,
        expires_at: jitRequest.expires_at
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Example 5: JIT Access Approval
 * Manager approves JIT access request
 */
router.post('/jit-access/:requestId/approve',
  authMiddleware,
  async (req, res, next) => {
    // Load request details for policy evaluation
    req.body.request = await getJITRequest(req.params.requestId);
    req.body.approver = req.user;
    req.body.requester = await getUser(req.body.request.user_id);
    next();
  },
  jitAccess(),  // Check if this user can approve
  async (req, res) => {
    try {
      if (!req.opaDecision?.allow_approval) {
        return res.status(403).json({
          error: 'Cannot approve this request',
          reasons: req.opaDecision?.deny
        });
      }
      
      const approval = await approveJITRequest({
        request_id: req.params.requestId,
        approver_id: req.user.id,
        approved_duration: req.opaDecision?.max_duration_hours
      });
      
      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Example 6: Combined Policies
 * High-risk action requiring multiple policy checks
 */
router.delete('/patients/:id/records/:recordId',
  authMiddleware,
  riskBasedAccess(),  // Check ML risk score
  hipaaCompliance(),  // Check HIPAA compliance
  authorize('healthcare/authorization'),  // Check general authorization
  async (req, res) => {
    try {
      // Multiple policies must all pass for deletion
      
      // Additional business logic check
      const record = await getRecord(req.params.id, req.params.recordId);
      if (record.locked) {
        return res.status(403).json({ error: 'Record is locked' });
      }
      
      // Perform deletion with full audit trail
      await deleteRecord(req.params.id, req.params.recordId, {
        deleted_by: req.user.id,
        risk_level: req.riskLevel,
        justification: req.body.justification,
        timestamp: new Date()
      });
      
      // Enhanced audit for deletion
      await auditDeletion({
        user: req.user,
        record_id: req.params.recordId,
        patient_id: req.params.id,
        risk_level: req.riskLevel,
        policies_checked: ['risk', 'hipaa', 'authorization']
      });
      
      res.json({ success: true, message: 'Record deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Example 7: Policy-Driven Dynamic Behavior
 * UI features enabled/disabled based on policy
 */
router.get('/user/permissions',
  authMiddleware,
  riskBasedAccess(),
  async (req, res) => {
    try {
      // Query multiple policies to determine UI capabilities
      const policies = await Promise.all([
        queryOPAPolicy('healthcare/authorization', { user: req.user }),
        queryOPAPolicy('healthcare/risk', { user: req.user }),
        queryOPAPolicy('healthcare/jit', { user: req.user })
      ]);
      
      const permissions = {
        can_read: policies[0].result?.allow || false,
        can_write: policies[0].result?.allowed_actions?.includes('write') || false,
        can_delete: policies[0].result?.allowed_actions?.includes('delete') || false,
        can_export: policies[0].result?.allowed_actions?.includes('export') || false,
        requires_mfa: policies[1].result?.requires_mfa || false,
        risk_level: policies[1].result?.risk_level || 'unknown',
        max_session_duration: policies[1].result?.max_session_duration_minutes || 480,
        can_request_jit: policies[2].result?.allow_request || false,
        jit_max_duration: policies[2].result?.max_duration_hours || 4
      };
      
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Helper functions (implement these based on your data layer)
async function getPatientRecords(id) { /* ... */ }
async function getFinancialData(id) { /* ... */ }
async function getPatient(id) { /* ... */ }
async function getPatientPHI(id) { /* ... */ }
async function createJITRequest(data) { /* ... */ }
async function getJITRequest(id) { /* ... */ }
async function getUser(id) { /* ... */ }
async function approveJITRequest(data) { /* ... */ }
async function getRecord(patientId, recordId) { /* ... */ }
async function deleteRecord(patientId, recordId, audit) { /* ... */ }
async function logAccess(data) { /* ... */ }
async function auditPHIAccess(data) { /* ... */ }
async function auditDeletion(data) { /* ... */ }
async function queryOPAPolicy(path, input) { /* ... */ }

function filterFields(data, allowedFields) {
  const filtered = {};
  allowedFields.forEach(field => {
    if (data.hasOwnProperty(field)) {
      filtered[field] = data[field];
    }
  });
  return filtered;
}

function filterToAllowedFields(data, allowedFields) {
  return filterFields(data, allowedFields);
}

export default router;

