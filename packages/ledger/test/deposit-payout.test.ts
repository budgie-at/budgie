import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    Db,
    ExternalSourceEnum,
    HistoricalExchangeRateEntityTable,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionTypeEnum,
    YieldKindEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { i18n } from '@lingui/core';
import * as Effect from 'effect/Effect';

import { AccountBalanceIncrementalService } from '../src/account/service/account-balance-incremental.service';
import { DepositPayoutService } from '../src/account/service/deposit-payout.service';

import { seed, TestLayer } from './ledger-test-layer';

i18n.loadAndActivate({ locale: 'en', messages: {} });

const OPENED_AT = new Date('2026-08-08T10:00:00.000Z');
const PAID_AT = new Date('2026-11-12T10:00:00.000Z');
const PAYOUT_TITLE = 'Виплата депозиту';

const seedEuro = Effect.gen(function* () {
    const euro = yield* (yield* seed).instrument({ code: 'TEU', name: 'Test euro', symbol: 'TE' });

    yield* (yield* Db).insert(HistoricalExchangeRateEntityTable).values([
        { sourceInstrumentId: euro.id, targetInstrumentId: 1, rateDate: '2026-01-01', rate: 50 },
        { sourceInstrumentId: 1, targetInstrumentId: euro.id, rateDate: '2026-01-01', rate: 0.02 }
    ]);

    return euro;
});

const seedCard = (title: string, instrumentId: number, integrationId: number) =>
    Effect.gen(function* () {
        const card = yield* (yield* seed).account({
            type: AccountTypeEnum.BANK_SYNC,
            title,
            externalId: title,
            externalSource: ExternalSourceEnum.MONOBANK,
            instrumentId
        });

        return yield* (yield* AccountRepository).updateById(card.id, { integrationId });
    });

const seedDeposit = (input: {
    readonly title: string;
    readonly source: { readonly id: number };
    readonly instrumentId: number;
    readonly integrationId: number;
    readonly sourceAmount: number;
    readonly receivedAmount: number;
    readonly type?: AccountTypeEnum;
}) =>
    Effect.gen(function* () {
        const testSeedService = yield* seed;
        const deposit = yield* testSeedService.account({
            type: input.type ?? AccountTypeEnum.DEPOSIT,
            title: input.title,
            instrumentId: input.instrumentId
        });

        yield* (yield* AccountRepository).updateById(deposit.id, { integrationId: input.integrationId });
        const opening = yield* testSeedService.directTransfer({
            exchangeRate: input.sourceAmount / input.receivedAmount,
            operatedAt: OPENED_AT,
            sourceAccountId: input.source.id,
            sourceAmount: convertToMicroUnits(input.sourceAmount),
            sourceEntryExchangeRate: 1,
            targetAccountId: deposit.id,
            targetAmount: convertToMicroUnits(input.receivedAmount),
            title: 'Відкриття депозиту',
            toIban: null
        });
        yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([input.source.id, deposit.id]);

        return { deposit, opening };
    });

const seedPayout = (accountId: number, amount: number, title: string) =>
    Effect.flatMap(seed, testSeedService =>
        testSeedService.manualExpense({
            accountId,
            amount: convertToMicroUnits(amount),
            operatedAt: PAID_AT,
            title,
            externalId: `payout-${accountId}-${amount}`,
            externalSource: ExternalSourceEnum.MONOBANK,
            type: TransactionTypeEnum.INCOME
        })
    );

const seedTransfer = (sourceAccountId: number, targetAccountId: number, amount: number, operatedAt: Date) =>
    Effect.flatMap(seed, testSeedService =>
        testSeedService.directTransfer({
            exchangeRate: 1,
            operatedAt,
            sourceAccountId,
            sourceAmount: convertToMicroUnits(amount),
            sourceEntryExchangeRate: 1,
            targetAccountId,
            targetAmount: convertToMicroUnits(amount),
            toIban: null
        })
    );

const seedCrossCurrencyDeposit = (receivedAmount: number) =>
    Effect.gen(function* () {
        const integration = yield* (yield* seed).bankIntegration();
        const euro = yield* seedEuro;
        const hryvniaCard = yield* seedCard('Hryvnia card', 1, integration.id);
        const euroCard = yield* seedCard('Euro card', euro.id, integration.id);
        const { deposit, opening } = yield* seedDeposit({
            title: 'VIS',
            source: hryvniaCard,
            instrumentId: euro.id,
            integrationId: integration.id,
            sourceAmount: 104_040,
            receivedAmount
        });

        return { hryvniaCard, euroCard, deposit, opening };
    });

