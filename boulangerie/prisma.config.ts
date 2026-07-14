import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations : connexion directe Supabase (DIRECT_URL), sinon DATABASE_URL.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
