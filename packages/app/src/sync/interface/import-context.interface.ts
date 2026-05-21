import type { DB, MccCategoryLookupInterface } from '@budgie/contracts';

export interface ImportContextInterface {
    readonly mccCategoryLookupMap: Map<string, MccCategoryLookupInterface | null>;
    readonly existingTransactionIdMap: Map<string, number>;
    readonly tx: DB;
}
