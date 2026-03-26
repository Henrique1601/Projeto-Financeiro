const { pool } = require('../config/database');

const getOne = async (sql, params) => {
  const { rows } = await pool.query(sql, params);
  return rows[0];
};

const run = async (sql, params) => {
  const result = await pool.query(sql, params);
  return result.rows[0]?.id || result.rowCount;
};

const getAll = async (sql, params) => {
  const { rows } = await pool.query(sql, params);
  return rows;
};

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getOne, run, getAll, withTransaction };
