/* eslint-disable max-lines -- absorbs convert-transaction-to-transfer logic per CLAUDE.md rule 38/51 (approved by user during pr-322-rules SOTA cleanup) */
import {
    AccountTypeEnum,
    CategorySourceEnum,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionUpdatedByEnum,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    accountRepository,
    db,
    mccCategoryRepository,
    ruleRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE } from '../constant/batch-processing.constant';
import { extractRuleActionOutcomes } from '../util/extract-rule-action-outcomes.util';

import { ruleMatcherService } from './rule-matcher.service';

import type { RuleCreatePreparationResultInterface } from '../interface/rule-create-preparation-result.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleTransferAccountIdsInterface } from '../interface/rule-transfer-account-ids.interface';
import type { RuleTransferAccountsInterface } from '../interface/rule-transfer-accounts.interface';
import type { RuleTransferCandidateInterface } from '../interface/rule-transfer-candidate.interface';
import type { RuleTransferConversionBuildInputInterface } from '../interface/rule-transfer-conversion-build-input.interface';
import type { RuleTransferConversionInterface } from '../interface/rule-transfer-conversion.interface';
import type { RuleTransferConvertedAmountInterface } from '../interface/rule-transfer-converted-amount.interface';
import type { RuleTransferEntriesInputInterface } from '../interface/rule-transfer-entries-input.interface';
import type {
    DB,
    RuleActionEntityInterface,
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

type ApplyRuleResultType = {
    readonly applied: number;
    readonly failed: number;
    readonly total: number;
};

class RuleEngineService {
    @Log(
        (transactionIds, transactionInputs) =>
            `enter transactionIds=${transactionIds.slice(0, 5).join(',')} transactionCount=${transactionIds.length} inputCount=${transactionInputs.length}`,
        (_result, transactionIds, transactionInputs) =>
            `done transactionIds=${transactionIds.slice(0, 5).join(',')} transactionCount=${transactionIds.length} inputCount=${transactionInputs.length}`,
        (error, transactionIds, transactionInputs) =>
            `throw transactionIds=${transactionIds.slice(0, 5).join(',')} transactionCount=${transactionIds.length} inputCount=${transactionInputs.length} error=${getErrorMessage(error)}`
    )
    async applyRulesToTransactions(transactionIds: number[], transactionInputs: TransactionCreateInputInterface[]): Promise<void> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return;
        }

        const mccCodeMap = await this.buildMccCodeMapIfNeeded(rules, transactionInputs);
        const evaluationInputs = transactionInputs.map(input => this.toRuleEvaluationInput(input, mccCodeMap));

        await this.getBatchStarts(transactionIds.length).reduce(
            (previousBatch, batchStart) =>
                previousBatch.then(() => this.applyRulesToTransactionsBatch(batchStart, transactionIds, evaluationInputs, rules)),
            Promise.resolve()
        );
    }

    @Log(
        transactionInputs =>
            `enter count=${transactionInputs.length} externalIds=${transactionInputs
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')}`,
        (result, transactionInputs) =>
            `done count=${transactionInputs.length} externalIds=${transactionInputs
                .slice(0, 5)
                .map(input => input.externalId)
                .join(
                    ','
                )} postCreateIndexes=${result.postCreateIndexes.slice(0, 5).join(',')} postCreateCount=${result.postCreateIndexes.length}`,
        (error, transactionInputs) =>
            `throw count=${transactionInputs.length} externalIds=${transactionInputs
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')} error=${getErrorMessage(error)}`
    )
    async prepareCreateInputsForRules(transactionInputs: TransactionCreateInputInterface[]): Promise<RuleCreatePreparationResultInterface> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return { transactionInputs, postCreateIndexes: [] };
        }

        const mccCodeMap = await this.buildMccCodeMapIfNeeded(rules, transactionInputs);
        const evaluationInputs = transactionInputs.map(input => this.toRuleEvaluationInput(input, mccCodeMap));
        const matchingRulesByIndex = evaluationInputs.map(input => rules.filter(rule => ruleMatcherService.evaluateRule(rule, input)));
        const preparedTransactionInputs = transactionInputs.map((input, index) =>
            this.applyCreateSafeRuleActionsToInput(input, matchingRulesByIndex[index] ?? [])
        );
        const postCreateIndexes = matchingRulesByIndex.flatMap((matchingRules, index) =>
            this.hasPostCreateRuleAction(matchingRules) ? [index] : []
        );

        return { transactionInputs: preparedTransactionInputs, postCreateIndexes };
    }

    @Log(
        ruleId => `enter ruleId=${ruleId}`,
        (result, ruleId, onProgress) =>
            `done ruleId=${ruleId} hasProgress=${isDefined(onProgress)} applied=${result.applied} failed=${result.failed} total=${result.total}`,
        (error, ruleId, onProgress) => `throw ruleId=${ruleId} hasProgress=${isDefined(onProgress)} error=${getErrorMessage(error)}`
    )
    async applyRuleToMatchingTransactions(
        ruleId: number,
        onProgress: ((processed: number, total: number) => void) | null
    ): Promise<ApplyRuleResultType> {
        const rule = await ruleRepository.findByIdWithRelations(ruleId);
        const emptyResult: ApplyRuleResultType = { applied: 0, failed: 0, total: 0 };

        if (!isDefined(rule) || !isNotEmptyArray(rule.conditions)) {
            return emptyResult;
        }

        const matchingIds = await ruleMatcherService.collectMatchingTransactionIds(rule);

        if (!isNotEmptyArray(matchingIds)) {
            return emptyResult;
        }

        const total = matchingIds.length;
        const failed = await this.applyRuleToMatchingTransactionBatches(matchingIds, rule.actions, onProgress);

        const applied = total - failed;

        return { applied, failed, total };
    }

    private async applyRulesToTransactionsBatch(
        batchStart: number,
        transactionIds: number[],
        evaluationInputs: RuleEvaluationInputInterface[],
        rules: RuleWithRelationsEntityInterface[]
    ): Promise<void> {
        await this.waitForNextBatch();

        const batchIds = transactionIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
        await Promise.all(
            batchIds.map((transactionId, offset) =>
                this.applyRulesToTransaction(transactionId, evaluationInputs[batchStart + offset], rules)
            )
        );
    }

    private async applyRuleToMatchingTransactionBatches(
        matchingIds: number[],
        actions: RuleActionEntityInterface[],
        onProgress: ((processed: number, total: number) => void) | null
    ): Promise<number> {
        let processed = 0;
        let failed = 0;
        const total = matchingIds.length;

        await this.getBatchStarts(total).reduce(
            (previousBatch, batchStart) =>
                previousBatch.then(async () => {
                    const batchIds = matchingIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
                    const batchFailed = await this.applyRuleToMatchingTransactionBatch(batchIds, actions);

                    failed += batchFailed;
                    processed += batchIds.length;
                    onProgress?.(processed, total);

                    return null;
                }),
            Promise.resolve(null)
        );

        return failed;
    }

    private async applyRuleToMatchingTransactionBatch(batchIds: number[], actions: RuleActionEntityInterface[]): Promise<number> {
        await this.waitForNextBatch();

        const results = await Promise.allSettled(batchIds.map(transactionId => this.applyRuleActionsToTransaction(transactionId, actions)));

        return results.filter(result => result.status === 'rejected').length;
    }

    private async applyRulesToTransaction(
        transactionId: number,
        input: RuleEvaluationInputInterface,
        rules: RuleWithRelationsEntityInterface[]
    ): Promise<void> {
        const matchingRules = rules.filter(rule => ruleMatcherService.evaluateRule(rule, input));

        if (!isNotEmptyArray(matchingRules)) {
            return;
        }

        await transactionAsync(db, async transaction => {
            const convertedToTransfer = await this.applyMatchingRulesSequentially(transactionId, matchingRules, transaction);
            await transactionRepository.updateById(transactionId, { updatedBy: TransactionUpdatedByEnum.RULE }, transaction);

            if (convertedToTransfer) {
                await accountBalanceIncrementalService.updateAllBalances(true, transaction);
            }
        });
    }

    private async applyMatchingRulesSequentially(
        transactionId: number,
        matchingRules: RuleWithRelationsEntityInterface[],
        transaction: DB
    ): Promise<boolean> {
        const appliedExclusiveActions = new Set<RuleActionTypeEnum>();
        let convertedToTransfer = false;

        for (const rule of matchingRules) {
            // eslint-disable-next-line no-await-in-loop -- rules apply sequentially; convert-to-transfer in one rule affects matching of later rules
            const converted = await this.applyRuleActions(transactionId, rule.actions, transaction, appliedExclusiveActions);
            convertedToTransfer ||= converted;
        }

        return convertedToTransfer;
    }

    private getBatchStarts(total: number): number[] {
        return Array.from({ length: Math.ceil(total / RULE_BATCH_SIZE) }, (_value, index) => index * RULE_BATCH_SIZE);
    }

    private async waitForNextBatch(): Promise<void> {
        await new Promise<void>(resolve => {
            setTimeout(resolve, RULE_BATCH_DELAY_MS);
        });
    }

    private async applyRuleActionsToTransaction(transactionId: number, actions: RuleActionEntityInterface[]): Promise<void> {
        await transactionAsync(db, async transaction => {
            const convertedToTransfer = await this.applyRuleActions(transactionId, actions, transaction, new Set<RuleActionTypeEnum>());
            await transactionRepository.updateById(transactionId, { updatedBy: TransactionUpdatedByEnum.RULE }, transaction);

            if (convertedToTransfer) {
                await accountBalanceIncrementalService.updateAllBalances(true, transaction);
            }
        });
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
        return matchingRules.some(rule => rule.actions.some(action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER));
    }

    private toRuleEvaluationInput(input: TransactionCreateInputInterface, mccCodeMap: Map<number, string>): RuleEvaluationInputInterface {
        return {
            ...input,
            entries: input.entries.map(entry => ({
                ...entry,
                mccCode: isDefined(entry.mccCategoryId) ? (mccCodeMap.get(entry.mccCategoryId) ?? null) : null
            }))
        };
    }

    private async buildMccCodeMapIfNeeded(
        rules: RuleWithRelationsEntityInterface[],
        inputs: TransactionCreateInputInterface[]
    ): Promise<Map<number, string>> {
        const emptyMap = new Map<number, string>();
        const hasMccCondition = rules.some(rule => rule.conditions.some(condition => condition.field === RuleConditionFieldEnum.MCC_CODE));

        if (!hasMccCondition) {
            return emptyMap;
        }

        const mccCategoryIds = new Set(inputs.flatMap(input => input.entries.map(entry => entry.mccCategoryId).filter(isDefined)));

        if (mccCategoryIds.size === 0) {
            return emptyMap;
        }

        const mccCategories = await mccCategoryRepository.findAll();

        return new Map(mccCategories.filter(category => mccCategoryIds.has(category.id)).map(category => [category.id, category.mcc]));
    }

    private async applyRuleActions(
        transactionId: number,
        actions: RuleActionEntityInterface[],
        transaction: DB,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ): Promise<boolean> {
        const sortedActions = [...actions].sort((actionA, actionB) => {
            if (actionA.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                return 1;
            }

            if (actionB.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                return -1;
            }

            return 0;
        });

        return sortedActions.reduce(
            (previousAction, action) =>
                previousAction.then(async previousConverted => {
                    const converted = await this.applyRuleAction(transactionId, action, transaction, appliedExclusiveActions);

                    return previousConverted || converted;
                }),
            Promise.resolve(false)
        );
    }

    private async applyRuleAction(
        transactionId: number,
        action: RuleActionEntityInterface,
        transaction: DB,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ): Promise<boolean> {
        switch (action.type) {
            case RuleActionTypeEnum.SET_CATEGORY:
                await this.applySetCategoryAction(transactionId, action, transaction, appliedExclusiveActions);

                return false;

            case RuleActionTypeEnum.ADD_TAG:
                await this.applyAddTagAction(transactionId, action, transaction);

                return false;

            case RuleActionTypeEnum.CONVERT_TO_TRANSFER: {
                if (!isDefined(action.accountId) || appliedExclusiveActions.has(RuleActionTypeEnum.CONVERT_TO_TRANSFER)) {
                    return false;
                }

                const converted = await this.convertTransactionToTransfer(transactionId, action.accountId, transaction);
                if (converted) {
                    appliedExclusiveActions.add(RuleActionTypeEnum.CONVERT_TO_TRANSFER);
                }

                return converted;
            }

            default:
                return false;
        }
    }

    private async applySetCategoryAction(
        transactionId: number,
        action: RuleActionEntityInterface,
        transaction: DB,
        appliedExclusiveActions: Set<RuleActionTypeEnum>
    ): Promise<void> {
        if (!isDefined(action.categoryId) || appliedExclusiveActions.has(RuleActionTypeEnum.SET_CATEGORY)) {
            return;
        }

        appliedExclusiveActions.add(RuleActionTypeEnum.SET_CATEGORY);
        await transactionEntryRepository.updateCategoryByTransactionId(
            transactionId,
            action.categoryId,
            CategorySourceEnum.RULE,
            transaction
        );
        await transactionRepository.touchUpdatedAt(transactionId, transaction);
    }

    private async applyAddTagAction(transactionId: number, action: RuleActionEntityInterface, transaction: DB): Promise<void> {
        if (!isDefined(action.tagId)) {
            return;
        }

        const existingTags = await transactionTagsRepository.findByTransactionId(transactionId, transaction);
        const hasTag = existingTags.some(tag => tag.tagId === action.tagId);

        if (hasTag) {
            return;
        }

        await transactionTagsRepository.bulkCreate([{ transactionId, tagId: action.tagId, isPrimary: false }], transaction);
        await transactionRepository.touchUpdatedAt(transactionId, transaction);
    }

    private async convertTransactionToTransfer(transactionId: number, targetAccountId: number, dbTransaction: DB): Promise<boolean> {
        const conversion = await this.buildRuleTransferConversion(transactionId, targetAccountId, dbTransaction);

        if (!isDefined(conversion)) {
            return false;
        }

        const [creditValuation, debitValuation] = await Promise.all([
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: conversion.fromAccountId,
                amount: conversion.originalEntry.amount,
                operatedAt: conversion.transaction.operatedAt,
                externalSource: null,
                tx: dbTransaction
            }),
            entryBaseValuationService.valueMicroUnitEntry({
                accountId: conversion.toAccountId,
                amount: conversion.convertedAmount,
                operatedAt: conversion.transaction.operatedAt,
                externalSource: null,
                tx: dbTransaction
            })
        ]);

        await transactionRepository.updateById(
            transactionId,
            {
                type: conversion.transactionType,
                fromAccountId: conversion.fromAccountId,
                toAccountId: conversion.toAccountId,
                exchangeRate: conversion.exchangeRate
            },
            dbTransaction
        );

        await transactionEntryRepository.deleteByTransactionId(transactionId, dbTransaction);

        await transactionEntryRepository.bulkCreate(
            this.buildRuleTransferEntries({
                transactionId,
                originalEntry: conversion.originalEntry,
                fromAccountId: conversion.fromAccountId,
                toAccountId: conversion.toAccountId,
                convertedAmount: conversion.convertedAmount,
                creditValuation,
                debitValuation
            }),
            dbTransaction
        );

        return true;
    }

    private async buildRuleTransferConversion(
        transactionId: number,
        targetAccountId: number,
        dbTransaction: DB
    ): Promise<RuleTransferConversionInterface | null> {
        const candidate = await this.findRuleTransferCandidate(transactionId, targetAccountId, dbTransaction);
        if (!isDefined(candidate)) {
            return null;
        }

        const accounts = await this.findRuleTransferAccounts(candidate.accountIds, dbTransaction);
        if (!isDefined(accounts)) {
            return null;
        }

        const converted = await this.convertRuleTransferAmount(accounts, candidate.originalEntry.amount);

        return this.buildRuleTransferConversionResult({ ...candidate, accounts, converted });
    }

    private async findRuleTransferCandidate(
        transactionId: number,
        targetAccountId: number,
        dbTransaction: DB
    ): Promise<RuleTransferCandidateInterface | null> {
        const transaction = await transactionRepository.getByIdWithEntries(transactionId, dbTransaction);
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

        return { transaction, originalEntry, accountIds };
    }

    private buildRuleTransferConversionResult({
        transaction,
        originalEntry,
        accountIds,
        accounts,
        converted
    }: RuleTransferConversionBuildInputInterface): RuleTransferConversionInterface {
        return {
            transaction,
            originalEntry,
            fromAccountId: accountIds.fromAccountId,
            toAccountId: accountIds.toAccountId,
            convertedAmount: converted.convertedAmount,
            exchangeRate: converted.exchangeRate,
            transactionType: this.resolveRuleTransferTransactionType(accounts)
        };
    }

    private async convertRuleTransferAmount(
        accounts: RuleTransferAccountsInterface,
        amount: number
    ): Promise<RuleTransferConvertedAmountInterface> {
        const converted = await exchangeRatesService.convert(accounts.fromAccount.instrumentId, accounts.toAccount.instrumentId, amount);

        return {
            convertedAmount: converted.amount,
            exchangeRate: converted.exchangeRate
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

    private async findRuleTransferAccounts(
        accountIds: RuleTransferAccountIdsInterface,
        dbTransaction: DB
    ): Promise<RuleTransferAccountsInterface | null> {
        const [fromAccount, toAccount] = await Promise.all([
            accountRepository.findById(accountIds.fromAccountId, dbTransaction),
            accountRepository.findById(accountIds.toAccountId, dbTransaction)
        ]);

        if (!isDefined(fromAccount) || !isDefined(toAccount)) {
            return null;
        }

        return { fromAccount, toAccount };
    }

    private resolveRuleTransferTransactionType(accounts: RuleTransferAccountsInterface): TransactionTypeEnum {
        return accounts.fromAccount.type === AccountTypeEnum.DEBT || accounts.toAccount.type === AccountTypeEnum.DEBT
            ? TransactionTypeEnum.DEBT
            : TransactionTypeEnum.TRANSFER;
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
                amount: originalEntry.amount,
                categoryId: originalEntry.categoryId,
                categorySource: originalEntry.categorySource,
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
                amount: convertedAmount,
                categoryId: originalEntry.categoryId,
                categorySource: originalEntry.categorySource,
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
