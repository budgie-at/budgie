import type { SyncCellType } from '../type/sync-cell.type';

export const SYNC_TOKEN_PLACEHOLDER_PREFIX = 'synced-device-placeholder:';

export const SYNC_INSERT_PLACEHOLDERS: Readonly<Record<string, (syncId: string) => Readonly<Record<string, SyncCellType>>>> = {
    bank_integrations: syncId => ({ token: `${SYNC_TOKEN_PLACEHOLDER_PREFIX}${syncId}` })
};
