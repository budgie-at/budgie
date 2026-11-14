import {
    AccountTypeEnum,
    TransactionCreateInputSchema,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    YieldKindEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { TransactionTransferService } from '../src/transaction/service/transaction-transfer.service';
import { TransactionService } from '../src/transaction/service/transaction.service';

import { seed, TestLayer } from './ledger-test-layer';

const OPERATED_AT = new Date('2026-06-01T10:00:00.000Z');
const AMOUNT = 5_000_000;

const readYield = (id: number) =>
    Effect.flatMap(TransactionRepository, repository => repository.getByIdRaw(id)).pipe(
        Effect.map(transaction => ({
            type: transaction?.type,
            yieldKind: transaction?.yieldKind ?? null,
            yieldSourceAccountId: transaction?.yieldSourceAccountId ?? null
        }))
    );

const seedBankAndDeposit = Effect.gen(function* () {
    const testSeedService = yield* seed;
    const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
    const source = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT });

    return { account, source };
});

const seedTaggedExpense = Effect.gen(function* () {
    const testSeedService = yield* seed;
    const transactionRepository = yield* TransactionRepository;
    const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
    const target = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Target' });
    const source = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT, title: 'Source' });
    const expense = yield* testSeedService.manualExpense({ accountId: account.id, amount: AMOUNT, operatedAt: OPERATED_AT });

    yield* transactionRepository.updateById(expense.id, { yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: source.id });

    return { account, target, source, expense };
});

const expenseCreateEntity = (fromAccountId: number) => ({
    type: TransactionTypeEnum.EXPENSE,
    title: '',
    comment: '',
    externalId: null,
    externalSource: null,
    operatedAt: OPERATED_AT,
    exchangeRate: 1,
    fromAccountId,
    toAccountId: null,
    updatedBy: null
});

const createInput = (type: TransactionTypeEnum, yieldKind: YieldKindEnum) => ({
    type,
    title: '',
    externalId: null,
    operatedAt: OPERATED_AT,
    comment: '',
    toAccountId: type === TransactionTypeEnum.INCOME ? 1 : null,
    fromAccountId: type === TransactionTypeEnum.EXPENSE ? 1 : null,
    exchangeRate: 1,
    externalSource: null,
    updatedBy: null,
    amount: 5,
    tagIds: [],
    entries: [{ accountId: 1, categoryId: null, mccCategoryId: null, type: TransactionEntryTypeEnum.DEBIT, amount: 5 }],
    yieldKind
});

