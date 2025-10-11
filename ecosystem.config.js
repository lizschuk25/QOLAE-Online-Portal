// ecosystem.config.js
module.exports = {
    apps: [
      {
        name: 'qolae-api-dashboard',
        script: '/var/www/api.qolae.com/fastify_server.js',
        cwd: '/var/www/api.qolae.com',
        instances: 1,
        exec_mode: 'fork',
        env: {
          NODE_ENV: 'production',
          API_PORT: 3000
        },
        // Cache prevention settings
        watch: false,
        ignore_watch: ['node_modules', 'logs', '*.log'],
        max_memory_restart: '200M',
        restart_delay: 1000,
        exp_backoff_restart_delay: 100,
        min_uptime: '10s',
        max_restarts: 10
      },
      {
        name: 'qolae-backend',
        script: '/var/www/admin.qolae.com/backend/server.js',
        cwd: '/var/www/admin.qolae.com/backend',
        instances: 1,
        exec_mode: 'fork',
        env: {
          NODE_ENV: 'production',
          PORT: 3001
        },
        // Cache prevention settings
        watch: false,
        ignore_watch: ['node_modules', 'logs', '*.log'],
        max_memory_restart: '200M',
        restart_delay: 1000,
        exp_backoff_restart_delay: 100,
        min_uptime: '10s',
        max_restarts: 10
      },
      {
        name: 'qolae-lawyers-dashboard',
        script: '/var/www/lawyers.qolae.com/LawyersDashboard/server.js',
        cwd: '/var/www/lawyers.qolae.com/LawyersDashboard',
        instances: 1,
        exec_mode: 'fork',
        env: {
          NODE_ENV: 'production',
          PORT: 3002
        },
        // Cache prevention settings
        watch: false,
        ignore_watch: ['node_modules', 'logs', '*.log'],
        max_memory_restart: '200M',
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'qolae-lawyers-login',
      script: '/var/www/lawyers.qolae.com/LawyersLoginPortal/Lawyers_server.js',
      cwd: '/var/www/lawyers.qolae.com/LawyersLoginPortal',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      // Cache prevention settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      max_memory_restart: '200M',
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'qolae-websocket1',
      script: '/var/www/api.qolae.com/socketServer.js',
      cwd: '/var/www/api.qolae.com',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3003
      },
      // Cache prevention settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      max_memory_restart: '200M',
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'qolae-wslawyers',
      script: '/var/www/api.qolae.com/socketLawyers.js',
      cwd: '/var/www/api.qolae.com',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3005
      },  
      // Cache prevention settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      max_memory_restart: '200M',
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10
    },
  {
    name: 'qolae-cm-dashboard',
    script: 'cm_server.js',
    cwd: '/var/www/casemanagers.qolae.com/CaseManagersDashboard',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      // Cache prevention settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      max_memory_restart: '200M',
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10,
      error_file: '/var/log/pm2/qolae-cm-dashboard-error.log',
      out_file: '/var/log/pm2/qolae-cm-dashboard-out.log',
      log_date_format: 'DD-MM-YYYY HH:mm:ss Z'
    },

  {
    name: 'qolae-readers-dashboard',
    script: 'rd_server.js',
    cwd: '/var/www/readers.qolae.com/ReadersDashboard',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3008
      },
      // Cache prevention settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      max_memory_restart: '200M',
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10,
      error_file: '/var/log/pm2/qolae-readers-dashboard-error.log',
      out_file: '/var/log/pm2/qolae-readers-dashboard-out.log',
      log_date_format: 'DD-MM-YYYY HH:mm:ss Z'
    }
  ]
};

 