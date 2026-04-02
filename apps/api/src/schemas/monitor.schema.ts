import { z } from 'zod';

export const createMonitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  intervalMinutes: z.number().int().min(1).optional(),
  alertThreshold: z.number().int().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export const updateMonitorSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  intervalMinutes: z.number().int().min(1).optional(),
  alertThreshold: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
