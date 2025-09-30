import fastify from 'fastify';

const server = fastify({ logger: true });

// CORS for testing
server.register(import('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  return { 
    status: 'healthy', 
    message: 'QOLAE Simulation Server is running',
    port: 3008,
    timestamp: new Date().toISOString()
  };
});

// Test PDF Manipulation endpoint (mock)
server.post('/documents/manipulate-pdf-signatures', async (request, reply) => {
  try {
    const { pin, lawyerData, signatureData } = request.body;
    
    if (!pin || !lawyerData || !signatureData) {
      return reply.code(400).send({
        success: false,
        error: 'PIN, lawyer data, and signature data are required'
      });
    }

    console.log(`🎯 PDF Manipulation for PIN: ${pin}`);
    console.log(`👤 Lawyer data:`, lawyerData);
    console.log(`✍️ Signature data:`, signatureData);

    // Mock successful response
    const result = {
      success: true,
      message: 'PDF manipulation completed successfully (MOCK)',
      pin: pin,
      downloadUrl: `/documents/${pin}/signed`,
      outputPath: `/central-repository/signed-tob/TOB_${pin}_Signed.pdf`,
      fileSize: 12345,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    return reply.send(result);
  } catch (error) {
    console.error('❌ Error manipulating PDF:', error);
    return reply.code(500).send({
      success: false,
      error: 'Failed to manipulate PDF',
      details: error.message
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = 3008;
    await server.listen({ port: port, host: '0.0.0.0' });
    console.log(`🚀 QOLAE Simulation Server running on http://localhost:${port}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   - GET  /health`);
    console.log(`   - POST /documents/manipulate-pdf-signatures`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
