const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');

// GET /api/experts - List all experts with pagination, search, filter
router.get('/', expertController.getExperts);

// GET /api/experts/categories - Get all categories
router.get('/categories', expertController.getCategories);

// GET /api/experts/:id - Get expert details
router.get('/:id', expertController.getExpertById);

module.exports = router;
