import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    AccountRepository,
    AccountTypeEnum,
    Db,
    DepositAccountCreateInputSchema,
    LiabilityAccountCreateInputSchema,
    TransactionRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum,
    YieldKindEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as TestClock from 'effect/testing/TestClock';

import { AccountBalanceIncrementalService } from '../src/account/service/account-balance-incremental.service';
import { AccountService } from '../src/account/service/account.service';

import { seed, TestLayer } from './ledger-test-layer';

const DAY_MS = 86_400_000;
const PRINCIPAL = 10_000;

const transfer = (sourceAccountId: number, targetAccountId: number, amount: number, daysAgo: number) =>
    Effect.flatMap(seed, testSeedService =>
        testSeedService.directTransfer({
            exchangeRate: 1,
            operatedAt: new Date(Date.now() - daysAgo * DAY_MS),
            sourceAccountId,
            sourceAmount: convertToMicroUnits(amount),
            sourceEntryExchangeRate: 1,
            targetAccountId,
            targetAmount: convertToMicroUnits(amount),
            toIban: null
        })
    );

const seedDeposit = (interestRate: number | null, daysAgo: number) =>
    Effect.gen(function* () {
        const testSeedService = yield* seed;
        const accountRepository = yield* AccountRepository;
        const bank = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Bank' });
        const deposit = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT, title: 'Deposit' });

        yield* accountRepository.updateById(deposit.id, { interestRate });
        yield* transfer(bank.id, deposit.id, PRINCIPAL, daysAgo);
        yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([bank.id, deposit.id]);

        return { bank, deposit };
    });

const readLatestOnDeposit = (depositAccountId: number) =>
    Effect.gen(function* () {
        const transactionRepository = yield* TransactionRepository;
        const transactions = yield* transactionRepository.findByAccountIdsWithEntries([depositAccountId]);
        const [latest] = transactions.toSorted((first, second) => second.id - first.id);
        const entry = latest.entries.find(({ accountId }) => accountId === depositAccountId);

        return {
            type: latest.type,
            yieldKind: latest.yieldKind,
            yieldSourceAccountId: latest.yieldSourceAccountId,
            entryType: entry?.type,
            amount: entry?.amount
        };
    });

const updateBalance = (depositAccountId: number, currentBalance: number) =>
    TestClock.setTime(Date.now()).pipe(
        Effect.andThen(AccountService),
        Effect.flatMap(accountService => accountService.updateDepositById(depositAccountId, { currentBalance }))
    );

describe('DepositInterestService.recordGrowth', () => {
    it.effect('records plausible growth on a rated deposit as interest attributed to it', () =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit(10, 30);

            yield* updateBalance(deposit.id, PRINCIPAL + 80);

            expect(yield* readLatestOnDeposit(deposit.id)).toEqual({
                type: TransactionTypeEnum.INCOME,
                yieldKind: YieldKindEnum.INTEREST,
                yieldSourceAccountId: deposit.id,
                entryType: TransactionEntryTypeEnum.DEBIT,
                amount: convertToMicroUnits(80)
            });
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('records growth beyond 1.5 times the accrual as an adjustment', () =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit(10, 30);

            yield* updateBalance(deposit.id, PRINCIPAL + 500);

            expect(yield* readLatestOnDeposit(deposit.id)).toMatchObject({ type: TransactionTypeEnum.ADJUSTMENT, yieldKind: null });
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('records a decrease as an adjustment', () =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit(10, 30);

            yield* updateBalance(deposit.id, PRINCIPAL - 100);

            expect(yield* readLatestOnDeposit(deposit.id)).toMatchObject({
                type: TransactionTypeEnum.ADJUSTMENT,
                entryType: TransactionEntryTypeEnum.CREDIT,
                amount: convertToMicroUnits(100)
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('treats growth right after a principal transfer as an adjustment', () =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit(10, 0);

            yield* updateBalance(deposit.id, PRINCIPAL + 50);

            expect((yield* readLatestOnDeposit(deposit.id)).type).toBe(TransactionTypeEnum.ADJUSTMENT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a corrected opening balance an adjustment', () =>
        Effect.gen(function* () {
            const accountService = yield* AccountService;
            const deposit = yield* accountService.createDeposit({
                title: 'Opening',
                icon: UserIconNameEnum.Landmark,
                type: AccountTypeEnum.DEPOSIT,
                instrumentId: 1,
                iban: null,
                deadline: null,
                interestRate: 10,
                currentBalance: 5000
            });

            expect((yield* readLatestOnDeposit(deposit.id)).type).toBe(TransactionTypeEnum.ADJUSTMENT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([null, 0])('treats any growth as an adjustment when the rate is %s', interestRate =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit(interestRate, 30);

            yield* updateBalance(deposit.id, PRINCIPAL + 10);

            expect((yield* readLatestOnDeposit(deposit.id)).type).toBe(TransactionTypeEnum.ADJUSTMENT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('allows more interest after a stale last balance event, and a top-up resets it', () =>
        Effect.gen(function* () {
            const stale = yield* seedDeposit(10, 200);

            yield* updateBalance(stale.deposit.id, PRINCIPAL + 500);

            expect((yield* readLatestOnDeposit(stale.deposit.id)).yieldKind).toBe(YieldKindEnum.INTEREST);

            const toppedUp = yield* seedDeposit(10, 200);

            yield* transfer(toppedUp.bank.id, toppedUp.deposit.id, 100, 1);
            yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([toppedUp.bank.id, toppedUp.deposit.id]);
            yield* updateBalance(toppedUp.deposit.id, PRINCIPAL + 100 + 500);

            expect((yield* readLatestOnDeposit(toppedUp.deposit.id)).type).toBe(TransactionTypeEnum.ADJUSTMENT);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the adjustment path for a synced deposit', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const accountRepository = yield* AccountRepository;
            const integration = yield* testSeedService.bankIntegration();
            const { deposit } = yield* seedDeposit(10, 30);

            yield* accountRepository.updateById(deposit.id, { integrationId: integration.id });
            yield* updateBalance(deposit.id, PRINCIPAL + 80);

            expect((yield* readLatestOnDeposit(deposit.id)).type).toBe(TransactionTypeEnum.ADJUSTMENT);
        }).pipe(Effect.provide(TestLayer))
    );

    it('accepts a 0% expected rate on deposits and savings', () => {
        expect(
            Schema.is(DepositAccountCreateInputSchema)({
                title: 'Deposit',
                icon: UserIconNameEnum.Landmark,
                type: AccountTypeEnum.DEPOSIT,
                instrumentId: 1,
                iban: null,
                deadline: null,
                interestRate: 0,
                currentBalance: 0
            })
        ).toBe(true);
        expect(
            Schema.is(LiabilityAccountCreateInputSchema)({
                title: 'Jar',
                icon: UserIconNameEnum.PiggyBank,
                type: AccountTypeEnum.SAVINGS,
                instrumentId: 1,
                currentBalance: 0,
                interestRate: 0
            })
        ).toBe(true);
    });
});
