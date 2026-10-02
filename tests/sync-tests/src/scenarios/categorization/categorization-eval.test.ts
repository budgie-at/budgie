import { categorizeInboxEngineService } from '@app/categorize-inbox/service/categorize-inbox-engine.service';
import { RuleMatcherService } from '@app/rule/service/rule-matcher.service';
import { extractRuleActionOutcomes } from '@app/rule/util/extract-rule-action-outcomes.util';
import { EMBEDDING_VEC_DISTANCE_THRESHOLD, buildCommentContext, buildMerchantContext, buildTransactionContext } from '@budgie/ai';
import {
    CategoryEntityTable,
    CategorySourceEnum,
    CommentEmbeddingRepository,
    MerchantEmbeddingRepository,
    RuleRepository,
    SettingsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { afterAll, describe, expect, it } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { seed, testDb, TestLayer } from '../../harness';
import { embedCategorizationEvalTexts } from '../../harness/categorization-eval/embed-categorization-eval-texts';
import { fetchCategorizationEvalEntries } from '../../harness/categorization-eval/fetch-categorization-eval-entries';
import { backupDatabasePath } from '../../harness/scenario/setup';
import { subtractMonths } from '../../harness/scenario/subtract-months';

import type { LabelEvidenceRowInterface } from '@budgie/contracts';

type EvalEntry = Effect.Success<ReturnType<typeof fetchCategorizationEvalEntries>>['entries'][number];
type KnnDocument = { readonly vector: Float32Array; readonly categoryId: number; readonly tagIds: Set<number> };

const EVAL_TIMEOUT_MS = 600_000;
const EVAL_WINDOW_MONTHS = 6;
const TOP_K = 3;
const DAY_MS = 86_400_000;
const KNN_OVERSAMPLE_LIMIT = 50;

const isCategoryEvidence = (entry: EvalEntry): entry is EvalEntry & { readonly categoryId: number } =>
    isDefined(entry.categoryId) &&
    entry.categorySource !== CategorySourceEnum.MCC_DEFAULT &&
    entry.isSystemCategory === false &&
    !isDefined(entry.categoryDeletedAt);

const addEvidence = (evidence: Map<string, LabelEvidenceRowInterface>, entry: EvalEntry, labelId: number): void => {
    const key = `${entry.type}|${entry.title}|${entry.mccCategoryId}|${labelId}`;

    evidence.set(key, {
        title: entry.title,
        type: entry.type,
        mccCategoryId: entry.mccCategoryId,
        labelId,
        count: (evidence.get(key)?.count ?? 0) + 1
    });
};

const buildKnnDocumentText = (entry: EvalEntry): string =>
    isNotEmptyString(entry.title)
        ? buildMerchantContext({
              title: entry.title,
              mccDescription: entry.mccDescription ?? '',
              categoryTitle: entry.categoryTitleEn ?? entry.categoryTitle
          })
        : buildCommentContext({ comment: entry.comment, categoryTitle: entry.categoryTitleEn ?? entry.categoryTitle });

const buildKnnQueryText = (entry: EvalEntry): string =>
    buildTransactionContext({ title: entry.title, mccDescription: entry.mccDescription, comment: entry.comment });

const isKnnIndexable = (entry: EvalEntry): boolean => isNotEmptyString(entry.title) || isNotEmptyString(entry.comment);

const isKnnDocumentCandidate = (entry: EvalEntry): entry is EvalEntry & { readonly categoryId: number } =>
    isDefined(entry.categoryId) && isKnnIndexable(entry);

const addKnnDocument = (
    entry: EvalEntry,
    documentVectors: ReadonlyMap<string, Float32Array>,
    merchantDocuments: Map<string, KnnDocument>,
    commentDocuments: Map<string, KnnDocument>,
    tagIds: readonly number[]
): void => {
    if (!isKnnDocumentCandidate(entry)) {
        return;
    }

    const text = buildKnnDocumentText(entry);
    const vector = documentVectors.get(text);
    if (!isDefined(vector)) {
        return;
    }

    const documents = isNotEmptyString(entry.title) ? merchantDocuments : commentDocuments;
    const key = `${entry.categoryId}|${text}`;
    const document = documents.get(key) ?? { vector, categoryId: entry.categoryId, tagIds: new Set<number>() };
    tagIds.forEach(tagId => document.tagIds.add(tagId));
    documents.set(key, document);
};

const sumScores = (scored: readonly (readonly [number, number])[]): [number, number][] => {
    const scores = new Map<number, number>();

    scored.forEach(([labelId, score]) => scores.set(labelId, (scores.get(labelId) ?? 0) + score));

    return [...scores].sort((first, second) => second[1] - first[1]).slice(0, TOP_K);
};

const rankKnn = (
    query: Float32Array | undefined,
    indexes: readonly (readonly KnnDocument[])[],
    labelsOf: (document: KnnDocument) => readonly number[]
): number[] =>
    isDefined(query)
        ? sumScores(
              indexes.flatMap(documents =>
                  sumScores(
                      documents
                          .map(document => ({
                              document,
                              distance: Math.sqrt(
                                  Math.max(0, 2 - 2 * document.vector.reduce((dot, value, index) => dot + value * query[index], 0))
                              )
                          }))
                          .sort((first, second) => first.distance - second.distance)
                          .slice(0, KNN_OVERSAMPLE_LIMIT)
                          .filter(neighbour => neighbour.distance < EMBEDDING_VEC_DISTANCE_THRESHOLD)
                          .flatMap(neighbour =>
                              labelsOf(neighbour.document).map(labelId => [labelId, 1 / (neighbour.distance + 0.01)] as const)
                          )
                  )
              )
          ).map(([labelId]) => labelId)
        : [];

const mergeRanked = (...rankings: (readonly number[])[]): number[] => [...new Set(rankings.flat())].slice(0, TOP_K);

const formatShare = (count: number, total: number): string => (isPositiveNumber(total) ? `${((count / total) * 100).toFixed(1)}%` : '-');

const formatCategoryRows = (
    cases: readonly { readonly categoryId: number; readonly categories: Readonly<Record<string, readonly number[]>> }[]
): string[] =>
    Object.keys(cases[0]?.categories ?? {}).map(signal => {
        const ranked = cases.map(evalCase => ({ actual: evalCase.categoryId, ranked: evalCase.categories[signal] }));
        const covered = ranked.filter(prediction => isNotEmptyArray(prediction.ranked)).length;
        const topOne = ranked.filter(prediction => prediction.ranked[0] === prediction.actual).length;
        const topThree = ranked.filter(prediction => prediction.ranked.includes(prediction.actual)).length;

        return [signal, formatShare(covered, cases.length), formatShare(topOne, cases.length), formatShare(topThree, cases.length)].join(
            '\t'
        );
    });

const formatTagRows = (
    cases: readonly { readonly tagIds: readonly number[]; readonly tags: Readonly<Record<string, readonly number[]>> }[]
): string[] =>
    Object.keys(cases[0]?.tags ?? {}).map(signal => {
        const predicted = cases.reduce((total, evalCase) => total + evalCase.tags[signal].length, 0);
        const actual = cases.reduce((total, evalCase) => total + evalCase.tagIds.length, 0);
        const hits = cases.reduce(
            (total, evalCase) => total + evalCase.tags[signal].filter(tagId => evalCase.tagIds.includes(tagId)).length,
            0
        );

        return [signal, formatShare(hits, predicted), formatShare(hits, actual)].join('\t');
    });

describe.skipIf(!isDefined(backupDatabasePath))('categorization/categorization-eval', () => {
    afterAll(() => testDb.$client.closeAsync());

    it.effect(
        'prints top-1/top-3 accuracy and tag precision/recall on user-set categories of a real backup',
        () =>
            Effect.gen(function* () {
                const ruleMatcherService = yield* RuleMatcherService;
                const ruleRepository = yield* RuleRepository;
                const settingsRepository = yield* SettingsRepository;
                const defaultInstrumentId = (yield* settingsRepository.getSettings()).defaultInstrumentId ?? 0;
                const { entries, tagIdsByTransactionId } = yield* fetchCategorizationEvalEntries();
                const rules = yield* ruleRepository.findEnabledWithRelations();
                const ruleMatches = yield* Effect.forEach(rules, rule =>
                    Effect.map(ruleMatcherService.collectMatchingTransactionIds(rule), transactionIds => new Set(transactionIds))
                );
                const primaryEntries = entries.filter((entry, index) => entries[index - 1]?.transactionId !== entry.transactionId);
                const labelledEntries = primaryEntries
                    .filter(isCategoryEvidence)
                    .filter(entry => entry.categorySource === CategorySourceEnum.USER);
                const windowStart = subtractMonths(labelledEntries.at(-1)?.operatedAt ?? new Date(0), EVAL_WINDOW_MONTHS);
                const evalEntries = labelledEntries.filter(entry => entry.operatedAt >= windowStart);
                const categoryEvidence = new Map<string, LabelEvidenceRowInterface>();
                const tagEvidence = new Map<string, LabelEvidenceRowInterface>();
                const { modelFile, documentVectors, queryVectors } = yield* embedCategorizationEvalTexts(
                    entries.filter(isKnnDocumentCandidate).map(buildKnnDocumentText),
                    evalEntries.map(buildKnnQueryText)
                );
                const merchantDocuments = new Map<string, KnnDocument>();
                const commentDocuments = new Map<string, KnnDocument>();
                let knnIndexes: KnnDocument[][] = [];
                let historyIndex = 0;
                let contextDay = Number.NaN;
                let categoryContext = categorizeInboxEngineService.buildContext([], defaultInstrumentId);
                let tagContext = categoryContext;

                const cases = evalEntries.map(evalEntry => {
                    const day = Math.floor(evalEntry.operatedAt.getTime() / DAY_MS);

                    if (day !== contextDay) {
                        while (historyIndex < entries.length && entries[historyIndex].operatedAt.getTime() < day * DAY_MS) {
                            const historyEntry = entries[historyIndex];

                            historyIndex += 1;

                            if (isCategoryEvidence(historyEntry)) {
                                addEvidence(categoryEvidence, historyEntry, historyEntry.categoryId);
                            }

                            addKnnDocument(
                                historyEntry,
                                documentVectors,
                                merchantDocuments,
                                commentDocuments,
                                tagIdsByTransactionId.get(historyEntry.transactionId) ?? []
                            );

                            (tagIdsByTransactionId.get(historyEntry.transactionId) ?? []).forEach(tagId =>
                                addEvidence(tagEvidence, historyEntry, tagId)
                            );
                        }

                        categoryContext = categorizeInboxEngineService.buildContext([...categoryEvidence.values()], defaultInstrumentId);
                        tagContext = categorizeInboxEngineService.buildContext([...tagEvidence.values()], defaultInstrumentId);
                        knnIndexes = [[...merchantDocuments.values()], [...commentDocuments.values()]];
                        contextDay = day;
                    }

                    const ruleOutcome = extractRuleActionOutcomes(
                        rules.filter((_rule, index) => ruleMatches[index].has(evalEntry.transactionId))
                    );
                    const ruleCategoryIds = isDefined(ruleOutcome.categoryId) ? [ruleOutcome.categoryId] : [];
                    const historyCategoryIds = categorizeInboxEngineService.suggestLabelIds([evalEntry], categoryContext);
                    const mccDefaultCategoryIds = isDefined(evalEntry.mccDefaultCategoryId) ? [evalEntry.mccDefaultCategoryId] : [];
                    const historyTagIds = categorizeInboxEngineService.suggestLabelIds([evalEntry], tagContext);
                    const queryVector = queryVectors.get(buildKnnQueryText(evalEntry));
                    const knnCategoryIds = rankKnn(queryVector, knnIndexes, document => [document.categoryId]);
                    const knnTagIds = rankKnn(queryVector, knnIndexes, document =>
                        document.categoryId === evalEntry.categoryId ? [...document.tagIds] : []
                    );

                    return {
                        categoryId: evalEntry.categoryId,
                        tagIds: tagIdsByTransactionId.get(evalEntry.transactionId) ?? [],
                        categories: {
                            rules: ruleCategoryIds,
                            history: historyCategoryIds,
                            mccDefault: mccDefaultCategoryIds,
                            combined: mergeRanked(ruleCategoryIds, historyCategoryIds, mccDefaultCategoryIds),
                            knn: knnCategoryIds,
                            combinedKnn: mergeRanked(ruleCategoryIds, historyCategoryIds, knnCategoryIds)
                        },
                        tags: {
                            rules: ruleOutcome.tagIds.slice(0, TOP_K),
                            history: historyTagIds,
                            combined: mergeRanked(ruleOutcome.tagIds, historyTagIds),
                            knn: knnTagIds,
                            combinedKnn: mergeRanked(ruleOutcome.tagIds, historyTagIds, knnTagIds)
                        }
                    };
                });

                process.stdout.write(
                    [
                        `userSetCases=${cases.length} windowMonths=${EVAL_WINDOW_MONTHS} enabledRules=${rules.length} embeddingModel=${modelFile}`,
                        ['signal', 'coverage', 'top1', 'top3'].join('\t'),
                        ...formatCategoryRows(cases),
                        ['tagSignal', 'precision@3', 'recall@3'].join('\t'),
                        ...formatTagRows(cases),
                        ''
                    ].join('\n')
                );

                expect(cases.length).toBeGreaterThan(0);
            }).pipe(Effect.provide(TestLayer)),
        EVAL_TIMEOUT_MS
    );
});

describe('categorization-eval/index-candidates', () => {
    it.effect('includes production-indexed MCC documents while keeping them out of user-set evaluation labels', () =>
        Effect.gen(function* () {
            const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
            const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
            const [mccSystemCategory, userCategory] = testDb
                .insert(CategoryEntityTable)
                .values([
                    { title: 'Default Dining', titleEn: 'Default Dining', icon: UserIconNameEnum.Wallet, isSystemCategory: true },
                    { title: 'User Dining', titleEn: 'User Dining', icon: UserIconNameEnum.Wallet, isSystemCategory: false }
                ])
                .returning()
                .all();
            const account = seed.account();
            const mccMerchant = seed.bankPairExpense(
                { externalId: 'eval-mcc-merchant', operatedAt: new Date('2026-01-01T12:00:00Z') },
                { accountId: account.id, amount: 1_000 }
            );
            const userMerchant = seed.bankPairExpense(
                { externalId: 'eval-user-merchant', operatedAt: new Date('2026-01-02T12:00:00Z') },
                { accountId: account.id, amount: 1_000 }
            );
            const userTarget = seed.bankPairExpense(
                { externalId: 'eval-user-target', operatedAt: new Date('2026-01-03T12:00:00Z') },
                { accountId: account.id, amount: 1_000 }
            );
            const mccComment = seed.bankPairExpense(
                { externalId: 'eval-mcc-comment', operatedAt: new Date('2026-01-01T13:00:00Z') },
                { accountId: account.id, amount: 1_000 }
            );

            [mccMerchant, userMerchant, userTarget, mccComment].forEach((transaction, index) => {
                testDb
                    .update(TransactionEntityTable)
                    .set({
                        title: index === 0 ? 'Cafe' : index === 1 ? 'Cafe shop' : index === 3 ? '' : 'Cafe',
                        comment: index === 3 ? 'Cafe receipt' : '',
                        needsEmbedding: true
                    })
                    .where(eq(TransactionEntityTable.id, transaction.id))
                    .run();
            });
            [mccMerchant, mccComment].forEach(transaction => {
                testDb
                    .update(TransactionEntryEntityTable)
                    .set({ categoryId: mccSystemCategory.id, categorySource: CategorySourceEnum.MCC_DEFAULT })
                    .where(
                        and(
                            eq(TransactionEntryEntityTable.transactionId, transaction.id),
                            eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY)
                        )
                    )
                    .run();
            });
            [userMerchant, userTarget].forEach(transaction => {
                testDb
                    .update(TransactionEntryEntityTable)
                    .set({ categoryId: userCategory.id, categorySource: CategorySourceEnum.USER })
                    .where(
                        and(
                            eq(TransactionEntryEntityTable.transactionId, transaction.id),
                            eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY)
                        )
                    )
                    .run();
            });

            const { entries } = yield* fetchCategorizationEvalEntries();
            const mccMerchantEntry = entries.find(entry => entry.transactionId === mccMerchant.id);
            const userMerchantEntry = entries.find(entry => entry.transactionId === userMerchant.id);
            const userTargetEntry = entries.find(entry => entry.transactionId === userTarget.id);
            const mccCommentEntry = entries.find(entry => entry.transactionId === mccComment.id);
            const targetDayStart = Math.floor(userTarget.operatedAt.getTime() / DAY_MS) * DAY_MS;
            const historicalEntries = entries.filter(entry => entry.operatedAt.getTime() < targetDayStart);
            const mccDocumentVector = new Float32Array([1, 0]);
            const userDocumentVector = new Float32Array([0.8, 0.6]);
            const otherDocumentVector = new Float32Array([0, 1]);
            const queryVector = new Float32Array([1, 0]);
            const merchantDocuments = new Map<string, KnnDocument>();
            const commentDocuments = new Map<string, KnnDocument>();
            const documentVectors = new Map<string, Float32Array>();

            entries.forEach(entry => {
                documentVectors.set(
                    buildKnnDocumentText(entry),
                    entry.transactionId === mccMerchant.id
                        ? mccDocumentVector
                        : entry.transactionId === userMerchant.id
                          ? userDocumentVector
                          : otherDocumentVector
                );
            });

            historicalEntries.forEach(entry => {
                addKnnDocument(entry, documentVectors, merchantDocuments, commentDocuments, []);
            });

            const knnIndexes: KnnDocument[][] = [Array.from(merchantDocuments.values()), Array.from(commentDocuments.values())];

            const merchantContexts = yield* merchantEmbeddingRepository.findPendingMerchantContexts(100);
            const commentContexts = yield* commentEmbeddingRepository.findPendingCommentContexts(100);

            expect(isDefined(mccMerchantEntry) && isCategoryEvidence(mccMerchantEntry)).toBe(false);
            expect(isDefined(userTargetEntry) && isCategoryEvidence(userTargetEntry)).toBe(true);
            expect(isDefined(userMerchantEntry) && isCategoryEvidence(userMerchantEntry)).toBe(true);
            expect(isDefined(mccCommentEntry) && isKnnIndexable(mccCommentEntry)).toBe(true);
            expect(merchantContexts.some(context => context.categoryId === mccSystemCategory.id && context.title === 'Cafe')).toBe(true);
            expect(commentContexts.some(context => context.categoryId === mccSystemCategory.id && context.comment === 'Cafe receipt')).toBe(
                true
            );
            expect(rankKnn(queryVector, knnIndexes, document => [document.categoryId])[0]).toBe(mccSystemCategory.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
