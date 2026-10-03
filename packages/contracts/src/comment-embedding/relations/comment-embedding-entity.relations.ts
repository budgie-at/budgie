import { defineRelationsPart } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { CommentEmbeddingAssociationEnum } from '../enum/comment-embedding-association.enum';
import { CommentEmbeddingEntityTable } from '../table/comment-embedding-entity.table';
import { CommentEmbeddingTagEntityTable } from '../table/comment-embedding-tag-entity.table';

export const CommentEmbeddingEntityRelations = defineRelationsPart(
    {
        CategoryEntityTable,
        CommentEmbeddingEntityTable,
        CommentEmbeddingTagEntityTable
    },
    relation => ({
        CommentEmbeddingEntityTable: {
            [CommentEmbeddingAssociationEnum.CATEGORY]: relation.one.CategoryEntityTable({
                from: relation.CommentEmbeddingEntityTable.categoryId,
                to: relation.CategoryEntityTable.id,
                optional: false
            }),
            [CommentEmbeddingAssociationEnum.TAGS]: relation.many.CommentEmbeddingTagEntityTable({
                from: relation.CommentEmbeddingEntityTable.id,
                to: relation.CommentEmbeddingTagEntityTable.commentEmbeddingId
            })
        }
    })
);
