import type { FastifyReply, FastifyRequest } from 'fastify';
import { createAdminSchema, updateAdminSchema, updateStatusSchema, updateRBACSchema } from './schema.js';
import bcrypt from 'bcrypt';

export async function generateIdHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const sequence = await request.server.prisma.adminIdSequence.create({ data: {} });
    const year = 2026; // As per requirement format
    const paddedId = String(sequence.id).padStart(4, '0');
    const adminId = `TBT-ADMIN-${year}-${paddedId}`;
    return reply.send({ success: true, data: adminId });
  } catch (err: any) {
    request.server.log.error(err);
    // Fallback ID if database is down
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const fallbackId = `TBT-ADMIN-2026-${randomId}`;
    return reply.send({ success: true, data: fallbackId });
  }
}

export async function checkUsernameHandler(request: FastifyRequest, reply: FastifyReply) {
  const { username } = request.query as { username: string };
  if (!username) return reply.send({ success: true, data: { available: false } });
  
  const admin = await request.server.prisma.admin.findUnique({ where: { username } });
  return reply.send({ success: true, data: { available: !admin } });
}

export async function checkEmailHandler(request: FastifyRequest, reply: FastifyReply) {
  const { email } = request.query as { email: string };
  if (!email) return reply.send({ success: true, data: { available: false } });

  const admin = await request.server.prisma.admin.findUnique({ where: { email } });
  return reply.send({ success: true, data: { available: !admin } });
}

export async function searchAdminsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { q, role, limit = 8 } = request.query as { q: string; role?: string; limit?: number };
  
  const roles = role ? role.split(',') : undefined;

  const admins = await request.server.prisma.admin.findMany({
    where: {
      AND: [
        { fullName: { contains: q, mode: 'insensitive' } },
        roles ? { role: { in: roles as any } } : {},
      ]
    },
    take: Number(limit),
    select: {
      id: true,
      fullName: true,
      designation: true,
      employeeId: true,
      role: true,
    }
  });

  return reply.send({ success: true, data: admins });
}

export async function listAdminsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 10, search } = request.query as any;
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  } : {};

  const [admins, total] = await Promise.all([
    request.server.prisma.admin.findMany({
      where: where as any,
      skip,
      take: Number(limit),
      include: { rbac: true },
    }),
    request.server.prisma.admin.count({ where: where as any }),
  ]);

  return reply.send({
    success: true,
    data: admins,
    meta: { total, page, limit },
    error: null
  });
}

