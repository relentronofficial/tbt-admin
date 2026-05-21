import { z } from 'zod';

export const sendNotificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  type: z.enum(['System', 'Course', 'Task', 'Community', 'Webinar']),
  metadata: z.any().optional(),
});

export const broadcastNotificationSchema = sendNotificationSchema.omit({ userId: true });
