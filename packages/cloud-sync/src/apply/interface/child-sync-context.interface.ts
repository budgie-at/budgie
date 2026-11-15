import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncResolutionsType } from '../type/sync-resolutions.type';

export interface ChildSyncContextInterface {
    readonly resolutions: SyncResolutionsType;
    readonly unitIds: Map<string, number>;
    readonly baseRows: ReadonlyMap<string, SyncRowInterface>;
    readonly isGated: boolean;
    readonly isParentTimingUnchanged: boolean;
}
