// ============================================================
//  middlewares/errorHandler.js
//  Manejo centralizado de errores
//  Responde siempre con formato JSON consistente
// ============================================================

const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  // Log del error
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });

  // Error de Multer (subida de archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      ok     : false,
      message: `El archivo supera el tamaño máximo permitido (${process.env.MAX_FILE_SIZE_MB || 5}MB)`,
    });
  }

  // Error de validación express-validator
  if (err.type === 'validation') {
    return res.status(422).json({ ok: false, message: 'Datos inválidos', errors: err.errors });
  }

  // Error de clave duplicada MySQL (código 1062)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ ok: false, message: 'Ya existe un registro con ese valor' });
  }

  // Error genérico
  const status  = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Error interno del servidor'
    : err.message;

  res.status(status).json({ ok: false, message });
}

// Rutas no encontradas
function notFound(req, res) {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
