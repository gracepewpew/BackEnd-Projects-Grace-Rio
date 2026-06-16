require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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
