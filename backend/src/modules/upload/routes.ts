import { FastifyInstance } from 'fastify';
import { getPresignedUrlHandler, createBunnyVideoHandler } from './controller.js';

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/presigned-url', getPresignedUrlHandler);
  fastify.post('/bunny-video-create', createBunnyVideoHandler);
}
