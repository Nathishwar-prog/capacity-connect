import { z } from 'zod';

export const loginValidationSchema = z.object({
  email: z
    .string({ required_error: 'Official email is required' })
    .min(1, 'Official email is required')
    .email('Please enter a valid government / organization email address')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginValidationSchema>;

export const registerValidationSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(1, 'First name is required')
      .trim(),
    lastName: z.string().trim().optional(),
    email: z
      .string({ required_error: 'Official email is required' })
      .min(1, 'Official email is required')
      .email('Please enter a valid official email address')
      .toLowerCase()
      .trim(),
    phone: z.string().trim().optional(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerValidationSchema>;
