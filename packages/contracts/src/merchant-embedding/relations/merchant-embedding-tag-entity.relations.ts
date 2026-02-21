import { relations } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { MerchantEmbeddingTagAssociationEnum } from '../enum/merchant-embedding-tag-association.enum';
import { MerchantEmbeddingEntityTable } from '../table/merchant-embedding-entity.table';
import { MerchantEmbeddingTagEntityTable } from '../table/merchant-embedding-tag-entity.table';

export const MerchantEmbeddingTagEntityRelations = relations(MerchantEmbeddingTagEntityTable, ({ one }) => ({
    [MerchantEmbeddingTagAssociationEnum.MERCHANT_EMBEDDING]: one(MerchantEmbeddingEntityTable, {
        fields: [MerchantEmbeddingTagEntityTable.merchantEmbeddingId],
        references: [MerchantEmbeddingEntityTable.id]
    }),
    [MerchantEmbeddingTagAssociationEnum.TAG]: one(TagEntityTable, {
        fields: [MerchantEmbeddingTagEntityTable.tagId],
        references: [TagEntityTable.id]
    })
}));
