require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
      phone VARCHAR(20),
      balance DECIMAL(10,2) DEFAULT 0.00,
      is_verified BOOLEAN DEFAULT FALSE,
      referral_code VARCHAR(20) UNIQUE,
      referred_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL, -- 'mentorship', 'referral'
      amount DECIMAL(10,2) NOT NULL,
      mpesa_code VARCHAR(50),
      bank_tx_code VARCHAR(50),
      screenshot_url VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
      verified_by INTEGER REFERENCES users(id), -- admin/mentor
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      reward_paid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      url VARCHAR(500) NOT NULL,
      thumbnail_url VARCHAR(255),
      uploaded_by INTEGER REFERENCES users(id),
      is_public BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      sender_type VARCHAR(20) CHECK (sender_type IN ('mentor', 'student')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      processed_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS admin_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      updated_by INTEGER REFERENCES users(id),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  -- Insert defaults
  INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('help_phone', '+254798183277'), 
  ('theme', 'dark') 
  ON CONFLICT (setting_key) DO NOTHING;
  `,
  `
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
  `
];

async function runMigrations() {
  try {
    const client = await pool.connect();
    console.log('Running migrations...');
    for (const migration of migrations) {
      await client.query(migration);
      console.log('Migration executed.');
    }
    client.release();
    console.log('All migrations complete!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

runMigrations();
