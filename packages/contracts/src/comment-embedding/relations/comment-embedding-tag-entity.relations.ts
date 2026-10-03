import { defineRelationsPart } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { CommentEmbeddingTagAssociationEnum } from '../enum/comment-embedding-tag-association.enum';
import { CommentEmbeddingEntityTable } from '../table/comment-embedding-entity.table';
import { CommentEmbeddingTagEntityTable } from '../table/comment-embedding-tag-entity.table';

export const CommentEmbeddingTagEntityRelations = defineRelationsPart(
    {
        CommentEmbeddingEntityTable,
        CommentEmbeddingTagEntityTable,
        TagEntityTable
    },
    relation => ({
        CommentEmbeddingTagEntityTable: {
            [CommentEmbeddingTagAssociationEnum.COMMENT_EMBEDDING]: relation.one.CommentEmbeddingEntityTable({
                from: relation.CommentEmbeddingTagEntityTable.commentEmbeddingId,
                to: relation.CommentEmbeddingEntityTable.id,
                optional: false
            }),
            [CommentEmbeddingTagAssociationEnum.TAG]: relation.one.TagEntityTable({
                from: relation.CommentEmbeddingTagEntityTable.tagId,
                to: relation.TagEntityTable.id,
                optional: false
            })
        }
    })
);
