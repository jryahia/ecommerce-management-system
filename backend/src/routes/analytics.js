const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Helper: build a safe date interval clause
function buildDateInterval(period) {
  switch (period) {
    case '7d':
      return "INTERVAL '7 days'";
    case '30d':
      return "INTERVAL '30 days'";
    case '90d':
      return "INTERVAL '90 days'";
    case '1y':
      return "INTERVAL '1 year'";
    default:
      return "INTERVAL '30 days'";
  }
}

// Dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total sales this month
    const salesResult = await db.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as current_month,
        (SELECT COALESCE(SUM(total_amount), 0) 
         FROM orders 
         WHERE created_at >= $2 AND created_at <= $3 AND status != 'cancelled') as last_month
      FROM orders 
      WHERE created_at >= $1 AND status != 'cancelled'
    `, [startOfMonth, startOfLastMonth, endOfLastMonth]);

    // Total orders this month
    const ordersResult = await db.query(`
      SELECT 
        COUNT(*) as current_month,
        (SELECT COUNT(*) 
         FROM orders 
         WHERE created_at >= $2 AND created_at <= $3) as last_month
      FROM orders 
      WHERE created_at >= $1
    `, [startOfMonth, startOfLastMonth, endOfLastMonth]);

    // Total products
    const productsResult = await db.query('SELECT COUNT(*) as total FROM products WHERE is_active = true');

    // Total customers
    const customersResult = await db.query('SELECT COUNT(*) as total FROM customers WHERE is_active = true');

    // Recent orders
    const recentOrdersResult = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.created_at,
        c.first_name || ' ' || c.last_name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Top products
    const topProductsResult = await db.query(`
      SELECT 
        p.name,
        p.sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= $1 AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT 5
    `, [startOfMonth]);

    // Sales chart data (last 7 days)
    const salesChartResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as sales,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Low stock products
    const lowStockResult = await db.query(`
      SELECT name, sku, stock_quantity, min_stock_level
      FROM products
      WHERE stock_quantity <= min_stock_level AND is_active = true
      ORDER BY stock_quantity ASC
      LIMIT 5
    `);

    const sales = salesResult.rows[0];
    const orders = ordersResult.rows[0];

    res.json({
      stats: {
        totalSales: {
          current: parseFloat(sales.current_month),
          previous: parseFloat(sales.last_month),
          change: parseFloat(sales.last_month) > 0
            ? ((sales.current_month - sales.last_month) / sales.last_month * 100).toFixed(1)
            : 0
        },
        totalOrders: {
          current: parseInt(orders.current_month),
          previous: parseInt(orders.last_month),
          change: parseInt(orders.last_month) > 0
            ? ((orders.current_month - orders.last_month) / orders.last_month * 100).toFixed(1)
            : 0
        },
        totalProducts: parseInt(productsResult.rows[0].total),
        totalCustomers: parseInt(customersResult.rows[0].total)
      },
      recentOrders: recentOrdersResult.rows,
      topProducts: topProductsResult.rows,
      salesChart: salesChartResult.rows,
      lowStockProducts: lowStockResult.rows
    });
  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sales analytics
router.get('/sales', auth, async (req, res) => {
  try {
    const { period = '30d', startDate, endDate } = req.query;

    let dateCondition = '';
    let params = [];

    if (startDate && endDate) {
      dateCondition = 'created_at >= $1 AND created_at <= $2';
      params = [startDate, endDate];
    } else {
      const interval = buildDateInterval(period);
      dateCondition = `created_at >= CURRENT_DATE - ${interval}`;
    }

    // Sales by day
    const salesByDayResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as sales,
        COUNT(*) as orders
      FROM orders
      WHERE ${dateCondition} AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, params);

    // Sales by status
    const salesByStatusResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE ${dateCondition}
      GROUP BY status
      ORDER BY count DESC
    `, params);

    // Sales by payment method
    const salesByPaymentResult = await db.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE ${dateCondition} AND status != 'cancelled'
      GROUP BY payment_method
      ORDER BY count DESC
    `, params);

    res.json({
      salesByDay: salesByDayResult.rows,
      salesByStatus: salesByStatusResult.rows,
      salesByPayment: salesByPaymentResult.rows
    });
  } catch (error) {
    logger.error('Sales analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Product analytics
router.get('/products', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const interval = buildDateInterval(period);

    // Top selling products
    const topSellingResult = await db.query(`
      SELECT 
        p.name,
        p.sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue,
        AVG(oi.unit_price) as avg_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' AND o.created_at >= CURRENT_DATE - ${interval}
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    // Products by category
    const categoryResult = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
        AND o.status != 'cancelled'
        AND o.created_at >= CURRENT_DATE - ${interval}
      GROUP BY c.id, c.name
      ORDER BY total_sold DESC
    `);

    // Low stock alerts
    const lowStockResult = await db.query(`
      SELECT 
        name,
        sku,
        stock_quantity,
        min_stock_level,
        (min_stock_level - stock_quantity) as shortage
      FROM products
      WHERE stock_quantity <= min_stock_level AND is_active = true
      ORDER BY shortage DESC
    `);

    res.json({
      topSelling: topSellingResult.rows,
      byCategory: categoryResult.rows,
      lowStock: lowStockResult.rows
    });
  } catch (error) {
    logger.error('Product analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer analytics
router.get('/customers', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const interval = buildDateInterval(period);

    // New customers
    const newCustomersResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers
      FROM customers
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Top customers by spending
    const topCustomersResult = await db.query(`
      SELECT 
        c.first_name || ' ' || c.last_name as name,
        c.email,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
        AND o.status != 'cancelled'
        AND o.created_at >= CURRENT_DATE - ${interval}
      GROUP BY c.id, c.first_name, c.last_name, c.email
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    // Customer segments
    const segmentsResult = await db.query(`
      SELECT segment, COUNT(*) as count FROM (
        SELECT 
          CASE 
            WHEN total_spent >= 1000 THEN 'VIP'
            WHEN total_spent >= 500 THEN 'Premium'
            WHEN total_spent >= 100 THEN 'Regular'
            ELSE 'New'
          END as segment
        FROM customers
      ) sub
      GROUP BY segment
      ORDER BY count DESC
    `);

    res.json({
      newCustomers: newCustomersResult.rows,
      topCustomers: topCustomersResult.rows,
      segments: segmentsResult.rows
    });
  } catch (error) {
    logger.error('Customer analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
