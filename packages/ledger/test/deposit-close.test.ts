import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    Db,
    HistoricalExchangeRateEntityTable,
    TransactionRepository,
    TransactionTypeEnum,
    YieldKindEnum,
    YieldRepository,
    convertToMicroUnits
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { i18n } from '@lingui/core';
import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';

import { AccountBalanceIncrementalService } from '../src/account/service/account-balance-incremental.service';
import { DepositInterestService } from '../src/account/service/deposit-interest.service';
import { TransactionTransferService } from '../src/transaction/service/transaction-transfer.service';

import { seed, TestLayer } from './ledger-test-layer';

i18n.loadAndActivate({ locale: 'en', messages: {} });

const DAY_MS = 86_400_000;
const BASE_TIME = new Date('2026-06-01T00:00:00.000Z');
const PRINCIPAL = 10_000;

const daysAgo = (days: number) => new Date(BASE_TIME.getTime() - days * DAY_MS);

const setNow = TestClock.setTime(BASE_TIME.getTime());

const fundDeposit = (bankAccountId: number, depositAccountId: number, principalDaysAgo: number) =>
    Effect.gen(function* () {
        yield* (yield* seed).directTransfer({
            exchangeRate: 1,
            operatedAt: daysAgo(principalDaysAgo),
            sourceAccountId: bankAccountId,
            sourceAmount: convertToMicroUnits(PRINCIPAL),
            sourceEntryExchangeRate: 1,
            targetAccountId: depositAccountId,
            targetAmount: convertToMicroUnits(PRINCIPAL),
            toIban: null
        });
        yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([bankAccountId, depositAccountId]);
    });

const seedDeposit = (input: { readonly interestRate: number | null; readonly principalDaysAgo: number; readonly instrumentId?: number }) =>
    Effect.gen(function* () {
        const testSeedService = yield* seed;
        const accountRepository = yield* AccountRepository;
        const instrumentId = input.instrumentId ?? 1;
        const bank = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Bank', instrumentId });
        const destination = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Destination', instrumentId });
        const deposit = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT, title: 'Deposit', instrumentId });

        yield* accountRepository.updateById(deposit.id, { interestRate: input.interestRate });
        yield* fundDeposit(bank.id, deposit.id, input.principalDaysAgo);

        return { bank, destination, deposit };
    });

const seedBankInterest = (bankAccountId: number, sourceAccountId: number | null, operatedAt: Date) =>
    Effect.gen(function* () {
        const testSeedService = yield* seed;
        const income = yield* testSeedService.manualExpense({
            accountId: bankAccountId,
            amount: convertToMicroUnits(50),
            operatedAt,
            type: TransactionTypeEnum.INCOME
        });

        yield* (yield* TransactionRepository).updateById(income.id, {
            yieldKind: YieldKindEnum.INTEREST,
            yieldSourceAccountId: sourceAccountId
        });

        return income;
    });

const ledgerBalanceOf = (accountId: number) =>
    Effect.flatMap(AccountBalanceRepository, repository => repository.getLedgerBalances([accountId])).pipe(
        Effect.map(balances => balances.get(accountId) ?? 0)
    );

const close = (depositAccountId: number, destinationAccountId: number, amountReceived: number) =>
    setNow.pipe(
        Effect.andThen(TransactionTransferService),
        Effect.flatMap(service => service.closeDepositTo(depositAccountId, destinationAccountId, amountReceived))
    );

const prefillOf = (depositAccountId: number) =>
    setNow.pipe(
        Effect.andThen(DepositInterestService),
        Effect.flatMap(service => service.getClosePrefill(depositAccountId))
    );

