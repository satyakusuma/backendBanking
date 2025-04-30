import { Router } from 'express';
import { register, login, getProfile, getAllUsers, createUser, updateUser, deleteUser } from '../controllers/authController.js';
import { authenticateToken, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

console.log('Mendaftarkan rute autentikasi...');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, restrictTo(['admin']), getAllUsers);
router.post('/users', authenticateToken, restrictTo(['admin']), createUser);
router.patch('/users/:id', authenticateToken, restrictTo(['admin']), updateUser);
router.delete('/users/:id', authenticateToken, restrictTo(['admin']), deleteUser);

export default router;