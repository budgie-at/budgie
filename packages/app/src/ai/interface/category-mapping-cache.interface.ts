import { LanguageEnum } from '@budgie/contracts';

import { ExpenseTypeMappingInterface } from './expense-type-mapping.interface';

export interface CategoryMappingCacheInterface {
    version: 1;
    language: LanguageEnum;
    categoriesHash: string;
    mapping: ExpenseTypeMappingInterface[];
    createdAt: number;
}