describe('yield fields', () => {
    it.effect('create drops a kind the type does not allow, together with its source', () =>
        Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const { account, source } = yield* seedBankAndDeposit;
            const transaction = yield* transactionRepository.create({
                ...expenseCreateEntity(account.id),
                yieldKind: YieldKindEnum.STAKING,
                yieldSourceAccountId: source.id
            });

            expect(yield* readYield(transaction.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updateById keeps the fields when the type does not change', () =>
        Effect.gen(function* () {
            const { expense, source } = yield* seedTaggedExpense;
            const transactionRepository = yield* TransactionRepository;

            yield* transactionRepository.updateById(expense.id, { title: 'Dividend tax' });

            expect(yield* readYield(expense.id)).toMatchObject({ yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: source.id });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updateById keeps the stored kind when only the source changes', () =>
        Effect.gen(function* () {
            const { expense } = yield* seedTaggedExpense;
            const testSeedService = yield* seed;
            const transactionRepository = yield* TransactionRepository;
            const otherSource = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT, title: 'Other source' });

            yield* transactionRepository.updateById(expense.id, { yieldSourceAccountId: otherSource.id });

            expect(yield* readYield(expense.id)).toMatchObject({ yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: otherSource.id });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updateById nulls the kind and the source when the kind is not allowed for the type', () =>
        Effect.gen(function* () {
            const { expense, source } = yield* seedTaggedExpense;
            const transactionRepository = yield* TransactionRepository;

            yield* transactionRepository.updateById(expense.id, { yieldKind: YieldKindEnum.STAKING, yieldSourceAccountId: source.id });

            expect(yield* readYield(expense.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('bulkCreate normalizes the yield fields of every row', () =>
        Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const { account, source } = yield* seedBankAndDeposit;
            const base = expenseCreateEntity(account.id);

            const [disallowed, allowed] = yield* transactionRepository.bulkCreate([
                { ...base, yieldKind: YieldKindEnum.STAKING, yieldSourceAccountId: source.id },
                { ...base, yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: source.id }
            ]);

            expect(yield* readYield(disallowed.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
            expect(yield* readYield(allowed.id)).toMatchObject({ yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: source.id });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updateById nulls both fields when the type becomes a transfer', () =>
        Effect.gen(function* () {
            const { expense } = yield* seedTaggedExpense;
            const transactionRepository = yield* TransactionRepository;

            yield* transactionRepository.updateById(expense.id, { type: TransactionTypeEnum.TRANSFER });

            expect(yield* readYield(expense.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('convertExpenseToTransfer clears the yield fields', () =>
        Effect.gen(function* () {
            const { expense, target } = yield* seedTaggedExpense;
            const transactionTransferService = yield* TransactionTransferService;

            yield* transactionTransferService.convertExpenseToTransfer({
                id: expense.id,
                accountId: target.id,
                customExchangeRate: 0,
                feeEntries: []
            });

            expect(yield* readYield(expense.id)).toEqual({
                type: TransactionTypeEnum.TRANSFER,
                yieldKind: null,
                yieldSourceAccountId: null
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('convertToTransferAccount clears the yield fields', () =>
        Effect.gen(function* () {
            const { expense, target } = yield* seedTaggedExpense;
            const transactionTransferService = yield* TransactionTransferService;

            expect(yield* transactionTransferService.convertToTransferAccount(expense.id, target.id)).toBe(true);
            expect(yield* readYield(expense.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('an adjustment edit clears the yield fields', () =>
        Effect.gen(function* () {
            const { expense, account } = yield* seedTaggedExpense;
            const transactionService = yield* TransactionService;

            yield* transactionService.updateById(expense.id, {
                title: '',
                comment: '',
                type: TransactionTypeEnum.ADJUSTMENT,
                operatedAt: OPERATED_AT,
                fromAccountId: account.id,
                toAccountId: null,
                exchangeRate: 1,
                tagIds: [],
                entries: [
                    {
                        accountId: account.id,
                        categoryId: null,
                        mccCategoryId: null,
                        amount: AMOUNT,
                        type: TransactionEntryTypeEnum.CREDIT,
                        externalId: null,
                        exchangeRate: 1,
                        toIban: null
                    }
                ]
            });

            expect(yield* readYield(expense.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('bulk transfer conversions produce rows without yield fields', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const transactionRepository = yield* TransactionRepository;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const other = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Other' });
            const transfer = yield* testSeedService.directTransfer({
                exchangeRate: 1,
                operatedAt: OPERATED_AT,
                sourceAccountId: account.id,
                sourceAmount: AMOUNT,
                sourceEntryExchangeRate: 1,
                targetAccountId: other.id,
                targetAmount: AMOUNT,
                toIban: null
            });

            yield* transactionRepository.convertTransfersFromAccountToIncome(account.id);

            expect(yield* readYield(transfer.id)).toEqual({
                type: TransactionTypeEnum.INCOME,
                yieldKind: null,
                yieldSourceAccountId: null
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it('the create schema rejects a kind the type does not allow', () => {
        const isValid = Schema.is(TransactionCreateInputSchema);

        expect(isValid(createInput(TransactionTypeEnum.EXPENSE, YieldKindEnum.STAKING))).toBe(false);
        expect(isValid(createInput(TransactionTypeEnum.INCOME, YieldKindEnum.TAX))).toBe(false);
        expect(isValid(createInput(TransactionTypeEnum.INCOME, YieldKindEnum.STAKING))).toBe(true);
        expect(isValid(createInput(TransactionTypeEnum.EXPENSE, YieldKindEnum.NONE))).toBe(true);
    });
});
