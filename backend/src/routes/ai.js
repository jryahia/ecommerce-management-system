const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Optional API key auth — checks X-API-Key header if AI_API_KEY env var is set,
// otherwise falls back to standard JWT authentication
const aiAuth = (req, res, next) => {
  const aiApiKey = process.env.AI_API_KEY;
  if (aiApiKey) {
    const providedKey = req.header('X-API-Key');
    if (providedKey === aiApiKey) {
      req.user = { id: 'api-key', role: 'admin' };
      return next();
    }
  }
  return auth(req, res, next);
};

// AI-powered product recommendations
router.get('/recommendations/products', aiAuth, async (req, res) => {
  try {
    const { customerId, limit = 5 } = req.query;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const result = await db.query(`
      WITH customer_categories AS (
        SELECT DISTINCT p.category_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.customer_id = $1 AND o.status != 'cancelled'
      ),
      recommended_products AS (
        SELECT
          p.*,
          COUNT(oi.id) as popularity_score
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.category_id IN (SELECT category_id FROM customer_categories)
          AND p.is_active = true
          AND p.id NOT IN (
            SELECT DISTINCT oi2.product_id
            FROM orders o2
            JOIN order_items oi2 ON o2.id = oi2.order_id
            WHERE o2.customer_id = $1
          )
        GROUP BY p.id
        ORDER BY popularity_score DESC, p.created_at DESC
        LIMIT $2
      )
      SELECT * FROM recommended_products
    `, [customerId, limit]);

    res.json({
      recommendations: result.rows,
      algorithm: 'category-based-collaborative-filtering',
    });
  } catch (error) {
    logger.error('AI recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI-powered demand forecasting
router.get('/forecast/demand', aiAuth, async (req, res) => {
  try {
    const { productId, days = 30 } = req.query;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const historicalData = await db.query(`
      SELECT
        DATE(o.created_at) as date,
        SUM(oi.quantity) as daily_sales
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.product_id = $1
        AND o.status != 'cancelled'
        AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY DATE(o.created_at)
      ORDER BY date
    `, [productId]);

    if (historicalData.rows.length < 7) {
      return res.json({
        forecast: null,
        message: 'Insufficient historical data for forecasting',
      });
    }

    const sales = historicalData.rows.map(row => parseInt(row.daily_sales));
    const avgDailySales = sales.reduce((a, b) => a + b, 0) / sales.length;
    const forecastedDemand = Math.round(avgDailySales * days);

    res.json({
      forecast: {
        productId,
        period: `${days} days`,
        averageDailySales: avgDailySales.toFixed(2),
        forecastedDemand,
        confidence: 'medium',
        basedOnDays: historicalData.rows.length,
      },
      historicalData: historicalData.rows,
    });
  } catch (error) {
    logger.error('AI demand forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI-powered price optimization
router.get('/optimize/pricing', aiAuth, async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const productResult = await db.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [productId]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResult.rows[0];

    const salesData = await db.query(`
      SELECT
        oi.unit_price,
        SUM(oi.quantity) as total_sold,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = $1 AND o.status != 'cancelled'
      GROUP BY oi.unit_price
      ORDER BY oi.unit_price
    `, [productId]);

    let priceElasticity = 0;
    let recommendedPrice = product.price;

    if (salesData.rows.length > 1) {
      const highPrice = salesData.rows[salesData.rows.length - 1];
      const lowPrice = salesData.rows[0];
      const priceChange = (highPrice.unit_price - lowPrice.unit_price) / lowPrice.unit_price;
      const quantityChange = (lowPrice.total_sold - highPrice.total_sold) / highPrice.total_sold;

      if (priceChange !== 0) {
        priceElasticity = quantityChange / priceChange;
      }

      if (priceElasticity < -1) {
        recommendedPrice = product.price * 0.95;
      } else if (priceElasticity > -1 && priceElasticity < 0) {
        recommendedPrice = product.price * 1.05;
      }
    }

    res.json({
      currentPrice: product.price,
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      priceElasticity: priceElasticity.toFixed(2),
      analysis: {
        demandType: priceElasticity < -1 ? 'elastic' : 'inelastic',
        recommendation: priceElasticity < -1 ? 'Consider lowering price' : 'Price increase may be viable',
        confidence: salesData.rows.length > 2 ? 'medium' : 'low',
      },
      salesHistory: salesData.rows,
    });
  } catch (error) {
    logger.error('AI price optimization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI-powered inventory optimization
router.get('/optimize/inventory', aiAuth, async (req, res) => {
  try {
    const { categoryId } = req.query;

    let whereClause = 'WHERE p.is_active = true';
    const params = [];

    if (categoryId) {
      whereClause += ' AND p.category_id = $1';
      params.push(categoryId);
    }

    const result = await db.query(`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.min_stock_level,
        COALESCE(AVG(oi.quantity), 0) as avg_daily_sales,
        COALESCE(SUM(oi.quantity), 0) as total_sales_30d
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      ${whereClause}
        AND (o.created_at >= CURRENT_DATE - INTERVAL '30 days' OR o.created_at IS NULL)
        AND (o.status != 'cancelled' OR o.status IS NULL)
      GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.min_stock_level
      ORDER BY p.name
    `, params);

    const optimizedInventory = result.rows.map(product => {
      const avgDailySales = parseFloat(product.avg_daily_sales);
      const currentStock = product.stock_quantity;
      const minStock = product.min_stock_level;
      const daysRemaining = avgDailySales > 0 ? currentStock / avgDailySales : 999;
      const leadTimeDays = 7;
      const safetyStock = avgDailySales * 3;
      const reorderPoint = avgDailySales * leadTimeDays + safetyStock;
      const optimalOrderQuantity = avgDailySales * 30;

      let status = 'optimal';
      let action = 'none';

      if (currentStock <= minStock) {
        status = 'critical';
        action = 'urgent_reorder';
      } else if (currentStock <= reorderPoint) {
        status = 'reorder_needed';
        action = 'reorder';
      } else if (currentStock > optimalOrderQuantity * 2) {
        status = 'overstock';
        action = 'reduce_orders';
      }

      return {
        ...product,
        daysRemaining: Math.round(daysRemaining),
        reorderPoint: Math.round(reorderPoint),
        optimalOrderQuantity: Math.round(optimalOrderQuantity),
        status,
        recommendedAction: action,
      };
    });

    res.json({
      products: optimizedInventory,
      summary: {
        total: optimizedInventory.length,
        needReorder: optimizedInventory.filter(p => p.status === 'reorder_needed').length,
        critical: optimizedInventory.filter(p => p.status === 'critical').length,
        overstock: optimizedInventory.filter(p => p.status === 'overstock').length,
      },
    });
  } catch (error) {
    logger.error('AI inventory optimization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
