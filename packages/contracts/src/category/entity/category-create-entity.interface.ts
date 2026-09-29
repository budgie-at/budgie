import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { CategoryEntityInterface } from './category-entity.interface';

export type CategoryCreateEntityInterface = PartialByKeysType<
    Omit<
        CategoryEntityInterface,
        BaseEntityKeyType | 'isDefault' | 'isSystemCategory' | 'titleSearch' | 'titleEn' | 'titleTags' | 'tagsGeneratedAt'
    >,
    'parentId'
>;
