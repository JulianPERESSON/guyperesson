import "dotenv/config";

import { defineConfig } from "prisma/config";

const buildSafeDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://prisma:prisma@127.0.0.1:5432/collection_ecommerce";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: buildSafeDatabaseUrl,
  },
});
