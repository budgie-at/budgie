import { categorizeInboxEngineService } from '@app/categorize-inbox/service/categorize-inbox-engine.service';
import { RuleMatcherService } from '@app/rule/service/rule-matcher.service';
import { extractRuleActionOutcomes } from '@app/rule/util/extract-rule-action-outcomes.util';
import { EMBEDDING_VEC_DISTANCE_THRESHOLD, buildCommentContext, buildMerchantContext, buildTransactionContext } from '@budgie/ai';
import { CategorySourceEnum, RuleRepository, SettingsRepository } from '@budgie/contracts';
import { afterAll, describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { testDb, TestLayer } from '../../harness';
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
                    entries.filter(isCategoryEvidence).filter(isKnnIndexable).map(buildKnnDocumentText),
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

                                const text = buildKnnDocumentText(historyEntry);
                                const vector = documentVectors.get(text);
                                const documents = isNotEmptyString(historyEntry.title) ? merchantDocuments : commentDocuments;
                                const key = `${historyEntry.categoryId}|${text}`;

                                if (isDefined(vector)) {
                                    const document = documents.get(key) ?? {
                                        vector,
                                        categoryId: historyEntry.categoryId,
                                        tagIds: new Set<number>()
                                    };

                                    (tagIdsByTransactionId.get(historyEntry.transactionId) ?? []).forEach(tagId =>
                                        document.tagIds.add(tagId)
                                    );
                                    documents.set(key, document);
                                }
                            }

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
