import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 reads CLI configuration from here rather than from the schema.
 * `dotenv/config` is imported explicitly because the Prisma CLI no longer
 * loads .env on its own.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
