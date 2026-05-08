const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const categoryRoutes = require('./routes/categories');

const app = express();
const server = createServer(app);

// CORS origin: allow configured URL, fall back to all origins in development
const corsOrigin = (() => {
  const configured = process.env.FRONTEND_URL;
  if (configured && configured.startsWith('http')) return configured;
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('FRONTEND_URL not set — allowing all origins in development mode');
    return true; // allow all
  }
  return 'http://localhost:3000';
})();

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));

// Stricter rate limiter for auth routes (20 req / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter — 500 req / 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no rate limit)
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Apply general rate limiter to all /api routes
app.use('/api', limiter);

// Apply auth limiter only to login/register
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/categories', categoryRoutes);

// Socket.IO real-time features
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(`User ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

app.set('io', io);

app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  E-COMMERCE MANAGEMENT SYSTEM - BACKEND');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Server running on port ${PORT}`);
  console.log(`  API URL: http://localhost:${PORT}/api`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log('');
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
