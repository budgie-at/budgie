import { isDefined } from '@rnw-community/shared';

import { getSyncRowKey } from './get-sync-row-key.util';

import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncResolutionsType } from '../type/sync-resolutions.type';

export const readSyncReferenceId = (
    row: SyncRowInterface,
    column: string,
    resolutions: SyncResolutionsType,
    unitIds: ReadonlyMap<string, number>
): number | null => {
    const reference = row.references.find(candidate => candidate.column === column);

    return isDefined(reference)
        ? (resolutions.get(row)?.get(column) ?? unitIds.get(getSyncRowKey(reference.tableName, reference.key)) ?? null)
        : null;
};
