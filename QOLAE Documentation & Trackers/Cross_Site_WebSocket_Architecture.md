# 🌐 Cross-Site WebSocket Architecture for QOLAE

## **🏗️ Current Architecture**

```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│ admin.qolae.com │ ←──────────────────→ │  api.qolae.com  │
│ (Admin Dashboard)│                      │ (Backend + WS)  │
└─────────────────┘                      └─────────────────┘
                                                │
                                                │ HTTP/WebSocket
                                                ▼
                                       ┌─────────────────┐
                                       │ lawyers.qolae.com│
                                       │ (Lawyers Dashboard)│
                                       └─────────────────┘
```

## **🎯 Why api.qolae.com is Perfect for WebSockets**

### **✅ Advantages:**
1. **Centralized Backend** - All business logic in one place
2. **Direct Database Access** - No proxy needed
3. **Single WebSocket Server** - Easier to manage
4. **Consistent Data** - All sites get same real-time updates
5. **Better Security** - One authentication point

### **🔧 How Cross-Site Communication Works:**

## **📡 WebSocket Connection Strategy**

### **For Each Site:**

**1. Admin Dashboard (admin.qolae.com):**
```javascript
// Connect to api.qolae.com WebSocket
socket = io('https://api.qolae.com:3003', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
```

**2. Lawyers Dashboard (lawyers.qolae.com):**
```javascript
// Same connection to api.qolae.com
socket = io('https://api.qolae.com:3003', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
```

**3. API Server (api.qolae.com):**
```javascript
// WebSocket server handles all connections
fastify.io.on('connection', (socket) => {
  // Route to appropriate room based on user type
  if (isAdminUser(socket)) {
    socket.join('admin-dashboard');
  } else if (isLawyerUser(socket)) {
    socket.join('lawyers-dashboard');
  }
});
```

## **🏠 Room-Based Communication**

### **Separate Rooms for Different User Types:**

```javascript
// Admin-specific events
socket.on('admin-workflow-update', (data) => {
  fastify.io.to('admin-dashboard').emit('workflow-update', data);
});

// Lawyer-specific events  
socket.on('lawyer-document-access', (data) => {
  fastify.io.to('lawyers-dashboard').emit('document-available', data);
});

// Cross-site events (when admin action affects lawyer)
socket.on('admin-completes-workflow', (data) => {
  // Notify both admin and lawyer
  fastify.io.to('admin-dashboard').emit('workflow-complete', data);
  fastify.io.to('lawyers-dashboard').emit('documents-ready', data);
});
```

## **🔐 Security & Authentication**

### **CORS Configuration (Already Done):**
```javascript
fastify.register(fastifyIO, {
  cors: {
    origin: [
      'https://admin.qolae.com',
      'https://api.qolae.com', 
      'https://lawyers.qolae.com',
      'https://clients.qolae.com',
      'https://casemanagers.qolae.com',
      'https://readers.qolae.com',
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### **Authentication Strategy:**
```javascript
// Each site sends authentication token
socket.on('authenticate', (token) => {
  const user = verifyToken(token);
  if (user) {
    socket.userId = user.id;
    socket.userType = user.type; // 'admin', 'lawyer', etc.
    socket.join(`${user.type}-dashboard`);
  }
});
```

## **📋 Implementation Plan**

### **Phase 1: Admin Dashboard (Current)**
- ✅ WebSocket server on api.qolae.com
- ✅ Admin dashboard connects to api.qolae.com
- ✅ Real-time workflow updates

### **Phase 2: Lawyers Dashboard**
- 🔄 Add WebSocket client to lawyers.qolae.com
- 🔄 Connect to same api.qolae.com WebSocket server
- 🔄 Real-time document availability notifications

### **Phase 3: Cross-Site Events**
- 🔄 Admin actions trigger lawyer notifications
- 🔄 Lawyer actions trigger admin updates
- 🔄 Real-time status synchronization

## **🎯 Benefits of This Architecture**

### **For You (Admin):**
- ✅ **Real-time workflow updates** - See when lawyers access documents
- ✅ **Instant notifications** - Know when workflows complete
- ✅ **Live status tracking** - Monitor all sites from one place

### **For Lawyers:**
- ✅ **Instant document access** - No need to refresh page
- ✅ **Real-time notifications** - Know when documents are ready
- ✅ **Live status updates** - See workflow progress

### **For System:**
- ✅ **Single source of truth** - All data flows through api.qolae.com
- ✅ **Easier maintenance** - One WebSocket server to manage
- ✅ **Better performance** - Direct database access
- ✅ **Consistent experience** - Same real-time features across all sites

## **🚀 Next Steps**

### **Immediate (What we've done):**
1. ✅ WebSocket server on api.qolae.com
2. ✅ Admin dashboard integration
3. ✅ Real-time workflow updates

### **Future (When you're ready):**
1. 🔄 Add WebSocket client to lawyers.qolae.com
2. 🔄 Implement cross-site notifications
3. 🔄 Add real-time document access tracking

## **💡 Key Insight**

**You don't need separate WebSocket servers!** One server on `api.qolae.com` can handle all your sites. This is actually the **best practice** because:

- **Simpler architecture** - One server to maintain
- **Better performance** - Direct database access
- **Easier debugging** - All WebSocket traffic in one place
- **Consistent data** - All sites get same real-time updates

**Your current setup is perfect for scaling to multiple sites!** 🎯 