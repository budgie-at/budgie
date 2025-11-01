import { sql } from 'drizzle-orm';

export const CURRENT_TIMESTAMP = sql`(unixepoch())`;
