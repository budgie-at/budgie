/* eslint-disable max-lines -- Service with multiple matching strategies (SQL, fallback, legacy) */
import {
    RuleConditionMatchTypeEnum,
    TransactionAssociationEnum,
    TransactionEntryAssociationEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository, transactionRuleRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { sumEntryAmounts } from '../../transaction/utils/sum-entry-amounts.util';
import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE } from '../constant/batch-processing.constant';
import { buildRuleConditionsWhere } from '../util/build-rule-conditions-where.util';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

import type { CountConditionsParamsInterface } from '../interface/count-conditions-params.interface';
import type { FindMatchingTransactionsResultInterface } from '../interface/find-matching-transactions-result.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleConditionInput } from '../util/build-rule-condition-sql.util';
import type { RuleWithRelationsEntityInterface, TransactionWithEntriesMccCategoryEntityInterface } from '@budgie/contracts';

class RuleMatcherService {
    @Log(
        params => `enter conditions=${params.conditions.length} matchType=${params.conditionMatchType}`,
        result => `done count=${result}`,
        (error, params) =>
            `throw conditions=${params.conditions.length} matchType=${params.conditionMatchType} error=${getErrorMessage(error)}`
    )
    async countMatchingTransactions(params: CountConditionsParamsInterface): Promise<number> {
        const { conditions, conditionMatchType } = params;

        if (!isNotEmptyArray(conditions)) {
            return 0;
        }

        const { sqlWhere, fallbackConditions } = buildRuleConditionsWhere(conditions, conditionMatchType);

        if (!isNotEmptyArray(fallbackConditions) && isDefined(sqlWhere)) {
            return transactionRuleRepository.countByRuleConditions(sqlWhere);
        }

        if (isDefined(sqlWhere) && conditionMatchType === RuleConditionMatchTypeEnum.ALL) {
            const candidateIds = await transactionRuleRepository.findIdsByRuleConditions(sqlWhere);

            return this.countWithFallbackConditions(candidateIds, fallbackConditions, conditionMatchType);
        }

        return this.countMatchingTransactionsLegacy(params);
    }

    @Log(
        (params, limit) => `enter conditions=${params.conditions.length} matchType=${params.conditionMatchType} limit=${limit}`,
        result => `done count=${result.count} returned=${result.transactions.length}`,
        (error, params, limit) =>
            `throw conditions=${params.conditions.length} matchType=${params.conditionMatchType} limit=${limit} error=${getErrorMessage(error)}`
    )
    // eslint-disable-next-line max-statements -- Multiple branching paths with SQL and fallback logic
    async findMatchingTransactions(
        params: CountConditionsParamsInterface,
        limit: number
    ): Promise<FindMatchingTransactionsResultInterface> {
        const { conditions, conditionMatchType } = params;
        const emptyResult: FindMatchingTransactionsResultInterface = { transactions: [], count: 0 };

        if (!isNotEmptyArray(conditions)) {
            return emptyResult;
        }

        const { sqlWhere, fallbackConditions } = buildRuleConditionsWhere(conditions, conditionMatchType);

        if (!isNotEmptyArray(fallbackConditions) && isDefined(sqlWhere)) {
            const allIds = await transactionRuleRepository.findIdsByRuleConditions(sqlWhere);
            const count = allIds.length;
            const slicedIds = allIds.slice(0, limit);
            const transactions = isNotEmptyArray(slicedIds) ? await transactionRepository.findByIdsWithEntries(slicedIds) : [];

            return { transactions, count };
        }

        if (isDefined(sqlWhere) && conditionMatchType === RuleConditionMatchTypeEnum.ALL) {
            const candidateIds = await transactionRuleRepository.findIdsByRuleConditions(sqlWhere);
            const matchingIds = await this.filterWithFallbackConditions(candidateIds, fallbackConditions, conditionMatchType);
            const count = matchingIds.length;
            const slicedIds = matchingIds.slice(0, limit);
            const transactions = isNotEmptyArray(slicedIds) ? await transactionRepository.findByIdsWithEntries(slicedIds) : [];

            return { transactions, count };
        }

        return this.findMatchingTransactionsLegacy(params, limit);
    }

