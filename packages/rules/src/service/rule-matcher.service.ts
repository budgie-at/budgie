import {
    MccCategoryEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    YIELD_TO_UI,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { SQL, and, or, sql } from 'drizzle-orm';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';
import { TransactionRuleRepository } from '../repository/transaction-rule.repository';
import { compileRule } from '../utils/compile-rule.util';
import { convertTransactionForRuleEvaluation } from '../utils/convert-transaction-for-rule-evaluation.util';
import { doConditionsRequireEntries } from '../utils/do-conditions-require-entries.util';
import { isValidRulePattern } from '../utils/is-valid-rule-pattern.util';
import { matchesRule } from '../utils/matches-rule.util';
import { parseRuleNumber } from '../utils/parse-rule-number.util';
import { prepareLightweightRuleSnapshot } from '../utils/prepare-lightweight-rule-snapshot.util';
import { prepareRuleEvaluationSnapshot } from '../utils/prepare-rule-evaluation-snapshot.util';

import type { LightweightRuleTransactionInterface } from '../interface/lightweight-rule-transaction.interface';
import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { SnapshotPredicateType } from '../type/snapshot-predicate.type';
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
        const MAX_ASCII_CHAR_CODE = 127;
        const NEVER_MATCH_SQL = sql`1 = 0`;
        const ALWAYS_MATCH_SQL = sql`1 = 1`;

        const EFFECTIVE_TITLE_SQL = sql`CASE WHEN ${TransactionEntityTable.title} != '' THEN ${TransactionEntityTable.title} ELSE ${TransactionEntityTable.comment} END`;
        const ACCOUNT_ID_SQL = sql`COALESCE(${TransactionEntityTable.fromAccountId}, ${TransactionEntityTable.toAccountId})`;
        const MCC_CODE_SQL = sql`(SELECT ${MccCategoryEntityTable.mcc} FROM ${TransactionEntryEntityTable} INNER JOIN ${MccCategoryEntityTable} ON ${MccCategoryEntityTable.id} = ${TransactionEntryEntityTable.mccCategoryId} WHERE ${TransactionEntryEntityTable.transactionId} = ${TransactionEntityTable.id} AND ${TransactionEntryEntityTable.originalTransactionId} IS NULL AND ${TransactionEntryEntityTable.deletedAt} IS NULL ORDER BY CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN 1 ELSE 0 END, ${TransactionEntryEntityTable.sequence} ASC, ${TransactionEntryEntityTable.id} ASC LIMIT 1)`;
        const AMOUNT_MICRO_SQL = sql`CASE ${TransactionEntityTable.type} WHEN ${TransactionTypeEnum.EXPENSE} THEN COALESCE((SELECT SUM(${TransactionEntryEntityTable.amount}) FROM ${TransactionEntryEntityTable} WHERE ${TransactionEntryEntityTable.transactionId} = ${TransactionEntityTable.id} AND ${TransactionEntryEntityTable.originalTransactionId} IS NULL AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}), 0) WHEN ${TransactionTypeEnum.TRANSFER} THEN COALESCE((SELECT SUM(${TransactionEntryEntityTable.amount}) FROM ${TransactionEntryEntityTable} WHERE ${TransactionEntryEntityTable.transactionId} = ${TransactionEntityTable.id} AND ${TransactionEntryEntityTable.originalTransactionId} IS NULL AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}), 0) WHEN ${TransactionTypeEnum.INCOME} THEN COALESCE((SELECT SUM(${TransactionEntryEntityTable.amount}) FROM ${TransactionEntryEntityTable} WHERE ${TransactionEntryEntityTable.transactionId} = ${TransactionEntityTable.id} AND ${TransactionEntryEntityTable.originalTransactionId} IS NULL AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}), 0) ELSE 0 END`;

        const hasNonAscii = (value: string): boolean => {
            for (let index = 0; index < value.length; index += 1) {
                if (value.charCodeAt(index) > MAX_ASCII_CHAR_CODE) {
                    return true;
                }
            }

            return false;
        };

        const toExactMicroUnits = (value: number): number | null => {
            const microUnits = convertToMicroUnits(value);

            return convertFromMicroUnits(microUnits) === value ? microUnits : null;
        };

        const filterLightweightMatchingIds = (
            rows: readonly LightweightRuleTransactionInterface[],
            matchesPredicate: SnapshotPredicateType,
            excludedIds?: ReadonlySet<number>
        ): number[] => {
            const matchedIds: number[] = [];

            for (const row of rows) {
                if ((!isDefined(excludedIds) || !excludedIds.has(row.id)) && matchesPredicate(prepareLightweightRuleSnapshot(row))) {
                    matchedIds.push(row.id);
                }
            }

            return matchedIds;
        };

        const filterMatchingIdsWithPredicate = (
            transactions: TransactionWithEntriesMccCategoryEntityInterface[],
            matchesPredicate: SnapshotPredicateType,
            excludedIds?: ReadonlySet<number>
        ): number[] => {
            const matchedIds: number[] = [];

            for (const transaction of transactions) {
                if (!isDefined(excludedIds) || !excludedIds.has(transaction.id)) {
                    const snapshot = prepareRuleEvaluationSnapshot(convertTransactionForRuleEvaluation(transaction));

                    if (matchesPredicate(snapshot)) {
                        matchedIds.push(transaction.id);
                    }
                }
            }

            return matchedIds;
        };

        const filterWithFallbackConditions = Effect.fnUntraced(function* (
            candidateIds: number[],
            fallbackRule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>
        ) {
            const matchesPredicate = compileRule(fallbackRule);
            const needsEntries = doConditionsRequireEntries(fallbackRule.conditions);
            const matchingIdBatches = yield* Effect.forEach(Arr.chunksOf(candidateIds, RULE_SET_BATCH_SIZE), batchIds =>
                needsEntries
                    ? Effect.map(transactionRepository.findByIdsWithEntries(batchIds), transactions =>
                          filterMatchingIdsWithPredicate(transactions, matchesPredicate)
                      )
                    : Effect.map(transactionRuleRepository.findLightweightByIds(batchIds), rows =>
                          filterLightweightMatchingIds(rows, matchesPredicate)
                      )
            );

            return matchingIdBatches.flat();
        });

        const scanMatchingIds = Effect.fnUntraced(function* (
            rule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>,
            excludedIds?: ReadonlySet<number>
        ) {
            const matchesPredicate = compileRule(rule);
            const needsEntries = doConditionsRequireEntries(rule.conditions);
            const matchingIds: number[] = [];
            let cursorId: number | null = null;
            let hasMore = true;

            while (hasMore) {
                if (isDefined(cursorId)) {
                    yield* YIELD_TO_UI;
                }

                if (needsEntries) {
                    const transactions: TransactionWithEntriesMccCategoryEntityInterface[] =
                        yield* transactionRepository.findVisibleForRuleMatchingAfter(cursorId, RULE_SET_BATCH_SIZE);

                    if (!isNotEmptyArray(transactions)) {
                        break;
                    }

                    matchingIds.push(...filterMatchingIdsWithPredicate(transactions, matchesPredicate, excludedIds));
                    hasMore = transactions.length >= RULE_SET_BATCH_SIZE;
                    cursorId = transactions.at(-1)?.id ?? null;
                } else {
                    const rows: LightweightRuleTransactionInterface[] =
                        yield* transactionRuleRepository.findLightweightForRuleMatchingAfter(cursorId, RULE_SET_BATCH_SIZE);

                    if (!isNotEmptyArray(rows)) {
                        break;
                    }

                    matchingIds.push(...filterLightweightMatchingIds(rows, matchesPredicate, excludedIds));
                    hasMore = rows.length >= RULE_SET_BATCH_SIZE;
                    cursorId = rows.at(-1)?.id ?? null;
                }
            }

            return matchingIds;
        });

        const getColumnForField = (field: RuleConditionFieldEnum): Column | SQL | null => {
            switch (field) {
                case RuleConditionFieldEnum.TITLE:
                    return EFFECTIVE_TITLE_SQL;
                case RuleConditionFieldEnum.COMMENT:
                    return TransactionEntityTable.comment;
                case RuleConditionFieldEnum.TRANSACTION_TYPE:
                    return TransactionEntityTable.type;
                case RuleConditionFieldEnum.EXTERNAL_SOURCE:
                    return TransactionEntityTable.externalSource;
                case RuleConditionFieldEnum.ACCOUNT_ID:
                    return ACCOUNT_ID_SQL;
                case RuleConditionFieldEnum.MCC_CODE:
                    return MCC_CODE_SQL;
                case RuleConditionFieldEnum.AMOUNT:
                    return AMOUNT_MICRO_SQL;
                default:
                    return null;
            }
        };

        const escapeSqlLikeValue = (value: string): string => value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

        const getFlexibleRegexTokens = (value: string): string[] | null => {
            const tokens = value.split('.*').filter(isNotEmptyString);
            const hasOnlySqlSafeTokens = tokens.every(token => !UNSUPPORTED_SQL_REGEX_TOKEN_PATTERN.test(token));

            return isNotEmptyArray(tokens) && hasOnlySqlSafeTokens ? tokens : null;
        };

        const buildRegexSqlPlan = (column: Column | SQL, value: string) => {
            if (!isValidRulePattern(value)) {
                return { exactSql: NEVER_MATCH_SQL, prefilterSql: null };
            }

            if (hasNonAscii(value)) {
                return { exactSql: null, prefilterSql: null };
            }

            if (!UNSUPPORTED_SQL_REGEX_TOKEN_PATTERN.test(value)) {
                return {
                    exactSql: sql`CAST(${column} AS TEXT) LIKE ${`%${escapeSqlLikeValue(value)}%`} ESCAPE '\\'`,
                    prefilterSql: null
                };
            }

            const tokens = getFlexibleRegexTokens(value);

            if (!isDefined(tokens)) {
                return { exactSql: null, prefilterSql: null };
            }

            const pattern = `%${tokens.map(token => escapeSqlLikeValue(token)).join('%')}%`;

            return {
                exactSql: null,
                prefilterSql: sql`CAST(${column} AS TEXT) LIKE ${pattern} ESCAPE '\\'`
            };
        };

        const buildNumericComparisonValue = (field: RuleConditionFieldEnum, rawValue: string | null): number | null | 'fallback' => {
            const parsed = parseRuleNumber(rawValue);

            if (!isDefined(parsed)) {
                return null;
            }

            if (field === RuleConditionFieldEnum.AMOUNT) {
                const microUnits = toExactMicroUnits(parsed);

                return isDefined(microUnits) ? microUnits : 'fallback';
            }

            return parsed;
        };

        const buildNumericOperatorSql = (column: Column | SQL, condition: RuleConditionInputInterface): SQL | null => {
            const { field, operator, value, secondaryValue } = condition;

            if (field !== RuleConditionFieldEnum.AMOUNT && field !== RuleConditionFieldEnum.ACCOUNT_ID) {
                return NEVER_MATCH_SQL;
            }

            const primaryValue = buildNumericComparisonValue(field, value);

            if (primaryValue === 'fallback') {
                return null;
            }

            if (!isDefined(primaryValue)) {
                return NEVER_MATCH_SQL;
            }

            if (operator === RuleConditionOperatorEnum.GREATER_THAN) {
                return sql`${column} > ${primaryValue}`;
            }

            if (operator === RuleConditionOperatorEnum.LESS_THAN) {
                return sql`${column} < ${primaryValue}`;
            }

            const upperValue = buildNumericComparisonValue(field, secondaryValue);

            if (upperValue === 'fallback') {
                return null;
            }

            if (!isDefined(upperValue) || primaryValue > upperValue) {
                return NEVER_MATCH_SQL;
            }

            return and(sql`${column} >= ${primaryValue}`, sql`${column} <= ${upperValue}`) ?? null;
        };

        const buildEqualityOperatorSql = (
            column: Column | SQL,
            field: RuleConditionFieldEnum,
            value: string,
            isEquals: boolean
        ): SQL | null => {
            if (field === RuleConditionFieldEnum.AMOUNT || field === RuleConditionFieldEnum.ACCOUNT_ID) {
                const numericValue = buildNumericComparisonValue(field, value);

                if (numericValue === 'fallback') {
                    return null;
                }

                if (!isDefined(numericValue)) {
                    if (isEquals) {
                        return NEVER_MATCH_SQL;
                    }

                    return field === RuleConditionFieldEnum.AMOUNT ? ALWAYS_MATCH_SQL : sql`${column} IS NOT NULL`;
                }

                return isEquals ? sql`${column} = ${numericValue}` : sql`${column} != ${numericValue}`;
            }

            if (hasNonAscii(value)) {
                return null;
            }

            return isEquals
                ? sql`CAST(${column} AS TEXT) COLLATE NOCASE = ${value}`
                : sql`CAST(${column} AS TEXT) COLLATE NOCASE != ${value}`;
        };

        const buildInOperatorSql = (column: Column | SQL, field: RuleConditionFieldEnum, value: string): SQL | null => {
            const inValues = value
                .split(',')
                .map(item => item.trim())
                .filter(isNotEmptyString);

            if (!isNotEmptyArray(inValues)) {
                return NEVER_MATCH_SQL;
            }

            if (field === RuleConditionFieldEnum.AMOUNT || field === RuleConditionFieldEnum.ACCOUNT_ID) {
                const numericValues: number[] = [];

                for (const item of inValues) {
                    const converted = buildNumericComparisonValue(field, item);

                    if (converted === 'fallback') {
                        return null;
                    }

                    if (isDefined(converted)) {
                        numericValues.push(converted);
                    }
                }

                if (!isNotEmptyArray(numericValues)) {
                    return NEVER_MATCH_SQL;
                }

                return sql`${column} IN (${sql.join(
                    numericValues.map(item => sql`${item}`),
                    sql`, `
                )})`;
            }

            if (inValues.some(hasNonAscii)) {
                return null;
            }

            return sql`CAST(${column} AS TEXT) COLLATE NOCASE IN (${sql.join(
                inValues.map(item => sql`${item}`),
                sql`, `
            )})`;
        };

        const buildRuleConditionSqlPlan = (condition: RuleConditionInputInterface) => {
            const column = getColumnForField(condition.field);

            if (!isDefined(column)) {
                return { exactSql: null, prefilterSql: null };
            }

            switch (condition.operator) {
                case RuleConditionOperatorEnum.CONTAINS:
                    if (condition.field === RuleConditionFieldEnum.AMOUNT || hasNonAscii(condition.value)) {
                        return { exactSql: null, prefilterSql: null };
                    }

                    return {
                        exactSql: sql`CAST(${column} AS TEXT) LIKE ${`%${escapeSqlLikeValue(condition.value)}%`} ESCAPE '\\'`,
                        prefilterSql: null
                    };
                case RuleConditionOperatorEnum.NOT_CONTAINS:
                    if (condition.field === RuleConditionFieldEnum.AMOUNT || hasNonAscii(condition.value)) {
                        return { exactSql: null, prefilterSql: null };
                    }

                    return {
                        exactSql: sql`CAST(${column} AS TEXT) NOT LIKE ${`%${escapeSqlLikeValue(condition.value)}%`} ESCAPE '\\'`,
                        prefilterSql: null
                    };
                case RuleConditionOperatorEnum.EQUALS:
                    return { exactSql: buildEqualityOperatorSql(column, condition.field, condition.value, true), prefilterSql: null };
                case RuleConditionOperatorEnum.NOT_EQUALS:
                    return { exactSql: buildEqualityOperatorSql(column, condition.field, condition.value, false), prefilterSql: null };
                case RuleConditionOperatorEnum.GREATER_THAN:
                case RuleConditionOperatorEnum.LESS_THAN:
                case RuleConditionOperatorEnum.BETWEEN:
                    return {
                        exactSql: buildNumericOperatorSql(column, condition),
                        prefilterSql: null
                    };
                case RuleConditionOperatorEnum.IN:
                    return { exactSql: buildInOperatorSql(column, condition.field, condition.value), prefilterSql: null };
                case RuleConditionOperatorEnum.MATCHES_REGEX:
                    if (condition.field === RuleConditionFieldEnum.AMOUNT) {
                        return { exactSql: null, prefilterSql: null };
                    }

                    return buildRegexSqlPlan(column, condition.value);
                default:
                    return { exactSql: null, prefilterSql: null };
            }
        };

        const buildRuleConditionsWhere = (conditions: RuleConditionInputInterface[], conditionMatchType: RuleConditionMatchTypeEnum) => {
            const isAll = conditionMatchType === RuleConditionMatchTypeEnum.ALL;
            const sqlConditions: SQL[] = [];
            const fallbackConditions: RuleConditionInputInterface[] = [];

            for (const condition of conditions) {
                const { exactSql, prefilterSql } = buildRuleConditionSqlPlan(condition);

                if (isDefined(exactSql)) {
                    sqlConditions.push(exactSql);
                } else {
                    if (isAll && isDefined(prefilterSql)) {
                        sqlConditions.push(prefilterSql);
                    }
                    fallbackConditions.push(condition);
                }
            }

            const combiner = isAll ? and : or;
            const sqlWhere = isNotEmptyArray(sqlConditions) ? (combiner(...sqlConditions) ?? null) : null;

            return { sqlWhere, fallbackConditions };
        };

        const findMatchingIdsFromPlan = Effect.fnUntraced(function* (
            conditions: RuleConditionInputInterface[],
            conditionMatchType: RuleConditionMatchTypeEnum,
            sqlWhere: SQL | null,
            fallbackConditions: RuleConditionInputInterface[]
        ) {
            if (!isNotEmptyArray(fallbackConditions) && isDefined(sqlWhere)) {
                return yield* transactionRuleRepository.findIdsByRuleConditions(sqlWhere);
            }

            if (isDefined(sqlWhere) && conditionMatchType === RuleConditionMatchTypeEnum.ALL) {
                const candidateIds = yield* transactionRuleRepository.findIdsByRuleConditions(sqlWhere);

                if (!isNotEmptyArray(candidateIds)) {
                    return [];
                }

                return yield* filterWithFallbackConditions(candidateIds, { conditions: fallbackConditions, conditionMatchType });
            }

            if (isDefined(sqlWhere) && conditionMatchType === RuleConditionMatchTypeEnum.ANY) {
                const sqlMatchedIds = yield* transactionRuleRepository.findIdsByRuleConditions(sqlWhere);
                const fallbackMatchedIds = yield* scanMatchingIds(
                    { conditions: fallbackConditions, conditionMatchType },
                    new Set(sqlMatchedIds)
                );

                return [...sqlMatchedIds, ...fallbackMatchedIds];
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

            const matchingIds = yield* findMatchingIdsFromPlan(conditions, conditionMatchType, sqlWhere, fallbackConditions);

            return matchingIds.length;
        });

        const collectMatchingTransactionIds = Effect.fn('RuleMatcherService.collectMatchingTransactionIds')(function* (
            rule: RuleWithRelationsEntityInterface
        ) {
            if (!isNotEmptyArray(rule.conditions)) {
                return [];
            }

            const { sqlWhere, fallbackConditions } = buildRuleConditionsWhere(rule.conditions, rule.conditionMatchType);

            return yield* findMatchingIdsFromPlan(rule.conditions, rule.conditionMatchType, sqlWhere, fallbackConditions);
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
