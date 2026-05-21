import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendNotificationSchema, broadcastNotificationSchema } from './schema.js';

export async function listNotificationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const notifications = await request.server.prisma.notification.findMany();
  return reply.send({ success: true, data: notifications, error: null });
}

export async function sendNotificationHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = sendNotificationSchema.parse(request.body);
  const notification = await request.server.prisma.notification.create({ data: body });
  
  // Real-time notification via Socket.io
  request.server.io.to(body.userId).emit('notification', notification);

  return reply.status(201).send({ success: true, data: notification, error: null });
}

export async function markAsReadHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const notification = await request.server.prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
  return reply.send({ success: true, data: notification, error: null });
}

export async function broadcastNotificationHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = broadcastNotificationSchema.parse(request.body);
  
  const members = await request.server.prisma.member.findMany({ select: { id: true } });
  
  const notifications = await request.server.prisma.notification.createMany({
    data: members.map(m => ({ ...body, userId: m.id }))
  });

  request.server.io.emit('broadcast', body);

  return reply.send({ success: true, data: notifications, error: null });
}
