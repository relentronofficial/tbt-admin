import type { FastifyReply, FastifyRequest } from 'fastify';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ok(reply: FastifyReply, data: unknown, meta?: object) {
  return reply.send({ success: true, data, error: null, ...(meta && { meta }) });
}

function fail(reply: FastifyReply, status: number, message: string) {
  return reply.status(status).send({ success: false, data: null, error: { code: 'ERROR', message } });
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const member = await request.server.prisma.member.findUnique({
    where: { id: request.memberId },
    select: {
      id: true,
      memberId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profilePhotoUrl: true,
      city: true,
      state: true,
      businessName: true,
      membershipPlan: true,
      status: true,
      verificationStatus: true,
      totalPoints: true,
      currentStreak: true,
      healthScore: true,
      onboardingCompleted: true,
      createdAt: true,
      accountManager: {
        select: {
          id: true,
          fullName: true,
          email: true,
          designation: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!member) return fail(reply, 404, 'Member not found');
  return ok(reply, member);
}

export async function updateMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const { firstName, lastName, city, state, businessName } = request.body as {
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    businessName?: string;
  };

  const data: Record<string, unknown> = {};
  if (firstName?.trim()) data.firstName = firstName.trim();
  if (lastName !== undefined) data.lastName = lastName?.trim() || null;
  if (city !== undefined) data.city = city?.trim() || null;
  if (state !== undefined) data.state = state?.trim() || null;
  if (businessName !== undefined) data.businessName = businessName?.trim() || null;

  if (Object.keys(data).length === 0) {
    return fail(reply, 400, 'No fields to update');
  }

  const member = await request.server.prisma.member.update({
    where: { id: request.memberId },
    data,
    select: {
      id: true,
      memberId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profilePhotoUrl: true,
      city: true,
      state: true,
      businessName: true,
      membershipPlan: true,
      status: true,
      verificationStatus: true,
      totalPoints: true,
      currentStreak: true,
      healthScore: true,
      onboardingCompleted: true,
      createdAt: true,
    },
  });

  return ok(reply, member);
}

// ─── Courses (user-facing, published only) ────────────────────────────────────

export async function listUserCoursesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 24, search, level } = request.query as {
    page?: number;
    limit?: number;
    search?: string;
    level?: string;
  };

  const where: Record<string, unknown> = { isPublished: true };
  if (level) where.level = level;
  if (search?.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const [courses, total] = await Promise.all([
    (request.server.prisma.course.findMany as any)({
      where: where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        durationHours: true,
        totalLessons: true,
        isPublished: true,
        isFeatured: true,
        createdAt: true,
        creator: {
          select: { id: true, fullName: true, profilePhotoUrl: true, designation: true },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    }) as Promise<any[]>,
    request.server.prisma.course.count({ where: where as any }),
  ]);

  const data = (courses as any[]).map((c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    thumbnailUrl: c.thumbnailUrl,
    level: c.level,
    durationHours: c.durationHours ? Number(c.durationHours) : null,
    isPublished: c.isPublished,
    isFeatured: c.isFeatured,
    createdAt: c.createdAt,
    instructor: c.creator ?? null,
    _count: { lessons: c.totalLessons, enrollments: c._count?.enrollments ?? 0 },
  }));

  return ok(reply, data, { total, page: Number(page), limit: Number(limit) });
}

export async function getUserCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const course = await (request.server.prisma.course.findUnique as any)({
    where: { id },
    include: {
      creator: {
        select: { id: true, fullName: true, profilePhotoUrl: true, designation: true },
      },
      modules: {
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              contentUrl: true,
              durationMinutes: true,
              sortOrder: true,
              isLocked: true,
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  }) as any;

  if (!course || !course.isPublished) return fail(reply, 404, 'Course not found');

  // Flatten lessons from all modules
  const lessons = (course.modules as any[]).flatMap((m: any) =>
    (m.lessons as any[]).map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      videoUrl: l.contentUrl,
      duration: l.durationMinutes,
      order: l.sortOrder,
      isFree: !l.isLocked,
    }))
  );

  return ok(reply, {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    level: course.level,
    durationHours: course.durationHours ? Number(course.durationHours) : null,
    isPublished: course.isPublished,
    isFeatured: course.isFeatured,
    createdAt: course.createdAt,
    instructor: course.creator ?? null,
    lessons,
    _count: { lessons: lessons.length, enrollments: course._count?.enrollments ?? 0 },
  });
}

