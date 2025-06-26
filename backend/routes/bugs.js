import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Bug from '../models/Bug.js';
import User from '../models/User.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const createBugValidation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and cannot exceed 200 characters')
    .trim(),
  body('description')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and cannot exceed 2000 characters')
    .trim(),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('category')
    .isIn(['ui', 'backend', 'database', 'performance', 'security', 'feature', 'other'])
    .withMessage('Invalid category'),
  body('project')
    .isLength({ min: 1 })
    .withMessage('Project is required')
    .trim(),
  body('stepsToReproduce')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Steps to reproduce cannot exceed 1000 characters')
    .trim(),
  body('expectedBehavior')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Expected behavior cannot exceed 500 characters')
    .trim(),
  body('actualBehavior')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Actual behavior cannot exceed 500 characters')
    .trim()
];

const updateBugValidation = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title cannot exceed 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description cannot exceed 2000 characters')
    .trim(),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'reopened'])
    .withMessage('Invalid status'),
  body('category')
    .optional()
    .isIn(['ui', 'backend', 'database', 'performance', 'security', 'feature', 'other'])
    .withMessage('Invalid category'),
  body('resolution')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution cannot exceed 1000 characters')
    .trim()
];

const addCommentValidation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and cannot exceed 1000 characters')
    .trim()
];

// @route   GET /api/bugs
// @desc    Get all bugs with filtering and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      severity,
      priority,
      category,
      project,
      assignedTo,
      reportedBy,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (project) filter.project = { $regex: project, $options: 'i' };
    if (assignedTo) filter.assignedTo = assignedTo;
    if (reportedBy) filter.reportedBy = reportedBy;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get bugs with pagination
    const bugs = await Bug.find(filter)
      .populate('reportedBy', 'username firstName lastName email role')
      .populate('assignedTo', 'username firstName lastName email role')
      .populate('comments.author', 'username firstName lastName')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Bug.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      status: 'success',
      data: {
        bugs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBugs: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/bugs/:id
// @desc    Get a single bug by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reportedBy', 'username firstName lastName email role avatar')
      .populate('assignedTo', 'username firstName lastName email role avatar')
      .populate('resolvedBy', 'username firstName lastName email role')
      .populate('comments.author', 'username firstName lastName avatar');

    if (!bug) {
      return res.status(404).json({
        status: 'error',
        message: 'Bug not found'
      });
    }

    res.json({
      status: 'success',
      data: { bug }
    });
  } catch (error) {
    console.error('Get bug error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/bugs
// @desc    Create a new bug
// @access  Private
router.post('/', createBugValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bugData = {
      ...req.body,
      reportedBy: req.user._id
    };

    const bug = new Bug(bugData);
    await bug.save();

    // Populate the created bug
    await bug.populate('reportedBy', 'username firstName lastName email role');

    res.status(201).json({
      status: 'success',
      message: 'Bug created successfully',
      data: { bug }
    });
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/bugs/:id
// @desc    Update a bug
// @access  Private
router.put('/:id', updateBugValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        status: 'error',
        message: 'Bug not found'
      });
    }

    // Check permissions - only bug reporter, assignee, or admin/project_manager can update
    const canUpdate = 
      bug.reportedBy.toString() === req.user._id.toString() ||
      (bug.assignedTo && bug.assignedTo.toString() === req.user._id.toString()) ||
      ['admin', 'project_manager'].includes(req.user.role);

    if (!canUpdate) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this bug'
      });
    }

    // Handle status change to resolved
    if (req.body.status === 'resolved' && bug.status !== 'resolved') {
      req.body.resolvedBy = req.user._id;
      req.body.resolvedAt = new Date();
    }

    // Update bug
    Object.assign(bug, req.body);
    await bug.save();

    // Populate and return updated bug
    await bug.populate([
      { path: 'reportedBy', select: 'username firstName lastName email role' },
      { path: 'assignedTo', select: 'username firstName lastName email role' },
      { path: 'resolvedBy', select: 'username firstName lastName email role' }
    ]);

    res.json({
      status: 'success',
      message: 'Bug updated successfully',
      data: { bug }
    });
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/bugs/:id
// @desc    Delete a bug
// @access  Private (Admin/Project Manager only)
router.delete('/:id', authorize('admin', 'project_manager'), async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        status: 'error',
        message: 'Bug not found'
      });
    }

    await Bug.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/bugs/:id/comments
// @desc    Add a comment to a bug
// @access  Private
router.post('/:id/comments', addCommentValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        status: 'error',
        message: 'Bug not found'
      });
    }

    const comment = {
      author: req.user._id,
      content: req.body.content,
      createdAt: new Date()
    };

    bug.comments.push(comment);
    await bug.save();

    // Populate the new comment
    const updatedBug = await Bug.findById(req.params.id)
      .populate('comments.author', 'username firstName lastName avatar');
    
    const newComment = updatedBug.comments[updatedBug.comments.length - 1];

    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: { comment: newComment }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/bugs/stats/overview
// @desc    Get bug statistics overview
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Bug.aggregate([
      {
        $group: {
          _id: null,
          totalBugs: { $sum: 1 },
          openBugs: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          inProgressBugs: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          resolvedBugs: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          criticalBugs: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          highPriorityBugs: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    const overview = stats[0] || {
      totalBugs: 0,
      openBugs: 0,
      inProgressBugs: 0,
      resolvedBugs: 0,
      criticalBugs: 0,
      highPriorityBugs: 0
    };

    res.json({
      status: 'success',
      data: { overview }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

export default router;
