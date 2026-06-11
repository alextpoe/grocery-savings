import { z } from 'zod'

/**
 * User schemas
 */
export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
})

/**
 * Common schemas
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const idSchema = z.string().uuid('Invalid ID format')

/**
 * Grocery-savings preferences
 *
 * Enum values mirror the `DietaryRestriction` type in
 * `@grocery-savings/utils/matching` — keep the two in lockstep.
 */
export const dietaryRestrictionSchema = z.enum([
  'dairy_free',
  'gluten_free',
  'no_fish',
  'no_pork',
  'vegetarian',
  'vegan',
  'nut_free',
])

export const preferencesSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, 'Enter a 5-digit ZIP code'),
  radiusMiles: z.number().int().min(1).max(50).default(10),
  householdSize: z.number().int().min(1).max(12).default(4),
  dietaryRestrictions: z.array(dietaryRestrictionSchema).default([]),
  budgetPerServing: z.number().positive().max(50).default(4),
  minDiscountPercent: z.number().min(0).max(90).default(25),
})

/**
 * Types
 */
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type DietaryRestrictionInput = z.infer<typeof dietaryRestrictionSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
