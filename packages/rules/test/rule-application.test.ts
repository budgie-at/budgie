import {
    AccountTypeEnum,
    CategoryEntityTable,
    CategorySourceEnum,
    RuleActionTypeEnum,
    RuleConditionEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TagSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTagsEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { RuleEngineService, RuleRepository, RuleService } from '@budgie/rules';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { testDb, TestLayer, testSeedService } from './context';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const RULE_TITLE = 'SPAR';

const titleContains = {
    field: RuleConditionFieldEnum.TITLE,
    operator: RuleConditionOperatorEnum.CONTAINS,
    value: RULE_TITLE,
    secondaryValue: null
};

const createRules = Effect.gen(function* () {
    const ruleService = yield* RuleService;
    const [firstCategory, secondCategory] = yield* testDb.select().from(CategoryEntityTable);
    const tag = yield* testSeedService.tag('groceries');

    yield* ruleService.create({
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [titleContains],
        actions: [{ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: firstCategory.id, tagId: null, accountId: null }]
    });
    yield* ruleService.create({
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [titleContains],
        actions: [
            { type: RuleActionTypeEnum.SET_CATEGORY, categoryId: secondCategory.id, tagId: null, accountId: null },
            { type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null }
        ]
    });

    return { firstCategory, tag };
});

const buildInput = (accountId: number): TransactionCreateInputInterface => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'SPAR MARKET',
    comment: '',
    externalId: null,
    operatedAt: new Date('2026-06-02T12:00:00.000Z'),
    toAccountId: null,
    fromAccountId: accountId,
    exchangeRate: 1,
    externalSource: null,
    updatedBy: null,
    amount: 10,
    tagIds: [],
    entries: [{ accountId, categoryId: null, mccCategoryId: null, type: TransactionEntryTypeEnum.CREDIT, amount: 10_000_000 }]
});

const emptyAction = { categoryId: null, tagId: null, accountId: null };

const createActionRule = (action: Parameters<RuleService['Service']['create']>[0]['actions'][number]) =>
    Effect.flatMap(RuleService, ruleService =>
        ruleService.create({
            enabled: true,
            conditionMatchType: RuleConditionMatchTypeEnum.ALL,
            conditions: [titleContains],
            actions: [action]
        })
    );

const seedExpenseWithTarget = Effect.gen(function* () {
    const source = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
    const target = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
    const expense = yield* testSeedService.manualExpense({
        accountId: source.id,
        amount: 10_000_000,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        title: 'SPAR MARKET'
    });

    return { source, target, expense };
});

const readTransaction = (transactionId: number) =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.id, transactionId))
        .pipe(Effect.map(([transaction]) => transaction));

