import type { DB } from '@budgie/contracts';

export interface ImportContextInterface {
    readonly mccCategoryIdMap: Map<string, number | null>;
    readonly existingExternalIds: Set<string>;
    readonly tx: DB;
}
