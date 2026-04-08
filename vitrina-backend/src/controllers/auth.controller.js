// ============================================================
//  controllers/auth.controller.js
//  Maneja req/res — delega lógica al service
// ============================================================

const authService        = require('../services/auth.service');
const { success, error } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const ip        = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(email, password, ip, userAgent);
    return success(res, result, 'Login exitoso');
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const ip        = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await authService.changePassword(req.user.id, current_password, new_password, ip, userAgent);
    return success(res, {}, 'Contraseña actualizada correctamente');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const ip        = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await authService.logout(req.user.id, ip, userAgent);
    return success(res, {}, 'Sesión cerrada correctamente');
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(
      parseInt(req.params.userId),
      req.user.id
    );
    return success(res, result, 'Contraseña restablecida correctamente');
  } catch (err) {
    next(err);
  }
}

module.exports = { login, changePassword, logout, resetPassword };
