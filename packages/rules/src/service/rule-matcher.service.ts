import {
    MccCategoryEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TransactionAssociationEnum,
    TransactionEntityTable,
    TransactionEntryAssociationEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    PRECISION
} from '@budgie/contracts';
import { SQL, and, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';
import { TransactionRuleRepository } from '../repository/transaction-rule.repository';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type {
    RuleCreateInputInterface,
    RuleWithRelationsEntityInterface,
    TransactionWithEntriesMccCategoryEntityInterface
} from '@budgie/contracts';
import type { Column } from 'drizzle-orm';

export class RuleMatcherService extends Context.Service<RuleMatcherService>()('@budgie/rules/RuleMatcherService', {
    make: Effect.gen(function* () {
        const transactionRepository = yield* TransactionRepository;

        const transactionRuleRepository = yield* TransactionRuleRepository;

        const UNSUPPORTED_SQL_REGEX_TOKEN_PATTERN = /[\\^$.*+?()[\]{}|]/u;

        const sumEntryAmountsOfType = (
            entries: TransactionWithEntriesMccCategoryEntityInterface['entries'],
            type: TransactionEntryTypeEnum
        ): number => entries.filter(entry => entry.type === type).reduce((sum, entry) => sum + entry.amount, 0);

        const calculateAmountForRuleEvaluation = (transaction: TransactionWithEntriesMccCategoryEntityInterface): number => {
            const entries = transaction[TransactionAssociationEnum.ENTRIES];

            switch (transaction.type) {
                case TransactionTypeEnum.EXPENSE:
                case TransactionTypeEnum.TRANSFER:
                    return sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.CREDIT);
                case TransactionTypeEnum.INCOME:
                    return sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.DEBIT);
                case TransactionTypeEnum.ADJUSTMENT:
                    return entries.some(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                        ? sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.DEBIT)
                        : sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.CREDIT);
                default:
                    return 0;
            }
        };

        const convertTransactionForRuleEvaluation = (
            transaction: TransactionWithEntriesMccCategoryEntityInterface
        ): RuleEvaluationInputInterface => {
            const entries = transaction[TransactionAssociationEnum.ENTRIES];

            return {
                ...transaction,
                amount: calculateAmountForRuleEvaluation(transaction) / PRECISION,
                tagIds: [],
                entries: entries.map(entry => ({
                    type: entry.type,
                    categoryId: entry.categoryId,
                    accountId: entry.accountId,
                    amount: entry.amount / PRECISION,
                    mccCategoryId: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.id ?? null,
                    mccCode: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.mcc ?? null
                }))
            };
        };

        const evaluateConditions = (
            conditions: readonly RuleConditionInputInterface[],
            conditionMatchType: RuleConditionMatchTypeEnum,
            input: RuleEvaluationInputInterface
        ): boolean => {
            const matchesCondition = (condition: RuleConditionInputInterface) => evaluateRuleCondition(condition, input);

            return conditionMatchType === RuleConditionMatchTypeEnum.ANY
                ? conditions.some(matchesCondition)
                : conditions.every(matchesCondition);
        };

        const filterWithFallbackConditions = Effect.fnUntraced(function* (
            candidateIds: number[],
            fallbackConditions: RuleConditionInputInterface[],
            conditionMatchType: RuleConditionMatchTypeEnum
        ) {
            const matchingIds: number[] = [];

            for (let batchStart = 0; batchStart < candidateIds.length; batchStart += RULE_SET_BATCH_SIZE) {
                const batchIds = candidateIds.slice(batchStart, batchStart + RULE_SET_BATCH_SIZE);
                const transactions = yield* transactionRepository.findByIdsWithEntries(batchIds);

                for (const transaction of transactions) {
                    const input = convertTransactionForRuleEvaluation(transaction);

                    if (evaluateConditions(fallbackConditions, conditionMatchType, input)) {
                        matchingIds.push(transaction.id);
                    }
                }
            }

            return matchingIds;
        });

        const forEachTransactionBatch = Effect.fnUntraced(function* (
            callback: (transactions: TransactionWithEntriesMccCategoryEntityInterface[]) => void
        ) {
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                yield* Effect.sleep(1);

                const transactions = yield* transactionRepository.findAllWithMccCategoryOffset(RULE_SET_BATCH_SIZE, offset);

                if (!isNotEmptyArray(transactions)) {
                    break;
                }

                callback(transactions);

                hasMore = transactions.length >= RULE_SET_BATCH_SIZE;
                offset += RULE_SET_BATCH_SIZE;
            }
        });

        const scanMatchingIds = Effect.fnUntraced(function* (
            conditions: RuleConditionInputInterface[],
            conditionMatchType: RuleConditionMatchTypeEnum
        ) {
            const matchingIds: number[] = [];

            yield* forEachTransactionBatch(transactions => {
                for (const transaction of transactions) {
                    const input = convertTransactionForRuleEvaluation(transaction);

                    if (input.type !== TransactionTypeEnum.ADJUSTMENT && evaluateConditions(conditions, conditionMatchType, input)) {
                        matchingIds.push(transaction.id);
                    }
                }
            });

            return matchingIds;
        });

        const getColumnForField = (field: RuleConditionFieldEnum): Column | SQL | null => {
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
        };

        const getFlexibleRegexTokens = (value: string): string[] | null => {
            const tokens = value.split('.*');
            const hasOnlySqlSafeTokens = tokens.every(token => isNotEmptyString(token) && !UNSUPPORTED_SQL_REGEX_TOKEN_PATTERN.test(token));

            return isNotEmptyArray(tokens) && hasOnlySqlSafeTokens ? tokens : null;
        };

        const escapeSqlLikeValue = (value: string): string => value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

        const buildRegexSql = (column: Column | SQL, value: string): SQL | null => {
            const tokens = getFlexibleRegexTokens(value);

            if (!isDefined(tokens)) {
                return null;
            }

            const pattern = `%${tokens.map(token => escapeSqlLikeValue(token)).join('%')}%`;

            return sql`CAST(${column} AS TEXT) LIKE ${pattern} ESCAPE '\\'`;
        };

        const buildOperatorSql = (
            column: Column | SQL,
            operator: RuleConditionOperatorEnum,
            value: string,
            secondaryValue: string | null
        ): SQL | null => {
            switch (operator) {
                case RuleConditionOperatorEnum.CONTAINS:
                    return sql`CAST(${column} AS TEXT) LIKE ${`%${escapeSqlLikeValue(value)}%`} ESCAPE '\\'`;
                case RuleConditionOperatorEnum.NOT_CONTAINS:
                    return sql`CAST(${column} AS TEXT) NOT LIKE ${`%${escapeSqlLikeValue(value)}%`} ESCAPE '\\'`;
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
                    return buildRegexSql(column, value);
                default:
                    return null;
            }
        };

        const buildRuleConditionSql = (condition: RuleConditionInputInterface): SQL | null => {
            const column = getColumnForField(condition.field);

            if (!isDefined(column)) {
                return null;
            }

            return buildOperatorSql(column, condition.operator, condition.value, condition.secondaryValue);
        };

        const buildRuleConditionsWhere = (conditions: RuleConditionInputInterface[], conditionMatchType: RuleConditionMatchTypeEnum) => {
            const sqlConditions: SQL[] = [];
            const fallbackConditions: RuleConditionInputInterface[] = [];

            for (const condition of conditions) {
                const sqlClause = buildRuleConditionSql(condition);

                if (isDefined(sqlClause)) {
                    sqlConditions.push(sqlClause);
                } else {
                    fallbackConditions.push(condition);
                }
            }

            const combiner = conditionMatchType === RuleConditionMatchTypeEnum.ALL ? and : or;
            const sqlWhere = isNotEmptyArray(sqlConditions) ? (combiner(...sqlConditions) ?? null) : null;

            return { sqlWhere, fallbackConditions };
        };

        const findMatchingIds = Effect.fnUntraced(function* (
            conditions: RuleConditionInputInterface[],
            conditionMatchType: RuleConditionMatchTypeEnum
        ) {
            const { sqlWhere, fallbackConditions } = buildRuleConditionsWhere(conditions, conditionMatchType);

            if (!isNotEmptyArray(fallbackConditions) && isDefined(sqlWhere)) {
                return yield* transactionRuleRepository.findIdsByRuleConditions(sqlWhere);
            }

            if (isDefined(sqlWhere) && conditionMatchType === RuleConditionMatchTypeEnum.ALL) {
                const candidateIds = yield* transactionRuleRepository.findIdsByRuleConditions(sqlWhere);

                return yield* filterWithFallbackConditions(candidateIds, fallbackConditions, conditionMatchType);
            }

            return yield* scanMatchingIds(conditions, conditionMatchType);
        });

        const countMatchingTransactions = Effect.fn('RuleMatcherService.countMatchingTransactions')(function* (
            params: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>
        ) {
            const { conditions, conditionMatchType } = params;

            if (!isNotEmptyArray(conditions)) {
                return 0;
            }

            const { sqlWhere, fallbackConditions } = buildRuleConditionsWhere(conditions, conditionMatchType);

            if (!isNotEmptyArray(fallbackConditions) && isDefined(sqlWhere)) {
                return yield* transactionRuleRepository.countByRuleConditions(sqlWhere);
            }

            const matchingIds = yield* findMatchingIds(conditions, conditionMatchType);

            return matchingIds.length;
        });

        const collectMatchingTransactionIds = Effect.fn('RuleMatcherService.collectMatchingTransactionIds')(function* (
            rule: RuleWithRelationsEntityInterface
        ) {
            if (!isNotEmptyArray(rule.conditions)) {
                return [];
            }

            return yield* findMatchingIds(rule.conditions, rule.conditionMatchType);
        });

        const evaluateRule = (rule: RuleWithRelationsEntityInterface, input: RuleEvaluationInputInterface): boolean => {
            if (input.type === TransactionTypeEnum.ADJUSTMENT) {
                return false;
            }

            if (!isNotEmptyArray(rule.conditions)) {
                return false;
            }

            return evaluateConditions(rule.conditions, rule.conditionMatchType, input);
        };

        return { countMatchingTransactions, collectMatchingTransactionIds, evaluateRule };
    })
}) {
    static readonly layer = Layer.effect(RuleMatcherService, RuleMatcherService.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionRuleRepository.layer])
    );
}
