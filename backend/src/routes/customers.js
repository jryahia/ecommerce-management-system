const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all customers
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
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
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const query_text = `
      SELECT *
      FROM customers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);
    const result = await db.query(query_text, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      customers: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single customer
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = result.rows[0];

    // Get customer orders
    const ordersResult = await db.query(`
      SELECT id, order_number, status, total_amount, created_at
      FROM orders 
      WHERE customer_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [req.params.id]);

    customer.recentOrders = ordersResult.rows;

    res.json(customer);
  } catch (error) {
    logger.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create customer
router.post('/', auth, authorize('admin', 'manager'), [
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName, lastName, email, phone, dateOfBirth,
      gender, addresses, notes
    } = req.body;

    // Check if email already exists
    if (email) {
      const existingCustomer = await db.query('SELECT id FROM customers WHERE email = $1', [email]);
      if (existingCustomer.rows.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const result = await db.query(`
      INSERT INTO customers (
        first_name, last_name, email, phone, date_of_birth,
        gender, addresses, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      firstName, lastName, email, phone, dateOfBirth,
      gender, JSON.stringify(addresses || []), notes
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customer
router.put('/:id', auth, authorize('admin', 'manager'), [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.params.id;
    const updates = req.body;

    // Check if email already exists (excluding current customer)
    if (updates.email) {
      const existingCustomer = await db.query(
        'SELECT id FROM customers WHERE email = $1 AND id != $2',
        [updates.email, customerId]
      );
      if (existingCustomer.rows.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Whitelist of allowed customer fields
    const ALLOWED_FIELDS = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      addresses: 'addresses',
      notes: 'notes',
      isActive: 'is_active',
    };

    // Build dynamic update query using WHITELISTED fields only
    const setClause = [];
    const params = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      const dbColumn = ALLOWED_FIELDS[key];
      if (!dbColumn) continue; // Skip unknown fields

      paramCount++;
      setClause.push(`${dbColumn} = $${paramCount}`);

      if (key === 'addresses') {
        params.push(JSON.stringify(value));
      } else {
        params.push(value);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    paramCount++;
    params.push(customerId);

    const result = await db.query(`
      UPDATE customers 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    // Check if customer has orders
    const ordersResult = await db.query('SELECT COUNT(*) FROM orders WHERE customer_id = $1', [req.params.id]);
    const orderCount = parseInt(ordersResult.rows[0].count);

    if (orderCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with existing orders. Consider deactivating instead.' 
      });
    }

    const result = await db.query('DELETE FROM customers WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    logger.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const customerId = req.params.id;

    // Get customer stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as average_order_value,
        MAX(o.created_at) as last_order_date
      FROM orders o
      WHERE o.customer_id = $1 AND o.status != 'cancelled'
    `, [customerId]);

    // Get monthly spending
    const monthlySpendingResult = await db.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(total_amount) as total
      FROM orders
      WHERE customer_id = $1 AND status != 'cancelled'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `, [customerId]);

    // Get favorite products
    const favoriteProductsResult = await db.query(`
      SELECT 
        p.name,
        p.sku,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_spent
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.customer_id = $1 AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity DESC
      LIMIT 5
    `, [customerId]);

    res.json({
      stats: statsResult.rows[0],
      monthlySpending: monthlySpendingResult.rows,
      favoriteProducts: favoriteProductsResult.rows
    });
  } catch (error) {
    logger.error('Get customer analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;