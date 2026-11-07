import { isDefined } from '@rnw-community/shared';

import type { SyncMergeInputInterface } from '../interface/sync-merge-input.interface';
import type { SyncMergeResultInterface } from '../interface/sync-merge-result.interface';
import type { SyncCellType } from '../type/sync-cell.type';

const DELETED_AT_PROPERTY = 'deletedAt';

type ConflictSideType = 'local' | 'server';

export const mergeSyncRow = ({ local, base, server, localChanged, authorship }: SyncMergeInputInterface): SyncMergeResultInterface => {
    const merged: Record<string, SyncCellType> = { ...local };
    const properties = Object.keys(server);
    const readServer = (property: string): SyncCellType => server[property] ?? null;
    const readLocal = (property: string): SyncCellType => local[property] ?? null;
    const isUserAuthored = (cells: Readonly<Record<string, SyncCellType>>): boolean =>
        isDefined(authorship) && cells[authorship.property] === authorship.userValue;
    const resolveConflict = (property: string): ConflictSideType => {
        const localCell = readLocal(property);
        const serverCell = readServer(property);

        const isLocalDeleted = isDefined(localCell);
        const isServerDeleted = isDefined(serverCell);

        if (property === DELETED_AT_PROPERTY && isLocalDeleted !== isServerDeleted) {
            return isServerDeleted ? 'server' : 'local';
        }

        return isUserAuthored(server) && !isUserAuthored(local) ? 'server' : 'local';
    };
    const conflictSides = new Set<ConflictSideType>();
    const pickMergedCell = (property: string): SyncCellType => {
        const localCell = readLocal(property);
        const serverCell = readServer(property);

        if (localCell === serverCell) {
            return localCell;
        }

        const baseCell = base?.[property] ?? null;
        const isLocalChanged = isDefined(localChanged) ? localChanged.has(property) : isDefined(base) && baseCell !== localCell;
        const isServerChanged = !isDefined(base) || baseCell !== serverCell;

        if (isLocalChanged && isServerChanged) {
            const side = resolveConflict(property);

            conflictSides.add(side);

            return side === 'server' ? serverCell : localCell;
        }

        return isLocalChanged ? localCell : serverCell;
    };
    const mergeProperty = (property: string): void => {
        merged[property] = pickMergedCell(property);
    };

    properties.filter(property => property !== authorship?.property).forEach(mergeProperty);

    if (isDefined(authorship) && properties.includes(authorship.property)) {
        mergeProperty(authorship.property);

        if (conflictSides.size === 1) {
            merged[authorship.property] = conflictSides.has('server') ? readServer(authorship.property) : readLocal(authorship.property);
        }
    }

    return { merged, keptLocal: properties.filter(property => merged[property] !== readServer(property)) };
};
