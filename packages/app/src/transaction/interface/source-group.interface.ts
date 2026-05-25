import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

export interface SourceGroupInterface {
    readonly entries: readonly ConsolidationSourceRowInterface[];
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
}
