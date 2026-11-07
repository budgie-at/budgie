import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';

export interface SyncUnitOutcomeInterface {
    readonly missing: SyncRowReferenceInterface | null;
    readonly isWritten: boolean;
    readonly touchedRows: ReadonlyArray<readonly [string, string]>;
    readonly accountIds: readonly number[];
    readonly keptColumns: readonly string[] | null;
}
