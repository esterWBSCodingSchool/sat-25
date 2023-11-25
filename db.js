const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.ELEPHANTSQL_URL,
  });
  
  // Test the database connection
  pool.connect((err, client, done) => {
    if (err) {
      console.error('Error connecting to the database', err);
    } else {
      console.log('Connected to the database');
    }
  });

module.exports = pool;