export async function createAdminHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    request.server.log.info({ body: request.body }, 'Creating new admin');
    const body = createAdminSchema.parse(request.body);

    // Check uniqueness again server-side
    const existingEmail = await request.server.prisma.admin.findUnique({ where: { email: body.email } });
    if (existingEmail) {
      return reply.status(409).send({ success: false, error: { code: 'CONFLICT', message: 'Email already exists' } });
    }

    const existingUsername = await request.server.prisma.admin.findUnique({ where: { username: body.username } });
    if (existingUsername) {
      return reply.status(409).send({ success: false, error: { code: 'CONFLICT', message: 'Username already exists' } });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Create Clerk User
    let clerkUserId = '';
    try {
      request.server.log.info({ email: body.email, username: body.username }, 'Creating Clerk user');
      const clerkUser = await request.server.clerk.users.createUser({
        emailAddress: [body.email],
        password: body.password,
        username: body.username,
        firstName: body.fullName.split(' ')[0] || body.fullName,
        lastName: body.fullName.split(' ').slice(1).join(' ') || undefined,
        skipPasswordChecks: false,
        skipPasswordRequirement: false,
      });
      clerkUserId = clerkUser.id;
      request.server.log.info({ clerkUserId }, 'Clerk user created successfully');
    } catch (clerkErr: any) {
      request.server.log.error({ err: clerkErr.message, errors: clerkErr.errors }, 'Failed to create Clerk user');
      const errorMessage = clerkErr.errors?.[0]?.longMessage || clerkErr.message || 'Failed to create authentication account';
      return reply.status(400).send({ success: false, error: { code: 'AUTH_CREATION_FAILED', message: errorMessage } });
    }

    // Get current user from Clerk session - handle potentially invalid UUID formats gracefully
    let createdBy = 'System';
    try {
      if (request.user && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.user)) {
        const currentUser = await request.server.prisma.admin.findUnique({ where: { id: request.user } });
        if (currentUser) {
          createdBy = `${currentUser.fullName} (${currentUser.role})`;
        }
      } else {
        request.server.log.warn(`Request user ID is not a valid UUID: ${request.user}`);
      }
    } catch (userErr) {
      request.server.log.warn(`Failed to fetch current user for createdBy field: ${userErr}`);
    }

    // Transaction
    try {
      const result = await request.server.prisma.$transaction(async (tx) => {
        // Prepare nested RBAC data if provided
        const rbacData = body.rbac && body.rbac.length > 0 
          ? { create: body.rbac } 
          : undefined;

        const admin = await tx.admin.create({
          data: {
            adminId: body.adminId,
            fullName: body.fullName,
            email: body.email,
            contactNumber: body.contactNumber,
            alternateContact: body.alternateContact || undefined,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
            bloodGroup: body.bloodGroup || undefined,
            profilePhoto: body.profilePhoto || undefined,
            role: body.role as any,
            department: body.department || undefined,
            designation: body.designation || undefined,
            ...(body.reportingManagerId ? {
              reportingManager: { connect: { id: body.reportingManagerId } }
            } : {}),
            employeeId: body.employeeId || undefined,
            country: body.country || undefined,
            state: body.state || undefined,
            city: body.city || undefined,
            address: body.address || undefined,
            username: body.username,
            accountStatus: body.accountStatus as any,
            twoFactorEnabled: body.twoFactorEnabled,
            notes: body.notes || undefined,
            tags: body.tags || [],
            rbac: rbacData,
          },
          include: { rbac: true }
        });

        return admin;
      });

      request.server.log.info(`Admin created successfully: ${result.adminId}`);
      return reply.status(201).send({ success: true, data: result, error: null });
    } catch (prismaErr: any) {
      request.server.log.error({ 
        prismaError: prismaErr.message, 
        code: prismaErr.code,
        meta: prismaErr.meta,
        stack: prismaErr.stack
      }, 'Prisma admin.create failed');

      // Rollback Clerk User
      if (clerkUserId) {
        try {
          request.server.log.info({ clerkUserId }, 'Rolling back Clerk user creation');
          await request.server.clerk.users.deleteUser(clerkUserId);
          request.server.log.info({ clerkUserId }, 'Clerk user rolled back successfully');
        } catch (rollbackErr: any) {
          request.server.log.error({ err: rollbackErr.message, clerkUserId }, 'Failed to rollback Clerk user creation');
        }
      }

      throw prismaErr;
    }
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return reply.status(400).send({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Validation failed', 
          fields: err.flatten().fieldErrors 
        } 
      });
    }
    request.server.log.error({ err }, 'Failed to create admin');
    return reply.status(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Something went wrong' } });
  }
}

export async function getAdminHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const admin = await request.server.prisma.admin.findUnique({
    where: { id },
    include: { rbac: true },
  });

  if (!admin) return reply.status(404).send({ success: false, data: null, error: 'Admin not found' });
  return reply.send({ success: true, data: admin, error: null });
}

export async function updateAdminHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const body = updateAdminSchema.parse(request.body);

  const admin = await request.server.prisma.admin.update({
    where: { id },
    data: body as any,
  });

  return reply.send({ success: true, data: admin, error: null });
}

export async function deleteAdminHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await request.server.prisma.admin.delete({ where: { id } });
  return reply.send({ success: true, data: null, error: null });
}

export async function updateStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { status } = updateStatusSchema.parse(request.body);

  const admin = await request.server.prisma.admin.update({
    where: { id },
    data: { accountStatus: status as any },
  });

  return reply.send({ success: true, data: admin, error: null });
}

export async function updateRBAChandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const permissions = updateRBACSchema.parse(request.body);

  await (request.server.prisma as any).rBAC.deleteMany({ where: { adminId: id } });
  
  const rbac = await (request.server.prisma as any).rBAC.createMany({
    data: permissions.map(p => ({ ...p, adminId: id })),
  });

  return reply.send({ success: true, data: rbac, error: null });
}