export async function enrollCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id: courseId } = request.params as { id: string };

  const course = await request.server.prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, isPublished: true },
  });
  if (!course || !course.isPublished) return fail(reply, 404, 'Course not found');

  const existing = await request.server.prisma.courseEnrollment.findUnique({
    where: { memberId_courseId: { memberId: request.memberId, courseId } },
  });
  if (existing) return fail(reply, 409, 'Already enrolled in this course');

  const enrollment = await (request.server.prisma.courseEnrollment.create as any)({
    data: { memberId: request.memberId, courseId, progressPercentage: 0 },
    include: {
      course: {
        select: { id: true, title: true, thumbnailUrl: true, level: true, isFeatured: true, isPublished: true, slug: true, createdAt: true, durationHours: true },
      },
    },
  }) as any;

  return reply.status(201).send({
    success: true,
    data: {
      id: enrollment.id,
      courseId: enrollment.courseId,
      memberId: enrollment.memberId,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      progressPercent: enrollment.progressPercentage,
      course: enrollment.course,
    },
    error: null,
  });
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export async function getEnrollmentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const enrollments = await (request.server.prisma.courseEnrollment.findMany as any)({
    where: { memberId: request.memberId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnailUrl: true,
          level: true,
          durationHours: true,
          totalLessons: true,
          isPublished: true,
          isFeatured: true,
          createdAt: true,
          creator: {
            select: { id: true, fullName: true, profilePhotoUrl: true, designation: true },
          },
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  }) as any[];

  const data = enrollments.map((e: any) => ({
    id: e.id,
    courseId: e.courseId,
    memberId: e.memberId,
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt ?? null,
    progressPercent: e.progressPercentage,
    course: {
      ...e.course,
      durationHours: e.course?.durationHours ? Number(e.course.durationHours) : null,
      instructor: e.course?.creator ?? null,
      _count: {
        lessons: e.course?.totalLessons ?? 0,
        enrollments: e.course?._count?.enrollments ?? 0,
      },
    },
  }));

  return ok(reply, data);
}

export async function getLessonProgressHandler(request: FastifyRequest, reply: FastifyReply) {
  const { courseId } = request.params as { courseId: string };

  // Collect all lesson IDs for this course across its modules
  const modules = await request.server.prisma.module.findMany({
    where: { courseId },
    select: { lessons: { select: { id: true, durationMinutes: true } } },
  });
  const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const lessonDurations = Object.fromEntries(
    modules.flatMap((m) => m.lessons.map((l) => [l.id, l.durationMinutes ?? 0]))
  );

  const progress = await request.server.prisma.lessonProgress.findMany({
    where: { memberId: request.memberId, lessonId: { in: lessonIds } },
    select: { lessonId: true, completed: true, watchPercentage: true, completedAt: true },
  });

  const data = progress.map((p) => ({
    lessonId: p.lessonId,
    completed: p.completed,
    watchedSeconds: Math.floor((p.watchPercentage / 100) * (lessonDurations[p.lessonId] ?? 0) * 60),
    completedAt: p.completedAt ?? null,
  }));

  return ok(reply, data);
}

export async function markLessonCompleteHandler(request: FastifyRequest, reply: FastifyReply) {
  const { courseId, lessonId } = request.params as { courseId: string; lessonId: string };
  const { watchedSeconds } = request.body as { watchedSeconds?: number };

  // Verify lesson belongs to this course
  const lesson = await request.server.prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true, durationMinutes: true },
  });
  if (!lesson) return fail(reply, 404, 'Lesson not found in this course');

  // Compute watchPercentage from watchedSeconds if available
  const watchPercentage =
    watchedSeconds && lesson.durationMinutes
      ? Math.min(100, Math.round((watchedSeconds / (lesson.durationMinutes * 60)) * 100))
      : 100;

  const progress = await request.server.prisma.lessonProgress.upsert({
    where: { memberId_lessonId: { memberId: request.memberId, lessonId } },
    create: {
      memberId: request.memberId,
      lessonId,
      watchPercentage,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      watchPercentage,
      completed: true,
      completedAt: new Date(),
    },
    select: { lessonId: true, completed: true, watchPercentage: true, completedAt: true },
  });

  // Recalculate and persist course progress percentage
  await recalculateCourseProgress(request, courseId);

  return ok(reply, {
    lessonId: progress.lessonId,
    completed: progress.completed,
    watchedSeconds: watchedSeconds ?? 0,
    completedAt: progress.completedAt ?? null,
  });
}

