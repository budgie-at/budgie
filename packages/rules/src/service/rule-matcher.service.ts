import {
    MccCategoryEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionRepository,
    YIELD_TO_UI
} from '@budgie/contracts';
import { SQL, and, or, sql } from 'drizzle-orm';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';
import { TransactionRuleRepository } from '../repository/transaction-rule.repository';
import { convertTransactionForRuleEvaluation } from '../utils/convert-transaction-for-rule-evaluation.util';
import { matchesRule } from '../utils/matches-rule.util';

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
        const TEXT_CONDITION_FIELDS = new Set<RuleConditionFieldEnum>([
            RuleConditionFieldEnum.TITLE,
            RuleConditionFieldEnum.COMMENT,
            RuleConditionFieldEnum.TRANSACTION_TYPE,
            RuleConditionFieldEnum.EXTERNAL_SOURCE
        ]);

        const filterMatchingIds = (
            transactions: TransactionWithEntriesMccCategoryEntityInterface[],
            rule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>
        ): number[] =>
            transactions
                .filter(transaction => matchesRule(rule, convertTransactionForRuleEvaluation(transaction)))
                .map(transaction => transaction.id);

        const filterWithFallbackConditions = Effect.fnUntraced(function* (
            candidateIds: number[],
            fallbackRule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>
        ) {
            const matchingIdBatches = yield* Effect.forEach(Arr.chunksOf(candidateIds, RULE_SET_BATCH_SIZE), batchIds =>
                Effect.map(transactionRepository.findByIdsWithEntries(batchIds), transactions =>
                    filterMatchingIds(transactions, fallbackRule)
                )
            );

            return matchingIdBatches.flat();
        });

        const forEachTransactionBatch = Effect.fnUntraced(function* (
            callback: (transactions: TransactionWithEntriesMccCategoryEntityInterface[]) => void
        ) {
            let cursorId: number | null = null;
            let hasMore = true;

            while (hasMore) {
                yield* YIELD_TO_UI;

                const transactions: TransactionWithEntriesMccCategoryEntityInterface[] =
                    yield* transactionRepository.findAllWithMccCategoryAfter(RULE_SET_BATCH_SIZE, cursorId);

                if (!isNotEmptyArray(transactions)) {
                    break;
                }

                callback(transactions);

                hasMore = transactions.length >= RULE_SET_BATCH_SIZE;
                cursorId = transactions.at(-1)?.id ?? null;
            }
        });

        const scanMatchingIds = Effect.fnUntraced(function* (rule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>) {
            const matchingIds: number[] = [];

            yield* forEachTransactionBatch(transactions => {
                matchingIds.push(...filterMatchingIds(transactions, rule));
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

        const buildRegexSql = (textColumn: Column | SQL, value: string): SQL | null => {
            const tokens = getFlexibleRegexTokens(value);

            if (!isDefined(tokens)) {
                return null;
            }

            const pattern = `%${tokens.map(token => escapeSqlLikeValue(token)).join('%')}%`;

            return sql`${textColumn} LIKE ${pattern} ESCAPE '\\'`;
        };

        const buildOperatorSql = (column: Column | SQL, condition: RuleConditionInputInterface): SQL | null => {
            const textColumn = TEXT_CONDITION_FIELDS.has(condition.field) ? column : sql`CAST(${column} AS TEXT)`;

            switch (condition.operator) {
                case RuleConditionOperatorEnum.CONTAINS:
                    return sql`${textColumn} LIKE ${`%${escapeSqlLikeValue(condition.value)}%`} ESCAPE '\\'`;
                case RuleConditionOperatorEnum.NOT_CONTAINS:
                    return sql`${textColumn} NOT LIKE ${`%${escapeSqlLikeValue(condition.value)}%`} ESCAPE '\\'`;
                case RuleConditionOperatorEnum.EQUALS:
                    return sql`${textColumn} COLLATE NOCASE = ${condition.value}`;
                case RuleConditionOperatorEnum.NOT_EQUALS:
                    return sql`${textColumn} COLLATE NOCASE != ${condition.value}`;
                case RuleConditionOperatorEnum.GREATER_THAN:
                    return sql`${column} > ${Number(condition.value)}`;
                case RuleConditionOperatorEnum.LESS_THAN:
                    return sql`${column} < ${Number(condition.value)}`;
                case RuleConditionOperatorEnum.BETWEEN: {
                    if (!isNotEmptyString(condition.secondaryValue)) {
                        return null;
                    }

                    const gteClause = sql`${column} >= ${Number(condition.value)}`;
                    const lteClause = sql`${column} <= ${Number(condition.secondaryValue)}`;

                    return and(gteClause, lteClause) ?? null;
                }
                case RuleConditionOperatorEnum.IN: {
                    const inValues = condition.value.split(',').map(item => item.trim());
                    const placeholders = inValues.map(item => sql`${item}`);

                    return sql`${textColumn} COLLATE NOCASE IN (${sql.join(placeholders, sql`, `)})`;
                }
                case RuleConditionOperatorEnum.MATCHES_REGEX:
                    return buildRegexSql(textColumn, condition.value);
                default:
                    return null;
            }
        };

        const buildRuleConditionSql = (condition: RuleConditionInputInterface): SQL | null => {
            const column = getColumnForField(condition.field);

            if (!isDefined(column)) {
                return null;
            }

            return buildOperatorSql(column, condition);
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

                return yield* filterWithFallbackConditions(candidateIds, { conditions: fallbackConditions, conditionMatchType });
            }

            return yield* scanMatchingIds({ conditions, conditionMatchType });
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

        return {
            countMatchingTransactions,
            collectMatchingTransactionIds,
            evaluateRule: (rule: RuleWithRelationsEntityInterface, input: RuleEvaluationInputInterface) => matchesRule(rule, input)
        };
    })
}) {
    static readonly layer = Layer.effect(RuleMatcherService, RuleMatcherService.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionRuleRepository.layer])
    );
}
