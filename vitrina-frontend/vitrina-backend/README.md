# Vitrina Empresarial Digital — Backend

API REST desarrollada con **Node.js + Express + MySQL 8**.

---

## Requisitos

- Node.js >= 18
- MySQL 8.x corriendo con `vitrina_empresarial_db` creada
- Git

---

## Instalación paso a paso

```bash
# 1. Clonar o descomprimir el proyecto
cd vitrina-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos de MySQL y JWT_SECRET

# 4. Verificar que la BD ya tiene el schema y seed cargados
#    (si no, ejecutar schema.sql y seed.sql primero)

# 5. Iniciar en desarrollo
npm run dev

# El servidor queda en: http://localhost:3000
# Health check: GET http://localhost:3000/api/health
```

---

## Estructura de carpetas

```
vitrina-backend/
├── src/
│   ├── app.js                  # Punto de entrada — configura Express
│   ├── config/
│   │   ├── db.js               # Pool de conexiones MySQL
│   │   ├── logger.js           # Logger Winston
│   │   └── upload.js           # Configuración Multer
│   ├── middlewares/
│   │   ├── auth.js             # JWT, roles y ownership
│   │   └── errorHandler.js     # Manejo centralizado de errores
│   ├── routes/                 # Define los endpoints (URL + método)
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── business.routes.js
│   │   ├── product.routes.js
│   │   ├── category.routes.js
│   │   ├── review.routes.js
│   │   ├── pqrs.routes.js
│   │   ├── analytics.routes.js
│   │   ├── notification.routes.js
│   │   ├── search.routes.js
│   │   └── public.routes.js
│   ├── controllers/            # Lógica de cada endpoint
│   ├── services/               # Lógica de negocio y queries
│   ├── models/                 # Funciones de acceso a datos
│   ├── validators/             # Validaciones con express-validator
│   └── utils/
│       ├── response.js         # Helpers JSON consistentes
│       └── helpers.js          # Utilidades generales
├── uploads/                    # Archivos subidos (no subir a git)
│   ├── logos/
│   ├── covers/
│   ├── gallery/
│   ├── products/
│   └── catalogs/
├── logs/                       # Logs generados (no subir a git)
├── .env.example                # Plantilla de variables de entorno
├── .gitignore
└── package.json
```

---

## Endpoints disponibles

| Método | Ruta                        | Descripción                        | Auth        |
|--------|-----------------------------|------------------------------------|-------------|
| POST   | /api/auth/login             | Login y obtención de JWT           | Pública     |
| POST   | /api/auth/change-password   | Cambio de contraseña               | JWT         |
| POST   | /api/auth/logout            | Cierre de sesión                   | JWT         |
| GET    | /api/public/businesses      | Listar emprendimientos (vitrina)   | Pública     |
| GET    | /api/public/businesses/:slug| Perfil público de un negocio      | Pública     |
| GET    | /api/public/categories      | Categorías y subcategorías         | Pública     |
| GET    | /api/search                 | Búsqueda full-text                 | Pública     |
| GET    | /api/users                  | Listar usuarios                    | Admin       |
| POST   | /api/users                  | Crear emprendedor                  | Admin       |
| PUT    | /api/users/:id              | Editar usuario                     | Admin       |
| PATCH  | /api/users/:id/status       | Activar/desactivar cuenta          | Admin       |
| GET    | /api/businesses/me          | Mi microtienda                     | Entrepreneur|
| PUT    | /api/businesses/me          | Editar mi microtienda              | Entrepreneur|
| GET    | /api/products               | Productos de mi tienda             | Entrepreneur|
| POST   | /api/products               | Crear producto                     | Entrepreneur|
| PUT    | /api/products/:id           | Editar producto                    | Entrepreneur|
| DELETE | /api/products/:id           | Eliminar producto                  | Entrepreneur|
| GET    | /api/categories             | Listar categorías                  | Admin       |
| POST   | /api/categories             | Crear categoría                    | Admin       |
| GET    | /api/reviews                | Listar reseñas                     | Admin       |
| PATCH  | /api/reviews/:id/visibility | Ocultar/mostrar reseña             | Admin       |
| POST   | /api/reviews                | Crear reseña                       | Pública     |
| GET    | /api/pqrs                   | Listar PQRS                        | Admin       |
| POST   | /api/pqrs                   | Enviar PQRS                        | Pública     |
| PATCH  | /api/pqrs/:id/respond       | Responder PQRS                     | Admin       |
| GET    | /api/analytics/global       | Métricas globales                  | Admin       |
| GET    | /api/analytics/my-store     | Métricas de mi tienda              | Entrepreneur|
| POST   | /api/analytics/event        | Registrar evento                   | Pública     |
| GET    | /api/notifications          | Mis notificaciones                 | JWT         |
| PATCH  | /api/notifications/:id/read | Marcar como leída                  | JWT         |
| GET    | /api/health                 | Estado del servidor                | Pública     |

---

## Flujo de autenticación

```
POST /api/auth/login
Body: { email, password }
Response: { ok, token, user: { id, name, role, must_change_password } }

→ Si must_change_password = true: redirigir a cambio de contraseña
→ Guardar token en localStorage del frontend
→ Enviar en cada request: Authorization: Bearer <token>
```

---

## Convenciones de código

- Todas las respuestas JSON siguen el formato: `{ ok: boolean, message: string, data: any }`
- Paginación: `?page=1&limit=12`
- Los controllers solo manejan req/res — la lógica va en services
- Los services hacen las queries — usan el pool de db.js
- Errores se lanzan con `throw` y los captura errorHandler.js
