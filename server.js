require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');

const ensureDatabase = require('./src/config/ensureDatabase');
const { sequelize } = require('./src/models');
const apiRoutes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const seedInitialData = require('./src/utils/seed');
const swaggerDocument = require('./src/docs/swagger');
const { initSocket } = require('./src/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8888;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { message: 'Terlalu banyak request. Coba lagi nanti.' }
});
app.use('/api/auth', authLimiter);

app.use(express.static(path.join(__dirname, 'public')));

function adminOnlyApiDocs(req, res, next) {
  if (req.path !== '/' && req.path !== '') return next();
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
    if (!token) throw new Error('no token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clinic-secret');
    if (decoded.role !== 'admin') throw new Error('not admin');
    next();
  } catch {
    return res.status(403).send(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Akses Ditolak</title><link href="/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet"></head><body class="d-flex align-items-center justify-content-center vh-100 bg-light"><div class="text-center p-5"><h2 class="fw-bold text-danger mb-3">Akses Ditolak</h2><p class="text-muted mb-4">Dokumentasi API hanya dapat diakses oleh <strong>Admin</strong>.</p><a href="/login.html" class="btn btn-primary">← Kembali ke Login</a></div></body></html>`);
  }
}

app.use('/api-docs', adminOnlyApiDocs, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', apiRoutes);

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Endpoint API tidak ditemukan.' });
  }
  return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use(errorHandler);

async function startServer() {
  try {
    await ensureDatabase();
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seedInitialData();
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Clinic UAS berjalan di http://localhost:${PORT}`);
      console.log(`Dashboard multi-user real-time: http://localhost:${PORT}/login.html`);
      console.log(`Dokumentasi REST API: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    process.exit(1);
  }
}

startServer();
