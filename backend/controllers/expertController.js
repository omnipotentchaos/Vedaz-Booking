const Expert = require('../models/Expert');

/**
 * GET /api/experts
 * List experts with pagination, search, and category filter
 */
exports.getExperts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 6,
      search = '',
      category = ''
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    const [experts, total] = await Promise.all([
      Expert.find(filter)
        .select('-availability')
        .sort({ rating: -1, experience: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Expert.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: experts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalExperts: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/experts/categories
 * Get all unique categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Expert.distinct('category');
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * GET /api/experts/:id
 * Get expert details including availability
 */
exports.getExpertById = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id).lean();

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: expert
    });
  } catch (error) {
    console.error('Error fetching expert:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expert ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
