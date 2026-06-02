import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { env } from '../config/env.js';

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

// Shared JWT extraction + verification logic used by both decorators.
async function extractAndVerifyClerkToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    reply.status(401).send({ success: false, data: null, error: 'Unauthorized: No token provided' });
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    reply.status(401).send({ success: false, data: null, error: 'Unauthorized: Invalid token format' });
    return null;
  }

  try {
    const verifiedToken = await verifyToken(match[1], {
      secretKey: env.CLERK_SECRET_KEY,
      jwtKey: env.CLERK_JWT_PUBLIC_KEY || undefined,
    });

    if (!verifiedToken?.sub) {
      throw new Error('Token subject (sub) is missing');
    }

    return verifiedToken.sub;
  } catch (err: any) {
    request.server.log.error({ message: err.message }, 'Clerk JWT verification failed');
    reply.status(401).send({ success: false, data: null, error: `Unauthorized: ${err.message}` });
    return null;
  }
}

async function clerkPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.decorate('clerk', clerkClient);

  // ── Admin auth ─────────────────────────────────────────────────────────────
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const clerkId = await extractAndVerifyClerkToken(request, reply);
      if (!clerkId) return;
      request.user = clerkId;
    } catch (error: any) {
      request.server.log.error({ err: error.message }, 'Unexpected authentication error');
      return reply.status(401).send({ success: false, data: null, error: 'Unauthorized: Authentication failed' });
    }
  });

  // ── Member (user web app) auth ─────────────────────────────────────────────
  fastify.decorate('authenticateUser', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const clerkId = await extractAndVerifyClerkToken(request, reply);
      if (!clerkId) return;

      // Look up the Member record linked to this Clerk user.
      const member = await fastify.prisma.member.findFirst({
        where: { clerkId } as any,
        select: { id: true, status: true },
      });

      if (!member) {
        return reply.status(401).send({
          success: false,
          data: null,
          error: 'Unauthorized: No member account linked to this Clerk user',
        });
      }

      if (member.status !== 'active') {
        return reply.status(403).send({
          success: false,
          data: null,
          error: `Forbidden: Account is ${member.status}`,
        });
      }

      request.user = clerkId;
      request.memberId = member.id;
    } catch (error: any) {
      request.server.log.error({ err: error.message }, 'Unexpected user authentication error');
      return reply.status(401).send({ success: false, data: null, error: 'Unauthorized: Authentication failed' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    clerk: any;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: string;
    memberId: string;
  }
}

export default fp(clerkPlugin);
