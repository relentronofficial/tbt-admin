import type { FastifyReply, FastifyRequest } from 'fastify';
import { createMemberSchema, updateMemberSchema } from './schema.js';

export async function listMembersHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 10, search } = request.query as any;
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { memberId: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
    ]
  } : {};

  const [members, total] = await Promise.all([
    request.server.prisma.member.findMany({
      where: where as any,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true
          }
        },
        batch: true
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
      batchId,
      createdBy,
      ...restBody 
    } = body;

    const data: any = {
      ...restBody,
      dob: dob ? new Date(dob) : null,
      businessEstablishedOn: businessEstablishedOn ? new Date(businessEstablishedOn) : null,
      marketingChannels: body.marketingChannels || [],
      currentChallenges: body.currentChallenges || [],
    };

    if (accountManagerId) {
      data.accountManager = { connect: { id: accountManagerId } };
    }
    
    if (batchId) {
      data.batch = { connect: { id: batchId } };
    }

    if (createdBy) {
      data.creator = { connect: { id: createdBy } };
    }

    // Auto-generate if not provided from frontend.
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
    include: { 
        accountManager: true, 
        creator: true,
        batch: true,
        courseEnrollments: { include: { course: true } }
    }
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
      batchId,
      createdBy,
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

    if (batchId !== undefined) {
      if (batchId && batchId.trim() !== '') {
        data.batch = { connect: { id: batchId } };
      } else {
        data.batch = { disconnect: true };
      }
    }
    
    if (createdBy !== undefined) {
      if (createdBy && createdBy.trim() !== '') {
        data.creator = { connect: { id: createdBy } };
      } else {
        data.creator = { disconnect: true };
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
  // Implement soft delete if needed, but for now hard delete as per previous code
  await request.server.prisma.member.delete({ where: { id } });
  return reply.send({ success: true, data: null, error: null });
}

export async function getManagersHandler(request: FastifyRequest, reply: FastifyReply) {
  const managers = await request.server.prisma.admin.findMany({
    where: { status: 'active' },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, email: true, designation: true, role: true, profilePhotoUrl: true },
  });
  return reply.send({ success: true, data: managers, error: null });
}

export async function createManagerHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { fullName, email, phone, designation } = request.body as {
      fullName: string;
      email: string;
      phone?: string;
      designation?: string;
    };

    if (!fullName?.trim() || fullName.trim().length < 2) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Full name is required (min 2 characters)' } });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid email is required' } });
    }

    const existingEmail = await request.server.prisma.admin.findUnique({ where: { email: email.trim() } });
    if (existingEmail) {
      return reply.status(409).send({ success: false, error: { code: 'CONFLICT', message: 'An admin with this email already exists' } });
    }

    // Auto-generate username and password
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const suffix = Math.floor(100 + Math.random() * 900);
    const username = `${baseUsername}_${suffix}`;
    const tempPassword = `Tbt@${Math.random().toString(36).slice(-6)}${suffix}`;

    let clerkUserId = '';
    try {
      const clerkUser = await request.server.clerk.users.createUser({
        emailAddress: [email.trim()],
        password: tempPassword,
        username,
        firstName: fullName.trim().split(' ')[0],
        lastName: fullName.trim().split(' ').slice(1).join(' ') || undefined,
      });
      clerkUserId = clerkUser.id;
    } catch (clerkErr: any) {
      const msg = clerkErr.errors?.[0]?.longMessage || clerkErr.message || 'Failed to create auth account';
      return reply.status(400).send({ success: false, error: { code: 'AUTH_FAILED', message: msg } });
    }

    try {
      const sequence = await request.server.prisma.adminIdSequence.create({ data: {} });
      const employeeId = `TBT-ADMIN-${new Date().getFullYear()}-${String(sequence.id).padStart(4, '0')}`;

      const admin = await request.server.prisma.admin.create({
        data: {
          clerkId: clerkUserId,
          employeeId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone?.trim() || undefined,
          designation: designation?.trim() || undefined,
          username,
          role: 'account_manager',
          status: 'active',
          country: 'India',
        },
        select: { id: true, fullName: true, email: true, designation: true, role: true, employeeId: true },
      });

      return reply.status(201).send({ success: true, data: admin, error: null });
    } catch (prismaErr: any) {
      await request.server.clerk.users.deleteUser(clerkUserId).catch(() => {});
      throw prismaErr;
    }
  } catch (err: any) {
    request.server.log.error(err);
    return reply.status(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Something went wrong' } });
  }
}
