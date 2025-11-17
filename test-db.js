require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB Connection Error:', err);
  } else {
    console.log('DB Connected:', res.rows[0]);
  }
  pool.end();
});
