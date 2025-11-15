import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'sqlite',
    driver: 'expo',
    schema: './src/@generic/drizzle/db/schema.ts',
    out: './drizzle',
});
