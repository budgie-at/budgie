import { defineRelationsPart } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { MerchantEmbeddingAssociationEnum } from '../enum/merchant-embedding-association.enum';
import { MerchantEmbeddingEntityTable } from '../table/merchant-embedding-entity.table';
import { MerchantEmbeddingTagEntityTable } from '../table/merchant-embedding-tag-entity.table';

export const MerchantEmbeddingEntityRelations = defineRelationsPart(
    {
        CategoryEntityTable,
        MerchantEmbeddingEntityTable,
        MerchantEmbeddingTagEntityTable
    },
    relation => ({
        MerchantEmbeddingEntityTable: {
            [MerchantEmbeddingAssociationEnum.CATEGORY]: relation.one.CategoryEntityTable({
                from: relation.MerchantEmbeddingEntityTable.categoryId,
                to: relation.CategoryEntityTable.id,
                optional: false
            }),
            [MerchantEmbeddingAssociationEnum.TAGS]: relation.many.MerchantEmbeddingTagEntityTable({
                from: relation.MerchantEmbeddingEntityTable.id,
                to: relation.MerchantEmbeddingTagEntityTable.merchantEmbeddingId
            })
        }
    })
);
