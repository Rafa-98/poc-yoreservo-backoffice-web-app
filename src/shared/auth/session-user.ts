import { z } from "zod";
import { BACKOFFICE_ROLES, type BackofficeRole } from "@/shared/config/roles";

export const backofficeRoleSchema = z.enum(BACKOFFICE_ROLES);

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  lastName: z.string().min(1),
  role: backofficeRoleSchema,
  status: z.string().optional(),
  phone: z.string().nullish(),
  organizationId: z.string().uuid().nullish(),
  managedVenueId: z.string().uuid().nullish(),
  imageUrl: z.string().nullish(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const sessionSchema = z.object({
  user: sessionUserSchema,
  /** Expiration as a Unix timestamp in milliseconds. */
  expiresAt: z.number().int().positive(),
});

export type Session = z.infer<typeof sessionSchema>;
