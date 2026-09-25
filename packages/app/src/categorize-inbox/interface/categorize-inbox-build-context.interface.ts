import { CategoryEvidenceRowInterface } from '@budgie/contracts';

export interface CategorizeInboxBuildContextInterface {
    readonly exact: ReadonlyMap<string, CategoryEvidenceRowInterface[]>;
    readonly merchant: ReadonlyMap<string, CategoryEvidenceRowInterface[]>;
    readonly brand: ReadonlyMap<string, CategoryEvidenceRowInterface[]>;
    readonly mcc: ReadonlyMap<string, CategoryEvidenceRowInterface[]>;
    readonly popularCategoryIds: ReadonlyMap<string, number[]>;
    readonly defaultInstrumentId: number;
}
