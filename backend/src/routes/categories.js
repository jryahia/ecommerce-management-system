const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, name_ar, parent_id FROM categories ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