const seedSameCurrency = Effect.gen(function* () {
    const integration = yield* (yield* seed).bankIntegration();
    const euro = yield* seedEuro;
    const card = yield* seedCard('Euro card', euro.id, integration.id);

    return {
        integration,
        euro,
        card,
        input: { source: card, instrumentId: euro.id, integrationId: integration.id, sourceAmount: 1000, receivedAmount: 1000 }
    };
});

const seedSameCurrencyDeposit = Effect.gen(function* () {
    const { card, input } = yield* seedSameCurrency;
    const { deposit } = yield* seedDeposit({ ...input, title: 'Deposit' });

    return { card, deposit };
});

const reconcile = Effect.flatMap(DepositPayoutService, service => service.reconcile(null));

const closeDepositTo = (depositAccountId: number, destinationAccountId: number, amountReceived: number) =>
    Effect.flatMap(DepositPayoutService, service => service.closeDepositTo(depositAccountId, destinationAccountId, amountReceived));

const ledgerBalanceOf = (accountId: number) =>
    Effect.flatMap(AccountBalanceRepository, repository => repository.getLedgerBalances([accountId])).pipe(
        Effect.map(balances => balances.get(accountId) ?? 0)
    );

const historyOf = (accountId: number) =>
    Effect.flatMap(TransactionRepository, repository => repository.findByAccountIdsWithEntries([accountId]));

const transactionOf = (transactionId: number) =>
    Effect.flatMap(TransactionRepository, repository => repository.getByIdWithEntries(transactionId));

const isActive = (accountId: number) =>
    Effect.map(
        Effect.flatMap(AccountRepository, repository => repository.findById(accountId)),
        account => account?.isActive
    );

const expectClosed = (accountId: number) =>
    Effect.gen(function* () {
        expect(yield* ledgerBalanceOf(accountId)).toBe(0);
        expect(yield* isActive(accountId)).toBe(false);
        yield* assertStoredBalancesMatchLedger(yield* Db);
    });

const expectStillIncome = (transactionId: number, depositAccountId: number) =>
    Effect.gen(function* () {
        expect((yield* transactionOf(transactionId))?.type).toBe(TransactionTypeEnum.INCOME);
        expect(yield* ledgerBalanceOf(depositAccountId)).toBe(convertToMicroUnits(1000));
        expect(yield* isActive(depositAccountId)).toBe(true);
    });

const interestOf = (accountId: number) =>
    Effect.map(historyOf(accountId), transactions =>
        transactions
            .filter(transaction => transaction.yieldKind === YieldKindEnum.INTEREST)
            .map(transaction => transaction.entries[0].amount)
    );

const expectSettled = (payoutId: number, depositId: number, interest: number) =>
    Effect.gen(function* () {
        expect((yield* transactionOf(payoutId))?.type).toBe(TransactionTypeEnum.TRANSFER);
        expect(yield* interestOf(depositId)).toEqual([convertToMicroUnits(interest)]);
        yield* expectClosed(depositId);
    });

