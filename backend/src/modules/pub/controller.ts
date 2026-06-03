import type { FastifyRequest, FastifyReply } from 'fastify';

export async function pubSiteConfigHandler(req: FastifyRequest, reply: FastifyReply) {
  let config = await req.server.prisma.siteConfig.findFirst();
  if (!config) {
    config = await req.server.prisma.siteConfig.create({
      data: { siteName: 'TBT', footerText: '© TBT' },
    });
  }

  // Shape the response exactly as specified in TBT_PRD_Dynamic.md §2
  return reply.send({
    success: true,
    data: {
      siteName: config.siteName,
      logoUrl: config.logoUrl ?? null,
      faviconUrl: config.faviconUrl ?? null,
      footerText: config.footerText,
      theme: {
        accentColor: config.accentColor,
        alertColor: config.alertColor,
        successColor: config.successColor,
        bgPrimary: config.bgPrimary,
        bgSurface: config.bgSurface,
      },
      splashLogoUrl: config.splashLogoUrl ?? null,
      splashDurationMs: config.splashDurationMs,
    },
    error: null,
  });
}

export async function pubNavItemsHandler(req: FastifyRequest, reply: FastifyReply) {
  const [items, config] = await Promise.all([
    req.server.prisma.navItem.findMany({
      where: { isVisible: true },
      orderBy: { order: 'asc' },
    }),
    req.server.prisma.siteConfig.findFirst(),
  ]);

  return reply.send({
    success: true,
    data: {
      items,
      rightIcons: {
        notifications: config?.navShowNotifications ?? true,
        messages: config?.navShowMessages ?? true,
        profile: config?.navShowProfile ?? true,
      },
    },
    error: null,
  });
}

export async function pubUiStringsHandler(req: FastifyRequest, reply: FastifyReply) {
  let strings = await req.server.prisma.uiStrings.findFirst();
  if (!strings) {
    strings = await req.server.prisma.uiStrings.create({ data: {} });
  }
  return reply.send({ success: true, data: strings, error: null });
}
