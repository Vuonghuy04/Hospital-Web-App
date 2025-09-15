import express from 'express';

const router = express.Router();

// Helper function to get PostgreSQL client
const getClient = async (pool) => {
  return await pool.connect();
};

// Create JIT requests table if it doesn't exist
const createJITTable = async (client) => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS jit_requests (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(255) UNIQUE NOT NULL,
        requester_id VARCHAR(255) NOT NULL,
        requester_username VARCHAR(255) NOT NULL,
        requester_role VARCHAR(255) NOT NULL,
        resource_type VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        access_level VARCHAR(50) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        approver_id VARCHAR(255),
        approver_username VARCHAR(255),
        approved_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_jit_requests_requester 
      ON jit_requests(requester_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_jit_requests_status 
      ON jit_requests(status)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_jit_requests_approver 
      ON jit_requests(approver_id)
    `);

    console.log("✅ JIT requests table created/verified");
  } catch (error) {
    console.error("❌ Error creating JIT table:", error);
    throw error;
  }
};

// Create policy violations table
const createPolicyViolationsTable = async (client) => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS policy_violations (
        id SERIAL PRIMARY KEY,
        violation_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        user_role VARCHAR(255) NOT NULL,
        violation_type VARCHAR(255) NOT NULL,
        resource_type VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        action_attempted VARCHAR(255) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        resolved_by VARCHAR(255),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_policy_violations_user 
      ON policy_violations(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_policy_violations_severity 
      ON policy_violations(severity)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_policy_violations_status 
      ON policy_violations(status)
    `);

    console.log("✅ Policy violations table created/verified");
  } catch (error) {
    console.error("❌ Error creating policy violations table:", error);
    throw error;
  }
};

// Initialize tables on first request
let tablesInitialized = false;
const initializeTables = async (req) => {
  if (!tablesInitialized) {
    const client = await getClient(req.app.locals.pool);
    try {
      await createJITTable(client);
      await createPolicyViolationsTable(client);
      tablesInitialized = true;
    } finally {
      client.release();
    }
  }
};

