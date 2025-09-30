import path from 'path';
import fs from 'fs-extra';

export default async function (fastify, opts) {
  fastify.register(await import('@fastify/multipart'));

  // Upload signed TOB (GDPR PROTECTED)
  fastify.post('/documents/upload/tob-signed/:pin', { 
    preHandler: [fastify.requireDocumentConsent()] 
  }, async function (request, reply) {
    const { pin } = request.params;
    
    // ✅ GDPR consent verified - add compliance headers
    fastify.gdprFirewall.addGDPRHeaders(reply, request.gdprConsent);
    
    // 📝 GDPR Audit Log
    fastify.log.info({
      event: 'document_upload_attempt',
      pin: pin,
      documentType: 'signed_tob',
      ip: request.ip,
      gdpr_category: 'document_processing'
    });
    
    const parts = request.parts();

    for await (const part of parts) {
      if (part.file && part.mimetype === 'application/pdf') {
        const fileName = `TOB_${pin}_signed.pdf`;
        const uploadDir = path.join(process.cwd(), 'central-repository', 'signed');

        await fs.ensureDir(uploadDir);

        const destination = path.join(uploadDir, fileName);
        await fs.writeFile(destination, await part.toBuffer());

        // 📝 GDPR Audit Log - Success
        fastify.log.info({
          event: 'document_upload_success',
          pin: pin,
          documentType: 'signed_tob',
          filePath: destination,
          gdpr_compliance: 'verified'
        });

        return reply.send({ success: true, file: fileName });
      }
    }

    return reply.code(400).send({ error: 'No valid PDF file uploaded' });
  });

  // Serve signed TOB (GDPR PROTECTED)
  fastify.get('/documents/signed/:filename', { 
    preHandler: [fastify.requireDocumentConsent()] 
  }, async (request, reply) => {
    const { filename } = request.params;
    
    // ✅ GDPR consent verified - add compliance headers
    fastify.gdprFirewall.addGDPRHeaders(reply, request.gdprConsent);
    
    const filePath = path.join(process.cwd(), 'central-repository', 'signed', filename);

    try {
      if (!await fs.pathExists(filePath)) {
        // 📝 GDPR Audit Log - Access Denied
        fastify.log.warn({
          event: 'document_access_denied',
          filename: filename,
          reason: 'file_not_found',
          ip: request.ip,
          gdpr_category: 'document_access'
        });
        return reply.code(404).send({ error: 'File not found' });
      }

      // 📝 GDPR Audit Log - Access Granted
      fastify.log.info({
        event: 'document_access_granted',
        filename: filename,
        ip: request.ip,
        gdpr_compliance: 'verified'
      });

      const stream = fs.createReadStream(filePath);
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `inline; filename="${filename}"`);
      reply.header('X-GDPR-Document-Access', 'Medical Data - Explicit Consent Required');
      return reply.send(stream);
    } catch (err) {
      // 📝 GDPR Audit Log - System Error
      fastify.log.error({
        event: 'document_access_error',
        filename: filename,
        error: err.message,
        gdpr_risk: 'document_access_failure'
      });
      return reply.code(500).send({ error: 'Failed to serve document' });
    }
  });

  // Serve original TOB for preview by PIN (GDPR PROTECTED)
  fastify.get('/documents/preview-tob/:pin', { 
    preHandler: [fastify.requireDocumentConsent()] 
  }, async (request, reply) => {
    const { pin } = request.params;
    
    // ✅ GDPR consent verified - add compliance headers
    fastify.gdprFirewall.addGDPRHeaders(reply, request.gdprConsent);
    
    const fileName = `TOB_${pin}.pdf`;
    const filePath = path.join(process.cwd(), 'central-repository', 'original', fileName);

    try {
      if (!await fs.pathExists(filePath)) {
        // 📝 GDPR Audit Log - TOB Preview Not Found
        fastify.log.warn({
          event: 'tob_preview_not_found',
          pin: pin,
          ip: request.ip,
          gdpr_category: 'document_preview'
        });
        return reply.code(404).send({ error: 'TOB not found for this PIN' });
      }

      // 📝 GDPR Audit Log - TOB Preview Access
      fastify.log.info({
        event: 'tob_preview_access',
        pin: pin,
        ip: request.ip,
        gdpr_compliance: 'verified'
      });

      const stream = fs.createReadStream(filePath);
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `inline; filename="${fileName}"`);
      reply.header('X-GDPR-Document-Type', 'Terms of Business Preview');
      return reply.send(stream);
    } catch (err) {
      // 📝 GDPR Audit Log - Preview Error
      fastify.log.error({
        event: 'tob_preview_error',
        pin: pin,
        error: err.message,
        gdpr_risk: 'document_preview_failure'
      });
      return reply.code(500).send({ error: 'Failed to preview TOB' });
    }
  });
}