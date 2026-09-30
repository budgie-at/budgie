import type { ImporterColumnMapInterface } from './importer-column-map.interface';
import type {
    AccountEntityInterface,
    CategoryEntityInterface,
    InstrumentEntityInterface,
    MccCategoryLookupInterface
} from '@budgie/contracts';

export interface ImporterLookupInterface {
    readonly columnMap: ImporterColumnMapInterface;
    readonly instrumentsMap: Record<string, InstrumentEntityInterface>;
    readonly accountsMap: Record<string, AccountEntityInterface>;
    readonly categoriesMap: Record<string, CategoryEntityInterface | undefined>;
    readonly mccCategoryLookupMap: Map<string, MccCategoryLookupInterface>;
}
