import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bug title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Bug description is required'],
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  stepsToReproduce: {
    type: String,
    trim: true,
    maxLength: [1000, 'Steps to reproduce cannot exceed 1000 characters']
  },
  expectedBehavior: {
    type: String,
    trim: true,
    maxLength: [500, 'Expected behavior cannot exceed 500 characters']
  },
  actualBehavior: {
    type: String,
    trim: true,
    maxLength: [500, 'Actual behavior cannot exceed 500 characters']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened'],
    default: 'open',
    required: true
  },
  category: {
    type: String,
    enum: ['ui', 'backend', 'database', 'performance', 'security', 'feature', 'other'],
    default: 'other',
    required: true
  },
  environment: {
    browser: {
      type: String,
      trim: true
    },
    os: {
      type: String,
      trim: true
    },
    version: {
      type: String,
      trim: true
    }
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  project: {
    type: String,
    required: [true, 'Project is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: [30, 'Tag cannot exceed 30 characters']
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    type: String,
    trim: true,
    maxLength: [1000, 'Resolution cannot exceed 1000 characters']
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedTime: {
    type: Number, // in hours
    min: 0
  },
  actualTime: {
    type: Number, // in hours
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
bugSchema.index({ reportedBy: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ status: 1 });
bugSchema.index({ severity: 1 });
bugSchema.index({ priority: 1 });
bugSchema.index({ project: 1 });
bugSchema.index({ createdAt: -1 });

// Virtual for bug age in days
bugSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for time to resolution
bugSchema.virtual('timeToResolution').get(function() {
  if (this.resolvedAt) {
    return Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60 * 60)); // in hours
  }
  return null;
});

// Pre-save middleware to set resolvedAt when status changes to resolved
bugSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status !== 'resolved') {
      this.resolvedAt = null;
      this.resolvedBy = null;
    }
  }
  next();
});

// Ensure virtual fields are serialized
bugSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Bug = mongoose.model('Bug', bugSchema);

export default Bug;
