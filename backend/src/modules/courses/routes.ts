import { FastifyInstance } from 'fastify';
import {
  listCoursesHandler,
  createCourseHandler,
  getCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
  publishCourseHandler,
  listEnrollmentsHandler,
  updateCurriculumHandler
} from './controller.js';

export async function courseRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', listCoursesHandler);
  fastify.post('/', createCourseHandler);
  fastify.get('/:id', getCourseHandler);
  fastify.put('/:id', updateCourseHandler);
  fastify.delete('/:id', deleteCourseHandler);
  fastify.post('/:id/publish', publishCourseHandler);
  fastify.get('/:id/enrollments', listEnrollmentsHandler);
  fastify.post('/:id/curriculum', updateCurriculumHandler);
}
