const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireEntrepreneur, requireAdmin, requirePasswordChange } = require('../middlewares/auth');
const { uploadLogo, uploadCover, uploadGallery, uploadCatalog } = require('../config/upload');
const { success } = require('../utils/response');
const { generateSlug } = require('../utils/helpers');

const auth = [authenticate, requireEntrepreneur, requirePasswordChange];

// GET mi tienda
router.get('/me', ...auth, async (req, res, next) => {
  try {
    console.log('USER LOGUEADO:', req.user);      // 👈 TODO el usuario
    console.log('USER ID:', req.user.id);         // 👈 solo el id

    const [biz] = await pool.query(
      `SELECT b.*, logo.url AS logo_url, cover.url AS cover_url
       FROM businesses b
       LEFT JOIN business_media logo  ON logo.business_id  = b.id AND logo.media_type  = 'logo'
       LEFT JOIN business_media cover ON cover.business_id = b.id AND cover.media_type = 'cover'
       WHERE b.user_id = ?`, [req.user.id]
    );
    
    console.log('RESULTADO QUERY:', biz); // 👈 MUY IMPORTANTE

    if (!biz.length) return res.status(404).json({ ok: false, message: 'Tienda no encontrada' });
    const bizId = biz[0].id;
    const [hours] = await pool.query('SELECT * FROM business_hours WHERE business_id = ? ORDER BY day_of_week', [bizId]);
    const [cats]  = await pool.query(
      `SELECT c.id,c.name,c.slug FROM business_categories bc JOIN categories c ON c.id=bc.category_id WHERE bc.business_id=?`, [bizId]
    );
    const [gallery] = await pool.query(`SELECT * FROM business_media WHERE business_id=? AND media_type='gallery' ORDER BY sort_order`, [bizId]);
    return success(res, { ...biz[0], hours, categories: cats, gallery });
  } catch (err) { next(err); }
});

// PUT editar tienda
router.put('/me', ...auth, async (req, res, next) => {
  try {
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    if (!biz.length) return res.status(404).json({ ok: false, message: 'Tienda no encontrada' });
    const { name, description, address, whatsapp, instagram, facebook, tiktok, website, category_ids, hours } = req.body;
    const updates = { description, address, whatsapp, instagram, facebook, tiktok, website };
    if (name) { updates.name = name; updates.slug = generateSlug(name); }
    const sets  = Object.entries(updates).filter(([,v]) => v !== undefined).map(([k]) => `${k}=?`).join(',');
    const vals  = Object.entries(updates).filter(([,v]) => v !== undefined).map(([,v]) => v);
    if (sets) await pool.query(`UPDATE businesses SET ${sets}, updated_at=NOW() WHERE id=?`, [...vals, biz[0].id]);
    if (category_ids?.length) {
      await pool.query('DELETE FROM business_categories WHERE business_id=?', [biz[0].id]);
      const rows = category_ids.map(c => [biz[0].id, c]);
      await pool.query('INSERT INTO business_categories (business_id,category_id) VALUES ?', [rows]);
    }
    if (hours?.length) {
      for (const h of hours) {
        await pool.query(
          'UPDATE business_hours SET open_time=?,close_time=?,is_closed=? WHERE business_id=? AND day_of_week=?',
          [h.open_time||null, h.close_time||null, h.is_closed||false, biz[0].id, h.day_of_week]
        );
      }
    }
    return success(res, {}, 'Tienda actualizada');
  } catch (err) { next(err); }
});

// POST subir logo
router.post('/me/logo', ...auth, uploadLogo.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Archivo requerido' });
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const url = `/uploads/logos/${req.file.filename}`;
    await pool.query('DELETE FROM business_media WHERE business_id=? AND media_type="logo"', [biz[0].id]);
    await pool.query('INSERT INTO business_media (business_id,media_type,url,alt_text) VALUES (?,?,?,?)', [biz[0].id,'logo',url,req.body.alt_text||null]);
    return success(res, { url }, 'Logo actualizado');
  } catch (err) { next(err); }
});

// POST subir portada
router.post('/me/cover', ...auth, uploadCover.single('cover'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Archivo requerido' });
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const url = `/uploads/covers/${req.file.filename}`;
    await pool.query('DELETE FROM business_media WHERE business_id=? AND media_type="cover"', [biz[0].id]);
    await pool.query('INSERT INTO business_media (business_id,media_type,url) VALUES (?,?,?)', [biz[0].id,'cover',url]);
    return success(res, { url }, 'Portada actualizada');
  } catch (err) { next(err); }
});

// POST subir galería
router.post('/me/gallery', ...auth, uploadGallery.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ ok: false, message: 'Archivos requeridos' });
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    const rows = req.files.map((f,i) => [biz[0].id,'gallery',`/uploads/gallery/${f.filename}`,null,i]);
    await pool.query('INSERT INTO business_media (business_id,media_type,url,alt_text,sort_order) VALUES ?', [rows]);
    return success(res, { count: rows.length }, 'Imágenes subidas');
  } catch (err) { next(err); }
});

// POST subir catálogo PDF
router.post('/me/catalog', ...auth, uploadCatalog.single('catalog'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Archivo PDF requerido' });
    const url = `/uploads/catalogs/${req.file.filename}`;
    const [biz] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [req.user.id]);
    await pool.query('UPDATE businesses SET catalog_pdf_url=? WHERE id=?', [url, biz[0].id]);
    return success(res, { url }, 'Catálogo actualizado');
  } catch (err) { next(err); }
});

// GET todas las tiendas (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id,b.name,b.slug,b.status,b.created_at,u.name AS owner_name,u.email AS owner_email
       FROM businesses b JOIN users u ON u.id=b.user_id ORDER BY b.created_at DESC`
    );
    return success(res, rows);
  } catch (err) { next(err); }
});

module.exports = router;
