import { categorizeInboxEngineService } from '@app/categorize-inbox/service/categorize-inbox-engine.service';
import { RuleMatcherService } from '@app/rule/service/rule-matcher.service';
import { extractRuleActionOutcomes } from '@app/rule/util/extract-rule-action-outcomes.util';
import { CategorySourceEnum, RuleRepository, SettingsRepository } from '@budgie/contracts';
import { afterAll, describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { testDb, TestLayer } from '../../harness';
import { CategorizationEvalSignalEnum } from '../../harness/categorization-eval/enum/categorization-eval-signal.enum';
import { fetchCategorizationEvalEntries } from '../../harness/categorization-eval/fetch-categorization-eval-entries';
import { backupDatabasePath } from '../../harness/scenario/setup';
import { subtractMonths } from '../../harness/scenario/subtract-months';

import type { CategorizationEvalCaseInterface } from '../../harness/categorization-eval/interface/categorization-eval-case.interface';
import type { LabelEvidenceRowInterface } from '@budgie/contracts';

type EvalEntry = Effect.Success<ReturnType<typeof fetchCategorizationEvalEntries>>['entries'][number];

const EVAL_TIMEOUT_MS = 600_000;
const EVAL_WINDOW_MONTHS = 6;
const TOP_K = 3;
const DAY_MS = 86_400_000;
const EVAL_SOURCES: ReadonlySet<CategorySourceEnum> = new Set([CategorySourceEnum.USER, CategorySourceEnum.RULE]);
const TAG_SIGNALS = [CategorizationEvalSignalEnum.RULES, CategorizationEvalSignalEnum.HISTORY, CategorizationEvalSignalEnum.COMBINED];

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

const formatCategoryRows = (scope: string, cases: readonly CategorizationEvalCaseInterface[]): string[] =>
    Object.values(CategorizationEvalSignalEnum).map(signal => {
        const predictions = cases.map(evalCase => ({
            actual: evalCase.categoryId,
            ranked: evalCase.categoryPredictions.get(signal) ?? []
        }));
        const covered = predictions.filter(({ ranked }) => isNotEmptyArray(ranked)).length;
        const topOne = predictions.filter(({ actual, ranked }) => ranked[0] === actual).length;
        const topThree = predictions.filter(({ actual, ranked }) => ranked.slice(0, TOP_K).includes(actual)).length;

        return [
            signal,
            scope,
            cases.length,
            formatShare(covered, cases.length),
            formatShare(topOne, cases.length),
            formatShare(topThree, cases.length),
            formatShare(topOne, covered)
        ].join('\t');
    });

const formatTagRows = (cases: readonly CategorizationEvalCaseInterface[]): string[] =>
    TAG_SIGNALS.map(signal => {
        const predictions = cases.map(evalCase => ({
            actual: evalCase.tagIds,
            ranked: (evalCase.tagPredictions.get(signal) ?? []).slice(0, TOP_K)
        }));
        const predicted = predictions.reduce((total, { ranked }) => total + ranked.length, 0);
        const actual = predictions.reduce((total, prediction) => total + prediction.actual.length, 0);
        const hits = predictions.reduce(
            (total, prediction) => total + prediction.ranked.filter(tagId => prediction.actual.includes(tagId)).length,
            0
        );
        const covered = predictions.filter(({ ranked }) => isNotEmptyArray(ranked)).length;

        return [signal, cases.length, formatShare(covered, cases.length), formatShare(hits, predicted), formatShare(hits, actual)].join(
            '\t'
        );
    });

describe.skipIf(!isDefined(backupDatabasePath))('categorization/categorization-eval', () => {
    afterAll(() => testDb.$client.closeAsync());

    it.effect(
        'prints baseline top-1/top-3 category accuracy and tag precision/recall of the current signals on a real backup',
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
                const labelledEntries = primaryEntries.filter(isCategoryEvidence).filter(entry => EVAL_SOURCES.has(entry.categorySource));
                const windowStart = subtractMonths(labelledEntries.at(-1)?.operatedAt ?? new Date(0), EVAL_WINDOW_MONTHS);
                const evalEntries = labelledEntries.filter(entry => entry.operatedAt >= windowStart);
                const categoryEvidence = new Map<string, LabelEvidenceRowInterface>();
                const tagEvidence = new Map<string, LabelEvidenceRowInterface>();
                const cases: CategorizationEvalCaseInterface[] = [];
                let historyIndex = 0;
                let contextDay = Number.NaN;
                let categoryContext = categorizeInboxEngineService.buildContext([], defaultInstrumentId);
                let tagContext = categoryContext;

                for (const evalEntry of evalEntries) {
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

                    cases.push({
                        categorySource: evalEntry.categorySource,
                        categoryId: evalEntry.categoryId,
                        tagIds: tagIdsByTransactionId.get(evalEntry.transactionId) ?? [],
                        categoryPredictions: new Map([
                            [CategorizationEvalSignalEnum.RULES, ruleCategoryIds],
                            [CategorizationEvalSignalEnum.HISTORY, historyCategoryIds],
                            [CategorizationEvalSignalEnum.MCC_DEFAULT, mccDefaultCategoryIds],
                            [CategorizationEvalSignalEnum.COMBINED, mergeRanked(ruleCategoryIds, historyCategoryIds, mccDefaultCategoryIds)]
                        ]),
                        tagPredictions: new Map([
                            [CategorizationEvalSignalEnum.RULES, ruleOutcome.tagIds],
                            [CategorizationEvalSignalEnum.HISTORY, historyTagIds],
                            [CategorizationEvalSignalEnum.COMBINED, mergeRanked(ruleOutcome.tagIds, historyTagIds)]
                        ])
                    });
                }

                process.stdout.write(
                    [
                        `cases=${cases.length} windowMonths=${EVAL_WINDOW_MONTHS} categorizableEntries=${entries.length} enabledRules=${rules.length}`,
                        ['signal', 'scope', 'cases', 'coverage', 'top1', 'top3', 'top1WhenCovered'].join('\t'),
                        ...formatCategoryRows('ALL', cases),
                        ...[...EVAL_SOURCES].flatMap(source =>
                            formatCategoryRows(
                                source,
                                cases.filter(evalCase => evalCase.categorySource === source)
                            )
                        ),
                        ['tagSignal', 'cases', 'coverage', 'precision@3', 'recall@3'].join('\t'),
                        ...formatTagRows(cases),
                        ''
                    ].join('\n')
                );

                expect(cases.length).toBeGreaterThan(0);
            }).pipe(Effect.provide(TestLayer)),
        EVAL_TIMEOUT_MS
    );
});
