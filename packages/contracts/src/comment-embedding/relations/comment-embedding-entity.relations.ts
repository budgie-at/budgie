import { relations } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { CommentEmbeddingAssociationEnum } from '../enum/comment-embedding-association.enum';
import { CommentEmbeddingEntityTable } from '../table/comment-embedding-entity.table';
import { CommentEmbeddingTagEntityTable } from '../table/comment-embedding-tag-entity.table';

export const CommentEmbeddingEntityRelations = relations(CommentEmbeddingEntityTable, ({ one, many }) => ({
    [CommentEmbeddingAssociationEnum.CATEGORY]: one(CategoryEntityTable, {
        fields: [CommentEmbeddingEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    }),
    [CommentEmbeddingAssociationEnum.TAGS]: many(CommentEmbeddingTagEntityTable)
}));
