import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { env } from '../config/env.js';

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

async function clerkPlugin(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.decorate('clerk', clerkClient);
fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      request.server.log.warn('Authentication failed: No Authorization header provided');
      return reply.status(401).send({ success: false, data: null, error: 'Unauthorized: No token provided' });
    }

    // Robust Bearer token extraction
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      request.server.log.warn('Authentication failed: Invalid Authorization header format');
      return reply.status(401).send({ success: false, data: null, error: 'Unauthorized: Invalid token format' });
    }

    const token = match[1];

    try {
      // Verify the Clerk JWT token using the official verification method
      // Using secretKey and optionally jwtKey (Public Key) for local verification
      const verifiedToken = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
        jwtKey: env.CLERK_JWT_PUBLIC_KEY || undefined,
      });

      if (!verifiedToken || !verifiedToken.sub) {
        throw new Error('Token verification succeeded but subject (sub) is missing');
      }

      request.user = verifiedToken.sub;
    } catch (verifyError: any) {
      request.server.log.error({ 
        message: verifyError.message,
        tokenPreview: token.substring(0, 10) + '...',
        stack: verifyError.stack 
      }, 'Clerk JWT verification failed');

      return reply.status(401).send({ 
        success: false, 
        data: null, 
        error: `Unauthorized: ${verifyError.message}` 
      });
    }
  } catch (error: any) {
    request.server.log.error({ err: error.message }, 'Unexpected authentication error');
    return reply.status(401).send({ success: false, data: null, error: 'Unauthorized: Authentication failed' });
  }
});

}

declare module 'fastify' {
  interface FastifyInstance {
    clerk: any;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: string;
  }
}

export default fp(clerkPlugin);
