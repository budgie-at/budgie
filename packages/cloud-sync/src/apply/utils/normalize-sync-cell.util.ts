import { isBoolean, isNumber, isString } from '@rnw-community/shared';

import type { SyncCellType } from '../type/sync-cell.type';

export const normalizeSyncCell = (value: unknown): SyncCellType => {
    if (value instanceof Date) {
        return Math.floor(value.getTime() / 1000);
    }

    if (isBoolean(value)) {
        return value ? 1 : 0;
    }

    return isString(value) || isNumber(value) ? value : null;
};
