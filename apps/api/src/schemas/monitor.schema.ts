import { z } from 'zod';

export const createMonitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  intervalMinutes: z.number().int().min(1).optional(),
  alertThreshold: z.number().int().min(1).optional(),
});

export const updateMonitorSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  intervalMinutes: z.number().int().min(1).optional(),
  alertThreshold: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
