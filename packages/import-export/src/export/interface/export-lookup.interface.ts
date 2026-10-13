import type {
    AccountEntityInterface,
    CategoryEntityInterface,
    InstrumentEntityInterface,
    MccCategoryEntityInterface
} from '@budgie/contracts';

export interface ExportLookupInterface {
    readonly accounts: ReadonlyMap<number, AccountEntityInterface>;
    readonly categories: ReadonlyMap<number, CategoryEntityInterface>;
    readonly instruments: ReadonlyMap<number, InstrumentEntityInterface>;
    readonly mccCategories: ReadonlyMap<number, MccCategoryEntityInterface>;
}
