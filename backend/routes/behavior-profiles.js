import express from 'express';
const router = express.Router();

/**
 * Behavior Profile Management API
 * ===============================
 * 
 * This module provides comprehensive API endpoints for managing user behavior profiles,
 * including profile CRUD operations, analytics, and anomaly detection.
 */

// Mock in-memory storage for profiles (in production, use a proper database)
const behaviorProfiles = new Map();
const profileCache = new Map();

// Helper functions
const generateProfileId = (userId) => `profile_${userId}_${Date.now()}`;
const getCacheKey = (userId, type = 'profile') => `${type}_${userId}`;

/**
 * GET /api/behavior-profiles
 * Get all behavior profiles (admin only)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, role, riskLevel } = req.query;
    
    let profiles = Array.from(behaviorProfiles.values());
    
    // Apply filters
    if (role) {
      profiles = profiles.filter(p => p.role === role);
    }
    if (riskLevel) {
      profiles = profiles.filter(p => p.baseline.riskLevel === riskLevel);
    }
    
    // Apply pagination
    const paginatedProfiles = profiles.slice(offset, offset + parseInt(limit));
    
    res.json({
      profiles: paginatedProfiles,
      total: profiles.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching behavior profiles:', error);
    res.status(500).json({ error: 'Failed to fetch behavior profiles' });
  }
});

/**
 * GET /api/behavior-profiles/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const profiles = Array.from(behaviorProfiles.values());
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      profilesCount: profiles.length,
      cacheSize: profileCache.size,
      memoryUsage: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * GET /api/behavior-profiles/analytics/overview
 * Get system-wide behavior analytics
 */
router.get('/analytics/overview', async (req, res) => {
  try {
    const profiles = Array.from(behaviorProfiles.values());
    
    const analytics = {
      totalProfiles: profiles.length,
      establishedBaselines: profiles.filter(p => p.baseline.established).length,
      riskDistribution: {
        low: profiles.filter(p => p.baseline.riskLevel === 'low').length,
        medium: profiles.filter(p => p.baseline.riskLevel === 'medium').length,
        high: profiles.filter(p => p.baseline.riskLevel === 'high').length
      },
      roleDistribution: profiles.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
      }, {}),
      averageConsistencyScore: profiles.length > 0 ? 
        profiles.reduce((sum, p) => sum + p.peerAnalysis.consistencyScore, 0) / profiles.length : 0,
      totalAnomalies: profiles.reduce((sum, p) => sum + p.currentSession.anomalies.length, 0),
      highRiskUsers: profiles.filter(p => p.currentSession.riskScore > 0.7).length,
      recentActivity: profiles.filter(p => {
        const lastActivity = new Date(p.metadata.lastActivity);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastActivity > oneDayAgo;
      }).length
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/behavior-profiles/:userId
 * Get specific user's behavior profile
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = getCacheKey(userId);
    
    // Check cache first
    if (profileCache.has(cacheKey)) {
      const cachedProfile = profileCache.get(cacheKey);
      if (Date.now() - cachedProfile.timestamp < 300000) { // 5 minutes cache
        return res.json(cachedProfile.data);
      }
    }
    
    // Get profile from storage
    const profile = behaviorProfiles.get(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Cache the result
    profileCache.set(cacheKey, {
      data: profile,
      timestamp: Date.now()
    });
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching behavior profile:', error);
    res.status(500).json({ error: 'Failed to fetch behavior profile' });
  }
});

/**
 * POST /api/behavior-profiles
 * Create or update a behavior profile
 */
