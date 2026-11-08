import { text } from 'drizzle-orm/sqlite-core';

import { PERSONAL_SYNC_ZONE } from '../constant/personal-sync-zone.constant';

import { generateSyncId } from './generate-sync-id.util';

export const withSyncIdentityColumns = () => ({
    syncId: text('sync_id').$defaultFn(generateSyncId),
    syncZone: text('sync_zone').notNull().default(PERSONAL_SYNC_ZONE)
});
