// ==============================================
// DATABASE CONNECTION CONFIGURATION
// ==============================================
// Purpose: PostgreSQL connection pool for HR Compliance Dashboard
// Author: Phoenix Agent
// Date: October 14, 2025
// Database: qolae_hrcompliance
// ==============================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// ==============================================
// DATABASE CONNECTION POOL CONFIGURATION
// ==============================================
const poolConfig = {
  connectionString: process.env.HRCOMPLIANCE_DATABASE_URL,

  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Query timeout
  query_timeout: 10000, // 10 seconds

  // Application name for monitoring
  application_name: 'QOLAE-HRCompliance-Dashboard'
};

// ==============================================
// CREATE CONNECTION POOL
// ==============================================
const pool = new Pool(poolConfig);

// ==============================================
// POOL EVENT HANDLERS
// ==============================================
pool.on('connect', (client) => {
  console.log('🔗 New client connected to HR Compliance database');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  console.log('🔌 Client removed from HR Compliance database pool');
});

// ==============================================
// DATABASE CONNECTION TEST
// ==============================================
export async function testDatabaseConnection() {
  try {
    console.log('\n🔍 === TESTING HR COMPLIANCE DATABASE CONNECTION ===');
    
    const client = await pool.connect();
    console.log('✅ Database connection established successfully');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Database Info:');
    console.log(`   Current Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].postgres_version.split(' ')[0]}`);
    
    // Test database exists and is accessible
    const dbResult = await client.query('SELECT current_database() as db_name');
    console.log(`   Database Name: ${dbResult.rows[0].db_name}`);
    
    client.release();
    console.log('✅ Database connection test completed successfully\n');
    
    return {
      success: true,
      database: dbResult.rows[0].db_name,
      version: result.rows[0].postgres_version.split(' ')[0],
      timestamp: result.rows[0].current_time
    };
    
  } catch (error) {
    console.error('❌ DATABASE CONNECTION TEST FAILED:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// ==============================================
// EXECUTE QUERY WITH ERROR HANDLING
// ==============================================
export async function executeQuery(queryText, params = []) {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Executing query: ${queryText.substring(0, 50)}...`);
    const result = await client.query(queryText, params);
    console.log(`✅ Query executed successfully (${result.rowCount} rows affected)`);
    return result;
  } catch (error) {
    console.error('❌ Query execution failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ==============================================
// TRANSACTION HELPER
// ==============================================
export async function executeTransaction(queries) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🔄 Starting database transaction');
    
    const results = [];
    for (const { query, params } of queries) {
      console.log(`🔍 Executing transaction query: ${query.substring(0, 50)}...`);
      const result = await client.query(query, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');
    
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ==============================================
// HEALTH CHECK
// ==============================================
export async function healthCheck() {
  try {
    const result = await executeQuery('SELECT 1 as health_check');
    return {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================
export async function closePool() {
  try {
    console.log('🔄 Closing HR Compliance database connection pool...');
    await pool.end();
    console.log('✅ Database connection pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
    throw error;
  }
}

// ==============================================
// EXPORT POOL FOR DIRECT ACCESS (IF NEEDED)
// ==============================================
export { pool };

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default {
  pool,
  testDatabaseConnection,
  executeQuery,
  executeTransaction,
  healthCheck,
  closePool
};
