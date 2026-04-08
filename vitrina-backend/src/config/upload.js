// ============================================================
//  config/upload.js
//  Configuración de Multer para subida de archivos
//  Imágenes: logos, portadas, galería, productos
//  Documentos: catálogos PDF
// ============================================================

const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

// ── Storage por tipo de archivo ─────────────────────────────
function buildStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.env.UPLOAD_PATH || 'uploads', folder));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

// ── Filtros de tipo MIME ─────────────────────────────────────
function imageFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'), false);
  }
}

function pdfFilter(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
}

// ── Instancias exportadas ────────────────────────────────────
const uploadLogo = multer({
  storage : buildStorage('logos'),
  fileFilter: imageFilter,
  limits  : { fileSize: MAX_SIZE_BYTES },
});

const uploadCover = multer({
  storage : buildStorage('covers'),
  fileFilter: imageFilter,
  limits  : { fileSize: MAX_SIZE_BYTES },
});

const uploadGallery = multer({
  storage : buildStorage('gallery'),
  fileFilter: imageFilter,
  limits  : { fileSize: MAX_SIZE_BYTES },
});

const uploadProduct = multer({
  storage : buildStorage('products'),
  fileFilter: imageFilter,
  limits  : { fileSize: MAX_SIZE_BYTES },
});

const uploadCatalog = multer({
  storage : buildStorage('catalogs'),
  fileFilter: pdfFilter,
  limits  : { fileSize: 20 * 1024 * 1024 }, // PDFs hasta 20MB
});

module.exports = {
  uploadLogo,
  uploadCover,
  uploadGallery,
  uploadProduct,
  uploadCatalog,
};
