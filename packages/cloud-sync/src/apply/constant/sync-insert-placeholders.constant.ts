import type { SyncCellType } from '../type/sync-cell.type';

export const SYNC_INSERT_PLACEHOLDERS: Readonly<Record<string, (syncId: string) => Readonly<Record<string, SyncCellType>>>> = {
    bank_integrations: syncId => ({ token: `synced-device-placeholder:${syncId}` })
};
