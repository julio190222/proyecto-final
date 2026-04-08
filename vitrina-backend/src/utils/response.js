// ============================================================
//  utils/response.js
//  Helpers para respuestas JSON consistentes en toda la API
// ============================================================

const success = (res, data = {}, message = 'OK', status = 200) => {
  return res.status(status).json({ ok: true, message, data });
};

const created = (res, data = {}, message = 'Creado exitosamente') => {
  return res.status(201).json({ ok: true, message, data });
};

const paginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    ok  : true,
    data,
    meta: {
      total,
      page    : parseInt(page),
      limit   : parseInt(limit),
      pages   : Math.ceil(total / limit),
    },
  });
};

const error = (res, message = 'Error', status = 500) => {
  return res.status(status).json({ ok: false, message });
};

module.exports = { success, created, paginated, error };
