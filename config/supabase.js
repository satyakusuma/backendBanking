import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL dan SUPABASE_KEY harus didefinisikan di .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test koneksi Supabase
supabase.from('users').select('id').limit(1).then(({ error }) => {
  if (error) console.error('Supabase connection error:', error);
  else console.log('Supabase connected successfully');
});

export default supabase;