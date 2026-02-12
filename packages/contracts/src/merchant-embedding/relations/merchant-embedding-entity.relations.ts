import { relations } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { MerchantEmbeddingAssociationEnum } from '../enum/merchant-embedding-association.enum';
import { MerchantEmbeddingEntityTable } from '../table/merchant-embedding-entity.table';
import { MerchantEmbeddingTagEntityTable } from '../table/merchant-embedding-tag-entity.table';

export const MerchantEmbeddingEntityRelations = relations(MerchantEmbeddingEntityTable, ({ one, many }) => ({
    [MerchantEmbeddingAssociationEnum.CATEGORY]: one(CategoryEntityTable, {
        fields: [MerchantEmbeddingEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    }),
    [MerchantEmbeddingAssociationEnum.TAGS]: many(MerchantEmbeddingTagEntityTable)
}));
