import { FastifyInstance } from 'fastify';
import {
  listMembersHandler,
  createMemberHandler,
  getMemberHandler,
  updateMemberHandler,
  deleteMemberHandler,
  getManagersHandler
} from './controller.js';

export async function memberRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/managers', getManagersHandler);
  fastify.get('/', listMembersHandler);
  fastify.post('/', createMemberHandler);
  fastify.get('/:id', getMemberHandler);
  fastify.put('/:id', updateMemberHandler);
  fastify.delete('/:id', deleteMemberHandler);
}
