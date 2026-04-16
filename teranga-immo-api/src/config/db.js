// src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || 'localhost',
  port:     process.env.MYSQLPORT     || 3306,
  user:     process.env.MYSQLUSER     || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connecté - base : ' + process.env.MYSQLDATABASE);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur MySQL :', err.message);
    process.exit(1);
  });

module.exports = pool;