router.post('/', async (req, res) => {
  try {
    const profileData = req.body;
    
    if (!profileData.userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const userId = profileData.userId;
    const profileId = generateProfileId(userId);
    
    // Create enhanced profile structure
    const profile = {
      id: profileId,
      userId,
      username: profileData.username,
      role: profileData.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Baseline patterns
      baseline: {
        established: profileData.baseline?.established || false,
        establishedAt: profileData.baseline?.establishedAt || null,
        typicalHours: profileData.baseline?.typicalHours || [],
        averageSessionDuration: profileData.baseline?.averageSessionDuration || 0,
        commonActions: profileData.baseline?.commonActions || [],
        peakActivityHours: profileData.baseline?.peakActivityHours || [],
        riskLevel: profileData.baseline?.riskLevel || 'low'
      },
      
      // Current session metrics
      currentSession: {
        sessionId: profileData.currentSession?.sessionId || null,
        startTime: profileData.currentSession?.startTime || new Date().toISOString(),
        actionCount: profileData.currentSession?.actionCount || 0,
        uniqueActionsCount: profileData.currentSession?.uniqueActionsCount || 0,
        riskScore: profileData.currentSession?.riskScore || 0,
        anomalies: profileData.currentSession?.anomalies || []
      },
      
      // Historical patterns
      patterns: {
        accessPatterns: profileData.patterns?.accessPatterns || [],
        temporalPatterns: profileData.patterns?.temporalPatterns || [],
        interactionPatterns: profileData.patterns?.interactionPatterns || [],
        riskTrends: profileData.patterns?.riskTrends || []
      },
      
      // Peer analysis
      peerAnalysis: {
        roleGroup: profileData.peerAnalysis?.roleGroup || profileData.role,
        consistencyScore: profileData.peerAnalysis?.consistencyScore || 1.0,
        outlierScore: profileData.peerAnalysis?.outlierScore || 0.0,
        riskRanking: profileData.peerAnalysis?.riskRanking || 50
      },
      
      // Metadata
      metadata: {
        dataPoints: profileData.metadata?.dataPoints || 0,
        lastActivity: new Date().toISOString(),
        version: '2.0'
      }
    };
    
    // Store profile
    behaviorProfiles.set(userId, profile);
    
    // Clear cache
    const cacheKey = getCacheKey(userId);
    profileCache.delete(cacheKey);
    
    res.status(201).json({
      message: 'Behavior profile created/updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error creating behavior profile:', error);
    res.status(500).json({ error: 'Failed to create behavior profile' });
  }
});

/**
 * PUT /api/behavior-profiles/:userId
 * Update specific user's behavior profile
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const existingProfile = behaviorProfiles.get(userId);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Merge updates with existing profile
    const updatedProfile = {
      ...existingProfile,
      ...updateData,
      userId, // Ensure userId doesn't change
      updatedAt: new Date().toISOString(),
      
      // Deep merge nested objects
      baseline: { ...existingProfile.baseline, ...updateData.baseline },
      currentSession: { ...existingProfile.currentSession, ...updateData.currentSession },
      patterns: { ...existingProfile.patterns, ...updateData.patterns },
      peerAnalysis: { ...existingProfile.peerAnalysis, ...updateData.peerAnalysis },
      metadata: { ...existingProfile.metadata, ...updateData.metadata }
    };
    
    behaviorProfiles.set(userId, updatedProfile);
    
    // Clear cache
    const cacheKey = getCacheKey(userId);
    profileCache.delete(cacheKey);
    
    res.json({
      message: 'Behavior profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating behavior profile:', error);
    res.status(500).json({ error: 'Failed to update behavior profile' });
  }
});

/**
 * DELETE /api/behavior-profiles/:userId
 * Delete a behavior profile
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!behaviorProfiles.has(userId)) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    behaviorProfiles.delete(userId);
    
    // Clear cache
    const cacheKey = getCacheKey(userId);
    profileCache.delete(cacheKey);
    
    res.json({ message: 'Behavior profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting behavior profile:', error);
    res.status(500).json({ error: 'Failed to delete behavior profile' });
  }
});

/**
 * GET /api/behavior-profiles/:userId/summary
 * Get profile summary with key metrics
 */
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = behaviorProfiles.get(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const summary = {
      userId,
      username: profile.username,
      role: profile.role,
      riskScore: profile.currentSession.riskScore,
      riskLevel: profile.baseline.riskLevel,
      consistencyScore: profile.peerAnalysis.consistencyScore,
      anomalyCount: profile.currentSession.anomalies.length,
      sessionDuration: profile.currentSession.startTime ? 
        Math.round((new Date() - new Date(profile.currentSession.startTime)) / (1000 * 60)) : 0,
      baselineEstablished: profile.baseline.established,
      lastActivity: profile.metadata.lastActivity,
      dataPoints: profile.metadata.dataPoints
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching profile summary:', error);
    res.status(500).json({ error: 'Failed to fetch profile summary' });
  }
});

/**
 * GET /api/behavior-profiles/:userId/anomalies
 * Get anomalies for a specific user
 */
router.get('/:userId/anomalies', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, severity } = req.query;
    
    const profile = behaviorProfiles.get(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    let anomalies = profile.currentSession.anomalies || [];
    
    // Filter by severity if specified
    if (severity) {
      anomalies = anomalies.filter(a => a.severity === severity);
    }
    
    // Sort by timestamp (newest first) and limit
    anomalies = anomalies
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));
    
    res.json({
      userId,
      anomalies,
      count: anomalies.length,
      totalAnomalies: profile.currentSession.anomalies.length
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

/**
 * POST /api/behavior-profiles/:userId/anomalies
 * Add new anomaly to user profile
 */
router.post('/:userId/anomalies', async (req, res) => {
  try {
    const { userId } = req.params;
    const anomalyData = req.body;
    
    const profile = behaviorProfiles.get(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const anomaly = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: anomalyData.type || 'general',
      severity: anomalyData.severity || 'low',
      description: anomalyData.description || 'Anomaly detected',
      confidence: anomalyData.confidence || 0.5,
      context: anomalyData.context || {},
      ...anomalyData
    };
    
    profile.currentSession.anomalies.push(anomaly);
    profile.updatedAt = new Date().toISOString();
    
    behaviorProfiles.set(userId, profile);
    
    // Clear cache
    const cacheKey = getCacheKey(userId);
    profileCache.delete(cacheKey);
    
    res.status(201).json({
      message: 'Anomaly added successfully',
      anomaly
    });
  } catch (error) {
    console.error('Error adding anomaly:', error);
    res.status(500).json({ error: 'Failed to add anomaly' });
  }
});

/**
 * GET /api/behavior-profiles/export/:userId
 * Export user behavior profile
 */
router.get('/export/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;
    
    const profile = behaviorProfiles.get(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      profile
    };
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="behavior_profile_${userId}_${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting profile:', error);
    res.status(500).json({ error: 'Failed to export profile' });
  }
});

/**
 * POST /api/behavior-profiles/import
 * Import behavior profile from file
 */
router.post('/import', async (req, res) => {
  try {
    const importData = req.body;
    
    if (!importData.profile || !importData.profile.userId) {
      return res.status(400).json({ error: 'Invalid import data' });
    }
    
    const profile = importData.profile;
    profile.updatedAt = new Date().toISOString();
    profile.metadata.importedAt = new Date().toISOString();
    
    behaviorProfiles.set(profile.userId, profile);
    
    // Clear cache
    const cacheKey = getCacheKey(profile.userId);
    profileCache.delete(cacheKey);
    
    res.status(201).json({
      message: 'Profile imported successfully',
      userId: profile.userId
    });
  } catch (error) {
    console.error('Error importing profile:', error);
    res.status(500).json({ error: 'Failed to import profile' });
  }
});

export default router;