describe('deposit close', () => {
    it.effect('records the excess received as interest, transfers it out and keeps the closed deposit history', () =>
        Effect.gen(function* () {
            const { deposit, destination } = yield* seedDeposit({ interestRate: null, principalDaysAgo: 90 });
            const transactionRepository = yield* TransactionRepository;
            const transactionCountBefore = (yield* transactionRepository.findByAccountIdsWithEntries([deposit.id])).length;

            yield* close(deposit.id, destination.id, PRINCIPAL + 250);

            const facts = yield* (yield* YieldRepository).findFacts({ positionAccountId: deposit.id, instrumentId: null }, 1);

            expect(yield* ledgerBalanceOf(destination.id)).toBe(convertToMicroUnits(PRINCIPAL + 250));
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(0);
            expect(yield* (yield* AccountRepository).findById(deposit.id)).toMatchObject({ isActive: false, deletedAt: null });
            expect((yield* transactionRepository.findByAccountIdsWithEntries([deposit.id])).length).toBe(transactionCountBefore + 2);
            expect(facts.map(fact => [fact.yieldKind, fact.amount])).toEqual([[YieldKindEnum.INTEREST, convertToMicroUnits(250)]]);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stops a closed deposit from claiming interest that landed after it closed', () =>
        Effect.gen(function* () {
            const { bank, deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });
            const closed = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });

            yield* close(closed.deposit.id, closed.destination.id, PRINCIPAL);

            const closedHistory = yield* (yield* TransactionRepository).findByAccountIdsWithEntries([closed.deposit.id]);
            const closedAt = Math.max(...closedHistory.map(transaction => transaction.operatedAt.getTime()));
            const payout = yield* seedBankInterest(bank.id, null, new Date(closedAt + DAY_MS));

            expect(yield* prefillOf(deposit.id)).toMatchObject({ hasUnassignedInterest: true });

            yield* Effect.flatMap(DepositInterestService, service => service.linkInterestPayouts(deposit.id));
            const linked = yield* (yield* TransactionRepository).getByIdRaw(payout.id);

            expect(linked?.yieldSourceAccountId).toBe(deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('records no delta when the amount received equals the balance', () =>
        Effect.gen(function* () {
            const { deposit, destination } = yield* seedDeposit({ interestRate: 10, principalDaysAgo: 90 });
            const transactionCountBefore = (yield* (yield* TransactionRepository).findByAccountIdsWithEntries([deposit.id])).length;

            yield* close(deposit.id, destination.id, PRINCIPAL);

            const transactions = yield* (yield* TransactionRepository).findByAccountIdsWithEntries([deposit.id]);

            expect(transactions.length).toBe(transactionCountBefore + 1);
            expect(transactions.some(transaction => transaction.yieldKind === YieldKindEnum.INTEREST)).toBe(false);
            expect(yield* ledgerBalanceOf(destination.id)).toBe(convertToMicroUnits(PRINCIPAL));
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('records a shortfall as an adjustment', () =>
        Effect.gen(function* () {
            const { deposit, destination } = yield* seedDeposit({ interestRate: 10, principalDaysAgo: 90 });

            yield* close(deposit.id, destination.id, PRINCIPAL - 100);

            expect(yield* ledgerBalanceOf(destination.id)).toBe(convertToMicroUnits(PRINCIPAL - 100));
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects an invalid amount received (%s)', amountReceived =>
        Effect.gen(function* () {
            const { deposit, destination } = yield* seedDeposit({ interestRate: 10, principalDaysAgo: 90 });
            const error = yield* Effect.flip(close(deposit.id, destination.id, amountReceived));

            expect(error._tag).toBe('DepositCloseAmountInvalidError');
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(convertToMicroUnits(PRINCIPAL));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('closes a deposit held in a non-base currency', () =>
        Effect.gen(function* () {
            const db = yield* Db;
            const foreign = yield* (yield* seed).instrument({ code: 'TMF', name: 'Foreign', symbol: 'TF' });

            yield* db.insert(HistoricalExchangeRateEntityTable).values([
                { sourceInstrumentId: foreign.id, targetInstrumentId: 1, rateDate: '2026-01-01', rate: 0.5 },
                { sourceInstrumentId: 1, targetInstrumentId: foreign.id, rateDate: '2026-01-01', rate: 2 }
            ]);
            const { deposit, destination } = yield* seedDeposit({ interestRate: null, principalDaysAgo: 30, instrumentId: foreign.id });

            yield* close(deposit.id, destination.id, PRINCIPAL + 50);

            expect(yield* ledgerBalanceOf(destination.id)).toBe(convertToMicroUnits(PRINCIPAL + 50));
            yield* assertStoredBalancesMatchLedger(db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('prefills the ledger balance plus accrual since the first principal transfer', () =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });
            const prefill = yield* prefillOf(deposit.id);

            expect(prefill.ledgerBalance).toBe(PRINCIPAL);
            expect(prefill.amountReceived).toBeCloseTo(PRINCIPAL + 240, 1);
            expect(prefill.hasUnassignedInterest).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('accrues a top-up only from the day it landed', () =>
        Effect.gen(function* () {
            const { bank, deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });

            yield* fundDeposit(bank.id, deposit.id, 1);

            expect((yield* prefillOf(deposit.id)).amountReceived).toBeCloseTo(2 * PRINCIPAL + 243.29, 1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stops the accrual at maturity', () =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });

            yield* (yield* AccountRepository).updateById(deposit.id, { deadline: daysAgo(30) });

            expect((yield* prefillOf(deposit.id)).amountReceived).toBeCloseTo(PRINCIPAL + 141.37, 1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never re-adds interest already paid out from the deposit', () =>
        Effect.gen(function* () {
            const { bank, deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });

            yield* seedBankInterest(bank.id, deposit.id, daysAgo(30));

            expect((yield* prefillOf(deposit.id)).amountReceived).toBeCloseTo(PRINCIPAL + 98.63, 1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never relinks a NONE row or a row that already has a source', () =>
        Effect.gen(function* () {
            const { bank, deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });
            const other = yield* (yield* seed).account({ type: AccountTypeEnum.DEPOSIT, title: 'Other', instrumentId: 1 });
            const transactionRepository = yield* TransactionRepository;
            const sourced = yield* seedBankInterest(bank.id, other.id, daysAgo(20));
            const none = yield* seedBankInterest(bank.id, null, daysAgo(10));

            yield* transactionRepository.updateById(none.id, { yieldKind: YieldKindEnum.NONE, yieldSourceAccountId: null });
            yield* Effect.flatMap(DepositInterestService, service => service.linkInterestPayouts(deposit.id));

            expect((yield* transactionRepository.getByIdRaw(sourced.id))?.yieldSourceAccountId).toBe(other.id);
            expect((yield* transactionRepository.getByIdRaw(none.id))?.yieldSourceAccountId).toBeNull();
            expect((yield* transactionRepository.getByIdRaw(none.id))?.yieldKind).toBe(YieldKindEnum.NONE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never offers or links a payout another open deposit could have paid', () =>
        Effect.gen(function* () {
            const { bank, deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });
            const other = yield* (yield* seed).account({ type: AccountTypeEnum.DEPOSIT, title: 'Other', instrumentId: 1 });

            yield* fundDeposit(bank.id, other.id, 40);

            const before = yield* seedBankInterest(bank.id, null, daysAgo(50));
            const during = yield* seedBankInterest(bank.id, null, daysAgo(20));

            yield* Effect.flatMap(DepositInterestService, service => service.linkInterestPayouts(deposit.id));

            expect((yield* (yield* TransactionRepository).getByIdRaw(before.id))?.yieldSourceAccountId).toBe(deposit.id);
            expect((yield* (yield* TransactionRepository).getByIdRaw(during.id))?.yieldSourceAccountId).toBeNull();
            expect(yield* prefillOf(deposit.id)).toMatchObject({ hasUnassignedInterest: false });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never links interest that landed on a savings account of its own', () =>
        Effect.gen(function* () {
            const { deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });
            const savings = yield* (yield* seed).account({ type: AccountTypeEnum.SAVINGS, title: 'Savings', instrumentId: 1 });
            const payout = yield* seedBankInterest(savings.id, null, daysAgo(20));

            expect(yield* prefillOf(deposit.id)).toMatchObject({ hasUnassignedInterest: false });

            yield* Effect.flatMap(DepositInterestService, service => service.linkInterestPayouts(deposit.id));

            expect((yield* (yield* TransactionRepository).getByIdRaw(payout.id))?.yieldSourceAccountId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('prefills the ledger balance and offers the link when unassigned interest landed, then links it', () =>
        Effect.gen(function* () {
            const { bank, deposit } = yield* seedDeposit({ interestRate: 12, principalDaysAgo: 73 });
            const payout = yield* seedBankInterest(bank.id, null, daysAgo(20));

            expect(yield* prefillOf(deposit.id)).toEqual({
                ledgerBalance: PRINCIPAL,
                amountReceived: PRINCIPAL,
                hasUnassignedInterest: true
            });

            yield* Effect.flatMap(DepositInterestService, service => service.linkInterestPayouts(deposit.id));

            expect((yield* (yield* TransactionRepository).getByIdRaw(payout.id))?.yieldSourceAccountId).toBe(deposit.id);
            expect(yield* prefillOf(deposit.id)).toMatchObject({ hasUnassignedInterest: false });
            expect((yield* prefillOf(deposit.id)).amountReceived).toBeCloseTo(PRINCIPAL + 65.75, 1);
        }).pipe(Effect.provide(TestLayer))
    );
});
