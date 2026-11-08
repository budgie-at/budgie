import { sql } from 'drizzle-orm';

export const RANDOM_SYNC_ID_SQL = sql`lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2, 3) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2, 3) || '-' || hex(randomblob(6)))`;
