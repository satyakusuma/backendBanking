import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();
const port = 3000;

/*
// Middleware
app.use(cors({ origin: 'https://backend-banking.vercel.app' }));
app.use(json());
*/
// Izinkan semua origin (hanya untuk pengujian)
app.use(cors());
app.use(json());

// Log semua permintaan
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Handle 404
app.use((req, res) => {
  console.log(`404: Rute tidak ditemukan untuk ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Rute tidak ditemukan' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan server' });
});

/* Start server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});*/

export default app;