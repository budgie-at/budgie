import {
    AccountRepository,
    AccountTypeEnum,
    HOUSEHOLD_SYNC_ZONE,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    YieldKindEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TransactionService } from '../src/transaction/service/transaction.service';

import { seed, TestLayer } from './ledger-test-layer';

import type { TransactionUpdateServiceInputInterface } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-06-01T10:00:00.000Z');
const AMOUNT = 1_000_000;

const incomeUpdate = (
    accountId: number,
    extra: Partial<TransactionUpdateServiceInputInterface>
): TransactionUpdateServiceInputInterface => ({
    title: 'Interest',
    comment: '',
    type: TransactionTypeEnum.INCOME,
    operatedAt: OPERATED_AT,
    fromAccountId: null,
    toAccountId: accountId,
    exchangeRate: 1,
    tagIds: [],
    entries: [
        {
            accountId,
            categoryId: null,
            mccCategoryId: null,
            amount: AMOUNT,
            type: TransactionEntryTypeEnum.DEBIT,
            externalId: null,
            exchangeRate: 1,
            toIban: null
        }
    ],
    ...extra
});

const moveToHousehold = (accountId: number) =>
    Effect.flatMap(AccountRepository, repository => repository.updateById(accountId, { syncZone: HOUSEHOLD_SYNC_ZONE }));

const readYield = (id: number) =>
    Effect.flatMap(TransactionRepository, repository => repository.getByIdRaw(id)).pipe(
        Effect.map(transaction => ({
            yieldKind: transaction?.yieldKind ?? null,
            yieldSourceAccountId: transaction?.yieldSourceAccountId ?? null
        }))
    );

const seedIncomeWithDeposit = Effect.gen(function* () {
    const testSeedService = yield* seed;
    const bank = yield* testSeedService.account({ type: AccountTypeEnum.BANK });
    const deposit = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT });
    const income = yield* testSeedService.manualExpense({
        accountId: bank.id,
        amount: AMOUNT,
        operatedAt: OPERATED_AT,
        type: TransactionTypeEnum.INCOME
    });

    return { bank, deposit, income };
});

describe('TransactionService.updateById yield fields', () => {
    it.effect('stores a kind and a same-zone source set by the user', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const { bank, deposit, income } = yield* seedIncomeWithDeposit;

            yield* transactionService.updateById(
                income.id,
                incomeUpdate(bank.id, { yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: deposit.id })
            );

            expect(yield* readYield(income.id)).toEqual({ yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: deposit.id });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the stored yield fields when the edit does not mention them', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const { bank, deposit, income } = yield* seedIncomeWithDeposit;

            yield* transactionService.updateById(
                income.id,
                incomeUpdate(bank.id, { yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: deposit.id })
            );
            yield* transactionService.updateById(income.id, incomeUpdate(bank.id, { title: 'Monthly interest' }));

            expect(yield* readYield(income.id)).toEqual({ yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: deposit.id });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('nulls a source that a new landing account puts in another zone', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const transactionService = yield* TransactionService;
            const personalBank = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Personal' });
            const sharedBank = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Shared' });
            const sharedDeposit = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT, title: 'Shared deposit' });

            yield* moveToHousehold(sharedBank.id);
            yield* moveToHousehold(sharedDeposit.id);

            const income = yield* testSeedService.manualExpense({
                accountId: sharedBank.id,
                amount: AMOUNT,
                operatedAt: OPERATED_AT,
                type: TransactionTypeEnum.INCOME
            });

            yield* transactionService.updateById(
                income.id,
                incomeUpdate(sharedBank.id, { yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: sharedDeposit.id })
            );
            yield* transactionService.updateById(income.id, incomeUpdate(personalBank.id, {}));

            expect(yield* readYield(income.id)).toEqual({ yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(['missing', 'archived'])('nulls a source account that is %s', state =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const accountRepository = yield* AccountRepository;
            const { bank, deposit, income } = yield* seedIncomeWithDeposit;

            yield* accountRepository.archiveById(deposit.id);
            yield* transactionService.updateById(
                income.id,
                incomeUpdate(bank.id, {
                    yieldKind: YieldKindEnum.INTEREST,
                    yieldSourceAccountId: state === 'missing' ? deposit.id + 1000 : deposit.id
                })
            );

            expect(yield* readYield(income.id)).toEqual({ yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );
});
