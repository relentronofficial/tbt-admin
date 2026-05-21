import type { FastifyReply, FastifyRequest } from 'fastify';
import { createMemberSchema, updateMemberSchema } from './schema.js';

export async function listMembersHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 10, search } = request.query as any;
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { firstName: { contains: search, mode: 'insensitive' } },
      { secondName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { memberId: { contains: search, mode: 'insensitive' } },
    ]
  } : {};

  const [members, total] = await Promise.all([
    request.server.prisma.member.findMany({
      where: where as any,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        accountManager: true,
        assignedBy: true
      }
    }),
    request.server.prisma.member.count({ where: where as any }),
  ]);

  return reply.send({ success: true, data: members, meta: { total, page, limit }, error: null });
}

export async function createMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createMemberSchema.parse(request.body);
    
    // Check email uniqueness
    const existingEmail = await request.server.prisma.member.findUnique({ where: { email: body.email } });
    if (existingEmail) {
      return reply.status(409).send({ success: false, error: { code: 'CONFLICT', message: 'Email already exists' } });
    }

    const { 
      dob, 
      businessEstablishedOn, 
      accountManagerId, 
      assignedById,
      ...restBody 
    } = body;

    const data: any = {
      ...restBody,
      dob: dob ? new Date(dob) : null,
      businessEstablishedOn: businessEstablishedOn ? new Date(businessEstablishedOn) : null,
      marketingChannels: body.marketingChannels || [],
      assignedAt: new Date(),
    };

    if (accountManagerId) {
      data.accountManager = { connect: { id: accountManagerId } };
    }
    
    if (assignedById) {
      data.assignedBy = { connect: { id: assignedById } };
    }

    // Auto-generate if not provided from frontend. The requirement says "generate on page load", but we should also enforce it here if missing.
    if (!data.memberId) {
      data.memberId = `TBT-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const member = await request.server.prisma.member.create({
      data
    });

    return reply.status(201).send({ success: true, data: member, error: null });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return reply.status(400).send({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: err.flatten().fieldErrors } 
      });
    }
    request.server.log.error({ err }, 'Failed to create member');
    return reply.status(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Something went wrong' } });
  }
}

export async function getMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const member = await request.server.prisma.member.findUnique({ 
    where: { id },
    include: { accountManager: true, assignedBy: true }
  });
  if (!member) return reply.status(404).send({ success: false, data: null, error: 'Member not found' });
  return reply.send({ success: true, data: member, error: null });
}

export async function updateMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const body = updateMemberSchema.parse(request.body);

    const { 
      dob, 
      businessEstablishedOn, 
      accountManagerId, 
      assignedById,
      id: bodyId, // Extract id if it's accidentally sent in body
      createdAt,
      updatedAt,
      ...restBody 
    } = body as any;

    const data: any = {};

    // Only assign non-empty strings and valid fields from restBody
    for (const key in restBody) {
        if (restBody[key] !== "" && restBody[key] !== undefined) {
            data[key] = restBody[key];
        }
    }

    if (dob) {
      data.dob = new Date(dob as string);
    } else if (dob === "") {
      data.dob = null;
    }

    if (businessEstablishedOn) {
      data.businessEstablishedOn = new Date(businessEstablishedOn as string);
    } else if (businessEstablishedOn === "") {
      data.businessEstablishedOn = null;
    }

    if (accountManagerId !== undefined) {
      if (accountManagerId && accountManagerId.trim() !== '') {
        data.accountManager = { connect: { id: accountManagerId } };
      } else {
        data.accountManager = { disconnect: true };
      }
    }
    
    if (assignedById !== undefined) {
      if (assignedById && assignedById.trim() !== '') {
        data.assignedBy = { connect: { id: assignedById } };
      } else {
        data.assignedBy = { disconnect: true };
      }
    }

    const member = await request.server.prisma.member.update({ 
      where: { id }, 
      data 
    });
    
    return reply.send({ success: true, data: member, error: null });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return reply.status(400).send({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: err.flatten().fieldErrors } 
      });
    }
    request.server.log.error({ err }, 'Failed to update member');
    return reply.status(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Something went wrong' } });
  }
}

export async function deleteMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await request.server.prisma.member.delete({ where: { id } });
  return reply.send({ success: true, data: null, error: null });
}

export async function getManagersHandler(request: FastifyRequest, reply: FastifyReply) {
  const managers = await request.server.prisma.manager.findMany({
    orderBy: { name: 'asc' }
  });
  return reply.send({ success: true, data: managers, error: null });
}
