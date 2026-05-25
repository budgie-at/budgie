import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

export interface SourceGroupInterface {
    readonly id: number;
    readonly entries: readonly ConsolidationSourceRowInterface[];
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly operatedAtMs: number;
    readonly insertionIndex: number;
}
