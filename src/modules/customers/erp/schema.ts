import { z } from "zod";

export const accountDtoSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  public_name: z.string(),
  email: z.string(),
});

export const ownReviewDtoSchema = z.object({
  id: z.number(),
  rating: z.number(),
  body: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  rejection_reason: z.string().nullable(),
  submitted_at: z.string().nullable(),
  product: z.object({ id: z.number(), name: z.string(), slug: z.string() }),
});

const signedInDtoSchema = z.object({
  status: z.literal("signed_in"),
  token: z.string(),
  expires_at: z.string().nullable(),
  account: accountDtoSchema,
});

export const googleSignInResponseDtoSchema = z.discriminatedUnion("status", [
  signedInDtoSchema,
  z.object({
    status: z.literal("needs_confirmation"),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
  }),
]);

export const googleRegisterResponseDtoSchema = signedInDtoSchema;

export const accountResponseDtoSchema = z.object({ data: accountDtoSchema });
export const ownReviewResponseDtoSchema = z.object({ data: ownReviewDtoSchema });
export const nullableOwnReviewResponseDtoSchema = z.object({
  data: ownReviewDtoSchema.nullable(),
});
export const ownReviewsResponseDtoSchema = z.object({
  data: z.array(ownReviewDtoSchema),
});

export const publicReviewsResponseDtoSchema = z.object({
  summary: z.object({
    average: z.number().nullable(),
    count: z.number(),
    breakdown: z.object({
      1: z.number(),
      2: z.number(),
      3: z.number(),
      4: z.number(),
      5: z.number(),
    }),
  }),
  data: z.array(
    z.object({
      id: z.number(),
      author: z.string(),
      rating: z.number(),
      body: z.string(),
      submitted_at: z.string().nullable(),
    }),
  ),
  meta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  }),
});

export const errorDtoSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type AccountDto = z.infer<typeof accountDtoSchema>;
export type OwnReviewDto = z.infer<typeof ownReviewDtoSchema>;
