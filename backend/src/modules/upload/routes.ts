import { FastifyInstance } from 'fastify';
import { getPresignedUrlHandler, createBunnyVideoHandler, deleteBunnyVideoHandler } from './controller.js';

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/presigned-url', getPresignedUrlHandler);
  fastify.post('/bunny-video-create', createBunnyVideoHandler);
  fastify.delete('/bunny-video/:videoId', deleteBunnyVideoHandler);
}
