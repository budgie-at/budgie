import {
    AccountTypeEnum,
    CategoryEntityTable,
    MccCategoryEntityTable,
    PERSONAL_SYNC_ZONE,
    PRECISION,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { RuleMatcherService, RuleService, isValidRulePattern, resolveRuleMccCode } from '@budgie/rules';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, testSeedService } from './context';

import type { RuleEvaluationInputInterface } from '@budgie/rules';

const transactionInput: RuleEvaluationInputInterface = {
    type: TransactionTypeEnum.EXPENSE,
    title: 'SPAR MARKET',
    comment: '',
    externalId: null,
    operatedAt: new Date('2026-06-02T12:00:00.000Z'),
    toAccountId: null,
    fromAccountId: 1,
    exchangeRate: 1,
    externalSource: null,
    updatedBy: null,
    amount: 25,
    tagIds: [],
    entries: []
};

const buildRule = (
    conditionMatchType: RuleConditionMatchTypeEnum,
    conditions: Array<[RuleConditionFieldEnum, RuleConditionOperatorEnum, string, string | null]>
) => ({
    id: 1,
    enabled: true,
    conditionMatchType,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    syncId: null,
    syncZone: PERSONAL_SYNC_ZONE,
    conditions: conditions.map(([field, operator, value, secondaryValue], index) => ({
        id: index + 1,
        ruleId: 1,
        field,
        operator,
        value,
        secondaryValue,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        syncId: null,
        syncZone: PERSONAL_SYNC_ZONE
    })),
    actions: []
});

const sparTitleRule = buildRule(RuleConditionMatchTypeEnum.ALL, [
    [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'spar', null]
]);

const mixedConditions: Array<[RuleConditionFieldEnum, RuleConditionOperatorEnum, string, string | null]> = [
    [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'LIDL', null],
    [RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.BETWEEN, '10', '30']
];

const buildDbConditions = (conditions: Array<[RuleConditionFieldEnum, RuleConditionOperatorEnum, string, string | null]>) =>
    conditions.map(([field, operator, value, secondaryValue]) => ({ field, operator, value, secondaryValue }));

layer(TestLayer)('RuleMatcherService.evaluateRule', it => {
    it.effect('matches a title contains condition case-insensitively', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;

            expect(ruleMatcherService.evaluateRule(sparTitleRule, transactionInput)).toBe(true);
            expect(ruleMatcherService.evaluateRule(sparTitleRule, { ...transactionInput, title: 'LIDL' })).toBe(false);
        })
    );

    it.effect('requires every condition for ALL and any condition for ANY, including amount ranges', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const allRule = buildRule(RuleConditionMatchTypeEnum.ALL, mixedConditions);
            const anyRule = buildRule(RuleConditionMatchTypeEnum.ANY, mixedConditions);

            expect(ruleMatcherService.evaluateRule(allRule, transactionInput)).toBe(false);
            expect(ruleMatcherService.evaluateRule(anyRule, transactionInput)).toBe(true);
            expect(ruleMatcherService.evaluateRule(anyRule, { ...transactionInput, amount: 31, title: 'X' })).toBe(false);
        })
    );

    it.effect('never matches adjustment transactions', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;

            expect(ruleMatcherService.evaluateRule(sparTitleRule, { ...transactionInput, type: TransactionTypeEnum.ADJUSTMENT })).toBe(
                false
            );
        })
    );

    it.effect('compares numeric amounts numerically for EQUALS and rejects invalid/empty numeric bounds and empty IN tokens', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const decimalEqualsRule = buildRule(RuleConditionMatchTypeEnum.ALL, [
                [RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.EQUALS, '25.00', null]
            ]);
            const emptyGtRule = buildRule(RuleConditionMatchTypeEnum.ALL, [
                [RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.GREATER_THAN, '', null]
            ]);
            const nanGtRule = buildRule(RuleConditionMatchTypeEnum.ALL, [
                [RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.GREATER_THAN, 'abc', null]
            ]);
            const trailingCommaInRule = buildRule(RuleConditionMatchTypeEnum.ALL, [
                [RuleConditionFieldEnum.COMMENT, RuleConditionOperatorEnum.IN, 'note, ', null]
            ]);

            expect(ruleMatcherService.evaluateRule(decimalEqualsRule, transactionInput)).toBe(true);
            expect(ruleMatcherService.evaluateRule(emptyGtRule, transactionInput)).toBe(false);
            expect(ruleMatcherService.evaluateRule(nanGtRule, transactionInput)).toBe(false);
            expect(ruleMatcherService.evaluateRule(trailingCommaInRule, transactionInput)).toBe(false);
        })
    );

    it.effect('validates safe regex patterns consistently with evaluation limits', () =>
        Effect.sync(() => {
            expect(isValidRulePattern('^spar.*market$')).toBe(true);
            expect(isValidRulePattern('[unclosed')).toBe(false);
            expect(isValidRulePattern('(a+)+')).toBe(false);
            expect(isValidRulePattern('a'.repeat(201))).toBe(false);
        })
    );
});

