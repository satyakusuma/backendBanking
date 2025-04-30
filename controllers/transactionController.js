import supabase from '../config/supabase.js';

export const createTransactionIn = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.userId;

    console.log('Create transaction in attempt:', { userId, amount, description });

    // Validasi input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Jumlah harus lebih besar dari 0' });
    }

    // Tambah transaksi masuk
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{ user_id: userId, type: 'masuk', amount, description }])
      .select()
      .single();

    if (transactionError) {
      console.error('Supabase transaction insert error:', transactionError);
      throw new Error(`Supabase error: ${transactionError.message}`);
    }

    // Update saldo
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Supabase user fetch error:', userError);
      throw new Error(`Supabase error: ${userError.message}`);
    }

    const newBalance = user.balance + amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase balance update error:', updateError);
      throw new Error(`Supabase error: ${updateError.message}`);
    }

    res.status(201).json({
      message: 'Transaksi masuk berhasil',
      transaction: {
        id: transaction.id,
        user_id: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        created_at: transaction.created_at,
      },
      newBalance,
    });
  } catch (error) {
    console.error('Create transaction in error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat membuat transaksi masuk' });
  }
};

export const createTransactionOut = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.userId;

    console.log('Create transaction out attempt:', { userId, amount, description });

    // Validasi input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Jumlah harus lebih besar dari 0' });
    }

    // Cek saldo
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Supabase user fetch error:', userError);
      throw new Error(`Supabase error: ${userError.message}`);
    }

    if (user.balance <= 0 || user.balance < amount) {
      return res.status(400).json({ error: 'Saldo tidak cukup untuk transaksi ini' });
    }

    // Tambah transaksi keluar
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{ user_id: userId, type: 'keluar', amount, description }])
      .select()
      .single();

    if (transactionError) {
      console.error('Supabase transaction insert error:', transactionError);
      throw new Error(`Supabase error: ${transactionError.message}`);
    }

    // Update saldo
    const newBalance = user.balance - amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase balance update error:', updateError);
      throw new Error(`Supabase error: ${updateError.message}`);
    }

    res.status(201).json({
      message: 'Transaksi keluar berhasil',
      transaction: {
        id: transaction.id,
        user_id: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        created_at: transaction.created_at,
      },
      newBalance,
    });
  } catch (error) {
    console.error('Create transaction out error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat membuat transaksi keluar' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { user_id } = req.query;
    const requesterRole = req.user.role;
    const requesterId = req.user.userId;

    console.log('Fetching transactions for:', { user_id, requesterRole, requesterId });

    let query = supabase.from('transactions').select('id, user_id, type, amount, description, created_at');

    // Nasabah hanya bisa melihat transaksi mereka sendiri
    if (requesterRole === 'nasabah') {
      query = query.eq('user_id', requesterId);
    } else if (user_id && ['admin', 'karyawan'].includes(requesterRole)) {
      // Admin/karyawan bisa memfilter berdasarkan user_id
      query = query.eq('user_id', user_id);
    } else if (!['admin', 'karyawan'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    const { data: transactions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch transactions error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat mengambil daftar transaksi' });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = req.user.role;
    const requesterId = req.user.userId;

    console.log('Fetching transaction by ID:', { id, requesterRole, requesterId });

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('id, user_id, type, amount, description, created_at')
      .eq('id', id)
      .single();

    if (error || !transaction) {
      console.error('Supabase fetch transaction error:', error);
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    // Nasabah hanya bisa melihat transaksi mereka sendiri
    if (requesterRole === 'nasabah' && transaction.user_id !== requesterId) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak diizinkan melihat transaksi ini' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction by ID error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat mengambil detail transaksi' });
  }
};

export const getBalance = async (req, res) => {
  try {
    const { user_id } = req.query;
    const requesterRole = req.user.role;
    const requesterId = req.user.userId;

    console.log('Fetching balance for:', { user_id, requesterRole, requesterId });

    let query = supabase.from('users').select('id, email, balance');

    // Nasabah hanya bisa melihat saldo mereka sendiri
    if (requesterRole === 'nasabah') {
      query = query.eq('id', requesterId);
    } else if (user_id && ['admin', 'karyawan'].includes(requesterRole)) {
      // Admin/karyawan bisa memfilter berdasarkan user_id
      query = query.eq('id', user_id);
    } else if (!['admin', 'karyawan'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Supabase fetch balance error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (users.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const balanceInfo = users.map((user) => ({
      user_id: user.id,
      email: user.email,
      balance: user.balance,
    }));

    res.json({ balances: balanceInfo });
  } catch (error) {
    console.error('Get balance error:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat mengambil saldo' });
  }
};