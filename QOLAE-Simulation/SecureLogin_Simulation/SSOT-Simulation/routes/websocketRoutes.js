import WebSocket from 'ws';

export default async function (fastify, opts) {
  
  // WebSocket health check
  fastify.get('/health', async (request, reply) => {
    return {
      service: 'websocket',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: process.env.WS_PORT || 3003
    };
  });

  // WebSocket server info
  fastify.get('/info', async (request, reply) => {
    return {
      service: 'websocket',
      description: 'Real-time communication service',
      endpoints: {
        ws: `ws://${request.hostname}:${process.env.WS_PORT || 3003}`,
        wss: `wss://${request.hostname}:${process.env.WS_PORT || 3003}`
      }
    };
  });

}; 