    @Log(
        rule => `enter ruleId=${rule.id} conditions=${rule.conditions.length} matchType=${rule.conditionMatchType}`,
        (result, rule) => `done ruleId=${rule.id} matchedCount=${result.length}`,
        (error, rule) => `throw ruleId=${rule.id} error=${getErrorMessage(error)}`
    )
    async collectMatchingTransactionIds(rule: RuleWithRelationsEntityInterface): Promise<number[]> {
        if (!isNotEmptyArray(rule.conditions)) {
            return [];
        }

        const { sqlWhere, fallbackConditions } = buildRuleConditionsWhere(rule.conditions, rule.conditionMatchType);

        if (!isNotEmptyArray(fallbackConditions) && isDefined(sqlWhere)) {
            return transactionRuleRepository.findIdsByRuleConditions(sqlWhere);
        }

        if (isDefined(sqlWhere) && rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL) {
            const candidateIds = await transactionRuleRepository.findIdsByRuleConditions(sqlWhere);

            return this.filterWithFallbackConditions(candidateIds, fallbackConditions, rule.conditionMatchType);
        }

        return this.collectMatchingTransactionIdsLegacy(rule);
    }

    @Log(
        (rule, input) => `enter ruleId=${rule.id} matchType=${rule.conditionMatchType} title="${input.title}"`,
        (result, rule, input) => `done ruleId=${rule.id} title="${input.title}" matched=${result}`,
        (error, rule, input) => `throw ruleId=${rule.id} title="${input.title}" error=${getErrorMessage(error)}`
    )
    evaluateRule(rule: RuleWithRelationsEntityInterface, input: RuleEvaluationInputInterface): boolean {
        if (!isNotEmptyArray(rule.conditions)) {
            return false;
        }

        const evaluator = rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

        return rule.conditions[evaluator](condition => evaluateRuleCondition(condition, input));
    }

    private convertTransactionForRuleEvaluation(
        transaction: TransactionWithEntriesMccCategoryEntityInterface
    ): RuleEvaluationInputInterface {
        const entries = transaction[TransactionAssociationEnum.ENTRIES];

        return {
            ...transaction,
            amount: convertFromMicroUnits(this.calculateAmountForRuleEvaluation(transaction)),
            tagIds: [],
            entries: entries.map(entry => ({
                type: entry.type,
                categoryId: entry.categoryId,
                accountId: entry.accountId,
                amount: convertFromMicroUnits(entry.amount),
                mccCategoryId: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.id ?? null,
                mccCode: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.mcc ?? null
            }))
        };
    }

    private async countWithFallbackConditions(
        candidateIds: number[],
        fallbackConditions: RuleConditionInput[],
        conditionMatchType: RuleConditionMatchTypeEnum
    ): Promise<number> {
        if (!isNotEmptyArray(candidateIds)) {
            return 0;
        }

        let count = 0;

        for (let batchStart = 0; batchStart < candidateIds.length; batchStart += RULE_BATCH_SIZE) {
            const batchIds = candidateIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.findByIdsWithEntries(batchIds);

            const matchCount = transactions.filter(transaction => {
                const input = this.convertTransactionForRuleEvaluation(transaction);

                return this.evaluateConditions(fallbackConditions, conditionMatchType, input);
            }).length;

            count += matchCount;
        }

        return count;
    }

