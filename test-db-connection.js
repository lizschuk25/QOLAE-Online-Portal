import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'QOLAE-Simulation/SecureLogin_Simulation/LawyersDashboard/simulation.env') });

console.log('🔍 Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

try {
  const result = await pool.query('SELECT pin, "contactName", "lawFirm" FROM "Lawyer" WHERE pin = $1', ['HC-002164']);
  console.log('✅ Query successful!');
  console.log('Result:', result.rows);
} catch (error) {
  console.error('❌ Database error:', error);
} finally {
  await pool.end();
}

