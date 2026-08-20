import { z } from "zod";

export const brandDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const categoryDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent: brandDtoSchema.nullish(),
});

export const locationDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(["store", "kiosk"]),
  address: z.string(),
  city: z.string().nullable(),
  phone: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const productSummaryDtoSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  brand: brandDtoSchema,
  category: categoryDtoSchema,
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  conditions: z.array(z.string()),
  cash_price_from: z.number().nullable(),
  srp_price: z.number().nullable(),
  locations: z.array(locationDtoSchema),
  updated_at: z.string().nullable(),
});

const attributeDtoSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string().nullable(),
});

const variantDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  condition: z.string(),
  attributes: z.array(attributeDtoSchema),
  image_url: z.string().nullable(),
  cash_price_from: z.number().nullable(),
  srp_price: z.number().nullable(),
  locations: z.array(locationDtoSchema),
});

export const productsResponseDtoSchema = z.object({
  data: z.array(productSummaryDtoSchema),
  meta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  }),
});

export const productResponseDtoSchema = z.object({
  data: productSummaryDtoSchema.extend({
    specifications: z.array(
      z.object({
        group: z.string(),
        items: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            value: z.string(),
          }),
        ),
      }),
    ),
    variants: z.array(variantDtoSchema),
  }),
});

export const filtersResponseDtoSchema = z.object({
  data: z.object({
    brands: z.array(brandDtoSchema),
    categories: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        children: z.array(brandDtoSchema),
      }),
    ),
    conditions: z.array(z.string()),
    locations: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        city: z.string().nullable(),
      }),
    ),
    cities: z.array(z.string()),
  }),
});

const brandingImageDtoSchema = z.object({
  url: z.string(),
  name: z.string(),
});

export const locationsResponseDtoSchema = z.object({
  data: z.array(locationDtoSchema),
});

export const brandingResponseDtoSchema = z.object({
  data: z.object({
    logo: brandingImageDtoSchema.nullable(),
    // Optional so a storefront deploy can precede the ERP upgrade.
    hero: brandingImageDtoSchema.nullable().optional(),
  }),
});

export type ProductSummaryDto = z.infer<typeof productSummaryDtoSchema>;
export type ProductDetailDto = z.infer<typeof productResponseDtoSchema>["data"];
export type FiltersDto = z.infer<typeof filtersResponseDtoSchema>["data"];
