const { pool } = require('../server'); // Import from server.js export

class User {
  static async findByEmail(email) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  }

  static async create(userData) {
  const { username, email, password_hash, phone, role, referredBy } = userData;
  const referralCode = 'TP' + Math.random().toString(36).substr(2, 8).toUpperCase();
  const res = await pool.query(
    'INSERT INTO users (username, email, password_hash, phone, role, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [username, email, password_hash, phone, role || 'student', referralCode, referredBy || null]
  );
  return res.rows[0];
}

  static async updateBalance(userId, amount) {
    const res = await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance', [amount, userId]);
    return res.rows[0]?.balance;
  }

  // Add more methods as needed (e.g., findById, getReferrals)
}

module.exports = User;
