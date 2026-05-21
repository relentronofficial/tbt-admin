import type { FastifyReply, FastifyRequest } from 'fastify';
import { createCourseSchema, updateCourseSchema } from './schema.js';

export async function listCoursesHandler(request: FastifyRequest, reply: FastifyReply) {
  const courses = await request.server.prisma.course.findMany();
  return reply.send({ success: true, data: courses, error: null });
}

export async function createCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createCourseSchema.parse(request.body);
  const courseId = `TBT-CRS-${Math.floor(1000 + Math.random() * 9000)}`;

  const course = await request.server.prisma.course.create({
    data: { ...body, courseId, curriculum: body.curriculum || {} } as any,
  });

  return reply.status(201).send({ success: true, data: course, error: null });
}

export async function getCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const course = await request.server.prisma.course.findUnique({ where: { id } });
  if (!course) return reply.status(404).send({ success: false, data: null, error: 'Course not found' });
  return reply.send({ success: true, data: course, error: null });
}

export async function updateCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const body = updateCourseSchema.parse(request.body);
  const course = await request.server.prisma.course.update({ where: { id }, data: body });
  return reply.send({ success: true, data: course, error: null });
}

export async function deleteCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await request.server.prisma.course.delete({ where: { id } });
  return reply.send({ success: true, data: null, error: null });
}

export async function publishCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const course = await request.server.prisma.course.update({ where: { id }, data: { status: 'Published' } });
  return reply.send({ success: true, data: course, error: null });
}

export async function listEnrollmentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const members = await request.server.prisma.member.findMany({
    where: { enrolledCourses: { has: id } }
  });
  return reply.send({ success: true, data: members, error: null });
}

export async function updateCurriculumHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { curriculum } = request.body as { curriculum: any };
  const course = await request.server.prisma.course.update({ where: { id }, data: { curriculum } });
  return reply.send({ success: true, data: course, error: null });
}
