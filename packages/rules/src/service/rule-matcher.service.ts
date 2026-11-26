import {
    transactionFilters,
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
import { SQL, and, eq, or, sql } from 'drizzle-orm';
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
import { parseRuleNumber } from '../utils/parse-rule-number.util';
import { prepareLightweightRuleSnapshot } from '../utils/prepare-lightweight-rule-snapshot.util';
import { prepareRuleEvaluationSnapshot } from '../utils/prepare-rule-evaluation-snapshot.util';

import type { LightweightRuleTransactionInterface } from '../interface/lightweight-rule-transaction.interface';
import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleEvaluationSnapshotInterface } from '../interface/rule-evaluation-snapshot.interface';
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
        const LEDGER_ENTRY_MATCH_SQL = and(
            eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
            transactionFilters.buildLedgerEntryCondition()
        );
        const MCC_CODE_SQL = sql`(SELECT ${MccCategoryEntityTable.mcc} FROM ${TransactionEntryEntityTable} INNER JOIN ${MccCategoryEntityTable} ON ${MccCategoryEntityTable.id} = ${TransactionEntryEntityTable.mccCategoryId} WHERE ${LEDGER_ENTRY_MATCH_SQL} ORDER BY CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN 1 ELSE 0 END, ${TransactionEntryEntityTable.sequence} ASC, ${TransactionEntryEntityTable.id} ASC LIMIT 1)`;
        const AMOUNT_MICRO_SQL = sql`COALESCE((SELECT SUM(${TransactionEntryEntityTable.amount}) FROM ${TransactionEntryEntityTable} WHERE ${LEDGER_ENTRY_MATCH_SQL} AND ${TransactionEntryEntityTable.type} = CASE ${TransactionEntityTable.type} WHEN ${TransactionTypeEnum.EXPENSE} THEN ${TransactionEntryTypeEnum.CREDIT} WHEN ${TransactionTypeEnum.TRANSFER} THEN ${TransactionEntryTypeEnum.CREDIT} WHEN ${TransactionTypeEnum.INCOME} THEN ${TransactionEntryTypeEnum.DEBIT} ELSE NULL END), 0)`;

        const isFreeTextField = (field: RuleConditionFieldEnum): boolean =>
            field === RuleConditionFieldEnum.TITLE || field === RuleConditionFieldEnum.COMMENT || field === RuleConditionFieldEnum.MCC_CODE;

        const isAsciiOrNullSql = (column: Column | SQL): SQL =>
            sql`(${column} IS NULL OR LENGTH(CAST(${column} AS BLOB)) = LENGTH(CAST(${column} AS TEXT)))`;

        const isNonAsciiSql = (column: Column | SQL): SQL =>
            sql`(${column} IS NOT NULL AND LENGTH(CAST(${column} AS BLOB)) != LENGTH(CAST(${column} AS TEXT)))`;

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

        const toTransactionSnapshot = (
            transaction: TransactionWithEntriesMccCategoryEntityInterface
        ): RuleEvaluationSnapshotInterface | null =>
            isNotEmptyArray(transaction.entries) ? prepareRuleEvaluationSnapshot(convertTransactionForRuleEvaluation(transaction)) : null;

        const filterMatchingIdsBySnapshot = <T extends { readonly id: number }>(
            items: readonly T[],
            toSnapshot: (item: T) => RuleEvaluationSnapshotInterface | null,
            matchesPredicate: SnapshotPredicateType,
            excludedIds?: ReadonlySet<number>
        ): number[] => {
            const matchedIds: number[] = [];

            for (const item of items) {
                if (!isDefined(excludedIds) || !excludedIds.has(item.id)) {
                    const snapshot = toSnapshot(item);

                    if (isDefined(snapshot) && matchesPredicate(snapshot)) {
                        matchedIds.push(item.id);
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
                    ? Effect.map(transactionRepository.findVisibleByIdsWithEntries(batchIds), transactions =>
                          filterMatchingIdsBySnapshot(transactions, toTransactionSnapshot, matchesPredicate)
                      )
                    : Effect.map(transactionRuleRepository.findLightweightByIds(batchIds), rows =>
                          filterMatchingIdsBySnapshot(rows, prepareLightweightRuleSnapshot, matchesPredicate)
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

                    matchingIds.push(...filterMatchingIdsBySnapshot(transactions, toTransactionSnapshot, matchesPredicate, excludedIds));
                    hasMore = transactions.length >= RULE_SET_BATCH_SIZE;
                    cursorId = transactions.at(-1)?.id ?? null;
                } else {
                    const rows: LightweightRuleTransactionInterface[] =
                        yield* transactionRuleRepository.findLightweightForRuleMatchingAfter(cursorId, RULE_SET_BATCH_SIZE);

                    if (!isNotEmptyArray(rows)) {
                        break;
                    }

                    matchingIds.push(...filterMatchingIdsBySnapshot(rows, prepareLightweightRuleSnapshot, matchesPredicate, excludedIds));
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

        const buildRegexSqlPlan = (column: Column | SQL, field: RuleConditionFieldEnum, value: string) => {
            if (!isValidRulePattern(value)) {
                return { exactSql: NEVER_MATCH_SQL, prefilterSql: null, needsAsciiGuard: false };
            }

            if (hasNonAscii(value)) {
                return { exactSql: null, prefilterSql: null, needsAsciiGuard: false };
            }

            const needsAsciiGuard = isFreeTextField(field);

            if (!UNSUPPORTED_SQL_REGEX_TOKEN_PATTERN.test(value)) {
                return {
                    exactSql: sql`CAST(${column} AS TEXT) LIKE ${`%${escapeSqlLikeValue(value)}%`} ESCAPE '\\'`,
                    prefilterSql: null,
                    needsAsciiGuard
                };
            }

            const tokens = getFlexibleRegexTokens(value);

            if (!isDefined(tokens)) {
                return { exactSql: null, prefilterSql: null, needsAsciiGuard: false };
            }

            const pattern = `%${tokens.map(token => escapeSqlLikeValue(token)).join('%')}%`;

            return {
                exactSql: null,
                prefilterSql: sql`CAST(${column} AS TEXT) LIKE ${pattern} ESCAPE '\\'`,
                needsAsciiGuard
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
                return { exactSql: null, prefilterSql: null, needsAsciiGuard: false };
            }

            const needsAsciiGuard = isFreeTextField(condition.field);

            switch (condition.operator) {
                case RuleConditionOperatorEnum.CONTAINS:
                    if (condition.field === RuleConditionFieldEnum.AMOUNT || hasNonAscii(condition.value)) {
                        return { exactSql: null, prefilterSql: null, needsAsciiGuard: false };
                    }

                    return {
                        exactSql: sql`CAST(${column} AS TEXT) LIKE ${`%${escapeSqlLikeValue(condition.value)}%`} ESCAPE '\\'`,
                        prefilterSql: null,
                        needsAsciiGuard
                    };
                case RuleConditionOperatorEnum.NOT_CONTAINS:
                    if (condition.field === RuleConditionFieldEnum.AMOUNT || hasNonAscii(condition.value)) {
                        return { exactSql: null, prefilterSql: null, needsAsciiGuard: false };
                    }

                    return {
                        exactSql: sql`CAST(${column} AS TEXT) NOT LIKE ${`%${escapeSqlLikeValue(condition.value)}%`} ESCAPE '\\'`,
                        prefilterSql: null,
                        needsAsciiGuard
                    };
                case RuleConditionOperatorEnum.EQUALS: {
                    const exactSql = buildEqualityOperatorSql(column, condition.field, condition.value, true);

                    return { exactSql, prefilterSql: null, needsAsciiGuard: needsAsciiGuard && isDefined(exactSql) };
                }
                case RuleConditionOperatorEnum.NOT_EQUALS: {
                    const exactSql = buildEqualityOperatorSql(column, condition.field, condition.value, false);

                    return { exactSql, prefilterSql: null, needsAsciiGuard: needsAsciiGuard && isDefined(exactSql) };
                }
                case RuleConditionOperatorEnum.GREATER_THAN:
                case RuleConditionOperatorEnum.LESS_THAN:
                case RuleConditionOperatorEnum.BETWEEN:
                    return {
                        exactSql: buildNumericOperatorSql(column, condition),
                        prefilterSql: null,
                        needsAsciiGuard: false
                    };
                case RuleConditionOperatorEnum.IN: {
                    const exactSql = buildInOperatorSql(column, condition.field, condition.value);

                    return { exactSql, prefilterSql: null, needsAsciiGuard: needsAsciiGuard && isDefined(exactSql) };
                }
                case RuleConditionOperatorEnum.MATCHES_REGEX:
                    if (condition.field === RuleConditionFieldEnum.AMOUNT) {
                        return { exactSql: null, prefilterSql: null, needsAsciiGuard: false };
                    }

                    return buildRegexSqlPlan(column, condition.field, condition.value);
                default:
                    return { exactSql: null, prefilterSql: null, needsAsciiGuard: false };
            }
        };

        const buildRuleConditionsWhere = (conditions: RuleConditionInputInterface[], conditionMatchType: RuleConditionMatchTypeEnum) => {
            const isAll = conditionMatchType === RuleConditionMatchTypeEnum.ALL;
            const sqlConditions: SQL[] = [];
            const nonTextExactSqlConditions: SQL[] = [];
            const fallbackConditions: RuleConditionInputInterface[] = [];
            const asciiGuardedColumns = new Map<RuleConditionFieldEnum, Column | SQL>();

            for (const condition of conditions) {
                const { exactSql, prefilterSql, needsAsciiGuard } = buildRuleConditionSqlPlan(condition);

                if (isDefined(exactSql)) {
                    sqlConditions.push(exactSql);
                    if (!needsAsciiGuard) {
                        nonTextExactSqlConditions.push(exactSql);
                    }
                } else {
                    if (isAll && isDefined(prefilterSql)) {
                        sqlConditions.push(prefilterSql);
                    }
                    fallbackConditions.push(condition);
                }

                if (needsAsciiGuard && (isDefined(exactSql) || (isAll && isDefined(prefilterSql)))) {
                    const column = getColumnForField(condition.field);

                    if (isDefined(column)) {
                        asciiGuardedColumns.set(condition.field, column);
                    }
                }
            }

            const combiner = isAll ? and : or;
            const sqlWhere = isNotEmptyArray(sqlConditions) ? (combiner(...sqlConditions) ?? null) : null;
            const guardedColumns = [...asciiGuardedColumns.values()];
            const allAsciiWhere = isNotEmptyArray(guardedColumns) ? (and(...guardedColumns.map(isAsciiOrNullSql)) ?? null) : null;
            const anyNonAsciiWhere = isNotEmptyArray(guardedColumns) ? (or(...guardedColumns.map(isNonAsciiSql)) ?? null) : null;
            let nonAsciiCandidateWhere: SQL | null = anyNonAsciiWhere;

            if (isDefined(anyNonAsciiWhere) && isAll && isNotEmptyArray(nonTextExactSqlConditions)) {
                nonAsciiCandidateWhere = and(anyNonAsciiWhere, ...nonTextExactSqlConditions) ?? anyNonAsciiWhere;
            }

            return { sqlWhere, fallbackConditions, allAsciiWhere, nonAsciiCandidateWhere };
        };

        const findNonAsciiMatches = Effect.fnUntraced(function* (
            nonAsciiCandidateWhere: SQL | null,
            rule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>
        ) {
            if (!isDefined(nonAsciiCandidateWhere)) {
                return { candidateIds: [] as number[], matchedIds: [] as number[] };
            }

            const candidateIds = yield* transactionRuleRepository.findIdsByRuleConditions(nonAsciiCandidateWhere);

            if (!isNotEmptyArray(candidateIds)) {
                return { candidateIds: [] as number[], matchedIds: [] as number[] };
            }

            const matchedIds = yield* filterWithFallbackConditions(candidateIds, rule);

            return { candidateIds, matchedIds };
        });

        const buildAsciiWhere = (sqlWhere: SQL | null, allAsciiWhere: SQL | null): SQL | null => {
            if (!isDefined(sqlWhere)) {
                return null;
            }

            return isDefined(allAsciiWhere) ? (and(allAsciiWhere, sqlWhere) ?? sqlWhere) : sqlWhere;
        };

        const findMatchingIdsFromPlan = Effect.fnUntraced(function* (
            rule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>,
            plan: ReturnType<typeof buildRuleConditionsWhere>
        ) {
            const { sqlWhere, fallbackConditions, allAsciiWhere, nonAsciiCandidateWhere } = plan;
            const asciiWhere = buildAsciiWhere(sqlWhere, allAsciiWhere);

            if (!isNotEmptyArray(fallbackConditions) && isDefined(asciiWhere)) {
                const asciiMatchedIds = yield* transactionRuleRepository.findIdsByRuleConditions(asciiWhere);
                const { matchedIds: nonAsciiMatchedIds } = yield* findNonAsciiMatches(nonAsciiCandidateWhere, rule);

                return [...asciiMatchedIds, ...nonAsciiMatchedIds];
            }

            if (isDefined(asciiWhere) && rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL) {
                const asciiCandidateIds = yield* transactionRuleRepository.findIdsByRuleConditions(asciiWhere);
                const asciiMatchedIds = isNotEmptyArray(asciiCandidateIds)
                    ? yield* filterWithFallbackConditions(asciiCandidateIds, {
                          conditions: fallbackConditions,
                          conditionMatchType: rule.conditionMatchType
                      })
                    : [];
                const { matchedIds: nonAsciiMatchedIds } = yield* findNonAsciiMatches(nonAsciiCandidateWhere, rule);

                return [...asciiMatchedIds, ...nonAsciiMatchedIds];
            }

            if (isDefined(asciiWhere) && rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY) {
                const asciiMatchedIds = yield* transactionRuleRepository.findIdsByRuleConditions(asciiWhere);
                const { candidateIds: nonAsciiCandidateIds, matchedIds: nonAsciiMatchedIds } = yield* findNonAsciiMatches(
                    nonAsciiCandidateWhere,
                    rule
                );
                const fallbackMatchedIds = yield* scanMatchingIds(
                    { conditions: fallbackConditions, conditionMatchType: rule.conditionMatchType },
                    new Set([...asciiMatchedIds, ...nonAsciiCandidateIds])
                );

                return [...asciiMatchedIds, ...nonAsciiMatchedIds, ...fallbackMatchedIds];
            }

            return yield* scanMatchingIds(rule);
        });

        const countMatchingTransactions = Effect.fn('RuleMatcherService.countMatchingTransactions')(function* (
            params: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>
        ) {
            const { conditions, conditionMatchType } = params;

            if (!isNotEmptyArray(conditions)) {
                return 0;
            }

            const plan = buildRuleConditionsWhere(conditions, conditionMatchType);
            const asciiWhere = buildAsciiWhere(plan.sqlWhere, plan.allAsciiWhere);

            if (!isNotEmptyArray(plan.fallbackConditions) && isDefined(asciiWhere)) {
                const asciiCount = yield* transactionRuleRepository.countByRuleConditions(asciiWhere);
                const { matchedIds: nonAsciiMatchedIds } = yield* findNonAsciiMatches(plan.nonAsciiCandidateWhere, params);

                return asciiCount + nonAsciiMatchedIds.length;
            }

            const matchingIds = yield* findMatchingIdsFromPlan(params, plan);

            return matchingIds.length;
        });

        const collectMatchingTransactionIds = Effect.fn('RuleMatcherService.collectMatchingTransactionIds')(function* (
            rule: RuleWithRelationsEntityInterface
        ) {
            if (!isNotEmptyArray(rule.conditions)) {
                return [];
            }

            const plan = buildRuleConditionsWhere(rule.conditions, rule.conditionMatchType);

            return yield* findMatchingIdsFromPlan(rule, plan);
        });

        return {
            countMatchingTransactions,
            collectMatchingTransactionIds,
            evaluateRule: (rule: RuleWithRelationsEntityInterface, input: RuleEvaluationInputInterface) =>
                compileRule(rule)(prepareRuleEvaluationSnapshot(input))
        };
    })
}) {
    static readonly layer = Layer.effect(RuleMatcherService, RuleMatcherService.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionRuleRepository.layer])
    );
}