async function recalculateCourseProgress(request: FastifyRequest, courseId: string) {
  const [modules, completed] = await Promise.all([
    request.server.prisma.module.findMany({
      where: { courseId },
      select: { lessons: { select: { id: true } } },
    }),
    request.server.prisma.lessonProgress.count({
      where: {
        memberId: request.memberId,
        completed: true,
        lesson: { module: { courseId } },
      },
    }),
  ]);

  const total = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  await request.server.prisma.courseEnrollment.updateMany({
    where: { memberId: request.memberId, courseId },
    data: {
      progressPercentage: pct,
      completedAt: pct === 100 ? new Date() : null,
    },
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  const now = new Date();

  const [totalCourses, completedCourses, member, upcomingEvents, unreadNotifications] =
    await Promise.all([
      request.server.prisma.courseEnrollment.count({
        where: { memberId: request.memberId },
      }),
      request.server.prisma.courseEnrollment.count({
        where: { memberId: request.memberId, completedAt: { not: null } },
      }),
      request.server.prisma.member.findUnique({
        where: { id: request.memberId },
        select: { totalPoints: true, currentStreak: true },
      }),
      request.server.prisma.event.count({
        where: { eventDate: { gt: now }, status: 'scheduled' },
      }),
      request.server.prisma.notification.count({
        where: { memberId: request.memberId, isRead: false },
      }),
    ]);

  return ok(reply, {
    totalCourses,
    completedCourses,
    inProgressCourses: totalCourses - completedCourses,
    totalPoints: member?.totalPoints ?? 0,
    currentStreak: member?.currentStreak ?? 0,
    upcomingEvents,
    unreadNotifications,
  });
}

export async function getContinueLearningHandler(request: FastifyRequest, reply: FastifyReply) {
  // Enrollments that are not yet completed
  const enrollments = await request.server.prisma.courseEnrollment.findMany({
    where: { memberId: request.memberId, completedAt: null, progressPercentage: { lt: 100 } },
    orderBy: { enrolledAt: 'desc' },
    take: 6,
    select: {
      courseId: true,
      progressPercentage: true,
      course: { select: { title: true, thumbnailUrl: true } },
    },
  });

  // For each enrollment, find the most recently accessed lesson
  const items = await Promise.all(
    enrollments.map(async (e) => {
      const lastProgress = await request.server.prisma.lessonProgress.findFirst({
        where: {
          memberId: request.memberId,
          lesson: { module: { courseId: e.courseId } },
        },
        orderBy: { updatedAt: 'desc' },
        select: { lessonId: true, lesson: { select: { title: true } } },
      });

      // Find the next uncompleted lesson
      const nextLesson = await request.server.prisma.lesson.findFirst({
        where: {
          module: { courseId: e.courseId },
          isPublished: true,
          progress: { none: { memberId: request.memberId, completed: true } },
        },
        orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        select: { id: true, title: true },
      });

      return {
        courseId: e.courseId,
        title: e.course.title,
        thumbnailUrl: e.course.thumbnailUrl ?? null,
        progressPercent: e.progressPercentage,
        lastLessonId: nextLesson?.id ?? lastProgress?.lessonId ?? null,
        lastLessonTitle: nextLesson?.title ?? lastProgress?.lesson?.title ?? null,
      };
    })
  );

  return ok(reply, items);
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function listUserEventsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 24, search } = request.query as {
    page?: number;
    limit?: number;
    search?: string;
  };

  const where: Record<string, unknown> = {};
  if (search?.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const [events, total] = await Promise.all([
    request.server.prisma.event.findMany({
      where: where as any,
      orderBy: { eventDate: 'asc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    }),
    request.server.prisma.event.count({ where: where as any }),
  ]);

  return ok(reply, events, { total, page: Number(page), limit: Number(limit) });
}

export async function getUserEventHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const event = await request.server.prisma.event.findUnique({ where: { id } });
  if (!event) return fail(reply, 404, 'Event not found');
  return ok(reply, event);
}

export async function registerForEventHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id: eventId } = request.params as { id: string };

  const event = await request.server.prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true },
  });
  if (!event) return fail(reply, 404, 'Event not found');

  const existing = await request.server.prisma.eventRegistration.findFirst({
    where: { memberId: request.memberId, eventId },
  });
  if (existing) return ok(reply, { registered: true });

  await request.server.prisma.eventRegistration.create({
    data: { memberId: request.memberId, eventId },
  });

  return reply.status(201).send({ success: true, data: { registered: true }, error: null });
}

