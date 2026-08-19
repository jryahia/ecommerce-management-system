# E-commerce Management System

A professional e-commerce management dashboard built with React, Node.js, and PostgreSQL. Features include product management, order processing, customer management, analytics, and AI-powered insights.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /> <path d="M20 2v4" /> <path d="M22 4h-4" /> <circle cx="4" cy="20" r="2" /> </svg>Features

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

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" /> </svg>Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand, React Query |
| Backend | Node.js, Express |
| Database | PostgreSQL 15+ |
| Cache | Redis (optional) |
| Real-time | Socket.IO |

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /> <path d="M12 11h4" /> <path d="M12 16h4" /> <path d="M8 11h.01" /> <path d="M8 16h.01" /> </svg>Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 15+** - [Download here](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

Optional:
- **Redis** - For caching (app works without it)

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /> <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" /> <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" /> <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" /> </svg>Quick Start

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
<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" /> </svg>DATABASE SEEDING COMPLETE!

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

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /> </svg>Project Structure

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

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" /> </svg>Available Commands

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

##  Environment Variables

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

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22v-5" /> <path d="M15 8V2" /> <path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" /> <path d="M9 8V2" /> </svg>API Endpoints

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

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /> <path d="m4.93 4.93 4.24 4.24" /> <path d="m14.83 9.17 4.24-4.24" /> <path d="m14.83 14.83 4.24 4.24" /> <path d="m9.17 14.83-4.24 4.24" /> <circle cx="12" cy="12" r="4" /> </svg>Troubleshooting

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

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" /> </svg>Security Features

- JWT authentication with 7-day expiry
- Password hashing with bcrypt (10 rounds)
- Rate limiting (100 requests/15 minutes)
- CORS configuration
- Helmet.js security headers
- Input validation with express-validator
- SQL injection prevention (parameterized queries)

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /> <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" /> <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" /> <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" /> </svg>Production Deployment

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

## <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" /> </svg>License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with  for E-commerce Excellence**