    private async filterWithFallbackConditions(
        candidateIds: number[],
        fallbackConditions: RuleConditionInput[],
        conditionMatchType: RuleConditionMatchTypeEnum
    ): Promise<number[]> {
        if (!isNotEmptyArray(candidateIds)) {
            return [];
        }

        const matchingIds: number[] = [];

        for (let batchStart = 0; batchStart < candidateIds.length; batchStart += RULE_BATCH_SIZE) {
            const batchIds = candidateIds.slice(batchStart, batchStart + RULE_BATCH_SIZE);
            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.findByIdsWithEntries(batchIds);

            for (const transaction of transactions) {
                const input = this.convertTransactionForRuleEvaluation(transaction);

                if (this.evaluateConditions(fallbackConditions, conditionMatchType, input)) {
                    matchingIds.push(transaction.id);
                }
            }
        }

        return matchingIds;
    }

    private async countMatchingTransactionsLegacy(params: CountConditionsParamsInterface): Promise<number> {
        const { conditions, conditionMatchType } = params;

        if (!isNotEmptyArray(conditions)) {
            return 0;
        }

        let count = 0;

        await this.forEachTransactionBatch(transactions => {
            count += transactions.filter(transaction => {
                const input = this.convertTransactionForRuleEvaluation(transaction);

                return this.evaluateConditions(conditions, conditionMatchType, input);
            }).length;
        });

        return count;
    }

    private async findMatchingTransactionsLegacy(
        params: CountConditionsParamsInterface,
        limit: number
    ): Promise<FindMatchingTransactionsResultInterface> {
        const { conditions, conditionMatchType } = params;

        if (!isNotEmptyArray(conditions)) {
            return { transactions: [], count: 0 };
        }

        const matchingIds: number[] = [];

        await this.forEachTransactionBatch(transactions => {
            for (const transaction of transactions) {
                const input = this.convertTransactionForRuleEvaluation(transaction);

                if (this.evaluateConditions(conditions, conditionMatchType, input)) {
                    matchingIds.push(transaction.id);
                }
            }
        });

        const count = matchingIds.length;
        const slicedIds = matchingIds.slice(0, limit);
        const resultTransactions = isNotEmptyArray(slicedIds) ? await transactionRepository.findByIdsWithEntries(slicedIds) : [];

        return { transactions: resultTransactions, count };
    }

    private async collectMatchingTransactionIdsLegacy(rule: RuleWithRelationsEntityInterface): Promise<number[]> {
        const matchingIds: number[] = [];

        await this.forEachTransactionBatch(transactions => {
            for (const transaction of transactions) {
                const input = this.convertTransactionForRuleEvaluation(transaction);

                if (this.evaluateRule(rule, input)) {
                    matchingIds.push(transaction.id);
                }
            }
        });

        return matchingIds;
    }

    private async forEachTransactionBatch(
        callback: (transactions: TransactionWithEntriesMccCategoryEntityInterface[]) => void
    ): Promise<void> {
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>(resolve => {
                setTimeout(resolve, RULE_BATCH_DELAY_MS);
            });

            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.findAllWithMccCategoryOffset(RULE_BATCH_SIZE, offset);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            callback(transactions);

            hasMore = transactions.length >= RULE_BATCH_SIZE;
            offset += RULE_BATCH_SIZE;
        }
    }

    private evaluateConditions(
        conditions: readonly RuleConditionInput[],
        conditionMatchType: RuleConditionMatchTypeEnum,
        input: RuleEvaluationInputInterface
    ): boolean {
        const evaluator = conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

        return conditions[evaluator](condition => evaluateRuleCondition(condition, input));
    }

    private calculateAmountForRuleEvaluation(transaction: TransactionWithEntriesMccCategoryEntityInterface): number {
        const entries = transaction[TransactionAssociationEnum.ENTRIES];

        if (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.TRANSFER) {
            return sumEntryAmounts(entries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT));
        }

        if (transaction.type === TransactionTypeEnum.INCOME) {
            return sumEntryAmounts(entries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT));
        }

        if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
            const hasDebit = entries.some(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

            return hasDebit
                ? sumEntryAmounts(entries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT))
                : sumEntryAmounts(entries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT));
        }

        return 0;
    }
}

export const ruleMatcherService = new RuleMatcherService();
