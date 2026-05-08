const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// GET / — list all users (admin only, paginated)
router.get('/', auth, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /:id — get user by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role, is_active, phone, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /:id — update user (admin only)
router.put('/:id', auth, authorize('admin'), [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['admin', 'manager', 'user']),
  body('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ALLOWED_FIELDS = {
      firstName: 'first_name',
      lastName: 'last_name',
      role: 'role',
      isActive: 'is_active',
      phone: 'phone',
    };

    const setClause = [];
    const params = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(req.body)) {
      if (value === undefined) continue;
      const dbColumn = ALLOWED_FIELDS[key];
      if (!dbColumn) continue;
      paramCount++;
      setClause.push(`${dbColumn} = $${paramCount}`);
      params.push(value);
    }

    if (setClause.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    paramCount++;
    params.push(req.params.id);

    const result = await db.query(
      `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /:id — deactivate user (admin only, soft delete)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const result = await db.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, email, is_active',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully', user: result.rows[0] });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
