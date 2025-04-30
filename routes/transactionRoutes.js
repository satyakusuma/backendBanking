import { Router } from 'express';
import {
  createTransactionIn,
  createTransactionOut,
  getTransactions,
  getTransactionById,
  getBalance,
} from '../controllers/transactionController.js';
import { authenticateToken, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

console.log('Mendaftarkan rute transaksi...');

// Transaksi masuk (hanya nasabah)
router.post('/in', authenticateToken, restrictTo(['nasabah']), createTransactionIn);

// Transaksi keluar (hanya nasabah)
router.post('/out', authenticateToken, restrictTo(['nasabah']), createTransactionOut);

// Daftar transaksi (nasabah: sendiri, admin/karyawan: semua)
router.get('/', authenticateToken, getTransactions);

// Saldo (nasabah: sendiri, admin/karyawan: semua)
router.get('/balance', authenticateToken, getBalance);

// Detail transaksi (nasabah: sendiri, admin/karyawan: semua)
router.get('/:id', authenticateToken, getTransactionById);

export default router;