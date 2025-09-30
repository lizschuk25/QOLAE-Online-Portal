// controllers/authController.js

import prisma from '../utils/prisma.js'  // adjust path if needed
import crypto from 'crypto'

export async function generateAuthToken(req, reply) {
  const { email, method, pin } = req.body

  console.log('🔐 generateAuthToken called with:', { email, method, pin })

  if (!email || !method) {
    return reply.code(400).send({ error: 'Missing email or method' })
  }

  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex')

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

  try {
    console.log('🔐 Attempting to create authVerificationToken...')
    
    const result = await prisma.authVerificationToken.create({
      data: {
        email,
        method,
        pin: pin || null,
        token,
        used: false,
        expiresAt,
      },
    })

    console.log('✅ AuthVerificationToken created successfully:', result.id)
    reply.send({ success: true, token }) // or trigger redirect
  } catch (err) {
    console.error('❌ Error creating auth token:', err)
    console.error('❌ Error details:', err.message)
    console.error('❌ Error code:', err.code)
    reply.code(500).send({ error: 'Server error', details: err.message })
  }
}
