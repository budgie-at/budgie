import {
    transactionFilters,
    CategorySourceEnum,
    Db,
    MccCategoryRepository,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    TagSourceEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTagsRepository,
    TransactionUpdatedByEnum,
    YIELD_TO_UI
} from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RULE_BATCH_SIZE, RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';
import { RuleRepository } from '../repository/rule.repository';
import { TransactionRuleRepository } from '../repository/transaction-rule.repository';
import { compileRule } from '../utils/compile-rule.util';
import { convertTransactionForRuleEvaluation } from '../utils/convert-transaction-for-rule-evaluation.util';
import { doConditionsRequireEntries } from '../utils/do-conditions-require-entries.util';
import { extractRuleActionOutcomes } from '../utils/extract-rule-action-outcomes.util';
import { prepareLightweightRuleSnapshot } from '../utils/prepare-lightweight-rule-snapshot.util';
import { prepareRuleEvaluationSnapshot } from '../utils/prepare-rule-evaluation-snapshot.util';

import { RuleMatcherService } from './rule-matcher.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleEvaluationSnapshotInterface } from '../interface/rule-evaluation-snapshot.interface';
import type { RuleTransactionMatchInterface } from '../interface/rule-transaction-match.interface';
import type { RuleActionEntityInterface, RuleWithRelationsEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';

export class RuleEngineService extends Context.Service<RuleEngineService>()('@budgie/rules/RuleEngineService', {
    make: Effect.gen(function* () {
        const mccCategoryRepository = yield* MccCategoryRepository;
        const ruleRepository = yield* RuleRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionRuleRepository = yield* TransactionRuleRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;
        const ruleMatcherService = yield* RuleMatcherService;
        const transactionTransferService = yield* TransactionTransferService;

        const pushBatchId = (map: Map<number, number[]>, key: number, transactionId: number): void => {
            const ids = map.get(key) ?? [];
            ids.push(transactionId);
            map.set(key, ids);
        };

        const isActiveRule = (rule: RuleWithRelationsEntityInterface): boolean =>
            isNotEmptyArray(rule.conditions) && isNotEmptyArray(rule.actions);

        const hasConvertToTransferAction = (actions: RuleActionEntityInterface[]): boolean =>
            actions.some(action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER);

        const hasPostCreateRuleAction = (matchingRules: RuleWithRelationsEntityInterface[]): boolean =>
            matchingRules.some(rule => hasConvertToTransferAction(rule.actions));

        const extractTransferAccountIds = (actions: RuleActionEntityInterface[]): number[] =>
            actions
                .filter(action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER)
                .map(action => action.accountId)
                .filter(isDefined);

        const applyMatchedRulesInBatch = Effect.fn('RuleEngineService.applyMatchedRulesInBatch')(
            function* (matches: RuleTransactionMatchInterface[]) {
                const transactionIdsByCategory = new Map<number, number[]>();
                const transactionIdsByTag = new Map<number, number[]>();
                const transferAccountIdsByTransaction = new Map<number, number[]>();

                for (const match of matches) {
                    const outcomes = extractRuleActionOutcomes(match.matchingRules);

                    if (isDefined(outcomes.categoryId)) {
                        pushBatchId(transactionIdsByCategory, outcomes.categoryId, match.transactionId);
                    }

                    for (const tagId of outcomes.tagIds) {
                        pushBatchId(transactionIdsByTag, tagId, match.transactionId);
                    }

                    const transferAccountIds = match.matchingRules.flatMap(rule => extractTransferAccountIds(rule.actions));

                    if (isNotEmptyArray(transferAccountIds)) {
                        transferAccountIdsByTransaction.set(match.transactionId, transferAccountIds);
                    }
                }

                const convertedTransactionIds = new Set<number>();

                for (const [transactionId, accountIds] of transferAccountIdsByTransaction) {
                    for (const accountId of accountIds) {
                        if (yield* transactionTransferService.convertToTransferAccount(transactionId, accountId)) {
                            convertedTransactionIds.add(transactionId);
                            break;
                        }
                    }
                }

                const changedTransactionIds = new Set<number>();

                for (const [categoryId, transactionIds] of transactionIdsByCategory) {
                    const categorizedIds = yield* transactionRuleRepository.setCategoryByTransactionIds(transactionIds, categoryId);

                    for (const transactionId of categorizedIds) {
                        changedTransactionIds.add(transactionId);
                    }
                }

                for (const [tagId, transactionIds] of transactionIdsByTag) {
                    const taggedIds = yield* transactionTagsRepository.addTagByTransactionIds(transactionIds, tagId, TagSourceEnum.RULE);

                    for (const transactionId of taggedIds) {
                        changedTransactionIds.add(transactionId);
                    }
                }

                if (changedTransactionIds.size > 0) {
                    yield* transactionRepository.touchUpdatedByIds([...changedTransactionIds], TransactionUpdatedByEnum.RULE);
                }

                if (convertedTransactionIds.size > 0) {
                    yield* transactionRuleRepository.stampUpdatedByRule([...convertedTransactionIds]);
                }

                yield* transactionRuleRepository.stampUnauthoredUpdatedByRule(matches.map(match => match.transactionId));
            },
            effect => Db.transaction(effect)
        );

        const buildMccCodeMapIfNeeded = Effect.fn('RuleEngineService.buildMccCodeMapIfNeeded')(function* (
            rules: RuleWithRelationsEntityInterface[],
            inputs: TransactionCreateInputInterface[]
        ) {
            const hasMccCondition = rules.some(rule =>
                rule.conditions.some(condition => condition.field === RuleConditionFieldEnum.MCC_CODE)
            );

            if (!hasMccCondition) {
                return new Map<number, string>();
            }

            const mccCategoryIds = [...new Set(inputs.flatMap(input => input.entries.map(entry => entry.mccCategoryId).filter(isDefined)))];

            if (!isNotEmptyArray(mccCategoryIds)) {
                return new Map<number, string>();
            }

            return yield* mccCategoryRepository.findMccCodesByIds(mccCategoryIds);
        });

        const toRuleEvaluationInput = (
            input: TransactionCreateInputInterface,
            mccCodeMap: Map<number, string>
        ): RuleEvaluationInputInterface => ({
            ...input,
            title: isNotEmptyString(input.title) ? input.title : input.comment,
            entries: input.entries.map(entry => ({
                ...entry,
                mccCode: isDefined(entry.mccCategoryId) ? (mccCodeMap.get(entry.mccCategoryId) ?? null) : null
            }))
        });

        const compileRulesWithEntities = (rules: RuleWithRelationsEntityInterface[]) =>
            rules.map(rule => ({ rule, matches: compileRule(rule) }));

        const matchCompiledRulesForSnapshot = (
            compiledRules: readonly { readonly rule: RuleWithRelationsEntityInterface; readonly matches: ReturnType<typeof compileRule> }[],
            snapshot: RuleEvaluationSnapshotInterface
        ): RuleWithRelationsEntityInterface[] => {
            const matchingRules: RuleWithRelationsEntityInterface[] = [];

            for (const compiledRule of compiledRules) {
                if (compiledRule.matches(snapshot)) {
                    matchingRules.push(compiledRule.rule);
                }
            }

            return matchingRules;
        };

        const findMatchingRulesByIndex = Effect.fnUntraced(function* (
            rules: RuleWithRelationsEntityInterface[],
            transactionInputs: TransactionCreateInputInterface[]
        ) {
            const mccCodeMap = yield* buildMccCodeMapIfNeeded(rules, transactionInputs);
            const compiledRules = compileRulesWithEntities(rules);

            return transactionInputs.map(input =>
                matchCompiledRulesForSnapshot(compiledRules, prepareRuleEvaluationSnapshot(toRuleEvaluationInput(input, mccCodeMap)))
            );
        });

        const applyMatches = Effect.fnUntraced(function* (matches: RuleTransactionMatchInterface[]) {
            const nonEmptyMatches = matches.filter(match => isNotEmptyArray(match.matchingRules));

            if (!isNotEmptyArray(nonEmptyMatches)) {
                return;
            }

            const hasTransferConversions = nonEmptyMatches.some(match => hasPostCreateRuleAction(match.matchingRules));
            const batchSize = hasTransferConversions ? RULE_BATCH_SIZE : RULE_SET_BATCH_SIZE;
            const batches = Arr.chunksOf(nonEmptyMatches, batchSize);

            for (const [index, batch] of batches.entries()) {
                if (index > 0) {
                    yield* YIELD_TO_UI;
                }

                yield* applyMatchedRulesInBatch(batch);
            }
        });

        const applyRulesToTransactions = Effect.fn('RuleEngineService.applyRulesToTransactions')(function* (
            transactionIds: number[],
            transactionInputs: TransactionCreateInputInterface[]
        ) {
            const count = Math.min(transactionIds.length, transactionInputs.length);

            if (count === 0) {
                return;
            }

            const rules = (yield* ruleRepository.findEnabledWithRelations).filter(isActiveRule);
            if (!isNotEmptyArray(rules)) {
                return;
            }

            const alignedInputs = count === transactionInputs.length ? transactionInputs : transactionInputs.slice(0, count);
            const matchingRulesByIndex = yield* findMatchingRulesByIndex(rules, alignedInputs);

            yield* applyMatches(
                transactionIds.slice(0, count).map((transactionId, index) => ({
                    transactionId,
                    matchingRules: matchingRulesByIndex[index] ?? []
                }))
            );
        });

        const applyRulesToTransactionIdsWhere = Effect.fn('RuleEngineService.applyRulesToTransactionIdsWhere')(function* (
            transactionIds: number[],
            isActionAllowed: (action: RuleActionEntityInterface) => boolean
        ) {
            if (!isNotEmptyArray(transactionIds)) {
                return;
            }

            const rules = yield* ruleRepository.findEnabledWithRelations;
            if (!isNotEmptyArray(rules)) {
                return;
            }

            const allowedRules = rules.map(rule => ({ ...rule, actions: rule.actions.filter(isActionAllowed) })).filter(isActiveRule);

            if (!isNotEmptyArray(allowedRules)) {
                return;
            }

            const compiledRules = compileRulesWithEntities(allowedRules);
            const needsEntries = allowedRules.some(rule => doConditionsRequireEntries(rule.conditions));

            if (needsEntries) {
                const transactions = yield* transactionRepository.findVisibleByIdsWithEntries(transactionIds);

                yield* applyMatches(
                    transactions.map(transaction => ({
                        transactionId: transaction.id,
                        matchingRules: matchCompiledRulesForSnapshot(
                            compiledRules,
                            prepareRuleEvaluationSnapshot(convertTransactionForRuleEvaluation(transaction))
                        )
                    }))
                );

                return;
            }

            const rows = yield* transactionRuleRepository.findLightweightByIds(transactionIds);

            yield* applyMatches(
                rows.map(row => ({
                    transactionId: row.id,
                    matchingRules: matchCompiledRulesForSnapshot(compiledRules, prepareLightweightRuleSnapshot(row))
                }))
            );
        });

        const applyCreateSafeRuleActionsToInput = (
            input: TransactionCreateInputInterface,
            matchingRules: RuleWithRelationsEntityInterface[]
        ): TransactionCreateInputInterface => {
            if (!isNotEmptyArray(matchingRules)) {
                return input;
            }

            const ruleActionOutcomes = extractRuleActionOutcomes(matchingRules);
            const { categoryId } = ruleActionOutcomes;
            const ruleTagIds = [...new Set([...(input.ruleTagIds ?? []), ...ruleActionOutcomes.tagIds])].filter(
                tagId => !input.tagIds.includes(tagId)
            );
            const canCategorize = transactionFilters.isCategorizableTransactionType(input.type);
            const hasCategoryAction =
                canCategorize && isDefined(categoryId) && input.entries.some(entry => entry.type !== TransactionEntryTypeEnum.FEE);
            const hasTagAction = ruleTagIds.some(tagId => !(input.ruleTagIds ?? []).includes(tagId));

            if (!hasCategoryAction && !hasTagAction) {
                return input;
            }

            const entries = hasCategoryAction
                ? input.entries.map(entry =>
                      entry.type === TransactionEntryTypeEnum.FEE
                          ? entry
                          : { ...entry, categoryId, categorySource: CategorySourceEnum.RULE }
                  )
                : input.entries;

            return {
                ...input,
                updatedBy: TransactionUpdatedByEnum.RULE,
                ruleTagIds,
                entries
            };
        };

        const prepareCreateInputsForRules = Effect.fn('RuleEngineService.prepareCreateInputsForRules')(function* (
            transactionInputs: TransactionCreateInputInterface[]
        ) {
            if (!isNotEmptyArray(transactionInputs)) {
                return { transactionInputs, postCreateIndexes: [] };
            }

            const rules = (yield* ruleRepository.findEnabledWithRelations).filter(isActiveRule);
            if (!isNotEmptyArray(rules)) {
                return { transactionInputs, postCreateIndexes: [] };
            }

            const matchingRulesByIndex = yield* findMatchingRulesByIndex(rules, transactionInputs);
            const preparedTransactionInputs = transactionInputs.map((input, index) =>
                applyCreateSafeRuleActionsToInput(input, matchingRulesByIndex[index] ?? [])
            );
            const postCreateIndexes = matchingRulesByIndex.flatMap((matchingRules, index) =>
                hasPostCreateRuleAction(matchingRules) ? [index] : []
            );

            return { transactionInputs: preparedTransactionInputs, postCreateIndexes };
        });

        const convertTransactionBatchToTransfer = Effect.fn('RuleEngineService.convertTransactionBatchToTransfer')(function* (
            batchIds: number[],
            actions: RuleActionEntityInterface[]
        ) {
            const transferAccountIds = extractTransferAccountIds(actions);
            const convertedTransactionIds = new Set<number>();

            if (!isNotEmptyArray(transferAccountIds)) {
                return convertedTransactionIds;
            }

            for (const transactionId of batchIds) {
                for (const accountId of transferAccountIds) {
                    if (yield* transactionTransferService.convertToTransferAccount(transactionId, accountId)) {
                        convertedTransactionIds.add(transactionId);
                        break;
                    }
                }
            }

            return convertedTransactionIds;
        });

        const applyRuleActionsToTransactionBatch = Effect.fn('RuleEngineService.applyRuleActionsToTransactionBatch')(
            function* (batchIds: number[], actions: RuleActionEntityInterface[]) {
                const categoryAction = actions.find(
                    action => action.type === RuleActionTypeEnum.SET_CATEGORY && isDefined(action.categoryId)
                );
                const tagIds = [
                    ...new Set(actions.filter(action => action.type === RuleActionTypeEnum.ADD_TAG).map(action => action.tagId))
                ].filter(isDefined);

                const convertedTransactionIds = yield* convertTransactionBatchToTransfer(batchIds, actions);
                const categorizedIds = isDefined(categoryAction?.categoryId)
                    ? yield* transactionRuleRepository.setCategoryByTransactionIds(batchIds, categoryAction.categoryId)
                    : [];
                const taggedIds: number[] = [];

                for (const tagId of tagIds) {
                    taggedIds.push(...(yield* transactionTagsRepository.addTagByTransactionIds(batchIds, tagId, TagSourceEnum.RULE)));
                }

                const changedIds = [...new Set([...categorizedIds, ...taggedIds])];

                if (isNotEmptyArray(changedIds)) {
                    yield* transactionRepository.touchUpdatedByIds(changedIds, TransactionUpdatedByEnum.RULE);
                }

                if (convertedTransactionIds.size > 0) {
                    yield* transactionRuleRepository.stampUpdatedByRule([...convertedTransactionIds]);
                }

                yield* transactionRuleRepository.stampUnauthoredUpdatedByRule(batchIds);
            },
            effect => Db.transaction(effect)
        );

        const applyRuleToMatchingTransactionBatch = Effect.fn('RuleEngineService.applyRuleToMatchingTransactionBatch')(function* (
            batchIds: number[],
            actions: RuleActionEntityInterface[],
            shouldYield: boolean
        ) {
            if (shouldYield) {
                yield* YIELD_TO_UI;
            }

            return yield* applyRuleActionsToTransactionBatch(batchIds, actions).pipe(
                Effect.as(0),
                Effect.catchCause(cause => Effect.as(Effect.logError(cause), batchIds.length))
            );
        });

        const applyRuleToMatchingTransactionBatches = Effect.fn('RuleEngineService.applyRuleToMatchingTransactionBatches')(function* (
            matchingIds: number[],
            actions: RuleActionEntityInterface[]
        ) {
            const batchSize = hasConvertToTransferAction(actions) ? RULE_BATCH_SIZE : RULE_SET_BATCH_SIZE;
            const failedCounts = yield* Effect.forEach(Arr.chunksOf(matchingIds, batchSize), (batchIds, index) =>
                applyRuleToMatchingTransactionBatch(batchIds, actions, index > 0)
            );

            return failedCounts.reduce((total, failed) => total + failed, 0);
        });

        const applyRuleToMatchingTransactions = Effect.fn('RuleEngineService.applyRuleToMatchingTransactions')(function* (ruleId: number) {
            const rule = yield* ruleRepository.findByIdWithRelations(ruleId);
            const emptyResult: ApplyRuleResultInterface = { applied: 0, failed: 0, total: 0 };

            if (!isDefined(rule) || !isActiveRule(rule)) {
                return emptyResult;
            }

            const matchingIds = yield* ruleMatcherService.collectMatchingTransactionIds(rule);

            if (!isNotEmptyArray(matchingIds)) {
                return emptyResult;
            }

            const total = matchingIds.length;
            const failed = yield* applyRuleToMatchingTransactionBatches(matchingIds, rule.actions);

            return { applied: total - failed, failed, total } satisfies ApplyRuleResultInterface;
        });

        return {
            applyRulesToTransactions,
            applyRulesToTransactionIds: (transactionIds: number[]) => applyRulesToTransactionIdsWhere(transactionIds, () => true),
            applyCreateSafeRulesToTransactionIds: (transactionIds: number[]) =>
                applyRulesToTransactionIdsWhere(transactionIds, action => action.type !== RuleActionTypeEnum.CONVERT_TO_TRANSFER),
            prepareCreateInputsForRules,
            applyRuleToMatchingTransactions
        };
    })
}) {
    static readonly layer = Layer.effect(RuleEngineService, RuleEngineService.make).pipe(
        Layer.provide([
            MccCategoryRepository.layer,
            RuleRepository.layer,
            TransactionRepository.layer,
            TransactionRuleRepository.layer,
            TransactionTagsRepository.layer,
            RuleMatcherService.layer,
            TransactionTransferService.layer
        ])
    );
}
