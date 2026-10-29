import { AccountTypeEnum, convertToMicroUnits, TransactionRepository, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TransactionTransferService } from '../src/transaction/service/transaction-transfer.service';

import { seed, TestLayer } from './ledger-test-layer';

const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
const amount = convertToMicroUnits(25);

describe('TransactionTransferService account conversion', () => {
    it.effect('converts an expense into a transfer to the picked account', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const transactionRepository = yield* TransactionRepository;
            const testSeedService = yield* seed;
            const source = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const target = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const expense = yield* testSeedService.manualExpense({ accountId: source.id, amount, operatedAt });

            const converted = yield* transactionTransferService.convertToTransferAccount(expense.id, target.id);
            const transaction = yield* transactionRepository.getByIdWithEntries(expense.id);

            expect(converted).toBe(true);
            expect(transaction?.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(transaction?.fromAccountId).toBe(source.id);
            expect(transaction?.toAccountId).toBe(target.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('skips a debt target account and leaves the expense untouched', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const transactionRepository = yield* TransactionRepository;
            const testSeedService = yield* seed;
            const source = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const debt = yield* testSeedService.account({ type: AccountTypeEnum.DEBT });
            const expense = yield* testSeedService.manualExpense({ accountId: source.id, amount, operatedAt });

            const converted = yield* transactionTransferService.convertToTransferAccount(expense.id, debt.id);
            const transaction = yield* transactionRepository.getByIdWithEntries(expense.id);

            expect(converted).toBe(false);
            expect(transaction?.type).toBe(TransactionTypeEnum.EXPENSE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns only the ids that were converted', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const testSeedService = yield* seed;
            const source = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const target = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
            const expense = yield* testSeedService.manualExpense({ accountId: source.id, amount, operatedAt });
            const income = yield* testSeedService.manualExpense({
                accountId: source.id,
                amount,
                operatedAt,
                type: TransactionTypeEnum.INCOME
            });
            const alreadyOnTarget = yield* testSeedService.manualExpense({ accountId: target.id, amount, operatedAt });

            const convertedIds = yield* transactionTransferService.convertManyToTransferAccount(
                [expense.id, income.id, alreadyOnTarget.id],
                target.id
            );

            expect(convertedIds).toEqual([expense.id, income.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});
