import { z } from "zod";

/**
 * Fails fast at startup rather than silently running with a missing secret.
 * Never import this from a client component.
 */
const schema = z.object({
  /** Signs staff sessions and keys the rate-limit fingerprint. */
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in the values.`,
    );
  }
  cached = parsed.data;
  return cached;
}
