const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all orders
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
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
    const { status, search } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (o.order_number ILIKE $${paramCount} OR c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const query_text = `
      SELECT 
        o.*,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email as customer_email,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, c.first_name, c.last_name, c.email
      ORDER BY o.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);
    const result = await db.query(query_text, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT o.id) 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order with items
router.get('/:id', auth, async (req, res) => {
  try {
    const orderResult = await db.query(`
      SELECT 
        o.*,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [req.params.id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await db.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku,
        p.images as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [req.params.id]);

    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create order — wrapped in a database transaction
router.post('/', auth, [
  body('customerId').isUUID(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('shippingAddress').isObject()
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      client.release();
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, items, shippingAddress, billingAddress, notes, paymentMethod } = req.body;

    await client.query('BEGIN');

    // Verify customer exists
    const customerCheck = await client.query('SELECT id FROM customers WHERE id = $1', [customerId]);
    if (customerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Validate products & calculate totals (lock rows to prevent race conditions)
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, price, stock_quantity, name FROM products WHERE id = $1 FOR UPDATE',
        [item.productId]
      );
      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      const product = productResult.rows[0];
      if (product.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    const taxAmount = subtotal * 0.1; // 10% tax
    const shippingAmount = 10; // Fixed shipping
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (
        order_number, customer_id, subtotal, tax_amount, 
        shipping_amount, total_amount, shipping_address, 
        billing_address, notes, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      orderNumber, customerId, subtotal, taxAmount,
      shippingAmount, totalAmount, JSON.stringify(shippingAddress),
      JSON.stringify(billingAddress || shippingAddress), notes, paymentMethod
    ]);

    const order = orderResult.rows[0];

    // Create order items and update stock
    for (const item of orderItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [order.id, item.productId, item.quantity, item.unitPrice, item.totalPrice]);

      // Update product stock
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );

      // Log inventory transaction
      await client.query(`
        INSERT INTO inventory_transactions (product_id, type, quantity, reference_type, reference_id, created_by)
        VALUES ($1, 'out', $2, 'order', $3, $4)
      `, [item.productId, item.quantity, order.id, req.user.id]);
    }

    // Update customer stats
    await client.query(`
      UPDATE customers 
      SET total_orders = total_orders + 1, 
          total_spent = total_spent + $1,
          last_order_date = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [totalAmount, customerId]);

    await client.query('COMMIT');
    client.release();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('new-order', { orderId: order.id, orderNumber });
    }

    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    logger.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status — with stock restoration on cancellation
router.patch('/:id/status', auth, authorize('admin', 'manager'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      client.release();
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const orderId = req.params.id;

    await client.query('BEGIN');

    // Get current order
    const currentOrder = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (currentOrder.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = currentOrder.rows[0];

    // Prevent invalid transitions
    if (order.status === 'cancelled' || order.status === 'refunded') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: `Cannot change status of a ${order.status} order` });
    }

    // Build update
    const updateFields = ['status = $1'];
    const updateValues = [status];
    let paramIdx = 2;

    if (status === 'shipped') {
      updateFields.push(`shipped_at = $${paramIdx++}`);
      updateValues.push(new Date());
    } else if (status === 'delivered') {
      updateFields.push(`delivered_at = $${paramIdx++}`);
      updateValues.push(new Date());
    }

    updateValues.push(orderId);

    const result = await client.query(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIdx}
      RETURNING *
    `, updateValues);

    // Restore stock on cancellation
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of items.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
        await client.query(`
          INSERT INTO inventory_transactions (product_id, type, quantity, reference_type, reference_id, notes, created_by)
          VALUES ($1, 'in', $2, 'order_cancellation', $3, 'Stock restored from cancelled order', $4)
        `, [item.product_id, item.quantity, orderId, req.user.id]);
      }

      // Revert customer stats
      await client.query(`
        UPDATE customers 
        SET total_orders = GREATEST(total_orders - 1, 0), 
            total_spent = GREATEST(total_spent - $1, 0)
        WHERE id = $2
      `, [order.total_amount, order.customer_id]);
    }

    await client.query('COMMIT');
    client.release();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('order-status-updated', { orderId, status });
    }

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    logger.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
