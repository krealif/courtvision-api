import { defineConfig } from "drizzle-kit";
import env from "./src/config/env";

export default defineConfig({
  dialect: "mysql",
  dbCredentials: {
    url: env.DB_URL,
  },
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
