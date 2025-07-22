import mongoose from 'mongoose';

const behaviorSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    default: ''
  },
  roles: [{
    type: String
  }],
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  sessionPeriod: {
    type: Number,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  metadata: {
    realm: {
      type: String,
      default: 'demo'
    },
    clientId: {
      type: String,
      default: 'demo-client'
    },
    tokenType: {
      type: String,
      default: 'Bearer'
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'user_behavior' // Explicitly set collection name
});

// Create indexes for better query performance
behaviorSchema.index({ username: 1, timestamp: -1 });
behaviorSchema.index({ riskLevel: 1, timestamp: -1 });
behaviorSchema.index({ sessionId: 1 });

const Behavior = mongoose.model('Behavior', behaviorSchema);

export default Behavior; 