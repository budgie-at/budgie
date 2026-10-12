import { TestQueryService } from '@budgie-at/test-kit';
import {
    AccountBalanceRepository,
    AccountTypeEnum,
    DebtEventEntityTable,
    PRECISION,
    RuleActionTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { RuleEngineService } from '@budgie/rules';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';
import { seedTitleRule } from '../../harness/seed/seed-title-rule';

const query = new TestQueryService(testDb);
const operatedAt = new Date('2026-06-02T12:00:00.000Z');
const expenseAmount = 100 * PRECISION;
const feeAmount = 2 * PRECISION;

const seedAccounts = Effect.gen(function* () {
    const source = yield* seed.account({ title: 'Rule source', type: AccountTypeEnum.BANK });
    const target = yield* seed.account({ title: 'Rule target', type: AccountTypeEnum.BANK });

    return { source, target };
});

const applyConvertRule = Effect.fnUntraced(function* (title: string, targetAccountId: number) {
    const ruleEngineService = yield* RuleEngineService;
    const rule = yield* seedTitleRule(title, {
        type: RuleActionTypeEnum.CONVERT_TO_TRANSFER,
        categoryId: null,
        accountId: targetAccountId
    });

    return yield* ruleEngineService.applyRuleToMatchingTransactions(rule.id);
});

const readBalance = Effect.fnUntraced(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return (yield* accountBalanceRepository.getByAccountId(accountId)).at(0)?.balance;
});

describe('rule/rule-transfer-conversion', () => {
    it.effect('keeps the FEE entry of a rule-converted expense and books it in the stored balance', () =>
        Effect.gen(function* () {
            const { source, target } = yield* seedAccounts;
            const expense = yield* seed.manualExpense({ accountId: source.id, amount: expenseAmount, operatedAt, title: 'RULE FEE' });
            yield* seed.feeEntry(expense.id, null, { accountId: source.id, amount: feeAmount });

            yield* applyConvertRule('RULE FEE', target.id);

            const transaction = yield* query.fetchTransactionById(expense.id);
            const entries = yield* query.fetchEntriesByTransactionId(expense.id);

            expect(transaction.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(
                [...entries]
                    .sort((left, right) => left.type.localeCompare(right.type))
                    .map(entry => [entry.type, entry.accountId, entry.amount])
            ).toStrictEqual([
                [TransactionEntryTypeEnum.CREDIT, source.id, expenseAmount],
                [TransactionEntryTypeEnum.DEBIT, target.id, expenseAmount],
                [TransactionEntryTypeEnum.FEE, source.id, feeAmount]
            ]);
            expect(yield* readBalance(source.id)).toBe(-(expenseAmount + feeAmount));
            expect(yield* readBalance(target.id)).toBe(expenseAmount);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert a debt-attached income and keeps its debt event', () =>
        Effect.gen(function* () {
            const { source, target } = yield* seedAccounts;
            const debtAccount = yield* seed.account({ title: 'Debtor', type: AccountTypeEnum.DEBT });
            const income = yield* seed.bankPairIncome(
                { externalId: 'rule-debt-income', operatedAt },
                { accountId: source.id, amount: 50 * PRECISION }
            );
            yield* seed.debtEvent(income.id, debtAccount.id, 50 * PRECISION);

            yield* applyConvertRule(income.title, target.id);

            const debtEvents = yield* testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.transactionId, income.id));

            expect((yield* query.fetchTransactionById(income.id)).type).toBe(TransactionTypeEnum.INCOME);
            expect(debtEvents.map(event => event.debtAccountId)).toStrictEqual([debtAccount.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert a split expense with two category entries', () =>
        Effect.gen(function* () {
            const { source, target } = yield* seedAccounts;
            const expense = yield* seed.manualExpense({ accountId: source.id, amount: 30 * PRECISION, operatedAt, title: 'RULE SPLIT' });
            yield* testDb.insert(TransactionEntryEntityTable).values({
                transactionId: expense.id,
                accountId: source.id,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: 20 * PRECISION,
                categoryId: null,
                mccCategoryId: null
            });

            yield* applyConvertRule('RULE SPLIT', target.id);

            const entries = yield* query.fetchEntriesByTransactionId(expense.id);

            expect((yield* query.fetchTransactionById(expense.id)).type).toBe(TransactionTypeEnum.EXPENSE);
            expect(entries.map(entry => entry.amount).sort((left, right) => left - right)).toStrictEqual([20 * PRECISION, 30 * PRECISION]);
        }).pipe(Effect.provide(TestLayer))
    );
});
