// ============================================================
//  routes/public.routes.js — Sin autenticación
// ============================================================
const router = require('express').Router();
const ctrl   = require('../controllers/public.controller');

// GET /api/public/businesses              → vitrina con filtros
// GET /api/public/businesses/:slug        → perfil de un negocio
// GET /api/public/categories              → árbol de categorías
// GET /api/public/similar/:productId      → productos similares

router.get('/businesses',             ctrl.listBusinesses);
router.get('/businesses/:slug',       ctrl.getBusinessBySlug);
router.get('/categories',             ctrl.getCategories);
router.get('/similar/:productId',     ctrl.getSimilarProducts);

module.exports = router;
