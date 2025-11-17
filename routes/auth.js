const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../server'); // Add this import
const User = require('../models/user');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, referralCode } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    let referredBy = null;
    if (referralCode) {
      const referrerRes = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (referrerRes.rows[0]) {
        referredBy = referrerRes.rows[0].id;
      }
    }
    // Pass referredBy to create
    const user = await User.create({ username, email, password_hash, phone, referredBy });
    if (referredBy) {
      await pool.query('INSERT INTO referrals (referrer_id, referred_id) VALUES ($1, $2)', [referredBy, user.id]);
      await User.updateBalance(referredBy, parseFloat(process.env.REFERRAL_REWARD)); // Reward Ksh.250
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username, email, balance: user.balance } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email, balance: user.balance, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
