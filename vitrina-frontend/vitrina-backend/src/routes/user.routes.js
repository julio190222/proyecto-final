// routes/user.routes.js — Todos los endpoints requieren admin
const router   = require('express').Router();
const ctrl     = require('../controllers/user.controller');
const authCtrl = require('../controllers/auth.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate, requireAdmin);

router.get('/',                        ctrl.list);
router.get('/:id',                     ctrl.getOne);
router.post('/',                       ctrl.create);
router.put('/:id',                     ctrl.update);
router.patch('/:id/status',            ctrl.toggleStatus);
router.post('/:userId/reset-password', authCtrl.resetPassword);

module.exports = router;
