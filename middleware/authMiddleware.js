import pkg from 'jsonwebtoken';

const { verify } = pkg;

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ error: 'Token diperlukan' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not defined');
    return res.status(500).json({ error: 'JWT_SECRET tidak didefinisikan' });
  }

  verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(403).json({ error: 'Token tidak valid' });
    }
    req.user = user;
    next();
  });
};

export const restrictTo = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    console.error(`Access denied: User role ${req.user.role} not in allowed roles ${roles}`);
    return res.status(403).json({ error: 'Akses ditolak: Role tidak diizinkan' });
  }
  next();
};