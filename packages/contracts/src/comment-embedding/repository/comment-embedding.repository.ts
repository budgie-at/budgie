import { and, desc, eq, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';

import { BaseEmbeddingRepository, isDefined } from '../../@generic/repository/base-embedding.repository';
import { DB, RawDb } from '../../@generic/type/db.type';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { UnembeddedCommentDataInterface } from '../interface/unembedded-comment-data.interface';
import { UpsertCommentEmbeddingParamsInterface } from '../interface/upsert-comment-embedding-params.interface';
import { CommentEmbeddingEntityTable } from '../table/comment-embedding-entity.table';
import { CommentEmbeddingTagEntityTable } from '../table/comment-embedding-tag-entity.table';

const SIMILAR_CATEGORIES_QUERY = `
    SELECT ce.category_id as categoryId,
           SUM(1.0 / (vec.distance + 0.01)) as score
    FROM (SELECT rowid, distance FROM comment_embedding_vec
          WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN comment_embeddings ce ON ce.id = vec.rowid
    WHERE ce.deleted_at IS NULL AND vec.distance < ?
    GROUP BY ce.category_id
    ORDER BY score DESC
    LIMIT ?
`;

const SIMILAR_TAGS_QUERY = `
    SELECT cet.tag_id as tagId,
           SUM(1.0 / (vec.distance + 0.01)) as score
    FROM (SELECT rowid, distance FROM comment_embedding_vec
          WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN comment_embeddings ce ON ce.id = vec.rowid
    JOIN comment_embedding_tags cet ON cet.comment_embedding_id = ce.id
    WHERE ce.deleted_at IS NULL AND vec.distance < ? AND ce.category_id = ?
    GROUP BY cet.tag_id
    ORDER BY score DESC
    LIMIT ?
`;

export class CommentEmbeddingRepository extends BaseEmbeddingRepository {
    constructor(db: DB, rawDb: RawDb) {
        super(db, rawDb, { similarCategoriesQuery: SIMILAR_CATEGORIES_QUERY, similarTagsQuery: SIMILAR_TAGS_QUERY });
    }

    async upsert(params: UpsertCommentEmbeddingParamsInterface): Promise<number | null> {
        const { comment, categoryId, embedding, dimensions } = params;

        if (!this.isValidDimensions(dimensions)) {
            return null;
        }

        const [row] = await this.db
            .insert(CommentEmbeddingEntityTable)
            .values({ comment, categoryId, embedding, dimensions })
            .onConflictDoUpdate({
                target: [CommentEmbeddingEntityTable.comment, CommentEmbeddingEntityTable.categoryId],
                set: { embedding, dimensions, updatedAt: new Date() }
            })
            .returning({ id: CommentEmbeddingEntityTable.id });

        await this.rawDb.runAsync(
            'INSERT OR REPLACE INTO comment_embedding_vec(rowid, embedding) SELECT id, embedding FROM comment_embeddings WHERE id = ?',
            [row.id]
        );

        return row.id;
    }

    async replaceTags(embeddingId: number, tagIds: number[]): Promise<void> {
        return this.replaceEmbeddingTags({
            tagTable: CommentEmbeddingTagEntityTable,
            foreignKeyColumn: CommentEmbeddingTagEntityTable.commentEmbeddingId,
            embeddingId,
            tagIds,
            createTagRow: tagId => ({ commentEmbeddingId: embeddingId, tagId })
        });
    }

    async findTransactionData(limit: number, cursor?: number): Promise<UnembeddedCommentDataInterface[]> {
        const entryJoinCondition = and(
            eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
            isNull(TransactionEntryEntityTable.deletedAt)
        );
        const commentWhereCondition = and(
            isNull(TransactionEntityTable.deletedAt),
            eq(TransactionEntityTable.title, ''),
            ne(TransactionEntityTable.comment, ''),
            isNotNull(TransactionEntryEntityTable.categoryId)
        );

        let query = this.db
            .select({
                comment: TransactionEntityTable.comment,
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitleEn: sql<string | null>`MAX(COALESCE(${CategoryEntityTable.titleEn}, ${CategoryEntityTable.title}))`,
                tagIds: sql<string | null>`GROUP_CONCAT(DISTINCT ${TagEntityTable.id})`,
                maxOperatedAt: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('maxOperatedAt')
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, entryJoinCondition)
            .leftJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .leftJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .leftJoin(TagEntityTable, eq(TagEntityTable.id, TransactionTagsEntityTable.tagId))
            .where(commentWhereCondition)
            .groupBy(TransactionEntityTable.comment, TransactionEntryEntityTable.categoryId)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(limit)
            .$dynamic();

        if (isDefined(cursor)) {
            query = query.having(lt(sql`MAX(${TransactionEntityTable.operatedAt})`, cursor));
        }

        const rows = await query;
        const validRows = rows.filter((row): row is typeof row & { categoryId: number } => isDefined(row.categoryId));

        return validRows.map(row => ({
            comment: row.comment,
            categoryId: row.categoryId,
            categoryTitleEn: row.categoryTitleEn ?? null,
            tagIds: row.tagIds ?? null,
            maxOperatedAt: row.maxOperatedAt
        }));
    }

    async countAll(): Promise<number> {
        return this.countRows(CommentEmbeddingEntityTable, CommentEmbeddingEntityTable.deletedAt);
    }

    async findAllContextKeys(): Promise<string[]> {
        const results = await this.db
            .select({
                comment: CommentEmbeddingEntityTable.comment,
                categoryId: CommentEmbeddingEntityTable.categoryId
            })
            .from(CommentEmbeddingEntityTable)
            .where(isNull(CommentEmbeddingEntityTable.deletedAt));

        return results.map(row => `${row.comment}|${row.categoryId}`);
    }

    async rebuildVecIndex(): Promise<void> {
        return this.rebuildVec('comment_embedding_vec', 'comment_embeddings');
    }

    async truncate(): Promise<void> {
        return this.truncateWithTags(CommentEmbeddingTagEntityTable, CommentEmbeddingEntityTable, 'comment_embedding_vec');
    }
}
