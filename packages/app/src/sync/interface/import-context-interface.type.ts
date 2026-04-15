import type { DB } from '@budgie/contracts';

export interface ImportContextInterface {
    readonly mccCategoryIdMap: Map<string, number | null>;
    readonly existingTransactionIdMap: Map<string, number>;
    readonly tx: DB;
}
