import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    CategorySourceEnum,
    convertToMicroUnits,
    CurrencyEnum,
    Db,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TagSourceEnum,
    TransactionTypeEnum,
    TransactionRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import { ReceiptMatchResultKindEnum, ReceiptMatchService } from '@budgie/ledger';
import { RuleEngineService, RuleService } from '@budgie/rules';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { TestLayer, testSeedService } from './context';

import type { RuleCreateInputInterface } from '@budgie/contracts';

const OPERATED_AT = new Date(2026, 9, 27, 9, 0, 0);
const TOTAL = convertToMicroUnits(62.1);

const createTitleRule = (action: RuleCreateInputInterface['actions'][number]) =>
    Effect.flatMap(RuleService, ruleService =>
        ruleService.create({
            enabled: true,
            conditionMatchType: RuleConditionMatchTypeEnum.ALL,
            conditions: [
                {
                    field: RuleConditionFieldEnum.TITLE,
                    operator: RuleConditionOperatorEnum.CONTAINS,
                    value: 'Ihr Labor',
                    secondaryValue: null
                }
            ],
            actions: [action]
        })
    );

const scan = (categoryId: number | null, total = TOTAL) =>
    Effect.gen(function* () {
        const receiptMatchService = yield* ReceiptMatchService;
        const ruleEngineService = yield* RuleEngineService;

        return yield* receiptMatchService.match(
            {
                total,
                currency: CurrencyEnum.USD,
                occurredAt: OPERATED_AT,
                cardLast4: null,
                receiptNumber: '0001',
                merchantVatId: null,
                merchantLegalName: null,
                merchantCandidates: ['IHR LABOR'],
                fingerprint: `receipt-${total}`,
                title: 'Ihr Labor',
                description: null,
                categoryId
            },
            transactionId => ruleEngineService.applyCreateSafeRulesToTransactionIds([transactionId])
        );
    });

const readTransaction = Effect.fnUntraced(function* (transactionId: number) {
    const transaction = yield* (yield* TransactionRepository).getByIdWithEntries(transactionId);
    const tags = yield* (yield* TransactionTagsRepository).findByTransactionId(transactionId);

    yield* assertStoredBalancesMatchLedger(yield* Db);

    return {
        type: transaction?.type,
        title: transaction?.title,
        categories: transaction?.entries.map(entry => [entry.categoryId, entry.categorySource]),
        tags: tags.map(tag => [tag.tagId, tag.source])
    };
});

const seedAccount = Effect.gen(function* () {
    const account = yield* testSeedService.account();

    yield* testSeedService.manualExpense({ accountId: account.id, amount: convertToMicroUnits(5), operatedAt: OPERATED_AT });

    return account;
});

const ReceiptTestLayer = Layer.mergeAll(ReceiptMatchService.layer, TransactionRepository.layer, TransactionTagsRepository.layer).pipe(
    Layer.provideMerge(TestLayer)
);

layer(ReceiptTestLayer)('receipt rules', it => {
    it.effect('lets a category rule win over the embedding category on a created receipt expense', () =>
        Effect.gen(function* () {
            yield* seedAccount;
            const ruleCategory = yield* testSeedService.category('Health');
            const embeddingCategory = yield* testSeedService.category('Shopping');
            yield* createTitleRule({ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: ruleCategory.id, tagId: null, accountId: null });

            const result = yield* scan(embeddingCategory.id);

            expect(result.kind).toBe(ReceiptMatchResultKindEnum.CREATED);
            expect((yield* readTransaction(result.transactionId)).categories).toEqual([[ruleCategory.id, CategorySourceEnum.RULE]]);
        })
    );

    it.effect('adds a rule tag and keeps the embedding category on a created receipt expense', () =>
        Effect.gen(function* () {
            yield* seedAccount;
            const embeddingCategory = yield* testSeedService.category('Shopping');
            const tag = yield* testSeedService.tag('lab');
            yield* createTitleRule({ type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null });

            const result = yield* scan(embeddingCategory.id);

            expect(yield* readTransaction(result.transactionId)).toMatchObject({
                categories: [[embeddingCategory.id, CategorySourceEnum.AI]],
                tags: [[tag.id, TagSourceEnum.RULE]]
            });
        })
    );

    it.effect('uses the embedding category on a created receipt expense when no rule matches', () =>
        Effect.gen(function* () {
            yield* seedAccount;
            const embeddingCategory = yield* testSeedService.category('Shopping');

            const result = yield* scan(embeddingCategory.id);

            expect(yield* readTransaction(result.transactionId)).toEqual({
                type: TransactionTypeEnum.EXPENSE,
                title: 'Ihr Labor',
                categories: [[embeddingCategory.id, CategorySourceEnum.AI]],
                tags: []
            });
        })
    );

    it.effect('applies a title rule to an uncategorised bank expense the receipt renamed', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account();
            const ruleCategory = yield* testSeedService.category('Health');
            const expense = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: TOTAL,
                operatedAt: OPERATED_AT,
                title: 'CARD 4711'
            });
            yield* createTitleRule({ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: ruleCategory.id, tagId: null, accountId: null });

            const result = yield* scan(null);

            expect(result).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: expense.id });
            expect(yield* readTransaction(expense.id)).toMatchObject({
                title: 'Ihr Labor',
                categories: [[ruleCategory.id, CategorySourceEnum.RULE]]
            });
        })
    );

    it.effect('keeps the category of an already categorised bank expense the receipt renamed', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account();
            const userCategory = yield* testSeedService.category('Groceries');
            const ruleCategory = yield* testSeedService.category('Health');
            const expense = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: TOTAL,
                operatedAt: OPERATED_AT,
                title: 'CARD 4711',
                categoryId: userCategory.id
            });
            yield* createTitleRule({ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: ruleCategory.id, tagId: null, accountId: null });

            yield* scan(ruleCategory.id);

            expect(yield* readTransaction(expense.id)).toMatchObject({
                title: 'Ihr Labor',
                categories: [[userCategory.id, CategorySourceEnum.USER]]
            });
        })
    );
    it.effect('never converts a created receipt expense or a matched bank expense to a transfer', () =>
        Effect.gen(function* () {
            const account = yield* seedAccount;
            const savings = yield* testSeedService.account({ title: 'Savings' });
            const bankTotal = convertToMicroUnits(18.4);
            const expense = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: bankTotal,
                operatedAt: OPERATED_AT,
                title: 'CARD 4711'
            });
            yield* createTitleRule({ type: RuleActionTypeEnum.CONVERT_TO_TRANSFER, categoryId: null, tagId: null, accountId: savings.id });

            const created = yield* scan(null);
            const matched = yield* scan(null, bankTotal);

            expect(matched).toEqual({ kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: expense.id });
            expect((yield* readTransaction(created.transactionId)).type).toBe(TransactionTypeEnum.EXPENSE);
            expect(yield* readTransaction(expense.id)).toMatchObject({ type: TransactionTypeEnum.EXPENSE, title: 'Ihr Labor' });
        })
    );
});
