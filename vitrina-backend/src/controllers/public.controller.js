// ============================================================
//  controllers/public.controller.js
// ============================================================

const publicService              = require('../services/public.service');
const { success, paginated }     = require('../utils/response');
const { getPagination }          = require('../utils/helpers');

async function listBusinesses(req, res, next) {
  try {
    const { page, limit, offset }          = getPagination(req.query);
    const { search, category, subcategory, sort } = req.query;
    const { rows, total } = await publicService.listBusinesses({
      page, limit, offset,
      search, category_slug: category, subcategory_slug: subcategory, sort,
    });
    return paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
}

async function getBusinessBySlug(req, res, next) {
  try {
    const data = await publicService.getBusinessBySlug(req.params.slug);
    return success(res, data);
  } catch (err) { next(err); }
}

async function getCategories(req, res, next) {
  try {
    const data = await publicService.getCategories();
    return success(res, data);
  } catch (err) { next(err); }
}

async function getSimilarProducts(req, res, next) {
  try {
    const data = await publicService.getSimilarProducts(parseInt(req.params.productId));
    return success(res, data);
  } catch (err) { next(err); }
}

module.exports = { listBusinesses, getBusinessBySlug, getCategories, getSimilarProducts };
