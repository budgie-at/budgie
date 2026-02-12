import { relations } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { CommentEmbeddingTagAssociationEnum } from '../enum/comment-embedding-tag-association.enum';
import { CommentEmbeddingEntityTable } from '../table/comment-embedding-entity.table';
import { CommentEmbeddingTagEntityTable } from '../table/comment-embedding-tag-entity.table';

export const CommentEmbeddingTagEntityRelations = relations(CommentEmbeddingTagEntityTable, ({ one }) => ({
    [CommentEmbeddingTagAssociationEnum.COMMENT_EMBEDDING]: one(CommentEmbeddingEntityTable, {
        fields: [CommentEmbeddingTagEntityTable.commentEmbeddingId],
        references: [CommentEmbeddingEntityTable.id]
    }),
    [CommentEmbeddingTagAssociationEnum.TAG]: one(TagEntityTable, {
        fields: [CommentEmbeddingTagEntityTable.tagId],
        references: [TagEntityTable.id]
    })
}));
