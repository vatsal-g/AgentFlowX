// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();
console.log("DB CONFIG:", {
  PG_USER: process.env.PG_USER,
  PG_DB: process.env.PG_DB,
  PG_HOST: process.env.PG_HOST,
  PG_PORT: process.env.PG_PORT,
});


const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DB || 'agentflowx',
  password: process.env.PG_PASS,
  port: process.env.PG_PORT || 5432,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

module.exports = { pool, query };
