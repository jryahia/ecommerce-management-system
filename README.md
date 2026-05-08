# E-commerce Management System

A professional e-commerce management dashboard built with React, Node.js, and PostgreSQL. Features include product management, order processing, customer management, analytics, and AI-powered insights.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### Core Management
- **Dashboard** - Real-time analytics and performance overview
- **Products** - Full CRUD, inventory tracking, categories, images
- **Orders** - Order processing, status tracking, fulfillment workflow
- **Customers** - Customer profiles, order history, segmentation
- **Analytics** - Sales reports, product performance, customer insights

### AI-Powered Features
- Product recommendations based on purchase history
- Demand forecasting with moving averages
- Price optimization suggestions
- Inventory optimization alerts

### Technical Highlights
- Real-time updates via WebSocket (Socket.IO)
- JWT authentication with role-based access control
- Responsive design with Tailwind CSS
- Arabic language support (RTL)
- Rate limiting and security headers

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand, React Query |
| Backend | Node.js, Express |
| Database | PostgreSQL 15+ |
| Cache | Redis (optional) |
| Real-time | Socket.IO |

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 15+** - [Download here](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

Optional:
- **Redis** - For caching (app works without it)

## 🚀 Quick Start

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ecommerce-management-system

# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### Step 2: Configure Database

Edit `backend/.env` with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_dev
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### Step 3: Initialize Database

```bash
# Create database and tables
npm run db:init

# Seed with sample data
npm run db:seed
```

You should see:
```
✅ DATABASE SEEDING COMPLETE!

Default Admin Login:
  Email:    admin@example.com
  Password: admin123
```

### Step 4: Start Development

```bash
npm run dev
```

This starts both:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Step 5: Login

Open http://localhost:3000 and login with:
```
Email: admin@example.com
Password: admin123
```

## 📁 Project Structure

```
ecommerce-management-system/
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   ├── stores/           # Zustand state stores
│   │   └── App.tsx           # Main application
│   └── package.json
├── backend/                    # Express API server
│   ├── src/
│   │   ├── config/           # Database & Redis config
│   │   ├── middleware/       # Auth, error handling
│   │   ├── routes/           # API endpoints
│   │   ├── database/         # Seed scripts
│   │   └── server.js         # Entry point
│   ├── scripts/              # Database init scripts
│   └── package.json
├── database/
│   └── init.sql              # Database schema
└── package.json               # Root workspace scripts
```

## 🔧 Available Commands

### Root Level
```bash
npm run install:all    # Install all dependencies
npm run dev            # Start frontend + backend
npm run build          # Build for production
npm run db:init        # Initialize database
npm run db:seed        # Seed sample data
npm run db:setup       # Init + seed database
```

### Frontend Only
```bash
cd frontend
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview build
```

### Backend Only
```bash
cd backend
npm run dev            # Development with hot reload
npm start              # Production server
npm run seed           # Seed database
```

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ecommerce_dev` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `password` |
| `JWT_SECRET` | JWT signing key | (required) |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `REDIS_DISABLED` | Disable Redis | `false` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login      # Login
POST   /api/auth/register   # Register
GET    /api/auth/me         # Current user
PUT    /api/auth/profile    # Update profile
```

### Products
```
GET    /api/products        # List products
POST   /api/products        # Create product
GET    /api/products/:id    # Get product
PUT    /api/products/:id    # Update product
DELETE /api/products/:id    # Delete product
PATCH  /api/products/:id/stock  # Update stock
```

### Orders
```
GET    /api/orders          # List orders
POST   /api/orders          # Create order
GET    /api/orders/:id      # Get order
PATCH  /api/orders/:id/status  # Update status
```

### Customers
```
GET    /api/customers       # List customers
POST   /api/customers       # Create customer
GET    /api/customers/:id   # Get customer
PUT    /api/customers/:id   # Update customer
DELETE /api/customers/:id   # Delete customer
```

### Analytics
```
GET    /api/analytics/dashboard  # Dashboard stats
GET    /api/analytics/sales      # Sales reports
GET    /api/analytics/products   # Product analytics
GET    /api/analytics/customers  # Customer analytics
```

### AI Features
```
GET    /api/ai/recommendations/products  # Product recommendations
GET    /api/ai/forecast/demand           # Demand forecasting
GET    /api/ai/optimize/pricing          # Price optimization
GET    /api/ai/optimize/inventory        # Inventory optimization
```

## 🆘 Troubleshooting

### "Login failed" Error

**Cause**: Database not seeded or backend not connected

**Solution**:
```bash
# 1. Make sure PostgreSQL is running
# 2. Initialize and seed the database
npm run db:init
npm run db:seed

# 3. Restart the servers
npm run dev
```

### "ECONNREFUSED" Error

**Cause**: PostgreSQL is not running

**Solution**:
```bash
# Windows: Open Services → Start "postgresql"

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### "Database does not exist" Error

**Cause**: Database not created

**Solution**:
```bash
npm run db:init
```

### "Authentication failed" Error

**Cause**: Wrong database credentials

**Solution**: Check `backend/.env` and verify:
- `DB_USER` matches your PostgreSQL user
- `DB_PASSWORD` matches your PostgreSQL password

### Port Already in Use

**Solution**:
```bash
# Find process using the port
lsof -i :5000  # or :3000

# Kill it
kill -9 <PID>
```

### Redis Connection Warning

This is **not an error**. The app works without Redis. To use Redis:
```bash
# macOS
brew install redis && brew services start redis

# Linux
sudo apt install redis-server && sudo systemctl start redis
```

## 🔒 Security Features

- JWT authentication with 7-day expiry
- Password hashing with bcrypt (10 rounds)
- Rate limiting (100 requests/15 minutes)
- CORS configuration
- Helmet.js security headers
- Input validation with express-validator
- SQL injection prevention (parameterized queries)

## 🚀 Production Deployment

### Build for Production

```bash
# Build frontend
cd frontend && npm run build

# The build output is in frontend/dist/
```

### Environment Setup

1. Set secure `JWT_SECRET` (64+ random characters)
2. Set strong database password
3. Configure proper CORS origins
4. Enable HTTPS
5. Set `NODE_ENV=production`

### Process Manager

Use PM2 for production:
```bash
npm install -g pm2
pm2 start backend/src/server.js --name ecommerce-api
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for E-commerce Excellence**
