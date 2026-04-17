// ============================================================
//  utils/helpers.js
//  Funciones de utilidad general
// ============================================================

const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

// Genera slug único con timestamp para evitar colisiones
function generateSlug(text) {
  return slugify(text, {
    lower      : true,
    strict     : true,
    locale     : 'es',
    replacement: '-',
  });
}

// Genera session_id único para analytics
function generateSessionId() {
  return `sess_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
}

// Calcula estado del stock de un producto
function getStockStatus(totalStock) {
  if (totalStock === 0)  return 'out_of_stock';
  if (totalStock <= 5)   return 'low_stock';
  return 'available';
}

// Paginación — extrae page y limit de query params
function getPagination(query) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 12);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// Construye mensaje WhatsApp con datos del producto
function buildWhatsappMessage(business, product = null) {
  const base = `https://wa.me/${business.whatsapp}`;
  if (!product) return `${base}?text=${encodeURIComponent(`Hola, vi tu tienda en Vitrina Empresarial y me gustaría más información.`)}`;

  const msg = `Hola, me interesa el producto:\n*${product.name}*\nCódigo: ${product.id}\nPrecio: $${Number(product.base_price).toLocaleString('es-CO')}\n\n_Visto en Vitrina Empresarial Digital_`;
  return `${base}?text=${encodeURIComponent(msg)}`;
}

module.exports = {
  generateSlug,
  generateSessionId,
  getStockStatus,
  getPagination,
  buildWhatsappMessage,
};
