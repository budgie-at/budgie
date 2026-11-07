import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';
import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';

export interface SyncPreResolutionInterface {
    readonly missing: SyncRowReferenceInterface | null;
    readonly resolutions: ReadonlyMap<SyncRowInterface, ReadonlyMap<string, number>>;
}
