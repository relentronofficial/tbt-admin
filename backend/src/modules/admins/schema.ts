import { z } from 'zod';

export const createAdminSchema = z.object({
  adminId: z.string(),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  contactNumber: z.string(),
  alternateContact: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  profilePhoto: z.string().optional(),
  role: z.string(),
  department: z.string(),
  designation: z.string().optional(),
  reportingManagerId: z.string().optional(),
  employeeId: z.string().optional(),
  country: z.string(),
  state: z.string(),
  district: z.string(),
  city: z.string(),
  address: z.string().min(10),
  username: z.string().min(4).max(30),
  accountStatus: z.string(),
  password: z.string().min(8),
  twoFactorEnabled: z.boolean().default(false),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rbac: z.array(z.object({
    module: z.string(),
    canView: z.boolean(),
    canCreate: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
  })).optional(),
});

export const updateAdminSchema = createAdminSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive', 'Suspended']),
});

export const updateRBACSchema = z.array(z.object({
  module: z.string(),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
}));
