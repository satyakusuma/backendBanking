import pkg from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';
import supabase from '../config/supabase.js';

const { sign } = pkg;

const validRoles = ['nasabah', 'karyawan', 'admin'];

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('Register attempt:', { email, role });

    // Validasi input
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, dan role diperlukan' });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }

    // Validasi JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET tidak didefinisikan di .env');
    }

    // Cek apakah email sudah terdaftar
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Supabase user check error:', userError);
      throw new Error(`Supabase error: ${userError.message}`);
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Simpan user ke Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, role }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Buat JWT token
    const token = sign(
      { userId: data[0].id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: { id: data[0].id, email, role }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat registrasi' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password diperlukan' });
    }

    // Validasi JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET tidak didefinisikan di .env');
    }

    // Cari user di Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Verifikasi password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Buat JWT token
    const token = sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat login' });
  }
};

export const getProfile = async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user.email);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users for user:', req.user.email, 'with role:', req.user.role);
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, created_at');

    if (error) {
      console.error('Supabase fetch users error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log('Users fetched:', users);
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat mengambil daftar pengguna' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('Create user attempt by admin:', req.user.email, { email, role });

    // Validasi input
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, dan role diperlukan' });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }

    // Cek apakah email sudah terdaftar
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Supabase user check error:', userError);
      throw new Error(`Supabase error: ${userError.message}`);
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Simpan user ke Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, role }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    res.status(201).json({
      message: 'Pengguna berhasil dibuat',
      user: { id: data[0].id, email, role }
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat membuat pengguna' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    console.log('Update user attempt by admin:', req.user.email, { id, email, role });

    // Validasi input
    if (!email && !role) {
      return res.status(400).json({ error: 'Setidaknya email atau role harus disediakan' });
    }

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }

    // Cek apakah pengguna ada
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    // Jika email disediakan, cek apakah sudah digunakan oleh pengguna lain
    if (email) {
      const { data: emailCheck, error: emailError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Supabase email check error:', emailError);
        throw new Error(`Supabase error: ${emailError.message}`);
      }

      if (emailCheck) {
        return res.status(400).json({ error: 'Email sudah digunakan oleh pengguna lain' });
      }
    }

    // Update pengguna
    const updates = {};
    if (email) updates.email = email;
    if (role) updates.role = role;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    res.json({
      message: 'Pengguna berhasil diperbarui',
      user: { id: data[0].id, email: data[0].email, role: data[0].role }
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat memperbarui pengguna' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Delete user attempt by admin:', req.user.email, { id });

    // Cek apakah pengguna ada
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    // Hapus pengguna
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat menghapus pengguna' });
  }
};