// ─── Webinars ─────────────────────────────────────────────────────────────────

export async function listUserWebinarsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 24, status } = request.query as {
    page?: number;
    limit?: number;
    status?: string;
  };

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [webinars, total] = await Promise.all([
    request.server.prisma.webinar.findMany({
      where: where as any,
      include: {
        host: {
          select: { id: true, fullName: true, profilePhotoUrl: true, designation: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    }),
    request.server.prisma.webinar.count({ where: where as any }),
  ]);

  const data = webinars.map((w) => ({
    id: w.id,
    title: w.title,
    description: w.description,
    scheduledAt: w.scheduledAt,
    durationMinutes: w.durationMinutes,
    status: w.status,
    streamUrl: w.meetingUrl ?? null,
    recordingUrl: w.recordingUrl ?? null,
    host: w.host ?? null,
  }));

  return ok(reply, data, { total, page: Number(page), limit: Number(limit) });
}

export async function getUserWebinarHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const webinar = await request.server.prisma.webinar.findUnique({
    where: { id },
    include: {
      host: {
        select: { id: true, fullName: true, profilePhotoUrl: true, designation: true },
      },
    },
  });
  if (!webinar) return fail(reply, 404, 'Webinar not found');

  return ok(reply, {
    id: webinar.id,
    title: webinar.title,
    description: webinar.description,
    scheduledAt: webinar.scheduledAt,
    durationMinutes: webinar.durationMinutes,
    status: webinar.status,
    streamUrl: webinar.meetingUrl ?? null,
    recordingUrl: webinar.recordingUrl ?? null,
    host: webinar.host ?? null,
  });
}

export async function getWebinarTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id: webinarId } = request.params as { id: string };

  const webinar = await request.server.prisma.webinar.findUnique({
    where: { id: webinarId },
    select: { id: true, title: true, meetingUrl: true, status: true },
  });
  if (!webinar) return fail(reply, 404, 'Webinar not found');

  // Ensure member is registered (upsert so joining auto-registers)
  await request.server.prisma.webinarRegistration.upsert({
    where: { memberId_webinarId: { memberId: request.memberId, webinarId } },
    create: { memberId: request.memberId, webinarId, attended: true, joinTime: new Date() },
    update: { attended: true, joinTime: new Date() },
  });

  return ok(reply, {
    token: webinar.meetingUrl ?? '',
    channel: webinarId,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getUserNotificationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 50, unread } = request.query as {
    page?: number;
    limit?: number;
    unread?: string;
  };

  const where: Record<string, unknown> = { memberId: request.memberId };
  if (unread === 'true') where.isRead = false;

  const [notifications, total] = await Promise.all([
    request.server.prisma.notification.findMany({
      where: where as any,
      orderBy: { sentAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        data: true,
        isRead: true,
        sentAt: true,
      },
    }),
    request.server.prisma.notification.count({ where: where as any }),
  ]);

  const data = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    data: n.data as Record<string, unknown> | null,
    isRead: n.isRead,
    createdAt: n.sentAt,
  }));

  return ok(reply, data, { total, page: Number(page), limit: Number(limit) });
}

export async function markNotificationReadHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const notification = await request.server.prisma.notification.findFirst({
    where: { id, memberId: request.memberId },
  });
  if (!notification) return fail(reply, 404, 'Notification not found');

  const updated = await request.server.prisma.notification.update({
    where: { id },
    data: { isRead: true },
    select: { id: true, title: true, body: true, type: true, isRead: true, sentAt: true },
  });

  return ok(reply, { ...updated, createdAt: updated.sentAt });
}

export async function markAllNotificationsReadHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await request.server.prisma.notification.updateMany({
    where: { memberId: request.memberId, isRead: false },
    data: { isRead: true },
  });

  return ok(reply, { updated: result.count });
}
