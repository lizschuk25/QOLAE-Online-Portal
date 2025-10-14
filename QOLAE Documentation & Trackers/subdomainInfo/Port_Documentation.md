# QOLAE Portal - Port Documentation

## 🔒 **Production Ports & Services**

### **Core Services**
| Port | Service Name | Purpose | Status | URL |
|------|--------------|---------|--------|-----|
| **3000** | qolae-api-dashboard |fastify_server.js | api.qolae.com ✅

| **3001** | qolae-backend | Admin Dashboard backend - server.js (admin.qolae.com/backend) | ✅ Active | https://admin.qolae.com |

| **3002** | qolae-lawyers-dashboard | Lawyers Dashboard - server.js (lawyers.qolae.com/LawyersDashboard) | ✅ |

| **3003** | qolae-websocket1 - socketServer.js | WebSocket server for real-time Lawyers Tracking Database updates | ✅ Active | (api.qolae.com)|

| **3004** | qolae-lawyers-login - Lawyers_server.js | Lawyers Login Portal (lawyers.qolae.com/LawyersLoginPortal) | ✅ Active
|
| **3005** | qolae-wslawyers - socketLawyers.js | websocket for Lawyers Dashboard for real-time updates| ✅ Active|


DATABASE SERVICES: 
**5432**| qolae_admin [socketServer.js (api.qolae.com) → connects to qolae_admin (your SSOT DB).]
**5432**| qolae_lawyers [socketLawyers.js (api.qolae.com)-> connects to qolae_lawyers (also SSOT DB).]

### **External Access**
| Service | External URL | Internal Port | Purpose |
|---------|--------------|---------------|---------|
| **Admin Dashboard** | https://admin.qolae.com | 3001 | Admin portal & lawyer management |
| **Lawyers Login** | https://lawyers.qolae.com | 3004 | Lawyer authentication portal |
| **Lawyers Dashboard** | TBD | 3002 | Secure legal document management |

## 🛡️ **Firewall Configuration**

### **Required Open Ports**
```bash
# WebSocket (Real-time updates)
3003 - WebSocket server

# Backend Services
3000 - API Dashboard backend - fastify_server.js (api.qolae.com) qolae-api-dashboard
3001 - Admin Dashboard backend (admin.qolae.com) server.js - qolae-backend
3002 - Lawyers Dashboard backend (lawyers.qolae.com) qolae-lawyers-dashboard - server.js
3003 - Websocket (api.qolae.com) qolae-websocket1 - socketServer.js (LawyersTrackingDatabase) and PostgreSQL

3004 - Lawyers Login Portal (lawyers.qolae.com) qolae-lawyers-login

3005 - Websocket Lawyers - socketLawyers.js) qolae-wslawyers(api.qolae.com) 

LawyersDashboard and PostgreSQL - qolae_admin, qolae_lawyers, qolae_readers, qolae_casemanagers, qolae_clients

3006 - CaseManagers-Dashboard (casemanagers.qolae.com) qolae-cm-dashboard - server.js
3007 - cm websocket
3008 - Readers-Dashboard (readers.qolae.com) qolae-readers - 
3009 - readers Websocket 
3010 - Clients-Dashboard (clients.qolae.com) qolae-clients 
3011 - clients websocket
3012 - hrCompliance-Dashboard (hrcompliance.qolae.com) qolae-hrcompliance
3013 - hrcompliance websocket (yet to be allocated) 

# Standard Web Ports
80   - HTTP (redirected to HTTPS)
443  - HTTPS (SSL/TLS)
```

### **Firewall Rules**
```bash
# Allow internal communication between services
ufw allow from 127.0.0.1 to any port 3001
ufw allow from 127.0.0.1 to any port 3002
ufw allow from 127.0.0.1 to any port 3004

# Allow WebSocket connections
ufw allow from any to any port 3003

# Allow HTTPS traffic
ufw allow 443/tcp
```

## 🔍 **Service Discovery**

### **Check Active Services**
```bash
# List all PM2 processes
pm2 list

# Check specific ports
netstat -tlnp | grep :300
ss -tlnp | grep :300

# Test service connectivity
curl -I http://localhost:3001
curl -I http://localhost:3002
curl -I http://localhost:3004
```

### **Service Health Check**
```bash
# Admin Dashboard
curl -I https://admin.qolae.com

# Lawyers Login Portal
curl -I https://lawyers.qolae.com

# Lawyers Dashboard (internal)
curl -I http://localhost:3002/lawyers-dashboard
```

## 📊 **Service Dependencies**

### **Authentication Flow**
```
LawyersLoginPortal (3004) → LawyersDashboard (3002)
     ↓
Admin Dashboard (3001) ← Centralized API
     ↓
WebSocket (3003) ← Real-time updates
```

### **Database Connections**
- **Admin Dashboard (3001)**: Direct PostgreSQL access
- **LawyersLoginPortal (3004)**: Centralized API calls to admin.qolae.com
- **LawyersDashboard (3002)**: Shared PostgreSQL via centralized API

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Port 3005 Unknown**: Now available for future services
2. **Firewall Blocks**: Ensure all required ports are open
3. **Service Conflicts**: Check for port conflicts with `netstat -tlnp`

### **Service Restart Commands**
```bash
# Restart specific service
pm2 restart qolae-backend
pm2 restart qolae-lawyers-login
pm2 restart qolae-lawyers-dashboard
pm2 restart qolae-websocket

# Restart all services
pm2 restart all

# Save PM2 configuration
pm2 save
```

## 📝 **Notes**

### **Available Ports**
- **Port 3000**: Available for future service
- **Port 3005**: Available for future service
- **Action**: Reserve these ports for future QOLAE services
- **Documentation**: Update when new services are deployed

### **Security Considerations**
- All services use JWT authentication
- Internal communication on localhost
- External access via HTTPS only
- WebSocket connections for real-time features

### **Backup & Recovery**
- PM2 configuration saved to `/root/.pm2/dump.pm2`
- Auto-start enabled via systemd
- Process monitoring and restart capabilities

---

**Last Updated**: July 31, 2025  
**Maintained By**: Liz Chukwu  
**Version**: 1.1 