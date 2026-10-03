import { defineRelationsPart } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { MerchantEmbeddingTagAssociationEnum } from '../enum/merchant-embedding-tag-association.enum';
import { MerchantEmbeddingEntityTable } from '../table/merchant-embedding-entity.table';
import { MerchantEmbeddingTagEntityTable } from '../table/merchant-embedding-tag-entity.table';

export const MerchantEmbeddingTagEntityRelations = defineRelationsPart(
    {
        MerchantEmbeddingEntityTable,
        MerchantEmbeddingTagEntityTable,
        TagEntityTable
    },
    relation => ({
        MerchantEmbeddingTagEntityTable: {
            [MerchantEmbeddingTagAssociationEnum.MERCHANT_EMBEDDING]: relation.one.MerchantEmbeddingEntityTable({
                from: relation.MerchantEmbeddingTagEntityTable.merchantEmbeddingId,
                to: relation.MerchantEmbeddingEntityTable.id,
                optional: false
            }),
            [MerchantEmbeddingTagAssociationEnum.TAG]: relation.one.TagEntityTable({
                from: relation.MerchantEmbeddingTagEntityTable.tagId,
                to: relation.TagEntityTable.id,
                optional: false
            })
        }
    })
);