layer(TestLayer)('rules engine', it => {
    it.effect('applies the first SET_CATEGORY and every ADD_TAG to new transaction inputs with the RULE source', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { firstCategory, tag } = yield* createRules;
            const account = yield* testSeedService.account();

            const { transactionInputs, postCreateIndexes } = yield* ruleEngineService.prepareCreateInputsForRules([buildInput(account.id)]);
            const [prepared] = transactionInputs;

            expect(postCreateIndexes).toEqual([]);
            expect(prepared.tagIds).toEqual([]);
            expect(prepared.ruleTagIds).toEqual([tag.id]);
            expect(prepared.entries.map(entry => [entry.categoryId, entry.categorySource])).toEqual([
                [firstCategory.id, CategorySourceEnum.RULE]
            ]);
        })
    );

    it.effect('writes categorySource RULE and the tag when applying rules to stored transactions', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { firstCategory, tag } = yield* createRules;
            const account = yield* testSeedService.account();
            const expense = yield* testSeedService.bankPairExpense(
                { externalId: 'rule-application', operatedAt: new Date('2026-06-02T12:00:00.000Z') },
                { accountId: account.id, amount: 10_000_000 }
            );
            yield* testSeedService.updateTransaction(expense.id, { title: 'SPAR MARKET' });

            yield* ruleEngineService.applyRulesToTransactions([expense.id], [buildInput(account.id)]);

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, expense.id));
            const tags = yield* testDb
                .select()
                .from(TransactionTagsEntityTable)
                .where(eq(TransactionTagsEntityTable.transactionId, expense.id));

            expect(entries.map(entry => [entry.categoryId, entry.categorySource])).toEqual([[firstCategory.id, CategorySourceEnum.RULE]]);
            expect(tags.map(transactionTag => [transactionTag.tagId, transactionTag.source])).toEqual([[tag.id, TagSourceEnum.RULE]]);
        })
    );

    it.effect('adds a new rule tag when an earlier rule tag is already user-picked', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const ruleService = yield* RuleService;
            const tag = yield* testSeedService.tag('groceries');
            const userTag = yield* testSeedService.tag('household');
            yield* ruleService.create({
                enabled: true,
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: [titleContains],
                actions: [{ type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null }]
            });
            const account = yield* testSeedService.account();

            const { transactionInputs } = yield* ruleEngineService.prepareCreateInputsForRules([
                { ...buildInput(account.id), tagIds: [userTag.id], ruleTagIds: [userTag.id] }
            ]);

            expect(transactionInputs[0].ruleTagIds).toEqual([tag.id]);
        })
    );

    it.effect('stamps updatedBy RULE on a convert-only match', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { source, target, expense } = yield* seedExpenseWithTarget;
            yield* createActionRule({ ...emptyAction, type: RuleActionTypeEnum.CONVERT_TO_TRANSFER, accountId: target.id });

            yield* ruleEngineService.applyRulesToTransactions([expense.id], [buildInput(source.id)]);

            expect(yield* readTransaction(expense.id)).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                updatedBy: TransactionUpdatedByEnum.RULE
            });
        })
    );

    it.effect('stamps updatedBy RULE without moving updatedAt when the category is already set', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { source, expense } = yield* seedExpenseWithTarget;
            const [category] = yield* testDb.select().from(CategoryEntityTable);
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ categoryId: category.id, categorySource: CategorySourceEnum.RULE })
                .where(eq(TransactionEntryEntityTable.transactionId, expense.id));
            const updatedAt = new Date('2026-06-02T12:00:00.000Z');
            yield* testDb.update(TransactionEntityTable).set({ updatedAt }).where(eq(TransactionEntityTable.id, expense.id));
            yield* createActionRule({ ...emptyAction, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id });

            yield* ruleEngineService.applyRulesToTransactions([expense.id], [buildInput(source.id)]);

            expect(yield* readTransaction(expense.id)).toMatchObject({ updatedAt, updatedBy: TransactionUpdatedByEnum.RULE });
        })
    );

    it.effect('leaves the transfer uncategorised when a convert rule precedes a category rule', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { source, target, expense } = yield* seedExpenseWithTarget;
            const [category] = yield* testDb.select().from(CategoryEntityTable);
            yield* createActionRule({ ...emptyAction, type: RuleActionTypeEnum.CONVERT_TO_TRANSFER, accountId: target.id });
            yield* createActionRule({ ...emptyAction, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id });

            yield* ruleEngineService.applyRulesToTransactions([expense.id], [buildInput(source.id)]);

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, expense.id));

            expect((yield* readTransaction(expense.id)).type).toBe(TransactionTypeEnum.TRANSFER);
            expect(entries.map(entry => entry.categoryId)).toStrictEqual([null, null]);
        })
    );

    it.effect('never categorizes FEE entries or TRANSFER transactions in prepareCreateInputsForRules or stored application', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { source, target } = yield* seedExpenseWithTarget;
            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const rule = yield* createActionRule({ ...emptyAction, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id });

            const { transactionInputs } = yield* ruleEngineService.prepareCreateInputsForRules([
                {
                    ...buildInput(source.id),
                    entries: [
                        { accountId: source.id, categoryId: null, mccCategoryId: null, type: TransactionEntryTypeEnum.CREDIT, amount: 10 },
                        { accountId: source.id, categoryId: null, mccCategoryId: null, type: TransactionEntryTypeEnum.FEE, amount: 1 }
                    ]
                },
                {
                    ...buildInput(source.id),
                    type: TransactionTypeEnum.TRANSFER,
                    toAccountId: target.id,
                    entries: [
                        { accountId: source.id, categoryId: null, mccCategoryId: null, type: TransactionEntryTypeEnum.CREDIT, amount: 10 },
                        { accountId: target.id, categoryId: null, mccCategoryId: null, type: TransactionEntryTypeEnum.DEBIT, amount: 10 }
                    ]
                }
            ]);

            expect(transactionInputs[0].entries.map(entry => entry.categoryId)).toStrictEqual([category.id, null]);
            expect(transactionInputs[1].entries.map(entry => entry.categoryId)).toStrictEqual([null, null]);

            const transfer = yield* testSeedService.directTransfer({
                sourceAccountId: source.id,
                targetAccountId: target.id,
                sourceAmount: 10_000_000,
                targetAmount: 10_000_000,
                exchangeRate: 1,
                operatedAt: new Date('2026-06-02T12:00:00.000Z'),
                sourceEntryExchangeRate: 1,
                toIban: null
            });
            yield* testSeedService.updateTransaction(transfer.id, { title: 'SPAR TRANSFER' });
            yield* ruleEngineService.applyRuleToMatchingTransactions(rule.id);

            const transferEntries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, transfer.id));

            expect(transferEntries.map(entry => entry.categoryId)).toStrictEqual([null, null]);
        })
    );

    it.effect(
        'skips actionless rules, stamps updatedBy RULE on applyRuleToMatchingTransactions transfer conversion, and ignores soft-deleted conditions',
        () =>
            Effect.gen(function* () {
                const ruleEngineService = yield* RuleEngineService;
                const ruleService = yield* RuleService;
                const ruleRepository = yield* RuleRepository;
                const { source, target, expense } = yield* seedExpenseWithTarget;
                const emptyRule = yield* ruleService.create({
                    enabled: true,
                    conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                    conditions: [titleContains],
                    actions: []
                });

                yield* ruleEngineService.applyRulesToTransactions([expense.id], [buildInput(source.id)]);
                expect((yield* readTransaction(expense.id)).updatedBy).toBeNull();
                expect(yield* ruleEngineService.applyRuleToMatchingTransactions(emptyRule.id)).toEqual({ applied: 0, failed: 0, total: 0 });

                yield* testDb
                    .update(RuleConditionEntityTable)
                    .set({ deletedAt: new Date() })
                    .where(eq(RuleConditionEntityTable.ruleId, emptyRule.id));
                const reloaded = yield* ruleRepository.findByIdWithRelations(emptyRule.id);

                expect(reloaded?.conditions).toEqual([]);

                const convertRule = yield* createActionRule({
                    ...emptyAction,
                    type: RuleActionTypeEnum.CONVERT_TO_TRANSFER,
                    accountId: target.id
                });
                const result = yield* ruleEngineService.applyRuleToMatchingTransactions(convertRule.id);

                expect(result).toEqual({ applied: 1, failed: 0, total: 1 });
                expect(yield* readTransaction(expense.id)).toMatchObject({
                    type: TransactionTypeEnum.TRANSFER,
                    updatedBy: TransactionUpdatedByEnum.RULE
                });

                yield* ruleService.archiveById(convertRule.id);
                const missingExit = yield* Effect.exit(ruleService.updateById(convertRule.id, { enabled: false }));

                expect(Exit.isFailure(missingExit)).toBe(true);
            })
    );

    it.effect('never converts or tags a hidden consolidation child when applying rules by id or input', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { source, target, expense: parent } = yield* seedExpenseWithTarget;
            const tag = yield* testSeedService.tag('hidden-child');
            const child = yield* testSeedService.manualExpense({
                accountId: source.id,
                amount: 10_000_000,
                operatedAt: new Date('2026-06-02T12:05:00.000Z'),
                title: 'SPAR MARKET'
            });
            yield* testDb
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: parent.id })
                .where(eq(TransactionEntityTable.id, child.id));
            yield* createActionRule({ ...emptyAction, type: RuleActionTypeEnum.CONVERT_TO_TRANSFER, accountId: target.id });
            yield* createActionRule({ ...emptyAction, type: RuleActionTypeEnum.ADD_TAG, tagId: tag.id });

            yield* ruleEngineService.applyRulesToTransactions([child.id], [buildInput(source.id)]);

            const childAfter = yield* readTransaction(child.id);
            const childTags = yield* testDb
                .select()
                .from(TransactionTagsEntityTable)
                .where(eq(TransactionTagsEntityTable.transactionId, child.id));

            expect(childAfter.type).toBe(TransactionTypeEnum.EXPENSE);
            expect(childAfter.updatedBy).toBeNull();
            expect(childTags).toEqual([]);
        })
    );
});
