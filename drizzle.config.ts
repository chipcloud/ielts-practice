import { defineConfig } from 'drizzle-kit';

// Database connection string
// Format: postgresql://username:password@host:port/database
const DATABASE_URL = 'postgresql://postgres:postgres123@localhost:5432/ielts_practice';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
