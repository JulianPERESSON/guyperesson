import { z } from "zod";

const shortText = z.string().trim().min(1).max(120);
const email = z.string().trim().toLowerCase().email().max(254);
const optionalPhone = z
  .string()
  .trim()
  .max(30)
  .refine(
    (value) => value === "" || /^[+()\d\s.-]{6,30}$/.test(value),
    "Le numéro de téléphone est invalide.",
  )
  .optional();
const optionalMoney = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() !== ""
      ? Number(value.replace(",", "."))
      : value,
  z.number().positive().max(1_000_000).optional(),
);

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(128),
  })
  .strict();

export const registerSchema = z
  .object({
    firstName: shortText,
    lastName: shortText,
    email,
    phone: optionalPhone,
    password: z
      .string()
      .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
      .max(128)
      .regex(/[a-z]/, "Ajoutez une lettre minuscule.")
      .regex(/[A-Z]/, "Ajoutez une lettre majuscule.")
      .regex(/\d/, "Ajoutez un chiffre."),
    acceptTerms: z.preprocess(
      (value) => value === true || value === "true" || value === "on",
      z.literal(true),
    ),
  })
  .strict();

export const contactSchema = z
  .object({
    name: shortText.optional(),
    firstName: shortText.optional(),
    lastName: shortText.optional(),
    email,
    phone: optionalPhone,
    subject: shortText,
    message: z.string().trim().min(10).max(5_000),
    productId: z.string().trim().min(1).max(128).optional(),
    reference: z.string().trim().min(1).max(128).optional(),
    productReference: z.string().trim().min(1).max(128).optional(),
    website: z.string().max(0).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.name && !(value.firstName && value.lastName)) {
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "Indiquez votre nom.",
      });
    }
  });

export const reservationSchema = z
  .object({
    productId: z.string().trim().min(1).max(128),
    reference: z.string().trim().min(1).max(128),
    firstName: shortText,
    lastName: shortText,
    email,
    phone: optionalPhone,
    message: z.string().trim().min(10).max(5_000),
    offerAmount: optionalMoney,
    website: z.string().max(0).optional(),
  })
  .strict();

export const checkoutSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(128),
            quantity: z.number().int().min(1).max(10).default(1),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    customerEmail: email.optional(),
    cartId: z.string().trim().min(1).max(128).optional(),
    promotionCode: z.string().trim().min(1).max(64).optional(),
    shippingMethod: z.string().trim().min(1).max(64).optional(),
  })
  .strict();

export type CheckoutInput = z.infer<typeof checkoutSchema>;
