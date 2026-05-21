import { z } from 'zod';

export const createAdminSchema = z.object({
  adminId: z.string(),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).regex(/^[a-zA-Z\s]+$/, "No special characters allowed"),
  email: z.string().email("Invalid email format"),
  contactNumber: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Invalid Indian mobile number (10 digits)"),
  alternateContact: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const age = new Date().getFullYear() - dob.getFullYear();
    return age >= 18;
  }, "Must be at least 18 years old"),
  bloodGroup: z.enum(['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'], {
    errorMap: () => ({ message: "Please select a valid blood group" })
  }),
  profilePhoto: z.string().optional().or(z.literal('')),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().max(100).optional().or(z.literal('')),
  reportingManagerId: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal('')),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  username: z.string().min(4, "Username must be at least 4 characters").max(30).regex(/^[a-zA-Z0-9._]+$/, "Alphanumeric, underscores, and dots only"),
  accountStatus: z.string().min(1, "Account status is required"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/, "Must contain uppercase, lowercase, number, and special character"),
  confirmPassword: z.string(),
  twoFactorEnabled: z.boolean().default(false),
  notes: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).max(10, "Max 10 tags allowed").optional(),
  rbac: z.array(z.object({
    module: z.string(),
    canView: z.boolean(),
    canCreate: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
  })).refine(perms => perms.some(p => p.canView || p.canCreate || p.canEdit || p.canDelete), "At least one permission must be enabled"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