layer(TestLayer)('RuleMatcherService SQL and fallback parity', it => {
    it.effect('evaluates AMOUNT conditions in SQL across EXPENSE, INCOME, TRANSFER, and expenses with FEE legs', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const source = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const target = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const expense = yield* testSeedService.manualExpense({
                accountId: source.id,
                amount: 25 * PRECISION,
                operatedAt: new Date('2026-06-02T12:00:00.000Z'),
                title: 'Amount expense'
            });
            yield* testSeedService.feeEntry(expense.id, null, { accountId: source.id, amount: 5 * PRECISION });
            const income = yield* testSeedService.bankPairIncome(
                { externalId: 'amount-income', operatedAt: new Date('2026-06-02T13:00:00.000Z') },
                { accountId: target.id, amount: 40 * PRECISION }
            );

            const equalsDecimalCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.EQUALS, '25.00', null]])
            });
            const betweenCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.BETWEEN, '20', '45']])
            });
            const greaterThan30Count = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.GREATER_THAN, '30', null]])
            });
            const invalidTextNumericCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.GREATER_THAN, '5', null]])
            });

            expect(income.id).toBeGreaterThan(0);
            expect(equalsDecimalCount).toBe(1);
            expect(betweenCount).toBe(2);
            expect(greaterThan30Count).toBe(1);
            expect(invalidTextNumericCount).toBe(0);
        })
    );

    it.effect('matches Unicode Cyrillic and diacritics case-insensitively and excludes consolidation children in fallback scans', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const parent = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 15 * PRECISION,
                operatedAt: new Date('2026-06-02T12:00:00.000Z'),
                title: 'СІЛЬПО КИЇВ'
            });
            const child = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 15 * PRECISION,
                operatedAt: new Date('2026-06-02T12:05:00.000Z'),
                title: 'СІЛЬПО КИЇВ'
            });
            yield* testDb
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: parent.id })
                .where(eq(TransactionEntityTable.id, child.id));
            yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 8 * PRECISION,
                operatedAt: new Date('2026-06-02T12:10:00.000Z'),
                title: 'BÄCKEREI MÜLLER'
            });

            const cyrillicCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'сільпо', null]])
            });
            const diacriticCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'bäckerei', null]])
            });
            const mixedAnyCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ANY,
                conditions: buildDbConditions([
                    [RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.EQUALS, '15', null],
                    [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'müller', null]
                ])
            });

            expect(cyrillicCount).toBe(1);
            expect(diacriticCount).toBe(1);
            expect(mixedAnyCount).toBe(2);
        })
    );

    it.effect('falls back TITLE to comment in SQL and matches MCC on primary entry even when a FEE entry precedes it', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const [mccCategory] = yield* testDb.select().from(MccCategoryEntityTable).limit(1);
            const commentOnly = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 12 * PRECISION,
                operatedAt: new Date('2026-06-02T12:00:00.000Z'),
                title: ''
            });
            yield* testDb
                .update(TransactionEntityTable)
                .set({ comment: 'Monthly gym membership' })
                .where(eq(TransactionEntityTable.id, commentOnly.id));
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ mccCategoryId: mccCategory.id, sequence: 1 })
                .where(eq(TransactionEntryEntityTable.transactionId, commentOnly.id));
            yield* testDb.insert(TransactionEntryEntityTable).values({
                transactionId: commentOnly.id,
                accountId: account.id,
                type: TransactionEntryTypeEnum.FEE,
                amount: PRECISION,
                sequence: 0,
                categoryId: null,
                mccCategoryId: null
            });

            const titleFromCommentCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'gym', null]])
            });
            const mccCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.MCC_CODE, RuleConditionOperatorEnum.EQUALS, mccCategory.mcc, null]])
            });

            expect(titleFromCommentCount).toBe(1);
            expect(mccCount).toBe(1);
        })
    );

    it.effect('keeps regex matching consistent across newlines and rejects oversized patterns in SQL', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const ruleService = yield* RuleService;
            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const singleLine = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 10 * PRECISION,
                operatedAt: new Date('2026-06-02T12:00:00.000Z'),
                title: 'UBER TRIP VIENNA'
            });
            const multiLine = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 10 * PRECISION,
                operatedAt: new Date('2026-06-02T12:05:00.000Z'),
                title: 'UBER\nTRIP VIENNA'
            });

            const regexCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.MATCHES_REGEX, 'uber.*trip', null]])
            });
            const oversizedCount = yield* ruleMatcherService.countMatchingTransactions({
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([
                    [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.MATCHES_REGEX, 'a'.repeat(201), null]
                ])
            });
            const created = yield* ruleService.create({
                enabled: true,
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.MATCHES_REGEX, '.*uber.*', null]]),
                actions: [{ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id, tagId: null, accountId: null }]
            });

            expect(singleLine.id).toBeGreaterThan(0);
            expect(multiLine.id).toBeGreaterThan(0);
            expect(created.id).toBeGreaterThan(0);
            expect(regexCount).toBe(1);
            expect(oversizedCount).toBe(0);
        })
    );

    it.effect(
        'keeps SQL and JS parity for non-ASCII titles against ASCII rules, MCC tie-breaks, empty titles, and tombstoned entries',
        () =>
            Effect.gen(function* () {
                const ruleMatcherService = yield* RuleMatcherService;
                const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
                const kelvinExpense = yield* testSeedService.manualExpense({
                    accountId: account.id,
                    amount: 10 * PRECISION,
                    operatedAt: new Date('2026-06-02T12:00:00.000Z'),
                    title: '\u212Aiosk'
                });
                const nulExpense = yield* testSeedService.manualExpense({
                    accountId: account.id,
                    amount: 10 * PRECISION,
                    operatedAt: new Date('2026-06-02T12:01:00.000Z'),
                    title: 'Shop\u0000Coffee'
                });
                const [storedNul] = yield* testDb
                    .select({ title: TransactionEntityTable.title })
                    .from(TransactionEntityTable)
                    .where(eq(TransactionEntityTable.id, nulExpense.id));
                const driverPreservesNul = storedNul.title.includes('\u0000');
                const tombstonedExpense = yield* testSeedService.manualExpense({
                    accountId: account.id,
                    amount: 10 * PRECISION,
                    operatedAt: new Date('2026-06-02T12:05:00.000Z'),
                    title: 'ORPHAN'
                });
                yield* testDb
                    .update(TransactionEntryEntityTable)
                    .set({ deletedAt: new Date('2026-06-02T12:06:00.000Z') })
                    .where(eq(TransactionEntryEntityTable.transactionId, tombstonedExpense.id));

                const equalsCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.EQUALS, 'kiosk', null]])
                });
                const notEqualsCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.NOT_EQUALS, 'kiosk', null]])
                });
                const regexCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.MATCHES_REGEX, 'k.*k', null]])
                });
                const nulContainsCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'coffee', null]])
                });
                const nulNotContainsCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([[RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.NOT_CONTAINS, 'coffee', null]])
                });
                const nulValueContainsCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([
                        [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'shop\u0000coffee', null]
                    ])
                });
                const nulValueMismatchCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([
                        [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'shop\u0000other', null]
                    ])
                });
                const zeroAmountCount = yield* ruleMatcherService.countMatchingTransactions({
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: buildDbConditions([[RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.EQUALS, '0', null]])
                });
                const commentFallbackMatch = ruleMatcherService.evaluateRule(
                    buildRule(RuleConditionMatchTypeEnum.ALL, [
                        [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'gym', null]
                    ]),
                    { ...transactionInput, title: '', comment: 'Monthly gym' }
                );
                const orderedMcc = resolveRuleMccCode([
                    { type: TransactionEntryTypeEnum.CREDIT, mccCode: '5812', sequence: 0, id: 20 },
                    { type: TransactionEntryTypeEnum.CREDIT, mccCode: '5411', sequence: 0, id: 10 }
                ]);

                expect(kelvinExpense.id).toBeGreaterThan(0);
                expect(nulExpense.id).toBeGreaterThan(0);
                expect(equalsCount).toBe(1);
                expect(notEqualsCount).toBe(1);
                expect(regexCount).toBe(1);
                expect(nulContainsCount).toBe(driverPreservesNul ? 1 : 0);
                expect(nulNotContainsCount).toBe(driverPreservesNul ? 1 : 2);
                expect(nulValueContainsCount).toBe(driverPreservesNul ? 1 : 0);
                expect(nulValueMismatchCount).toBe(0);
                expect(zeroAmountCount).toBe(0);
                expect(commentFallbackMatch).toBe(true);
                expect(orderedMcc).toBe('5411');
            })
    );
});
