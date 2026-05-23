/* eslint-disable max-lines -- Service with multiple matching strategies (SQL, fallback, legacy); absorbs SQL where-builder chain per CLAUDE.md rule 51 */
import {
    MccCategoryEntityTable,
    RuleConditionCreateInputInterface,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TransactionAssociationEnum,
    TransactionEntityTable,
    TransactionEntryAssociationEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { SQL, and, or, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { transactionRepository, transactionRuleRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { sumEntryAmounts } from '../../transaction/utils/sum-entry-amounts.util';
import { RULE_BATCH_DELAY_MS, RULE_BATCH_SIZE } from '../constant/batch-processing.constant';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleWithRelationsEntityInterface, TransactionWithEntriesMccCategoryEntityInterface } from '@budgie/contracts';
import type { Column } from 'drizzle-orm';

type BuildRuleConditionsWhereResultType = {
    readonly sqlWhere: SQL | null;
    readonly fallbackConditions: RuleConditionInputInterface[];
};

type CountConditionsParamsType = {
    readonly conditions: RuleConditionCreateInputInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
};

type FindMatchingTransactionsResultType = {
    readonly transactions: TransactionWithEntriesMccCategoryEntityInterface[];
    readonly count: number;
};

class RuleMatcherService {
    private static readonly UNSUPPORTED_SQL_REGEX_TOKEN_PATTERN = /[\\^$.*+?()[\]{}|]/u;

    @Log(
        params => `enter conditions=${params.conditions.length} matchType=${params.conditionMatchType}`,
        result => `done count=${result}`,
        (error, params) =>
            `throw conditions=${params.conditions.length} matchType=${params.conditionMatchType} error=${getErrorMessage(error)}`
    )
    async countMatchingTransactions(params: CountConditionsParamsType): Promise<number> {
        const { conditions, conditionMatchType } = params;

        if (!isNotEmptyArray(conditions)) {
            return 0;
        }

        const { sqlWhere, fallbackConditions } = this.buildRuleConditionsWhere(conditions, conditionMatchType);

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
    async findMatchingTransactions(params: CountConditionsParamsType, limit: number): Promise<FindMatchingTransactionsResultType> {
        const { conditions, conditionMatchType } = params;
        const emptyResult: FindMatchingTransactionsResultType = { transactions: [], count: 0 };

        if (!isNotEmptyArray(conditions)) {
            return emptyResult;
        }

        const { sqlWhere, fallbackConditions } = this.buildRuleConditionsWhere(conditions, conditionMatchType);

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

        const { sqlWhere, fallbackConditions } = this.buildRuleConditionsWhere(rule.conditions, rule.conditionMatchType);

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

        return this.evaluateConditions(rule.conditions, rule.conditionMatchType, input);
    }

    private buildRuleConditionsWhere(
        conditions: RuleConditionInputInterface[],
        conditionMatchType: RuleConditionMatchTypeEnum
    ): BuildRuleConditionsWhereResultType {
        const sqlConditions: SQL[] = [];
        const fallbackConditions: RuleConditionInputInterface[] = [];

        for (const condition of conditions) {
            const sqlClause = this.buildRuleConditionSql(condition);

            if (isDefined(sqlClause)) {
                sqlConditions.push(sqlClause);
            } else {
                fallbackConditions.push(condition);
            }
        }

        const combiner = conditionMatchType === RuleConditionMatchTypeEnum.ALL ? and : or;
        const sqlWhere = isNotEmptyArray(sqlConditions) ? (combiner(...sqlConditions) ?? null) : null;

        return { sqlWhere, fallbackConditions };
    }

    private buildRuleConditionSql(condition: RuleConditionInputInterface): SQL | null {
        const column = this.getColumnForField(condition.field);

        if (!isDefined(column)) {
            return null;
        }

        return this.buildOperatorSql(column, condition.operator, condition.value, condition.secondaryValue);
    }

    private getColumnForField(field: RuleConditionFieldEnum): Column | SQL | null {
        switch (field) {
            case RuleConditionFieldEnum.TITLE:
                return TransactionEntityTable.title;
            case RuleConditionFieldEnum.COMMENT:
                return TransactionEntityTable.comment;
            case RuleConditionFieldEnum.TRANSACTION_TYPE:
                return TransactionEntityTable.type;
            case RuleConditionFieldEnum.EXTERNAL_SOURCE:
                return TransactionEntityTable.externalSource;
            case RuleConditionFieldEnum.ACCOUNT_ID:
                return sql`COALESCE(${TransactionEntityTable.fromAccountId}, ${TransactionEntityTable.toAccountId})`;
            case RuleConditionFieldEnum.MCC_CODE:
                return sql`(SELECT ${MccCategoryEntityTable.mcc} FROM ${MccCategoryEntityTable} WHERE ${MccCategoryEntityTable.id} = ${TransactionEntryEntityTable.mccCategoryId})`;
            case RuleConditionFieldEnum.AMOUNT:
                return null;
            default:
                return null;
        }
    }

    private buildOperatorSql(
        column: Column | SQL,
        operator: RuleConditionOperatorEnum,
        value: string,
        secondaryValue: string | null
    ): SQL | null {
        switch (operator) {
            case RuleConditionOperatorEnum.CONTAINS:
                return sql`CAST(${column} AS TEXT) LIKE ${`%${this.escapeSqlLikeValue(value)}%`} ESCAPE '\\'`;
            case RuleConditionOperatorEnum.NOT_CONTAINS:
                return sql`CAST(${column} AS TEXT) NOT LIKE ${`%${this.escapeSqlLikeValue(value)}%`} ESCAPE '\\'`;
            case RuleConditionOperatorEnum.EQUALS:
                return sql`CAST(${column} AS TEXT) COLLATE NOCASE = ${value}`;
            case RuleConditionOperatorEnum.NOT_EQUALS:
                return sql`CAST(${column} AS TEXT) COLLATE NOCASE != ${value}`;
            case RuleConditionOperatorEnum.GREATER_THAN:
                return sql`${column} > ${Number(value)}`;
            case RuleConditionOperatorEnum.LESS_THAN:
                return sql`${column} < ${Number(value)}`;
            case RuleConditionOperatorEnum.BETWEEN: {
                if (!isNotEmptyString(secondaryValue)) {
                    return null;
                }

                const gteClause = sql`${column} >= ${Number(value)}`;
                const lteClause = sql`${column} <= ${Number(secondaryValue)}`;

                return and(gteClause, lteClause) ?? null;
            }
            case RuleConditionOperatorEnum.IN: {
                const inValues = value.split(',').map(item => item.trim());
                const placeholders = inValues.map(item => sql`${item}`);

                return sql`CAST(${column} AS TEXT) COLLATE NOCASE IN (${sql.join(placeholders, sql`, `)})`;
            }
            case RuleConditionOperatorEnum.MATCHES_REGEX:
                return this.buildRegexSql(column, value);
            default:
                return null;
        }
    }

    private buildRegexSql(column: Column | SQL, value: string): SQL | null {
        const tokens = this.getFlexibleRegexTokens(value);

        if (!isDefined(tokens)) {
            return null;
        }

        const pattern = `%${tokens.map(token => this.escapeSqlLikeValue(token)).join('%')}%`;

        return sql`CAST(${column} AS TEXT) LIKE ${pattern} ESCAPE '\\'`;
    }

    private getFlexibleRegexTokens(value: string): string[] | null {
        const tokens = value.split('.*');
        const hasOnlySqlSafeTokens = tokens.every(
            token => isNotEmptyString(token) && !RuleMatcherService.UNSUPPORTED_SQL_REGEX_TOKEN_PATTERN.test(token)
        );

        return isNotEmptyArray(tokens) && hasOnlySqlSafeTokens ? tokens : null;
    }

    private escapeSqlLikeValue(value: string): string {
        return value.replace(/\\/gu, '\\\\').replace(/%/gu, '\\%').replace(/_/gu, '\\_');
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
        fallbackConditions: RuleConditionInputInterface[],
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
        fallbackConditions: RuleConditionInputInterface[],
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

    private async countMatchingTransactionsLegacy(params: CountConditionsParamsType): Promise<number> {
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
        params: CountConditionsParamsType,
        limit: number
    ): Promise<FindMatchingTransactionsResultType> {
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
        conditions: readonly RuleConditionInputInterface[],
        conditionMatchType: RuleConditionMatchTypeEnum,
        input: RuleEvaluationInputInterface
    ): boolean {
        const matchesCondition = (condition: RuleConditionInputInterface) => evaluateRuleCondition(condition, input);

        return conditionMatchType === RuleConditionMatchTypeEnum.ANY
            ? conditions.some(matchesCondition)
            : conditions.every(matchesCondition);
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
