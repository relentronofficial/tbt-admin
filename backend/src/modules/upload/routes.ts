import { FastifyInstance } from 'fastify';
import { getPresignedUrlHandler } from './controller.js';

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/presigned-url', getPresignedUrlHandler);
}
