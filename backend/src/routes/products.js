const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Whitelist of allowed product fields for dynamic updates
const ALLOWED_PRODUCT_FIELDS = {
  name: 'name',
  nameAr: 'name_ar',
  description: 'description',
  descriptionAr: 'description_ar',
  sku: 'sku',
  barcode: 'barcode',
  categoryId: 'category_id',
  price: 'price',
  costPrice: 'cost_price',
  stockQuantity: 'stock_quantity',
  minStockLevel: 'min_stock_level',
  weight: 'weight',
  dimensions: 'dimensions',
  images: 'images',
  isActive: 'is_active',
  isFeatured: 'is_featured',
  tags: 'tags',
  metaTitle: 'meta_title',
  metaDescription: 'meta_description',
};

// Get all products with pagination and filters (auth required for management system)
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('category').optional().isUUID(),
  query('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, category, status } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND p.category_id = $${paramCount}`;
      params.push(category);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND p.is_active = $${paramCount}`;
      params.push(status === 'active');
    }

    const query_text = `
      SELECT 
        p.*,
        c.name as category_name,
        c.name_ar as category_name_ar
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    const result = await db.query(query_text, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.name_ar as category_name_ar
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product
router.post('/', auth, authorize('admin', 'manager'), [
  body('name').trim().isLength({ min: 1 }),
  body('sku').trim().isLength({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('categoryId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, nameAr, description, descriptionAr, sku, barcode,
      categoryId, price, costPrice, stockQuantity, minStockLevel,
      weight, dimensions, images, tags, metaTitle, metaDescription
    } = req.body;

    // Check if SKU already exists
    const existingSku = await db.query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existingSku.rows.length > 0) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const result = await db.query(`
      INSERT INTO products (
        name, name_ar, description, description_ar, sku, barcode,
        category_id, price, cost_price, stock_quantity, min_stock_level,
        weight, dimensions, images, tags, meta_title, meta_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      name, nameAr || null, description || null, descriptionAr || null, sku, barcode || null,
      categoryId || null, price, costPrice || 0, stockQuantity || 0, minStockLevel || 0,
      weight || null, JSON.stringify(dimensions || null), JSON.stringify(images || []),
      tags || null, metaTitle || null, metaDescription || null
    ]);

    // Log inventory transaction if stock quantity > 0
    if (stockQuantity > 0) {
      await db.query(`
        INSERT INTO inventory_transactions (product_id, type, quantity, reference_type, created_by)
        VALUES ($1, 'in', $2, 'initial_stock', $3)
      `, [result.rows[0].id, stockQuantity, req.user.id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product — uses whitelist to prevent SQL injection via field names
router.put('/:id', auth, authorize('admin', 'manager'), [
  body('name').optional().trim().isLength({ min: 1 }),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productId = req.params.id;
    const updates = req.body;

    // Build dynamic update query using WHITELISTED fields only
    const setClause = [];
    const params = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      const dbColumn = ALLOWED_PRODUCT_FIELDS[key];
      if (!dbColumn) continue; // Skip unknown fields

      paramCount++;
      setClause.push(`${dbColumn} = $${paramCount}`);

      if (key === 'dimensions' || key === 'images') {
        params.push(JSON.stringify(value));
      } else {
        params.push(value);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    paramCount++;
    params.push(productId);

    const result = await db.query(`
      UPDATE products 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product — check for FK references first
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    // Check if product has order items
    const orderItemsCheck = await db.query(
      'SELECT COUNT(*) FROM order_items WHERE product_id = $1',
      [req.params.id]
    );
    if (parseInt(orderItemsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete product with existing orders. Consider deactivating instead.'
      });
    }

    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stock
router.patch('/:id/stock', auth, authorize('admin', 'manager'), [
  body('quantity').isInt(),
  body('type').isIn(['in', 'out', 'adjustment']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity, type, notes } = req.body;
    const productId = req.params.id;

    // Get current stock
    const productResult = await db.query('SELECT stock_quantity FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const currentStock = productResult.rows[0].stock_quantity;
    let newStock;

    switch (type) {
      case 'in':
        newStock = currentStock + quantity;
        break;
      case 'out':
        if (currentStock < quantity) {
          return res.status(400).json({ message: 'Insufficient stock for this operation' });
        }
        newStock = currentStock - quantity;
        break;
      case 'adjustment':
        newStock = quantity;
        break;
      default:
        return res.status(400).json({ message: 'Invalid stock operation type' });
    }

    // Update stock
    await db.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [newStock, productId]);

    // Log transaction
    await db.query(`
      INSERT INTO inventory_transactions (product_id, type, quantity, notes, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [productId, type, type === 'adjustment' ? quantity - currentStock : quantity, notes, req.user.id]);

    res.json({ message: 'Stock updated successfully', newStock });
  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
