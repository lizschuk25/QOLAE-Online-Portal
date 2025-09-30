#!/bin/bash

# QOLAE Secure Login Simulation Test Script
# Purpose: Test the professional authentication flow

echo "🎯 Starting QOLAE Secure Login Simulation Test..."
echo ""

# Test data
echo "📋 Test Lawyers:"
echo "   HC-002164 - Judith Henriksson (Henriksson & Cluster LLP)"
echo "   MF-001583 - James Fry (Macaffety & Fry LLP)"
echo ""

echo "🚀 Starting servers..."
echo ""

# Start Login Portal (port 3010) in background
echo "Starting Login Portal on port 3010..."
cd LawyersLoginPortal
node Lawyers_server.js &
LOGIN_PID=$!
cd ..

# Start Dashboard (port 3009) in background  
echo "Starting Dashboard on port 3009..."
cd LawyersDashboard
node server.js &
DASHBOARD_PID=$!
cd ..

# Wait for servers to start
sleep 3

echo ""
echo "✅ Servers started!"
echo ""
echo "📋 Test URLs:"
echo "   Login Portal: http://localhost:3010"
echo "   Dashboard: http://localhost:3009"
echo ""
echo "🎯 Test Flow:"
echo "   1. Go to: http://localhost:3010"
echo "   2. Enter PIN: HC-002164 or MF-001583"
echo "   3. Enter email: judith.henriksson@henriksson-cluster.com or james.fry@macaffety-fry.com"
echo "   4. Complete 2FA flow"
echo "   5. Set up password in Secure Login"
echo "   6. Access Dashboard at http://localhost:3009"
echo ""
echo "⏹️  Press Ctrl+C to stop servers"
echo ""

# Wait for user to stop
wait

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $LOGIN_PID 2>/dev/null
    kill $DASHBOARD_PID 2>/dev/null
    exit 0
}

# Handle Ctrl+C
trap cleanup SIGINT

# Keep script running
while true; do
    sleep 1
done
