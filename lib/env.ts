import { z } from 'zod';

// Validated lazily (not at import time) so a missing var only breaks the
// specific feature that needs it, with a clear error, instead of crashing
// every route on boot - useful since Vercel builds don't always have every
// runtime env var available.

const paystackSchema = z.object({
  PAYSTACK_SECRET_KEY: z.string().min(1, 'PAYSTACK_SECRET_KEY is not set'),
});

const adminSchema = z.object({
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is not set'),
});

const blobSchema = z.object({
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is not set'),
});

const emailSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is not set'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is not set'),
});

function validate<T extends z.ZodTypeAny>(schema: T, source: NodeJS.ProcessEnv): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Missing configuration: ${messages}`);
  }
  return result.data;
}

export const requirePaystackEnv = () => validate(paystackSchema, process.env);
export const requireAdminEnv = () => validate(adminSchema, process.env);
export const requireBlobEnv = () => validate(blobSchema, process.env);
export const requireEmailEnv = () => validate(emailSchema, process.env);

/** True if the optional email-notification feature is fully configured. */
export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
