/* eslint-disable max-lines -- absorbs convert-transaction-to-transfer logic per CLAUDE.md rule 38/51 (approved by user during pr-322-rules SOTA cleanup) */
import {
    AccountTypeEnum,
    CategorySourceEnum,
    Db,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import {
    accountRepository,
    mccCategoryRepository,
    ruleRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionRuleRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { getTransactionDisplayTitle } from '../../transaction/utils/get-transaction-display-title.util';
import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE, RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';
import { extractRuleActionOutcomes } from '../util/extract-rule-action-outcomes.util';

import { ruleMatcherService } from './rule-matcher.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { RuleCreatePreparationResultInterface } from '../interface/rule-create-preparation-result.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleTransactionMatchInterface } from '../interface/rule-transaction-match.interface';
import type { RuleTransferAccountIdsInterface } from '../interface/rule-transfer-account-ids.interface';
import type { RuleTransferAccountsInterface } from '../interface/rule-transfer-accounts.interface';
import type { RuleTransferCandidateInterface } from '../interface/rule-transfer-candidate.interface';
import type { RuleTransferConversionBuildInputInterface } from '../interface/rule-transfer-conversion-build-input.interface';
import type { RuleTransferConversionInterface } from '../interface/rule-transfer-conversion.interface';
import type { RuleTransferConvertedAmountInterface } from '../interface/rule-transfer-converted-amount.interface';
import type { RuleTransferEntriesInputInterface } from '../interface/rule-transfer-entries-input.interface';
import type {
    RuleActionEntityInterface,
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

class RuleEngineService {
    readonly applyRulesToTransactions = Effect.fn('RuleEngineService.applyRulesToTransactions')(function* (
        this: RuleEngineService,
        transactionIds: number[],
        transactionInputs: TransactionCreateInputInterface[]
    ) {
        const rules = yield* Db.query(() => ruleRepository.findEnabledWithRelations());
        if (!isNotEmptyArray(rules)) {
            return;
        }

        const mccCodeMap = yield* this.buildMccCodeMapIfNeeded(rules, transactionInputs);
        const evaluationInputs = transactionInputs.map(input => this.toRuleEvaluationInput(input, mccCodeMap));

        yield* Effect.forEach(
            this.getBatchStarts(transactionIds.length, RULE_BATCH_SIZE),
            batchStart => this.applyRulesToTransactionsBatch(this.findBatchMatches(batchStart, transactionIds, evaluationInputs, rules)),
            { discard: true }
        );
    });

    readonly prepareCreateInputsForRules = Effect.fn('RuleEngineService.prepareCreateInputsForRules')(function* (
        this: RuleEngineService,
        transactionInputs: TransactionCreateInputInterface[]
    ) {
        const rules = yield* Db.query(() => ruleRepository.findEnabledWithRelations());
        if (!isNotEmptyArray(rules)) {
            const unchanged: RuleCreatePreparationResultInterface = { transactionInputs, postCreateIndexes: [] };

            return unchanged;
        }

        const mccCodeMap = yield* this.buildMccCodeMapIfNeeded(rules, transactionInputs);
        const evaluationInputs = transactionInputs.map(input => this.toRuleEvaluationInput(input, mccCodeMap));
        const matchingRulesByIndex = evaluationInputs.map(input => rules.filter(rule => ruleMatcherService.evaluateRule(rule, input)));
        const preparedTransactionInputs = transactionInputs.map((input, index) =>
            this.applyCreateSafeRuleActionsToInput(input, matchingRulesByIndex[index] ?? [])
        );
        const postCreateIndexes = matchingRulesByIndex.flatMap((matchingRules, index) =>
            this.hasPostCreateRuleAction(matchingRules) ? [index] : []
        );
        const prepared: RuleCreatePreparationResultInterface = { transactionInputs: preparedTransactionInputs, postCreateIndexes };

        return prepared;
    });

    readonly applyRuleToMatchingTransactions = Effect.fn('RuleEngineService.applyRuleToMatchingTransactions')(function* (
        this: RuleEngineService,
        ruleId: number,
        onProgress: ((processed: number, total: number) => void) | null
    ) {
        const rule = yield* Db.query(() => ruleRepository.findByIdWithRelations(ruleId));
        const emptyResult: ApplyRuleResultInterface = { applied: 0, failed: 0, total: 0 };

        if (!isDefined(rule) || !isNotEmptyArray(rule.conditions)) {
            return emptyResult;
        }

        const matchingIds = yield* ruleMatcherService.collectMatchingTransactionIds(rule);

        if (!isNotEmptyArray(matchingIds)) {
            return emptyResult;
        }

        const total = matchingIds.length;
        const failed = yield* this.applyRuleToMatchingTransactionBatches(matchingIds, rule.actions, onProgress);

        const applied = total - failed;
        const result: ApplyRuleResultInterface = { applied, failed, total };

        return result;
    }, invalidateDatabaseLiveQuery);

    private readonly applyMatchedRulesInBatchTransaction = Effect.fn('RuleEngineService.applyMatchedRulesInBatchTransaction')(
        function* (this: RuleEngineService, matches: RuleTransactionMatchInterface[]) {
            yield* this.applyMatchedRulesInBatch(matches);
        },
        effect => Db.transaction(effect)
    );

    private readonly applyRuleActionsToTransactionBatchTransaction = Effect.fn(
        'RuleEngineService.applyRuleActionsToTransactionBatchTransaction'
    )(
        function* (this: RuleEngineService, batchIds: number[], actions: RuleActionEntityInterface[]) {
            yield* this.applyRuleActionsToTransactionBatch(batchIds, actions);
        },
        effect => Db.transaction(effect)
    );

    private readonly applyRulesToTransactionsBatch = Effect.fn('RuleEngineService.applyRulesToTransactionsBatch')(function* (
        this: RuleEngineService,
        matches: RuleTransactionMatchInterface[]
    ) {
        yield* Effect.sleep(RULE_BATCH_DELAY_MS);

        if (!isNotEmptyArray(matches)) {
            return;
        }

        yield* this.applyMatchedRulesInBatchTransaction(matches);
    });

    private readonly applyMatchedRulesInBatch = Effect.fn('RuleEngineService.applyMatchedRulesInBatch')(function* (
        this: RuleEngineService,
        matches: RuleTransactionMatchInterface[]
    ) {
        yield* this.applyRuleItemsInBatch(
            matches,
            match => match.transactionId,
            match => this.applyMatchingRulesSequentially(match.transactionId, match.matchingRules)
        );
    });

    private readonly applyRuleToMatchingTransactionBatches = Effect.fn('RuleEngineService.applyRuleToMatchingTransactionBatches')(
        function* (
            this: RuleEngineService,
            matchingIds: number[],
            actions: RuleActionEntityInterface[],
            onProgress: ((processed: number, total: number) => void) | null
        ) {
            let processed = 0;
            let failed = 0;
            const total = matchingIds.length;
            const batchSize = this.hasConvertToTransferAction(actions) ? RULE_BATCH_SIZE : RULE_SET_BATCH_SIZE;

            for (const batchStart of this.getBatchStarts(total, batchSize)) {
                const batchIds = matchingIds.slice(batchStart, batchStart + batchSize);
                const batchFailed = yield* this.applyRuleToMatchingTransactionBatch(batchIds, actions);

                failed += batchFailed;
                processed += batchIds.length;
                onProgress?.(processed, total);
            }

            return failed;
        }
    );

    private readonly applyRuleToMatchingTransactionBatch = Effect.fn('RuleEngineService.applyRuleToMatchingTransactionBatch')(function* (
        this: RuleEngineService,
        batchIds: number[],
        actions: RuleActionEntityInterface[]
    ) {
        yield* YIELD_TO_UI;

        return yield* this.applyRuleActionsToTransactionBatchTransaction(batchIds, actions).pipe(
            Effect.as(0),
            Effect.tapCause(Effect.logError),
            Effect.catchCause(() => Effect.succeed(batchIds.length))
        );
    });

    private readonly applyRuleActionsToTransactionBatch = Effect.fn('RuleEngineService.applyRuleActionsToTransactionBatch')(function* (
        this: RuleEngineService,
        batchIds: number[],
        actions: RuleActionEntityInterface[]
    ) {
        const categoryAction = actions.find(action => action.type === RuleActionTypeEnum.SET_CATEGORY && isDefined(action.categoryId));
        const tagIds = [
            ...new Set(actions.filter(action => action.type === RuleActionTypeEnum.ADD_TAG).map(action => action.tagId))
        ].filter(isDefined);

        const categorizedIds = isDefined(categoryAction?.categoryId)
            ? yield* transactionRuleRepository.setCategoryByTransactionIds(batchIds, categoryAction.categoryId)
            : [];
        const taggedIds: number[] = [];

        for (const tagId of tagIds) {
            taggedIds.push(...(yield* transactionTagsRepository.addTagByTransactionIds(batchIds, tagId)));
        }

        yield* transactionRepository.touchUpdatedByIds([...new Set([...categorizedIds, ...taggedIds])], TransactionUpdatedByEnum.RULE);
        yield* this.convertTransactionBatchToTransfer(batchIds, actions);
    });

    private readonly convertTransactionBatchToTransfer = Effect.fn('RuleEngineService.convertTransactionBatchToTransfer')(function* (
        this: RuleEngineService,
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
            const converted = yield* this.convertTransactionToTransfer(transactionId, accountId);

            convertedAny ||= converted;
        }

        if (convertedAny) {
            yield* accountBalanceIncrementalService.updateAllBalances(true);
        }
    });

    private readonly applyRuleItemsInBatch = Effect.fn('RuleEngineService.applyRuleItemsInBatch')(function* <Item, E, R>(
        items: Item[],
        getTransactionId: (item: Item) => number,
        applyRuleItem: (item: Item) => Effect.Effect<boolean, E, R>
    ) {
        let convertedAny = false;

        for (const item of items) {
            const converted = yield* applyRuleItem(item);

            yield* transactionRepository.updateById(getTransactionId(item), { updatedBy: TransactionUpdatedByEnum.RULE });

            convertedAny ||= converted;
        }

        if (convertedAny) {
            yield* accountBalanceIncrementalService.updateAllBalances(true);
        }
    });

    private readonly applyMatchingRulesSequentially = Effect.fn('RuleEngineService.applyMatchingRulesSequentially')(function* (
        this: RuleEngineService,
        transactionId: number,
        matchingRules: RuleWithRelationsEntityInterface[]
    ) {
        const appliedExclusiveActions = new Set<RuleActionTypeEnum>();
        let convertedToTransfer = false;

        for (const rule of matchingRules) {
            const converted = yield* this.applyRuleActions(transactionId, rule.actions, appliedExclusiveActions);
            convertedToTransfer ||= converted;
        }

        return convertedToTransfer;
    });

    private readonly buildMccCodeMapIfNeeded = Effect.fn('RuleEngineService.buildMccCodeMapIfNeeded')(function* (
        rules: RuleWithRelationsEntityInterface[],
        inputs: TransactionCreateInputInterface[]
    ) {
        const emptyMap = new Map<number, string>();
        const hasMccCondition = rules.some(rule => rule.conditions.some(condition => condition.field === RuleConditionFieldEnum.MCC_CODE));

        if (!hasMccCondition) {
            return emptyMap;
        }

        const mccCategoryIds = new Set(inputs.flatMap(input => input.entries.map(entry => entry.mccCategoryId).filter(isDefined)));

        if (mccCategoryIds.size === 0) {
            return emptyMap;
        }

        const mccCategories = yield* Db.query(() => mccCategoryRepository.findAll());

        return new Map(mccCategories.filter(category => mccCategoryIds.has(category.id)).map(category => [category.id, category.mcc]));
    });

    private readonly applyRuleActions = Effect.fnUntraced(function* (
        this: RuleEngineService,
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
            const converted = yield* this.applyRuleAction(transactionId, action, appliedExclusiveActions);

            convertedAny ||= converted;
        }

        return convertedAny;
    });

    private readonly applyRuleAction = Effect.fnUntraced(function* (
        this: RuleEngineService,
        transactionId: number,
        action: RuleActionEntityInterface,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ) {
        switch (action.type) {
            case RuleActionTypeEnum.SET_CATEGORY:
                yield* this.applySetCategoryAction(transactionId, action, appliedExclusiveActions);

                return false;

            case RuleActionTypeEnum.ADD_TAG:
                yield* this.applyAddTagAction(transactionId, action);

                return false;

            case RuleActionTypeEnum.CONVERT_TO_TRANSFER: {
                if (!isDefined(action.accountId) || appliedExclusiveActions.has(RuleActionTypeEnum.CONVERT_TO_TRANSFER)) {
                    return false;
                }

                const converted = yield* this.convertTransactionToTransfer(transactionId, action.accountId);
                if (converted) {
                    appliedExclusiveActions.add(RuleActionTypeEnum.CONVERT_TO_TRANSFER);
                }

                return converted;
            }

            default:
                return false;
        }
    });

    private readonly applySetCategoryAction = Effect.fn('RuleEngineService.applySetCategoryAction')(function* (
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

    private readonly applyAddTagAction = Effect.fn('RuleEngineService.applyAddTagAction')(function* (
        transactionId: number,
        action: RuleActionEntityInterface
    ) {
        if (!isDefined(action.tagId)) {
            return;
        }

        const taggedIds = yield* transactionTagsRepository.addTagByTransactionIds([transactionId], action.tagId);

        if (isNotEmptyArray(taggedIds)) {
            yield* transactionRepository.touchUpdatedAt(transactionId);
        }
    });

    private readonly convertTransactionToTransfer = Effect.fnUntraced(function* (
        this: RuleEngineService,
        transactionId: number,
        targetAccountId: number
    ) {
        const conversion = yield* this.buildRuleTransferConversion(transactionId, targetAccountId);

        if (!isDefined(conversion)) {
            return false;
        }

        const [creditValuation, debitValuation] = yield* Effect.all(
            [
                entryBaseValuationService.valueMicroUnitEntry({
                    accountId: conversion.fromAccountId,
                    amount: conversion.originalEntry.amount,
                    operatedAt: conversion.transaction.operatedAt,
                    externalSource: null
                }),
                entryBaseValuationService.valueMicroUnitEntry({
                    accountId: conversion.toAccountId,
                    amount: conversion.convertedAmount,
                    operatedAt: conversion.transaction.operatedAt,
                    externalSource: null
                })
            ],
            { concurrency: 'unbounded' }
        );

        yield* transactionRepository.updateById(transactionId, {
            type: conversion.transactionType,
            fromAccountId: conversion.fromAccountId,
            toAccountId: conversion.toAccountId,
            exchangeRate: conversion.exchangeRate
        });

        yield* transactionEntryRepository.deleteByTransactionId(transactionId);

        yield* transactionEntryRepository.bulkCreate(
            this.buildRuleTransferEntries({
                transactionId,
                originalEntry: conversion.originalEntry,
                fromAccountId: conversion.fromAccountId,
                toAccountId: conversion.toAccountId,
                convertedAmount: conversion.convertedAmount,
                creditValuation,
                debitValuation
            })
        );

        return true;
    });

    private readonly buildRuleTransferConversion = Effect.fn('RuleEngineService.buildRuleTransferConversion')(function* (
        this: RuleEngineService,
        transactionId: number,
        targetAccountId: number
    ) {
        const candidate = yield* this.findRuleTransferCandidate(transactionId, targetAccountId);
        if (!isDefined(candidate)) {
            return null;
        }

        const accounts = yield* this.findRuleTransferAccounts(candidate.accountIds);
        if (!isDefined(accounts)) {
            return null;
        }

        const converted = yield* this.convertRuleTransferAmount(accounts, candidate.originalEntry.amount);

        return this.buildRuleTransferConversionResult({ ...candidate, converted });
    });

    private readonly findRuleTransferCandidate = Effect.fn('RuleEngineService.findRuleTransferCandidate')(function* (
        this: RuleEngineService,
        transactionId: number,
        targetAccountId: number
    ) {
        const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);
        if (!isDefined(transaction) || !this.isRuleTransferConvertibleType(transaction.type)) {
            return null;
        }

        const [originalEntry] = transaction.entries;
        if (!isDefined(originalEntry)) {
            return null;
        }

        const accountIds = this.resolveRuleTransferAccountIds(transaction.type, originalEntry.accountId, targetAccountId);
        if (!isDefined(accountIds)) {
            return null;
        }

        const candidate: RuleTransferCandidateInterface = { transaction, originalEntry, accountIds };

        return candidate;
    });

    private readonly convertRuleTransferAmount = Effect.fn('RuleEngineService.convertRuleTransferAmount')(function* (
        accounts: RuleTransferAccountsInterface,
        amount: number
    ) {
        const converted = yield* exchangeRatesService.convert(accounts.fromAccount.instrumentId, accounts.toAccount.instrumentId, amount);
        const convertedAmount: RuleTransferConvertedAmountInterface = {
            convertedAmount: converted.amount,
            exchangeRate: converted.exchangeRate
        };

        return convertedAmount;
    });

    private readonly findRuleTransferAccounts = Effect.fn('RuleEngineService.findRuleTransferAccounts')(function* (
        accountIds: RuleTransferAccountIdsInterface
    ) {
        const [fromAccount, toAccount] = yield* Effect.all(
            [
                Db.query(db => accountRepository.findById(accountIds.fromAccountId, db)),
                Db.query(db => accountRepository.findById(accountIds.toAccountId, db))
            ],
            { concurrency: 'unbounded' }
        );

        if (!isDefined(fromAccount) || !isDefined(toAccount)) {
            return null;
        }

        if (fromAccount.type === AccountTypeEnum.DEBT || toAccount.type === AccountTypeEnum.DEBT) {
            return null;
        }

        const accounts: RuleTransferAccountsInterface = { fromAccount, toAccount };

        return accounts;
    });

    private findBatchMatches(
        batchStart: number,
        transactionIds: number[],
        evaluationInputs: RuleEvaluationInputInterface[],
        rules: RuleWithRelationsEntityInterface[]
    ): RuleTransactionMatchInterface[] {
        return transactionIds
            .slice(batchStart, batchStart + RULE_BATCH_SIZE)
            .map((transactionId, offset): RuleTransactionMatchInterface => ({
                transactionId,
                matchingRules: rules.filter(rule => ruleMatcherService.evaluateRule(rule, evaluationInputs[batchStart + offset]))
            }))
            .filter(match => isNotEmptyArray(match.matchingRules));
    }

    private getBatchStarts(total: number, batchSize: number): number[] {
        return Array.from({ length: Math.ceil(total / batchSize) }, (_value, index) => index * batchSize);
    }

    private applyCreateSafeRuleActionsToInput(
        input: TransactionCreateInputInterface,
        matchingRules: RuleWithRelationsEntityInterface[]
    ): TransactionCreateInputInterface {
        if (!isNotEmptyArray(matchingRules)) {
            return input;
        }

        const ruleActionOutcomes = extractRuleActionOutcomes(matchingRules);
        const { categoryId } = ruleActionOutcomes;
        const tagIds = [...new Set([...input.tagIds, ...ruleActionOutcomes.tagIds])];
        const hasCategoryAction = isDefined(categoryId);
        const hasTagAction = tagIds.length !== input.tagIds.length;

        if (!hasCategoryAction && !hasTagAction) {
            return input;
        }

        const entries = hasCategoryAction
            ? input.entries.map(entry => ({ ...entry, categoryId, categorySource: CategorySourceEnum.RULE }))
            : input.entries;

        return {
            ...input,
            updatedBy: TransactionUpdatedByEnum.RULE,
            tagIds,
            entries
        };
    }

    private hasPostCreateRuleAction(matchingRules: RuleWithRelationsEntityInterface[]): boolean {
        return matchingRules.some(rule => this.hasConvertToTransferAction(rule.actions));
    }

    private hasConvertToTransferAction(actions: RuleActionEntityInterface[]): boolean {
        return actions.some(action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER);
    }

    private toRuleEvaluationInput(input: TransactionCreateInputInterface, mccCodeMap: Map<number, string>): RuleEvaluationInputInterface {
        return {
            ...input,
            title: getTransactionDisplayTitle(input),
            entries: input.entries.map(entry => ({
                ...entry,
                mccCode: isDefined(entry.mccCategoryId) ? (mccCodeMap.get(entry.mccCategoryId) ?? null) : null
            }))
        };
    }

    private buildRuleTransferConversionResult({
        transaction,
        originalEntry,
        accountIds,
        converted
    }: RuleTransferConversionBuildInputInterface): RuleTransferConversionInterface {
        return {
            transaction,
            originalEntry,
            fromAccountId: accountIds.fromAccountId,
            toAccountId: accountIds.toAccountId,
            convertedAmount: converted.convertedAmount,
            exchangeRate: converted.exchangeRate,
            transactionType: TransactionTypeEnum.TRANSFER
        };
    }

    private isRuleTransferConvertibleType(transactionType: TransactionTypeEnum): boolean {
        return transactionType === TransactionTypeEnum.EXPENSE || transactionType === TransactionTypeEnum.INCOME;
    }

    private resolveRuleTransferAccountIds(
        transactionType: TransactionTypeEnum,
        originalAccountId: number,
        targetAccountId: number
    ): RuleTransferAccountIdsInterface | null {
        if (originalAccountId === targetAccountId) {
            return null;
        }

        const isExpense = transactionType === TransactionTypeEnum.EXPENSE;

        return {
            fromAccountId: isExpense ? originalAccountId : targetAccountId,
            toAccountId: isExpense ? targetAccountId : originalAccountId
        };
    }

    private buildRuleTransferEntries({
        transactionId,
        originalEntry,
        fromAccountId,
        toAccountId,
        convertedAmount,
        creditValuation,
        debitValuation
    }: RuleTransferEntriesInputInterface): TransactionEntryCreateEntityInterface[] {
        return [
            {
                transactionId,
                accountId: fromAccountId,
                type: TransactionEntryTypeEnum.CREDIT,
                kind: TransactionEntryKindEnum.PRIMARY,
                amount: originalEntry.amount,
                categoryId: null,
                categorySource: CategorySourceEnum.USER,
                mccCategoryId: originalEntry.mccCategoryId,
                externalId: null,
                baseInstrumentId: creditValuation.baseInstrumentId,
                baseExchangeRate: creditValuation.baseExchangeRate,
                baseAmount: creditValuation.baseAmount
            },
            {
                transactionId,
                accountId: toAccountId,
                type: TransactionEntryTypeEnum.DEBIT,
                kind: TransactionEntryKindEnum.PRIMARY,
                amount: convertedAmount,
                categoryId: null,
                categorySource: CategorySourceEnum.USER,
                mccCategoryId: null,
                externalId: null,
                baseInstrumentId: debitValuation.baseInstrumentId,
                baseExchangeRate: debitValuation.baseExchangeRate,
                baseAmount: debitValuation.baseAmount
            }
        ];
    }
}

export const ruleEngineService = new RuleEngineService();
