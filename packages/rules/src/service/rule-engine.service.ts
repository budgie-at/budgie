import {
    AccountRepository,
    AccountTypeEnum,
    CategorySourceEnum,
    Db,
    DebtEventRepository,
    MccCategoryRepository,
    TransactionRepository,
    TransactionTagsRepository,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    TagSourceEnum,
    TransactionTypeEnum,
    TransactionUpdatedByEnum,
    YIELD_TO_UI
} from '@budgie/contracts';
import { TransactionTransferService, getTransactionCategoryEntries } from '@budgie/ledger';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE, RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';
import { RuleRepository } from '../repository/rule.repository';
import { TransactionRuleRepository } from '../repository/transaction-rule.repository';
import { convertTransactionForRuleEvaluation } from '../utils/convert-transaction-for-rule-evaluation.util';
import { extractRuleActionOutcomes } from '../utils/extract-rule-action-outcomes.util';
import { matchesRule } from '../utils/matches-rule.util';

import { RuleMatcherService } from './rule-matcher.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleTransactionMatchInterface } from '../interface/rule-transaction-match.interface';
import type { RuleActionEntityInterface, RuleWithRelationsEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';

export class RuleEngineService extends Context.Service<RuleEngineService>()('@budgie/rules/RuleEngineService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const mccCategoryRepository = yield* MccCategoryRepository;
        const ruleRepository = yield* RuleRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionRuleRepository = yield* TransactionRuleRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;
        const ruleMatcherService = yield* RuleMatcherService;
        const transactionTransferService = yield* TransactionTransferService;

        const isTransferAccount = Effect.fnUntraced(function* (accountId: number) {
            const account = yield* accountRepository.findById(accountId);

            return isDefined(account) && account.type !== AccountTypeEnum.DEBT;
        });

        const convertToTransfer = Effect.fn('RuleEngineService.convertToTransfer')(function* (
            transactionId: number,
            targetAccountId: number
        ) {
            const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

            if (!isDefined(transaction) || isDefined(transaction.consolidationType)) {
                return false;
            }

            const isExpense = transaction.type === TransactionTypeEnum.EXPENSE;
            const sourceAccountId = isExpense ? transaction.fromAccountId : transaction.toAccountId;
            const isConvertible =
                (isExpense || transaction.type === TransactionTypeEnum.INCOME) &&
                isDefined(sourceAccountId) &&
                sourceAccountId !== targetAccountId &&
                getTransactionCategoryEntries(transaction.entries).length === 1;

            if (!isConvertible) {
                return false;
            }

            const [isSourceTransferAccount, isTargetTransferAccount, debtEvent] = yield* Effect.all([
                isTransferAccount(sourceAccountId),
                isTransferAccount(targetAccountId),
                debtEventRepository.findByTransactionId(transactionId)
            ]);

            if (!isSourceTransferAccount || !isTargetTransferAccount || isDefined(debtEvent)) {
                return false;
            }

            const params = { id: transactionId, accountId: targetAccountId, customExchangeRate: 0, feeEntries: [] };

            yield* isExpense
                ? transactionTransferService.convertExpenseToTransfer(params)
                : transactionTransferService.convertIncomeToTransfer(params);

            return true;
        });

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
                    break;

                case RuleActionTypeEnum.ADD_TAG:
                    yield* applyAddTagAction(transactionId, action);
                    break;

                case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
                    if (
                        isDefined(action.accountId) &&
                        !appliedExclusiveActions.has(RuleActionTypeEnum.CONVERT_TO_TRANSFER) &&
                        (yield* convertToTransfer(transactionId, action.accountId))
                    ) {
                        appliedExclusiveActions.add(RuleActionTypeEnum.CONVERT_TO_TRANSFER);
                    }
                    break;

                default:
                    break;
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
            for (const action of sortedActions) {
                yield* applyRuleAction(transactionId, action, appliedExclusiveActions);
            }
        });

        const applyMatchingRulesSequentially = Effect.fn('RuleEngineService.applyMatchingRulesSequentially')(function* (
            transactionId: number,
            matchingRules: RuleWithRelationsEntityInterface[]
        ) {
            const appliedExclusiveActions = new Set<RuleActionTypeEnum>();

            for (const rule of matchingRules) {
                yield* applyRuleActions(transactionId, rule.actions, appliedExclusiveActions);
            }
        });

        const applyMatchedRulesInBatch = Effect.fn('RuleEngineService.applyMatchedRulesInBatch')(
            function* (matches: RuleTransactionMatchInterface[]) {
                for (const match of matches) {
                    yield* applyMatchingRulesSequentially(match.transactionId, match.matchingRules);
                    yield* transactionRepository.updateById(match.transactionId, { updatedBy: TransactionUpdatedByEnum.RULE });
                }
            },
            effect => Db.transaction(effect)
        );

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

        const findMatchingRulesByIndex = Effect.fnUntraced(function* (
            rules: RuleWithRelationsEntityInterface[],
            transactionInputs: TransactionCreateInputInterface[]
        ) {
            const mccCodeMap = yield* buildMccCodeMapIfNeeded(rules, transactionInputs);

            return transactionInputs.map(input => {
                const evaluationInput = toRuleEvaluationInput(input, mccCodeMap);

                return rules.filter(rule => matchesRule(rule, evaluationInput));
            });
        });

        const applyMatches = (matches: RuleTransactionMatchInterface[]) =>
            Effect.forEach(
                Arr.chunksOf(
                    matches.filter(match => isNotEmptyArray(match.matchingRules)),
                    RULE_BATCH_SIZE
                ),
                batch => Effect.andThen(applyMatchedRulesInBatch(batch), Effect.sleep(RULE_BATCH_DELAY_MS)),
                { discard: true }
            );

        const applyRulesToTransactions = Effect.fn('RuleEngineService.applyRulesToTransactions')(function* (
            transactionIds: number[],
            transactionInputs: TransactionCreateInputInterface[]
        ) {
            const rules = yield* ruleRepository.findEnabledWithRelations();
            if (!isNotEmptyArray(rules)) {
                return;
            }

            const matchingRulesByIndex = yield* findMatchingRulesByIndex(rules, transactionInputs);

            yield* applyMatches(
                transactionIds.map((transactionId, index) => ({ transactionId, matchingRules: matchingRulesByIndex[index] ?? [] }))
            );
        });

        const applyRulesToTransactionIds = Effect.fn('RuleEngineService.applyRulesToTransactionIds')(function* (transactionIds: number[]) {
            if (!isNotEmptyArray(transactionIds)) {
                return;
            }

            const rules = yield* ruleRepository.findEnabledWithRelations();
            if (!isNotEmptyArray(rules)) {
                return;
            }

            const transactions = yield* transactionRepository.findByIdsWithEntries(transactionIds);

            yield* applyMatches(
                transactions.map(transaction => ({
                    transactionId: transaction.id,
                    matchingRules: rules.filter(rule => matchesRule(rule, convertTransactionForRuleEvaluation(transaction)))
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
            const hasCategoryAction = isDefined(categoryId);
            const hasTagAction = ruleTagIds.some(tagId => !(input.ruleTagIds ?? []).includes(tagId));

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
            const transferAction = actions.find(
                action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER && isDefined(action.accountId)
            );

            if (!isDefined(transferAction?.accountId)) {
                return;
            }

            const { accountId } = transferAction;

            for (const transactionId of batchIds) {
                yield* convertToTransfer(transactionId, accountId);
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
            yield* YIELD_TO_UI;

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
            const failedCounts = yield* Effect.forEach(Arr.chunksOf(matchingIds, batchSize), batchIds =>
                applyRuleToMatchingTransactionBatch(batchIds, actions)
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

        return { applyRulesToTransactions, applyRulesToTransactionIds, prepareCreateInputsForRules, applyRuleToMatchingTransactions };
    })
}) {
    static readonly layer = Layer.effect(RuleEngineService, RuleEngineService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
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
