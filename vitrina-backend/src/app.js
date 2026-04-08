// ============================================================
//  app.js
//  Configuración principal de Express
//  Registra middlewares globales y todas las rutas de la API
// ============================================================

require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const compression    = require('compression');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const path           = require('path');

const { testConnection } = require('./config/db');
const logger             = require('./config/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// ── Rutas ────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const userRoutes         = require('./routes/user.routes');
const businessRoutes     = require('./routes/business.routes');
const productRoutes      = require('./routes/product.routes');
const categoryRoutes     = require('./routes/category.routes');
const reviewRoutes       = require('./routes/review.routes');
const pqrsRoutes         = require('./routes/pqrs.routes');
const analyticsRoutes    = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const searchRoutes       = require('./routes/search.routes');
const publicRoutes       = require('./routes/public.routes');

const app = express();

// ── Seguridad ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin     : process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting global ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max     : 200,
  message : { ok: false, message: 'Demasiadas solicitudes, intenta más tarde' },
});
app.use('/api/', limiter);

// Rate limiting estricto para login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 10,
  message : { ok: false, message: 'Demasiados intentos de login' },
});

// ── Parsers y utilidades ─────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', { stream: { write: msg => logger.info(msg.trim()) } }));

// ── Archivos estáticos (uploads) ─────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/businesses',    businessRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/pqrs',          pqrsRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/public',        publicRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Vitrina Empresarial API funcionando', env: process.env.NODE_ENV });
});

// ── Manejo de errores ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Iniciar servidor ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    logger.info(`📦 Ambiente: ${process.env.NODE_ENV}`);
  });
}

start();

module.exports = app;
