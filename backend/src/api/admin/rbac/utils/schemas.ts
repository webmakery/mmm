import { z } from "@medusajs/framework/zod"

export const PostCreateRoleSchema = z.object({
  key: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/),
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
})

export const PostUpdateRoleSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
})

export const PostInviteWithRolesSchema = z.object({
  email: z.string().email(),
  role_ids: z.array(z.string()).min(1),
})

export const PostAssignRolesSchema = z.object({
  role_ids: z.array(z.string()).min(1),
})
