import { z } from "zod";

const brandSchema = z.object({ id: z.number(), name: z.string() });
const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  parent: brandSchema.nullish(),
});
const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(["store", "kiosk"]),
  address: z.string(),
  city: z.string().nullable(),
  phone: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});
const summarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  brand: brandSchema,
  category: categorySchema,
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  conditions: z.array(z.string()),
  cash_price_from: z.number().nullable(),
  srp_price: z.number().nullable(),
  locations: z.array(locationSchema),
  updated_at: z.string().nullable(),
});
const attributeSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string().nullable(),
});
const variantSchema = z.object({
  id: z.number(),
  name: z.string(),
  condition: z.string(),
  attributes: z.array(attributeSchema),
  image_url: z.string().nullable(),
  cash_price_from: z.number().nullable(),
  srp_price: z.number().nullable(),
  locations: z.array(locationSchema),
});

export const productsResponseSchema = z.object({
  data: z.array(summarySchema),
  meta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  }),
});

export const productResponseSchema = z.object({
  data: summarySchema.extend({
    specifications: z.array(
      z.object({
        group: z.string(),
        items: z.array(z.object({ key: z.string(), label: z.string(), value: z.string() })),
      }),
    ),
    variants: z.array(variantSchema),
  }),
});

export const filtersResponseSchema = z.object({
  data: z.object({
    brands: z.array(brandSchema),
    categories: z.array(
      z.object({ id: z.number(), name: z.string(), children: z.array(brandSchema) }),
    ),
    conditions: z.array(z.string()),
    locations: z.array(
      z.object({ id: z.number(), name: z.string(), city: z.string().nullable() }),
    ),
    cities: z.array(z.string()),
  }),
});
