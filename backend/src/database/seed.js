/**
 * Database Seeding Script
 * 
 * Seeds the database with initial data including:
 * - Admin user (admin@example.com / admin123)
 * - Sample categories
 * - Sample products
 * - Sample customers
 * - Sample orders
 * 
 * Usage: npm run seed
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ecommerce_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

// Create a dedicated pool for seeding
const pool = new Pool(config);

// Helper to log with timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Helper to log errors
function logError(message, error) {
  console.error(`[${new Date().toISOString()}]  ${message}`);
  if (error) {
    console.error(`   Error: ${error.message}`);
    if (error.code) console.error(`   Code: ${error.code}`);
  }
}

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    log(' Starting database seeding...');
    log(`   Database: ${config.database}@${config.host}:${config.port}`);
    console.log('');

    await client.query('BEGIN');

    // ========================================
    // 1. Create Admin User
    // ========================================
    log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminResult = await client.query(`
      INSERT INTO users (email, password, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active
      RETURNING id, email
    `, ['admin@example.com', hashedPassword, 'Admin', 'User', 'admin', true]);
    
    const adminId = adminResult.rows[0].id;
    log(`    Admin user created/updated: ${adminResult.rows[0].email}`);

    // ========================================
    // 2. Create Categories
    // ========================================
    log('Creating categories...');
    const categories = [
      { name: 'Electronics', nameAr: 'إلكترونيات', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', nameAr: 'ملابس', description: 'Fashion and apparel' },
      { name: 'Books', nameAr: 'كتب', description: 'Books and literature' },
      { name: 'Home & Garden', nameAr: 'المنزل والحديقة', description: 'Home improvement and garden supplies' },
      { name: 'Sports', nameAr: 'رياضة', description: 'Sports equipment and apparel' }
    ];

    const categoryIds = {};
    for (const category of categories) {
      const result = await client.query(`
        INSERT INTO categories (name, name_ar, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET
          name_ar = EXCLUDED.name_ar,
          description = EXCLUDED.description
        RETURNING id, name
      `, [category.name, category.nameAr, category.description]);
      
      categoryIds[category.name] = result.rows[0].id;
    }
    log(`    ${categories.length} categories created/updated`);

    // ========================================
    // 3. Create Products
    // ========================================
    log('Creating products...');
    const products = [
      {
        name: 'iPhone 15 Pro',
        nameAr: 'آيفون 15 برو',
        description: 'Latest iPhone with advanced features including A17 Pro chip',
        sku: 'IPH15PRO001',
        category: 'Electronics',
        price: 999.99,
        costPrice: 750.00,
        stockQuantity: 50,
        minStockLevel: 10
      },
      {
        name: 'Samsung Galaxy S24',
        nameAr: 'سامسونج جالاكسي S24',
        description: 'Premium Android smartphone with AI features',
        sku: 'SGS24001',
        category: 'Electronics',
        price: 899.99,
        costPrice: 650.00,
        stockQuantity: 30,
        minStockLevel: 5
      },
      {
        name: 'MacBook Pro 16"',
        nameAr: 'ماك بوك برو 16 بوصة',
        description: 'Professional laptop for creators with M3 Pro chip',
        sku: 'MBP16001',
        category: 'Electronics',
        price: 2499.99,
        costPrice: 1800.00,
        stockQuantity: 15,
        minStockLevel: 3
      },
      {
        name: 'Nike Air Max',
        nameAr: 'نايك اير ماكس',
        description: 'Comfortable running shoes with Air cushioning',
        sku: 'NAM001',
        category: 'Sports',
        price: 129.99,
        costPrice: 80.00,
        stockQuantity: 100,
        minStockLevel: 20
      },
      {
        name: 'Wireless Headphones',
        nameAr: 'سماعات لاسلكية',
        description: 'High-quality wireless headphones with noise cancellation',
        sku: 'WH001',
        category: 'Electronics',
        price: 199.99,
        costPrice: 120.00,
        stockQuantity: 75,
        minStockLevel: 15
      },
      {
        name: 'Cotton T-Shirt',
        nameAr: 'تي شيرت قطني',
        description: 'Premium cotton t-shirt, comfortable fit',
        sku: 'CTS001',
        category: 'Clothing',
        price: 29.99,
        costPrice: 12.00,
        stockQuantity: 200,
        minStockLevel: 50
      },
      {
        name: 'JavaScript Guide',
        nameAr: 'دليل جافاسكريبت',
        description: 'Comprehensive guide to modern JavaScript development',
        sku: 'JSG001',
        category: 'Books',
        price: 49.99,
        costPrice: 20.00,
        stockQuantity: 60,
        minStockLevel: 10
      },
      {
        name: 'Garden Tools Set',
        nameAr: 'مجموعة أدوات الحديقة',
        description: 'Complete garden tools set for home gardening',
        sku: 'GTS001',
        category: 'Home & Garden',
        price: 79.99,
        costPrice: 45.00,
        stockQuantity: 40,
        minStockLevel: 8
      }
    ];

    const productIds = [];
    for (const product of products) {
      const categoryId = categoryIds[product.category];
      
      const result = await client.query(`
        INSERT INTO products (
          name, name_ar, description, sku, category_id, price, cost_price,
          stock_quantity, min_stock_level, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (sku) DO UPDATE SET
          name = EXCLUDED.name,
          name_ar = EXCLUDED.name_ar,
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          price = EXCLUDED.price,
          cost_price = EXCLUDED.cost_price,
          stock_quantity = EXCLUDED.stock_quantity,
          min_stock_level = EXCLUDED.min_stock_level,
          is_active = EXCLUDED.is_active
        RETURNING id, name, sku
      `, [
        product.name, product.nameAr, product.description, product.sku,
        categoryId, product.price, product.costPrice, product.stockQuantity,
        product.minStockLevel, true
      ]);

      productIds.push(result.rows[0].id);
    }
    log(`    ${products.length} products created/updated`);

    // ========================================
    // 4. Create Customers
    // ========================================
    log('Creating customers...');
    const customers = [
      { firstName: 'أحمد', lastName: 'محمد', email: 'ahmed@example.com', phone: '+966501234567' },
      { firstName: 'فاطمة', lastName: 'علي', email: 'fatima@example.com', phone: '+966507654321' },
      { firstName: 'محمد', lastName: 'السعيد', email: 'mohammed@example.com', phone: '+966509876543' },
      { firstName: 'عائشة', lastName: 'أحمد', email: 'aisha@example.com', phone: '+966502468135' },
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', phone: '+1234567890' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@example.com', phone: '+1987654321' }
    ];

    const customerIds = [];
    for (const customer of customers) {
      const result = await client.query(`
        INSERT INTO customers (first_name, last_name, email, phone, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          is_active = EXCLUDED.is_active
        RETURNING id
      `, [customer.firstName, customer.lastName, customer.email, customer.phone, true]);

      customerIds.push(result.rows[0].id);
    }
    log(`    ${customers.length} customers created/updated`);

    // ========================================
    // 5. Create Sample Orders
    // ========================================
    log('Creating sample orders...');
    
    // Check if we already have orders
    const existingOrders = await client.query('SELECT COUNT(*) FROM orders');
    const orderCount = parseInt(existingOrders.rows[0].count);
    
    if (orderCount < 10) {
      const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
      let ordersCreated = 0;

      for (let i = 0; i < 15; i++) {
        const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
        const orderNumber = `ORD-${Date.now()}-${i.toString().padStart(3, '0')}`;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random date in the last 30 days
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
        
        const subtotal = Math.round((Math.random() * 500 + 100) * 100) / 100;
        const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
        const shippingAmount = 10;
        const totalAmount = Math.round((subtotal + taxAmount + shippingAmount) * 100) / 100;

        const orderResult = await client.query(`
          INSERT INTO orders (
            order_number, customer_id, subtotal, tax_amount, shipping_amount,
            total_amount, status, payment_status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          orderNumber, customerId, subtotal, taxAmount, shippingAmount,
          totalAmount, status, status === 'delivered' ? 'paid' : 'pending', orderDate
        ]);

        const orderId = orderResult.rows[0].id;

        // Add 1-3 items to each order
        const numItems = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numItems; j++) {
          const productId = productIds[Math.floor(Math.random() * productIds.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const unitPrice = Math.round((Math.random() * 200 + 50) * 100) / 100;
          const totalPrice = Math.round(quantity * unitPrice * 100) / 100;

          await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
          `, [orderId, productId, quantity, unitPrice, totalPrice]);
        }

        // Update customer stats
        await client.query(`
          UPDATE customers 
          SET total_orders = total_orders + 1, 
              total_spent = total_spent + $1,
              last_order_date = $2
          WHERE id = $3
        `, [totalAmount, orderDate, customerId]);

        ordersCreated++;
      }
      log(`    ${ordersCreated} orders created`);
    } else {
      log(`    Orders already exist (${orderCount}), skipping`);
    }

    await client.query('COMMIT');

    console.log('');
    log('═══════════════════════════════════════════════════════════');
    log('   DATABASE SEEDING COMPLETE!');
    log('═══════════════════════════════════════════════════════════');
    console.log('');
    log('  Default Admin Login:');
    log('    Email:    admin@example.com');
    log('    Password: admin123');
    console.log('');
    log('  Next steps:');
    log('    1. Run: npm run dev');
    log('    2. Open: http://localhost:3000');
    log('    3. Login with the credentials above');
    console.log('');

  } catch (error) {
    await client.query('ROLLBACK');
    logError('Database seeding failed', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('    PostgreSQL is not running. Please start it first:');
      console.log('      - Windows: Start "PostgreSQL" service');
      console.log('      - macOS:   brew services start postgresql');
      console.log('      - Linux:   sudo systemctl start postgresql');
    } else if (error.code === '3D000') {
      console.log('');
      console.log('    Database does not exist. Run: npm run db:init');
    } else if (error.code === '42P01') {
      console.log('');
      console.log('    Database tables do not exist. Run: npm run db:init');
    }
    
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
