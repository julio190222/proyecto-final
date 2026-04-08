// ============================================================
//  controllers/user.controller.js
// ============================================================

const userService                    = require('../services/user.service');
const { success, created, paginated } = require('../utils/response');
const { getPagination }              = require('../utils/helpers');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search }              = req.query;
    const { rows, total }         = await userService.listEntrepreneurs({ page, limit, offset, search });
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const data = await userService.getUserById(parseInt(req.params.id));
    return success(res, data);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const result = await userService.createEntrepreneur(req.body, req.user.id);
    return created(res, result, 'Emprendedor creado exitosamente');
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    await userService.updateUser(parseInt(req.params.id), req.body);
    return success(res, {}, 'Usuario actualizado correctamente');
  } catch (err) { next(err); }
}

async function toggleStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    await userService.toggleStatus(parseInt(req.params.id), Boolean(is_active));
    return success(res, {}, is_active ? 'Cuenta activada' : 'Cuenta desactivada');
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, toggleStatus };
