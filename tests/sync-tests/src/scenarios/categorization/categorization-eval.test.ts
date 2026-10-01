import { categorizeInboxEngineService } from '@app/categorize-inbox/service/categorize-inbox-engine.service';
import { RuleMatcherService } from '@app/rule/service/rule-matcher.service';
import { extractRuleActionOutcomes } from '@app/rule/util/extract-rule-action-outcomes.util';
import { CategorySourceEnum, RuleRepository, SettingsRepository } from '@budgie/contracts';
import { afterAll, describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { testDb, TestLayer } from '../../harness';
import { fetchCategorizationEvalEntries } from '../../harness/categorization-eval/fetch-categorization-eval-entries';
import { backupDatabasePath } from '../../harness/scenario/setup';
import { subtractMonths } from '../../harness/scenario/subtract-months';

import type { LabelEvidenceRowInterface } from '@budgie/contracts';

type EvalEntry = Effect.Success<ReturnType<typeof fetchCategorizationEvalEntries>>['entries'][number];

const EVAL_TIMEOUT_MS = 600_000;
const EVAL_WINDOW_MONTHS = 6;
const TOP_K = 3;
const DAY_MS = 86_400_000;

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

                            (tagIdsByTransactionId.get(historyEntry.transactionId) ?? []).forEach(tagId =>
                                addEvidence(tagEvidence, historyEntry, tagId)
                            );
                        }

                        categoryContext = categorizeInboxEngineService.buildContext([...categoryEvidence.values()], defaultInstrumentId);
                        tagContext = categorizeInboxEngineService.buildContext([...tagEvidence.values()], defaultInstrumentId);
                        contextDay = day;
                    }

                    const ruleOutcome = extractRuleActionOutcomes(
                        rules.filter((_rule, index) => ruleMatches[index].has(evalEntry.transactionId))
                    );
                    const ruleCategoryIds = isDefined(ruleOutcome.categoryId) ? [ruleOutcome.categoryId] : [];
                    const historyCategoryIds = categorizeInboxEngineService.suggestLabelIds([evalEntry], categoryContext);
                    const mccDefaultCategoryIds = isDefined(evalEntry.mccDefaultCategoryId) ? [evalEntry.mccDefaultCategoryId] : [];
                    const historyTagIds = categorizeInboxEngineService.suggestLabelIds([evalEntry], tagContext);

                    return {
                        categoryId: evalEntry.categoryId,
                        tagIds: tagIdsByTransactionId.get(evalEntry.transactionId) ?? [],
                        categories: {
                            rules: ruleCategoryIds,
                            history: historyCategoryIds,
                            mccDefault: mccDefaultCategoryIds,
                            combined: mergeRanked(ruleCategoryIds, historyCategoryIds, mccDefaultCategoryIds)
                        },
                        tags: {
                            rules: ruleOutcome.tagIds.slice(0, TOP_K),
                            history: historyTagIds,
                            combined: mergeRanked(ruleOutcome.tagIds, historyTagIds)
                        }
                    };
                });

                process.stdout.write(
                    [
                        `userSetCases=${cases.length} windowMonths=${EVAL_WINDOW_MONTHS} enabledRules=${rules.length}`,
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
