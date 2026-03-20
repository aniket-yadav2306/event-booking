'use strict';

const mysql = require('mysql2/promise');

let pool;

async function initDB() {
  try {
    // 1️⃣ Connect WITHOUT database
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });

    console.log("✅ Connected to MySQL");

    // 2️⃣ Create DB if not exists
    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
    );

    console.log("✅ Database ready");

    await tempConnection.end();

    // 3️⃣ Create pool WITH database
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'event_booking',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
    });

    console.log("✅ Connected to DB pool");

  } catch (err) {
    console.error("❌ DB Init Failed:", err.message);
    process.exit(1);
  }
}

// getter (important)
function getPool() {
  if (!pool) {
    throw new Error("Pool not initialized. Call initDB first.");
  }
  return pool;
}

module.exports = { initDB, getPool };