describe('deposit payout', () => {
    it.effect('links a titled payout, corrects the estimated cross-currency opening and closes the deposit', () =>
        Effect.gen(function* () {
            const { hryvniaCard, euroCard, deposit, opening } = yield* seedCrossCurrencyDeposit(2004.62);
            const payout = yield* seedPayout(euroCard.id, 2000.39, PAYOUT_TITLE);

            yield* reconcile;

            const correctedOpening = yield* transactionOf(opening.id);
            const converted = yield* transactionOf(payout.id);

            expect(correctedOpening?.entries.find(entry => entry.accountId === deposit.id)?.amount).toBe(convertToMicroUnits(2000));
            expect(correctedOpening?.entries.find(entry => entry.accountId === hryvniaCard.id)?.amount).toBe(convertToMicroUnits(104_040));
            expect(correctedOpening?.exchangeRate).toBeCloseTo(52.02, 2);
            expect(converted).toMatchObject({ type: TransactionTypeEnum.TRANSFER, fromAccountId: deposit.id, toAccountId: euroCard.id });
            expect(yield* interestOf(deposit.id)).toEqual([convertToMicroUnits(0.39)]);
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(0);
            expect(yield* ledgerBalanceOf(euroCard.id)).toBe(convertToMicroUnits(2000.39));
            expect(yield* isActive(deposit.id)).toBe(false);
            yield* assertStoredBalancesMatchLedger(yield* Db);

            const transactionCount = (yield* historyOf(deposit.id)).length;

            yield* reconcile;

            expect((yield* historyOf(deposit.id)).length).toBe(transactionCount);
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the cross-currency opening when the payout exceeds it and books the excess as interest', () =>
        Effect.gen(function* () {
            const { euroCard, deposit, opening } = yield* seedCrossCurrencyDeposit(2000.5);

            yield* seedPayout(euroCard.id, 2001.25, PAYOUT_TITLE);
            yield* reconcile;

            expect((yield* transactionOf(opening.id))?.entries.find(entry => entry.accountId === deposit.id)?.amount).toBe(
                convertToMicroUnits(2000.5)
            );
            expect(yield* interestOf(deposit.id)).toEqual([convertToMicroUnits(0.75)]);
            yield* expectClosed(deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('uses the exact deposit-currency amount of a payout landing on another currency account', () =>
        Effect.gen(function* () {
            const { integration, euro, card, input } = yield* seedSameCurrency;
            const hryvniaCard = yield* seedCard('Hryvnia card', 1, integration.id);
            const { deposit } = yield* seedDeposit({ ...input, source: card, instrumentId: euro.id, title: 'Deposit' });
            const payout = yield* seedPayout(hryvniaCard.id, 50_000, PAYOUT_TITLE);
            const [entry] = (yield* transactionOf(payout.id))?.entries ?? [];

            yield* (yield* TransactionEntryRepository).updateById(entry.id, {
                operationInstrumentId: euro.id,
                operationAmount: convertToMicroUnits(1010)
            });
            yield* reconcile;

            yield* expectSettled(payout.id, deposit.id, 10);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves a smaller titled payout in another currency without an exact amount as income', () =>
        Effect.gen(function* () {
            const { integration, input } = yield* seedSameCurrency;
            const hryvniaCard = yield* seedCard('Hryvnia card', 1, integration.id);
            const { deposit } = yield* seedDeposit({ ...input, title: 'Deposit' });
            const payout = yield* seedPayout(hryvniaCard.id, 10_000, PAYOUT_TITLE);

            yield* reconcile;

            yield* expectStillIncome(payout.id, deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves an untitled payout as income', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;

            yield* (yield* AccountRepository).updateById(deposit.id, { deadline: PAID_AT });
            const payout = yield* seedPayout(card.id, 1012.5, 'Monobank');

            yield* reconcile;

            yield* expectStillIncome(payout.id, deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves a titled payout from another bank integration as income', () =>
        Effect.gen(function* () {
            const { euro, input } = yield* seedSameCurrency;
            const { deposit } = yield* seedDeposit({ ...input, title: 'Deposit' });
            const otherIntegration = yield* (yield* seed).bankIntegration({ token: 'other-bank' });
            const otherCard = yield* seedCard('Other euro card', euro.id, otherIntegration.id);
            const payout = yield* seedPayout(otherCard.id, 1010, PAYOUT_TITLE);

            yield* reconcile;

            yield* expectStillIncome(payout.id, deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('links a titled payout to a deposit without a bank integration', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;

            yield* (yield* AccountRepository).updateById(deposit.id, { integrationId: null });
            const payout = yield* seedPayout(card.id, 1010, PAYOUT_TITLE);

            yield* reconcile;

            yield* expectSettled(payout.id, deposit.id, 10);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('links a payout titled in another supported language', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;
            const payout = yield* seedPayout(card.id, 1010, 'Festgeldauszahlung 12 Monate');

            yield* reconcile;

            yield* expectSettled(payout.id, deposit.id, 10);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves an untitled income matching only by amount as income away from maturity', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;
            const salary = yield* seedPayout(card.id, 1000, 'Salary');

            yield* reconcile;

            yield* expectStillIncome(salary.id, deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books a same-currency shortfall on a full close as a bank fee', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;

            yield* seedPayout(card.id, 995, PAYOUT_TITLE);
            yield* reconcile;

            const fees = (yield* historyOf(deposit.id)).filter(transaction => transaction.type === TransactionTypeEnum.EXPENSE);

            expect(fees.map(fee => [fee.entries[0].categoryId, fee.entries[0].amount])).toEqual([
                [BANK_FEE_CATEGORY_ID, convertToMicroUnits(5)]
            ]);
            yield* expectClosed(deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('treats a smaller titled payout as a partial withdrawal and keeps the deposit open', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;
            const payout = yield* seedPayout(card.id, 300, PAYOUT_TITLE);

            yield* reconcile;

            expect((yield* transactionOf(payout.id))?.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(yield* interestOf(deposit.id)).toEqual([]);
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(convertToMicroUnits(700));
            expect(yield* isActive(deposit.id)).toBe(true);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('links the closest of several matching deposits', () =>
        Effect.gen(function* () {
            const { card, input } = yield* seedSameCurrency;
            const far = yield* seedDeposit({ ...input, title: 'Far' });
            const close = yield* seedDeposit({ ...input, title: 'Close', sourceAmount: 1020, receivedAmount: 1020 });

            yield* seedPayout(card.id, 1019, PAYOUT_TITLE);
            yield* reconcile;

            expect(yield* ledgerBalanceOf(close.deposit.id)).toBe(0);
            expect(yield* ledgerBalanceOf(far.deposit.id)).toBe(convertToMicroUnits(1000));
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves a payout that ties between deposits as income', () =>
        Effect.gen(function* () {
            const { card, input } = yield* seedSameCurrency;

            yield* seedDeposit({ ...input, title: 'First' });
            yield* seedDeposit({ ...input, title: 'Second' });
            const payout = yield* seedPayout(card.id, 1000, PAYOUT_TITLE);

            yield* reconcile;

            expect((yield* transactionOf(payout.id))?.type).toBe(TransactionTypeEnum.INCOME);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('adopts a synced payout when the deposit is closed by hand instead of creating a second transfer', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;
            const payout = yield* seedPayout(card.id, 1010, PAYOUT_TITLE);

            yield* closeDepositTo(deposit.id, card.id, 1008);

            expect((yield* transactionOf(payout.id))?.type).toBe(TransactionTypeEnum.TRANSFER);
            expect((yield* historyOf(card.id)).filter(transaction => transaction.toAccountId === card.id).length).toBe(1);
            expect(yield* interestOf(deposit.id)).toEqual([convertToMicroUnits(10)]);
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(0);
            expect(yield* ledgerBalanceOf(card.id)).toBe(convertToMicroUnits(10));
            expect(yield* isActive(deposit.id)).toBe(false);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores a manual close of a deposit the payout already settled', () =>
        Effect.gen(function* () {
            const { card, deposit } = yield* seedSameCurrencyDeposit;

            yield* seedPayout(card.id, 1010, PAYOUT_TITLE);
            yield* reconcile;
            const transactionCount = (yield* historyOf(deposit.id)).length;

            yield* closeDepositTo(deposit.id, card.id, 1000);

            expect((yield* historyOf(deposit.id)).length).toBe(transactionCount);
            yield* expectClosed(deposit.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books no interest for an overdrawn account whose outflow is not a bank deposit payout', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const { euro, card } = yield* seedSameCurrency;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Savings', instrumentId: euro.id });
            yield* seedTransfer(card.id, account.id, 1000, OPENED_AT);
            const withdrawal = yield* seedTransfer(account.id, card.id, 1005, PAID_AT);

            yield* testSeedService.updateTransaction(withdrawal.id, { externalSource: ExternalSourceEnum.MONOBANK });
            yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([card.id, account.id]);
            yield* reconcile;

            expect(yield* interestOf(account.id)).toEqual([]);
            expect(yield* ledgerBalanceOf(account.id)).toBe(-convertToMicroUnits(5));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('splits interest out of payouts already linked as transfers, once', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const { integration, euro, card } = yield* seedSameCurrency;
            const deposit = yield* testSeedService.account({ type: AccountTypeEnum.BANK, title: 'Old deposit', instrumentId: euro.id });
            const legs = [
                [4060, 4060.79],
                [3650, 3650.71],
                [426, 426.08]
            ];

            yield* (yield* AccountRepository).updateById(deposit.id, { integrationId: integration.id });
            yield* Effect.forEach(
                [
                    [card.id, deposit.id],
                    [deposit.id, card.id]
                ],
                ([sourceAccountId, targetAccountId], index) =>
                    seedTransfer(sourceAccountId, targetAccountId, 812, new Date(OPENED_AT.getTime() - (2 - index) * 86_400_000)),
                { discard: true }
            );
            yield* Effect.forEach(
                legs,
                ([principal, payout], index) =>
                    Effect.gen(function* () {
                        const openedAt = new Date(OPENED_AT.getTime() + index * 30 * 86_400_000);
                        yield* seedTransfer(card.id, deposit.id, principal, openedAt);
                        const paid = yield* seedTransfer(deposit.id, card.id, payout, new Date(openedAt.getTime() + 86_400_000));

                        yield* testSeedService.updateTransaction(paid.id, {
                            externalSource: ExternalSourceEnum.MONOBANK,
                            title: PAYOUT_TITLE
                        });
                    }),
                { discard: true }
            );
            yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([card.id, deposit.id]);

            expect(yield* ledgerBalanceOf(deposit.id)).toBe(-convertToMicroUnits(1.58));

            yield* reconcile;

            expect(yield* interestOf(deposit.id)).toEqual([
                convertToMicroUnits(0.79),
                convertToMicroUnits(0.71),
                convertToMicroUnits(0.08)
            ]);
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(0);
            yield* assertStoredBalancesMatchLedger(yield* Db);

            yield* reconcile;

            expect((yield* interestOf(deposit.id)).length).toBe(3);
            expect(yield* ledgerBalanceOf(deposit.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
