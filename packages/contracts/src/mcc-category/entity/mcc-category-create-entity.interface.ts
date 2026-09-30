import type { MccCategoryEntityInterface } from './mcc-category-entity.interface';

export type MccCategoryCreateEntityInterface = Pick<
    MccCategoryEntityInterface,
    'mcc' | 'mccGroupId' | 'shortDescription' | 'fullDescription'
>;
