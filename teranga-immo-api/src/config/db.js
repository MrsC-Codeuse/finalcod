// src/config/db.js
// Connexion MySQL avec pool de connexions

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'teranga_immo',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: '+00:00',
});

// Test de connexion au démarrage
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL connecté — base de données : ' + process.env.DB_NAME);
    conn.release();
  })
  .catch(err => {
    console.error('❌  Erreur de connexion MySQL :', err.message);
    process.exit(1);
  });

module.exports = pool;
