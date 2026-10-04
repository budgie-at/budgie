import {
    CategorySourceEnum,
    Db,
    MccCategoryRepository,
    TransactionRepository,
    TransactionTagsRepository,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    TagSourceEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE, RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';
import { RuleRepository } from '../repository/rule.repository';
import { TransactionRuleRepository } from '../repository/transaction-rule.repository';
import { extractRuleActionOutcomes } from '../util/extract-rule-action-outcomes.util';

import { RuleMatcherService } from './rule-matcher.service';
import { RuleTransferConversionService } from './rule-transfer-conversion.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleTransactionMatchInterface } from '../interface/rule-transaction-match.interface';
import type { RuleActionEntityInterface, RuleWithRelationsEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';

export class RuleEngineService extends Context.Service<RuleEngineService>()('@budgie/rules/RuleEngineService', {
    make: Effect.gen(function* () {
        const mccCategoryRepository = yield* MccCategoryRepository;

        const ruleRepository = yield* RuleRepository;

        const transactionRepository = yield* TransactionRepository;

        const transactionRuleRepository = yield* TransactionRuleRepository;

        const transactionTagsRepository = yield* TransactionTagsRepository;

        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

        const ruleMatcherService = yield* RuleMatcherService;

        const ruleTransferConversionService = yield* RuleTransferConversionService;

        const applySetCategoryAction = Effect.fn('RuleEngineService.applySetCategoryAction')(function* (
            transactionId: number,
            action: RuleActionEntityInterface,
            appliedExclusiveActions: Set<RuleActionTypeEnum>
        ) {
            if (!isDefined(action.categoryId) || appliedExclusiveActions.has(RuleActionTypeEnum.SET_CATEGORY)) {
                return;
            }

            appliedExclusiveActions.add(RuleActionTypeEnum.SET_CATEGORY);
            const categorizedIds = yield* transactionRuleRepository.setCategoryByTransactionIds([transactionId], action.categoryId);

            if (isNotEmptyArray(categorizedIds)) {
                yield* transactionRepository.touchUpdatedAt(transactionId);
            }
        });

        const applyAddTagAction = Effect.fn('RuleEngineService.applyAddTagAction')(function* (
            transactionId: number,
            action: RuleActionEntityInterface
        ) {
            if (!isDefined(action.tagId)) {
                return;
            }

            const taggedIds = yield* transactionTagsRepository.addTagByTransactionIds([transactionId], action.tagId, TagSourceEnum.RULE);

            if (isNotEmptyArray(taggedIds)) {
                yield* transactionRepository.touchUpdatedAt(transactionId);
            }
        });

        const applyRuleAction = Effect.fnUntraced(function* (
            transactionId: number,
            action: RuleActionEntityInterface,
            appliedExclusiveActions: Set<RuleActionTypeEnum>
        ) {
            switch (action.type) {
                case RuleActionTypeEnum.SET_CATEGORY:
                    yield* applySetCategoryAction(transactionId, action, appliedExclusiveActions);

                    return false;

                case RuleActionTypeEnum.ADD_TAG:
                    yield* applyAddTagAction(transactionId, action);

                    return false;

                case RuleActionTypeEnum.CONVERT_TO_TRANSFER: {
                    if (!isDefined(action.accountId) || appliedExclusiveActions.has(RuleActionTypeEnum.CONVERT_TO_TRANSFER)) {
                        return false;
                    }

                    const converted = yield* ruleTransferConversionService.convertTransactionToTransfer(transactionId, action.accountId);
                    if (converted) {
                        appliedExclusiveActions.add(RuleActionTypeEnum.CONVERT_TO_TRANSFER);
                    }

                    return converted;
                }

                default:
                    return false;
            }
        });

        const applyRuleActions = Effect.fnUntraced(function* (
            transactionId: number,
            actions: RuleActionEntityInterface[],
            appliedExclusiveActions: Set<RuleActionTypeEnum>
        ) {
            const sortedActions = [...actions].sort((actionA, actionB) => {
                if (actionA.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                    return 1;
                }

                if (actionB.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                    return -1;
                }

                return 0;
            });
            let convertedAny = false;

            for (const action of sortedActions) {
                const converted = yield* applyRuleAction(transactionId, action, appliedExclusiveActions);

                convertedAny ||= converted;
            }

            return convertedAny;
        });

        const applyMatchingRulesSequentially = Effect.fn('RuleEngineService.applyMatchingRulesSequentially')(function* (
            transactionId: number,
            matchingRules: RuleWithRelationsEntityInterface[]
        ) {
            const appliedExclusiveActions = new Set<RuleActionTypeEnum>();
            let convertedToTransfer = false;

            for (const rule of matchingRules) {
                const converted = yield* applyRuleActions(transactionId, rule.actions, appliedExclusiveActions);
                convertedToTransfer ||= converted;
            }

            return convertedToTransfer;
        });

        const applyMatchedRulesInBatch = Effect.fn('RuleEngineService.applyMatchedRulesInBatch')(
            function* (matches: RuleTransactionMatchInterface[]) {
                let convertedAny = false;

                for (const match of matches) {
                    const converted = yield* applyMatchingRulesSequentially(match.transactionId, match.matchingRules);

                    yield* transactionRepository.updateById(match.transactionId, { updatedBy: TransactionUpdatedByEnum.RULE });

                    convertedAny ||= converted;
                }

                if (convertedAny) {
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                }
            },
            effect => Db.transaction(effect)
        );

        const applyRulesToTransactionsBatch = Effect.fn('RuleEngineService.applyRulesToTransactionsBatch')(function* (
            matches: RuleTransactionMatchInterface[]
        ) {
            yield* Effect.sleep(RULE_BATCH_DELAY_MS);

            if (!isNotEmptyArray(matches)) {
                return;
            }

            yield* applyMatchedRulesInBatch(matches);
        });

        const buildMccCodeMapIfNeeded = Effect.fn('RuleEngineService.buildMccCodeMapIfNeeded')(function* (
            rules: RuleWithRelationsEntityInterface[],
            inputs: TransactionCreateInputInterface[]
        ) {
            const emptyMap = new Map<number, string>();
            const hasMccCondition = rules.some(rule =>
                rule.conditions.some(condition => condition.field === RuleConditionFieldEnum.MCC_CODE)
            );

            if (!hasMccCondition) {
                return emptyMap;
            }

            const mccCategoryIds = new Set(inputs.flatMap(input => input.entries.map(entry => entry.mccCategoryId).filter(isDefined)));

            if (mccCategoryIds.size === 0) {
                return emptyMap;
            }

            const mccCategories = yield* mccCategoryRepository.findAll();

            return new Map(mccCategories.filter(category => mccCategoryIds.has(category.id)).map(category => [category.id, category.mcc]));
        });

        const findBatchMatches = (
            batchStart: number,
            transactionIds: number[],
            evaluationInputs: RuleEvaluationInputInterface[],
            rules: RuleWithRelationsEntityInterface[]
        ): RuleTransactionMatchInterface[] =>
            transactionIds
                .slice(batchStart, batchStart + RULE_BATCH_SIZE)
                .map((transactionId, offset): RuleTransactionMatchInterface => ({
                    transactionId,
                    matchingRules: rules.filter(rule => ruleMatcherService.evaluateRule(rule, evaluationInputs[batchStart + offset]))
                }))
                .filter(match => isNotEmptyArray(match.matchingRules));

        const getBatchStarts = (total: number, batchSize: number): number[] =>
            Array.from({ length: Math.ceil(total / batchSize) }, (_value, index) => index * batchSize);

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

        const applyRulesToTransactions = Effect.fn('RuleEngineService.applyRulesToTransactions')(function* (
            transactionIds: number[],
            transactionInputs: TransactionCreateInputInterface[]
        ) {
            const rules = yield* ruleRepository.findEnabledWithRelations();
            if (!isNotEmptyArray(rules)) {
                return;
            }

            const mccCodeMap = yield* buildMccCodeMapIfNeeded(rules, transactionInputs);
            const evaluationInputs = transactionInputs.map(input => toRuleEvaluationInput(input, mccCodeMap));

            yield* Effect.forEach(
                getBatchStarts(transactionIds.length, RULE_BATCH_SIZE),
                batchStart => applyRulesToTransactionsBatch(findBatchMatches(batchStart, transactionIds, evaluationInputs, rules)),
                { discard: true }
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
            const hasCategoryAction = isDefined(categoryId);
            const hasTagAction = ruleTagIds.length !== (input.ruleTagIds ?? []).length;

            if (!hasCategoryAction && !hasTagAction) {
                return input;
            }

            const entries = hasCategoryAction
                ? input.entries.map(entry => ({ ...entry, categoryId, categorySource: CategorySourceEnum.RULE }))
                : input.entries;

            return {
                ...input,
                updatedBy: TransactionUpdatedByEnum.RULE,
                ruleTagIds,
                entries
            };
        };

        const hasConvertToTransferAction = (actions: RuleActionEntityInterface[]): boolean =>
            actions.some(action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER);

        const hasPostCreateRuleAction = (matchingRules: RuleWithRelationsEntityInterface[]): boolean =>
            matchingRules.some(rule => hasConvertToTransferAction(rule.actions));

        const prepareCreateInputsForRules = Effect.fn('RuleEngineService.prepareCreateInputsForRules')(function* (
            transactionInputs: TransactionCreateInputInterface[]
        ) {
            const rules = yield* ruleRepository.findEnabledWithRelations();
            if (!isNotEmptyArray(rules)) {
                return { transactionInputs, postCreateIndexes: [] };
            }

            const mccCodeMap = yield* buildMccCodeMapIfNeeded(rules, transactionInputs);
            const evaluationInputs = transactionInputs.map(input => toRuleEvaluationInput(input, mccCodeMap));
            const matchingRulesByIndex = evaluationInputs.map(input => rules.filter(rule => ruleMatcherService.evaluateRule(rule, input)));
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
            const transferAction = actions.find(
                action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER && isDefined(action.accountId)
            );

            if (!isDefined(transferAction?.accountId)) {
                return;
            }

            const { accountId } = transferAction;
            let convertedAny = false;

            for (const transactionId of batchIds) {
                const converted = yield* ruleTransferConversionService.convertTransactionToTransfer(transactionId, accountId);

                convertedAny ||= converted;
            }

            if (convertedAny) {
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            }
        });

        const applyRuleActionsToTransactionBatch = Effect.fn('RuleEngineService.applyRuleActionsToTransactionBatch')(
            function* (batchIds: number[], actions: RuleActionEntityInterface[]) {
                const categoryAction = actions.find(
                    action => action.type === RuleActionTypeEnum.SET_CATEGORY && isDefined(action.categoryId)
                );
                const tagIds = [
                    ...new Set(actions.filter(action => action.type === RuleActionTypeEnum.ADD_TAG).map(action => action.tagId))
                ].filter(isDefined);

                const categorizedIds = isDefined(categoryAction?.categoryId)
                    ? yield* transactionRuleRepository.setCategoryByTransactionIds(batchIds, categoryAction.categoryId)
                    : [];
                const taggedIds: number[] = [];

                for (const tagId of tagIds) {
                    taggedIds.push(...(yield* transactionTagsRepository.addTagByTransactionIds(batchIds, tagId, TagSourceEnum.RULE)));
                }

                yield* transactionRepository.touchUpdatedByIds(
                    [...new Set([...categorizedIds, ...taggedIds])],
                    TransactionUpdatedByEnum.RULE
                );
                yield* convertTransactionBatchToTransfer(batchIds, actions);
            },
            effect => Db.transaction(effect)
        );

        const applyRuleToMatchingTransactionBatch = Effect.fn('RuleEngineService.applyRuleToMatchingTransactionBatch')(function* (
            batchIds: number[],
            actions: RuleActionEntityInterface[]
        ) {
            yield* Effect.sleep(1);

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
            const failedCounts = yield* Effect.forEach(getBatchStarts(matchingIds.length, batchSize), batchStart =>
                applyRuleToMatchingTransactionBatch(matchingIds.slice(batchStart, batchStart + batchSize), actions)
            );

            return failedCounts.reduce((total, failed) => total + failed, 0);
        });

        const applyRuleToMatchingTransactions = Effect.fn('RuleEngineService.applyRuleToMatchingTransactions')(function* (ruleId: number) {
            const rule = yield* ruleRepository.findByIdWithRelations(ruleId);
            const emptyResult: ApplyRuleResultInterface = { applied: 0, failed: 0, total: 0 };

            if (!isDefined(rule) || !isNotEmptyArray(rule.conditions)) {
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

        return { applyRulesToTransactions, prepareCreateInputsForRules, applyRuleToMatchingTransactions };
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
            RuleTransferConversionService.layer,
            AccountBalanceIncrementalService.layer
        ])
    );
}
