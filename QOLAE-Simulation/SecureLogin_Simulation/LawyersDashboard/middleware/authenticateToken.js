import jwt from 'jsonwebtoken';

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (request, reply) => {
    // Look for the token in Authorization header only
  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];  // Token from Authorization header

  if (!token) {
    return reply.code(401).send({ error: 'Access token required' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, JWT_SECRET);  // Verify the token
    request.user = decoded;  // Attach the decoded user info to the request
    return reply.continue();  // Continue with the request to the protected route
  } catch (err) {
    return reply.code(403).send({ error: 'Invalid token' });  // If token is invalid or expired
  }
};

export default authenticateToken;
