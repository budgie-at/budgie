import {
    CategorizeInboxLabelKindEnum,
    CategorizeInboxService,
    CommentEmbeddingRepository,
    EmbeddingInvoker,
    EmbeddingService,
    EmbeddingSuggestionService,
    MerchantEmbeddingRepository,
    TransactionCategorizeInboxRepository,
    categorizeInboxEngineService
} from '@budgie/categorization';
import {
    CategoryEntityTable,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    MerchantEmbeddingEntityTable,
    TransactionEntryEntityTable,
    TransactionRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { TestLayer, testDb, testSeedService } from './harness/test-context';

interface FakeDocumentInterface {
    readonly vector: readonly number[];
    readonly categoryId: number;
}

const seedCategory = (title: string) =>
    Effect.map(
        testDb
            .insert(CategoryEntityTable)
            .values({ title, titleEn: title, icon: UserIconNameEnum.Wallet, isSystemCategory: false })
            .returning(),
        ([category]) => category
    );

const seedExpense = Effect.fnUntraced(function* (accountId: number, externalId: string, title: string, categoryId: number | null) {
    const transaction = yield* testSeedService.bankPairExpense(
        { externalId, operatedAt: new Date('2026-01-03T09:00:00Z') },
        { accountId, amount: 1_000 }
    );

    yield* testSeedService.updateTransaction(transaction.id, { title });

    if (isDefined(categoryId)) {
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ categoryId, categorySource: CategorySourceEnum.USER })
            .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));
    }

    return transaction;
});

const makeSuggestionLayer = (documents: readonly FakeDocumentInterface[]) => {
    const merchantRepository = Layer.effect(
        MerchantEmbeddingRepository,
        Effect.map(MerchantEmbeddingRepository.make, repository => ({
            ...repository,
            findSimilarCategories: (query: Uint8Array, _vecLimit: number, distanceThreshold: number, categoryLimit: number) => {
                const target = new Float32Array(query.buffer, query.byteOffset, query.byteLength / Float32Array.BYTES_PER_ELEMENT);
                const scores = new Map<number, number>();

                documents.forEach(({ vector, categoryId }) => {
                    const distance = Math.hypot(...vector.map((value, index) => value - target[index]));

                    if (distance < distanceThreshold) {
                        scores.set(categoryId, (scores.get(categoryId) ?? 0) + 1 / (distance + 0.01));
                    }
                });

                return Effect.succeed(
                    [...scores]
                        .map(([categoryId, score]) => ({ categoryId, score }))
                        .sort((first, second) => second.score - first.score)
                        .slice(0, categoryLimit)
                );
            }
        }))
    );
    const commentRepository = Layer.effect(
        CommentEmbeddingRepository,
        Effect.map(CommentEmbeddingRepository.make, repository => ({ ...repository, findSimilarCategories: () => Effect.succeed([]) }))
    );

    return Layer.effect(EmbeddingSuggestionService, EmbeddingSuggestionService.make).pipe(
        Layer.provide([merchantRepository, commentRepository, TransactionRepository.layer, EmbeddingService.layer]),
        Layer.provide(Layer.succeed(EmbeddingInvoker, { embed: () => Effect.succeed([1, 0]) }))
    );
};

describe('categorization/suggestion', () => {
    it.effect('suggests the category a merchant was categorized with twice before', () =>
        Effect.gen(function* () {
            const inboxRepository = yield* TransactionCategorizeInboxRepository;
            const account = yield* testSeedService.account();
            const coffee = yield* seedCategory('Coffee');

            yield* seedExpense(account.id, 'history-1', 'Blue Bottle', coffee.id);
            yield* seedExpense(account.id, 'history-2', 'Blue Bottle', coffee.id);
            yield* seedExpense(account.id, 'pending', 'Blue Bottle', null);

            const evidence = yield* inboxRepository.findCategoryEvidence();
            const rows = yield* inboxRepository.findUncategorizedRows(DEFAULT_TRANSACTION_FILTER);
            const [cluster] = categorizeInboxEngineService.buildClusters(
                rows,
                categorizeInboxEngineService.buildContext(evidence, account.instrumentId)
            );

            expect(cluster.candidateLabelIds).toEqual([coffee.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('suggests the category of the nearest embedded neighbour', () =>
        Effect.gen(function* () {
            const coffee = yield* seedCategory('Coffee');
            const groceries = yield* seedCategory('Groceries');
            const suggestions = yield* Effect.flatMap(EmbeddingSuggestionService, embeddingSuggestionService =>
                embeddingSuggestionService.suggestCategories([coffee, groceries], 'Blue Bottle', null, '', '', null)
            ).pipe(
                Effect.provide(
                    makeSuggestionLayer([
                        { vector: [1, 0], categoryId: coffee.id },
                        { vector: [0, 1], categoryId: groceries.id }
                    ])
                )
            );

            expect(suggestions.map(category => category.id)).toEqual([coffee.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a category correction forgets the merchant embedding of the previous category', () =>
        Effect.gen(function* () {
            const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
            const account = yield* testSeedService.account();
            const coffee = yield* seedCategory('Coffee');
            const groceries = yield* seedCategory('Groceries');
            const transaction = yield* seedExpense(account.id, 'corrected', 'Blue Bottle', coffee.id);

            yield* testDb.run(sql`CREATE TABLE IF NOT EXISTS merchant_embedding_vec (rowid INTEGER PRIMARY KEY, embedding BLOB)`);
            yield* testDb.insert(MerchantEmbeddingEntityTable).values(
                [coffee.id, groceries.id].map(categoryId => ({
                    title: 'Blue Bottle',
                    mccDescription: '',
                    categoryId,
                    comment: '',
                    embedding: new Uint8Array(4),
                    dimensions: 1
                }))
            );
            yield* merchantEmbeddingRepository.deleteStaleCategories(transaction.id, [groceries.id, coffee.id]);

            const embeddings = yield* testDb.select().from(MerchantEmbeddingEntityTable);

            expect(embeddings.map(embedding => embedding.categoryId)).toEqual([coffee.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('accepting a cluster writes a user category to every row', () =>
        Effect.gen(function* () {
            const inboxRepository = yield* TransactionCategorizeInboxRepository;
            const categorizeInboxService = yield* CategorizeInboxService;
            const account = yield* testSeedService.account();
            const groceries = yield* seedCategory('Groceries');

            yield* seedExpense(account.id, 'cluster-1', 'Corner Shop', null);
            yield* seedExpense(account.id, 'cluster-2', 'Corner Shop', null);
            yield* seedExpense(account.id, 'cluster-3', 'Corner Shop', null);

            const rows = yield* inboxRepository.findUncategorizedRows(DEFAULT_TRANSACTION_FILTER);
            const [cluster] = categorizeInboxEngineService.buildClusters(
                rows,
                categorizeInboxEngineService.buildContext([], account.instrumentId)
            );

            yield* categorizeInboxService.assign(CategorizeInboxLabelKindEnum.CATEGORY, [
                {
                    key: cluster.key,
                    displayTitle: cluster.displayTitle,
                    labelId: groceries.id,
                    rows: cluster.rows,
                    ruleConditionValue: cluster.ruleConditionValue
                }
            ]);

            const entries = yield* testDb.select().from(TransactionEntryEntityTable);

            expect(cluster.rows).toHaveLength(3);
            expect(
                entries.filter(entry => entry.categoryId === groceries.id && entry.categorySource === CategorySourceEnum.USER)
            ).toHaveLength(3);
        }).pipe(Effect.provide(TestLayer))
    );
});
