import type { Transaction } from '../../@generic/type/transaction.type';

export interface ImportContextInterface {
    readonly mccCategoryIdMap: Map<string, number | null>;
    readonly existingExternalIds: Set<string>;
    readonly tx: Transaction;
}
