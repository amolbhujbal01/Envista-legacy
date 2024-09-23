const mysql = require('mysql2');
const dbConfig = require('../config/dbConfig');

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
const MAX_RETRIES = 3;const RETRY_DELAY = 1000; // 1 second
 
const queryWithRetry = (sql, values, retries = 0) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, results) => {
      if (err) {
        if (retries < MAX_RETRIES && 
            (err.code === 'PROTOCOL_CONNECTION_LOST' || 
             err.code === 'ECONNREFUSED' || 
             err.code === 'ETIMEDOUT' || 
             err.code === 'ER_LOCK_DEADLOCK')) {
          console.warn(`Query failed. Retrying (${retries + 1}/${MAX_RETRIES})...`, err);
          setTimeout(() => {
            resolve(queryWithRetry(sql, values, retries + 1));
          }, RETRY_DELAY);
        } else { 
          return reject(err);
        }
      } else {
        resolve(results);
      }
    });
  });
};

process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('MySQL pool closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MySQL pool:', err);
    process.exit(1);
  }
});

module.exports = {
    query: queryWithRetry
};