// POST / - Create a new JIT request
router.post('/', async (req, res) => {
  try {
    await initializeTables(req);
    
    const {
      resourceType,
      resourceId,
      accessLevel,
      reason,
      requesterId,
      requesterUsername,
      requesterRole
    } = req.body;

    // Validate required fields
    if (!resourceType || !resourceId || !accessLevel || !reason || !requesterId || !requesterUsername || !requesterRole) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['resourceType', 'resourceId', 'accessLevel', 'reason', 'requesterId', 'requesterUsername', 'requesterRole']
      });
    }

    const client = await getClient(req.app.locals.pool);
    
    try {
      // Generate unique request ID
      const requestId = `jit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate expiration time (default 2 hours)
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      // Insert JIT request
      const query = `
        INSERT INTO jit_requests (
          request_id, requester_id, requester_username, requester_role,
          resource_type, resource_id, access_level, reason, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        requestId, requesterId, requesterUsername, requesterRole,
        resourceType, resourceId, accessLevel, reason, expiresAt
      ];

      const result = await client.query(query, values);
      const jitRequest = result.rows[0];

      // Auto-approve based on role and resource type
      let autoApproved = false;
      let approvalReason = '';

      // Check if auto-approval is possible
      if (requesterRole === 'manager' || requesterRole === 'admin') {
        autoApproved = true;
        approvalReason = 'Auto-approved: Manager/Admin role';
      } else if (requesterRole === 'doctor' && resourceType === 'patient_record') {
        autoApproved = true;
        approvalReason = 'Auto-approved: Doctor accessing patient records';
      } else if (requesterRole === 'nurse' && resourceType === 'patient_record' && accessLevel === 'read') {
        autoApproved = true;
        approvalReason = 'Auto-approved: Nurse read access to patient records';
      }

      if (autoApproved) {
        // Update request as approved
        await client.query(`
          UPDATE jit_requests 
          SET status = 'approved', 
              approver_id = 'system',
              approver_username = 'system',
              approved_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [jitRequest.id]);

        jitRequest.status = 'approved';
        jitRequest.approver_id = 'system';
        jitRequest.approver_username = 'system';
        jitRequest.approved_at = new Date().toISOString();
      }

      res.status(201).json({
        success: true,
        data: jitRequest,
        autoApproved,
        approvalReason
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating JIT request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create JIT request',
      message: error.message
    });
  }
});

// GET / - Get JIT requests
router.get('/', async (req, res) => {
  try {
    await initializeTables(req);
    
    const { 
      requesterId, 
      status, 
      approverId,
      limit = 50, 
      offset = 0 
    } = req.query;

    const client = await getClient(req.app.locals.pool);
    
    try {
      let whereClause = '';
      const values = [];
      let paramCount = 0;

      if (requesterId) {
        whereClause += ` AND requester_id = $${++paramCount}`;
        values.push(requesterId);
      }
      
      if (status) {
        whereClause += ` AND status = $${++paramCount}`;
        values.push(status);
      }
      
      if (approverId) {
        whereClause += ` AND approver_id = $${++paramCount}`;
        values.push(approverId);
      }

      const query = `
        SELECT * FROM jit_requests 
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;
      values.push(parseInt(limit), parseInt(offset));

      const result = await client.query(query, values);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM jit_requests WHERE 1=1 ${whereClause}`;
      const countResult = await client.query(countQuery, values.slice(0, -2));
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount,
          hasMore: totalCount > (parseInt(offset) + parseInt(limit))
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error retrieving JIT requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve JIT requests',
      message: error.message
    });
  }
});

// PUT /:requestId/approve - Approve a JIT request
router.put('/:requestId/approve', async (req, res) => {
  try {
    await initializeTables(req);
    
    const { requestId } = req.params;
    const { approverId, approverUsername } = req.body;

    if (!approverId || !approverUsername) {
      return res.status(400).json({
        success: false,
        error: 'Approver information required'
      });
    }

    const client = await getClient(req.app.locals.pool);
    
    try {
      // Update request as approved
      const query = `
        UPDATE jit_requests 
        SET status = 'approved',
            approver_id = $1,
            approver_username = $2,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE request_id = $3 AND status = 'pending'
        RETURNING *
      `;

      const result = await client.query(query, [approverId, approverUsername, requestId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'JIT request not found or already processed'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error approving JIT request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve JIT request',
      message: error.message
    });
  }
});

// PUT /:requestId/reject - Reject a JIT request
router.put('/:requestId/reject', async (req, res) => {
  try {
    await initializeTables(req);
    
    const { requestId } = req.params;
    const { approverId, approverUsername, reason } = req.body;

    if (!approverId || !approverUsername) {
      return res.status(400).json({
        success: false,
        error: 'Approver information required'
      });
    }

    const client = await getClient(req.app.locals.pool);
    
    try {
      // Update request as rejected
      const query = `
        UPDATE jit_requests 
        SET status = 'rejected',
            approver_id = $1,
            approver_username = $2,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP,
            metadata = metadata || $4
        WHERE request_id = $3 AND status = 'pending'
        RETURNING *
      `;

      const metadata = reason ? { rejectionReason: reason } : {};

      const result = await client.query(query, [approverId, approverUsername, requestId, JSON.stringify(metadata)]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'JIT request not found or already processed'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error rejecting JIT request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject JIT request',
      message: error.message
    });
  }
});

// POST /violations - Create a policy violation
router.post('/violations', async (req, res) => {
  try {
    await initializeTables(req);
    
    const {
      userId,
      username,
      userRole,
      violationType,
      resourceType,
      resourceId,
      actionAttempted,
      reason,
      severity = 'medium'
    } = req.body;

    // Validate required fields
    if (!userId || !username || !userRole || !violationType || !resourceType || !actionAttempted) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['userId', 'username', 'userRole', 'violationType', 'resourceType', 'actionAttempted']
      });
    }

    const client = await getClient(req.app.locals.pool);
    
    try {
      // Generate unique violation ID
      const violationId = `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert policy violation
      const query = `
        INSERT INTO policy_violations (
          violation_id, user_id, username, user_role,
          violation_type, resource_type, resource_id,
          action_attempted, reason, severity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        violationId, userId, username, userRole,
        violationType, resourceType, resourceId,
        actionAttempted, reason || 'Policy violation detected', severity
      ];

      const result = await client.query(query, values);

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating policy violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create policy violation',
      message: error.message
    });
  }
});

// GET /violations - Get policy violations
router.get('/violations', async (req, res) => {
  try {
    await initializeTables(req);
    
    const { 
      status, 
      severity,
      limit = 50, 
      offset = 0 
    } = req.query;

    const client = await getClient(req.app.locals.pool);
    
    try {
      let whereClause = '';
      const values = [];
      let paramCount = 0;

      if (status) {
        whereClause += ` AND status = $${++paramCount}`;
        values.push(status);
      }
      
      if (severity) {
        whereClause += ` AND severity = $${++paramCount}`;
        values.push(severity);
      }

      const query = `
        SELECT * FROM policy_violations 
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;
      values.push(parseInt(limit), parseInt(offset));

      const result = await client.query(query, values);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM policy_violations WHERE 1=1 ${whereClause}`;
      const countResult = await client.query(countQuery, values.slice(0, -2));
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount,
          hasMore: totalCount > (parseInt(offset) + parseInt(limit))
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error retrieving policy violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve policy violations',
      message: error.message
    });
  }
});

// PUT /violations/:violationId/resolve - Resolve a policy violation
router.put('/violations/:violationId/resolve', async (req, res) => {
  try {
    await initializeTables(req);
    
    const { violationId } = req.params;
    const { resolvedBy } = req.body;

    if (!resolvedBy) {
      return res.status(400).json({
        success: false,
        error: 'Resolver information required'
      });
    }

    const client = await getClient(req.app.locals.pool);
    
    try {
      // Update violation as resolved
      const query = `
        UPDATE policy_violations 
        SET status = 'resolved',
            resolved_by = $1,
            resolved_at = CURRENT_TIMESTAMP
        WHERE violation_id = $2 AND status = 'open'
        RETURNING *
      `;

      const result = await client.query(query, [resolvedBy, violationId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Policy violation not found or already resolved'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error resolving policy violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve policy violation',
      message: error.message
    });
  }
});

export default router;
