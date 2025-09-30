// QOLAE Secure Login Simulation Test Script
// Purpose: Test the professional authentication flow

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 Starting QOLAE Secure Login Simulation Test...\n');

// Test data
const testLawyers = [
  {
    pin: 'HC-002164',
    email: 'judith.henriksson@henriksson-cluster.com',
    name: 'Judith Henriksson',
    firm: 'Henriksson & Cluster LLP'
  },
  {
    pin: 'MF-001583', 
    email: 'james.fry@macaffety-fry.com',
    name: 'James Fry',
    firm: 'Macaffety & Fry LLP'
  }
];

console.log('📋 Test Lawyers:');
testLawyers.forEach(lawyer => {
  console.log(`   ${lawyer.pin} - ${lawyer.name} (${lawyer.firm})`);
});

console.log('\n🚀 Starting servers...\n');

// Start Login Portal (port 3004)
const loginPortal = spawn('node', ['LawyersLoginPortal/Lawyers_server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

loginPortal.stdout.on('data', (data) => {
  console.log(`[Login Portal] ${data.toString().trim()}`);
});

loginPortal.stderr.on('data', (data) => {
  console.log(`[Login Portal ERROR] ${data.toString().trim()}`);
});

// Start Dashboard (port 3002)
const dashboard = spawn('node', ['LawyersDashboard/server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

dashboard.stdout.on('data', (data) => {
  console.log(`[Dashboard] ${data.toString().trim()}`);
});

dashboard.stderr.on('data', (data) => {
  console.log(`[Dashboard ERROR] ${data.toString().trim()}`);
});

// Wait for servers to start
setTimeout(() => {
  console.log('\n✅ Servers started!');
  console.log('\n📋 Test URLs:');
  console.log('   Login Portal: http://localhost:3004');
  console.log('   Dashboard: http://localhost:3002');
  console.log('\n🎯 Test Flow:');
  console.log('   1. Go to: http://localhost:3004');
  console.log('   2. Enter PIN: HC-002164 or MF-001583');
  console.log('   3. Enter email: judith.henriksson@henriksson-cluster.com or james.fry@macaffety-fry.com');
  console.log('   4. Complete 2FA flow');
  console.log('   5. Set up password in Secure Login');
  console.log('   6. Access Dashboard');
  
  console.log('\n⏹️  Press Ctrl+C to stop servers\n');
}, 3000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  loginPortal.kill();
  dashboard.kill();
  process.exit(0);
});

// Handle errors
loginPortal.on('error', (err) => {
  console.error('❌ Login Portal error:', err);
});

dashboard.on('error', (err) => {
  console.error('❌ Dashboard error:', err);
});
