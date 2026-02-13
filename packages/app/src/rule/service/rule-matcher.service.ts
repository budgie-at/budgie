import {
    RuleConditionCreateInputInterface,
    RuleConditionMatchTypeEnum,
    RuleWithRelationsEntityInterface,
    TransactionAssociationEnum,
    TransactionCreateInputInterface,
    TransactionEntryAssociationEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithEntriesMccCategoryEntityInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository, transactionRuleRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { sumEntryAmounts } from '../../transaction/utils/sum-entry-amounts.util';
import { buildRuleConditionsWhere } from '../util/build-rule-conditions-where.util';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

import type { RuleConditionInput } from '../util/build-rule-condition-sql.util';

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 50;

interface CountConditionsParams {
    readonly conditions: RuleConditionCreateInputInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
}

class RuleMatcherService {
    async countMatchingTransactions(params: CountConditionsParams): Promise<number> {
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

    evaluateRule(rule: RuleWithRelationsEntityInterface, input: TransactionCreateInputInterface): boolean {
        if (!isNotEmptyArray(rule.conditions)) {
            return false;
        }

        const evaluator = rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

        return rule.conditions[evaluator](condition => evaluateRuleCondition(condition, input));
    }

    convertTransactionForRuleEvaluation(transaction: TransactionWithEntriesMccCategoryEntityInterface): TransactionCreateInputInterface {
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
                mccCategoryId: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.id ?? null
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

        for (let batchStart = 0; batchStart < candidateIds.length; batchStart += BATCH_SIZE) {
            const batchIds = candidateIds.slice(batchStart, batchStart + BATCH_SIZE);
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

        for (let batchStart = 0; batchStart < candidateIds.length; batchStart += BATCH_SIZE) {
            const batchIds = candidateIds.slice(batchStart, batchStart + BATCH_SIZE);
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

    // eslint-disable-next-line max-statements -- Batch processing with loop control variables
    private async countMatchingTransactionsLegacy(params: CountConditionsParams): Promise<number> {
        const { conditions, conditionMatchType } = params;

        if (!isNotEmptyArray(conditions)) {
            return 0;
        }

        let count = 0;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.getAllWithOffset(BATCH_SIZE, offset);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            const matchCount = transactions.filter(transaction => {
                const input = this.convertTransactionForRuleEvaluation(transaction);

                return this.evaluateConditions(conditions, conditionMatchType, input);
            }).length;

            count += matchCount;
            hasMore = transactions.length >= BATCH_SIZE;
            offset += BATCH_SIZE;
        }

        return count;
    }

    private async collectMatchingTransactionIdsLegacy(rule: RuleWithRelationsEntityInterface): Promise<number[]> {
        const matchingIds: number[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>(resolve => {
                setTimeout(resolve, BATCH_DELAY_MS);
            });

            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.getAllWithOffset(BATCH_SIZE, offset);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            transactions.forEach(transaction => {
                const input = this.convertTransactionForRuleEvaluation(transaction);
                if (this.evaluateRule(rule, input)) {
                    matchingIds.push(transaction.id);
                }
            });

            hasMore = transactions.length >= BATCH_SIZE;
            offset += BATCH_SIZE;
        }

        return matchingIds;
    }

    private evaluateConditions(
        conditions: readonly RuleConditionInput[],
        conditionMatchType: RuleConditionMatchTypeEnum,
        input: TransactionCreateInputInterface
    ): boolean {
        const evaluator = conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

        return conditions[evaluator](condition =>
            evaluateRuleCondition({ ...condition, id: 0, ruleId: 0, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }, input)
        );
    }

    private calculateAmountForRuleEvaluation(transaction: TransactionWithEntriesMccCategoryEntityInterface): number {
        const entries = transaction[TransactionAssociationEnum.ENTRIES];

        if (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.TRANSFER) {
            return sumEntryAmounts(entries, TransactionEntryTypeEnum.CREDIT);
        }

        if (transaction.type === TransactionTypeEnum.INCOME) {
            return sumEntryAmounts(entries, TransactionEntryTypeEnum.DEBIT);
        }

        if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
            const hasDebit = entries.some(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

            return hasDebit
                ? sumEntryAmounts(entries, TransactionEntryTypeEnum.DEBIT)
                : sumEntryAmounts(entries, TransactionEntryTypeEnum.CREDIT);
        }

        return 0;
    }
}

export const ruleMatcherService = new RuleMatcherService();
