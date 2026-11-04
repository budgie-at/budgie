import {
    AccountTypeEnum,
    AccountEntityTable,
    DividendPayoutEnum,
    ExternalSourceEnum,
    InstrumentEntityTable,
    InstrumentPriceProviderEnum,
    InstrumentTypeEnum,
    INVESTMENTS_CATEGORY_ID,
    PRECISION,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { InzhurImportOutcomeEnum, InzhurNotSetUpError, InzhurSetupService, InzhurStatementInvalidError } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, testDb } from '../../harness';
import { buildForeignDocumentItems } from '../../harness/inzhur/build-foreign-document-items';
import { buildInzhurBaselineItems, buildInzhurHoldings } from '../../harness/inzhur/build-inzhur-baseline-items';
import { buildInzhurStatementItems } from '../../harness/inzhur/build-inzhur-statement-items';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { INZHUR_ENERGY_LAYOUT, INZHUR_REIT_LAYOUT, INZHUR_UNKNOWN_LAYOUT } from '../../harness/inzhur/inzhur-fund-layouts';
import {
    FIRST_DATE,
    FIRST_URI,
    REIT_PRICE,
    SECOND_DATE,
    SECOND_DATE_ISO,
    SECOND_URI
} from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurLayer } from '../../harness/inzhur/make-inzhur-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';
import { setInzhurPayout } from '../../harness/inzhur/set-inzhur-payout';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const FOREIGN_URI = 'foreign.pdf';

describe('inzhur/statement-import', () => {
    it.effect('takes the first statement as the starting point and leaves cash untouched', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(1000, 1950, 2);
            const setup = yield* requireInzhurSetup();

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1000 * PRECISION);
            expect(yield* fetchInzhurLedger()).toEqual([]);
            expect(setup.lastStatementDate).toBe('2026-09-30');
            expect([reitAccount, energyAccount].map(account => [account.type, account.dividendPayout, account.integrationId])).toEqual([
                [AccountTypeEnum.STOCKS, DividendPayoutEnum.REINVEST, setup.integration.id],
                [AccountTypeEnum.STOCKS, DividendPayoutEnum.REINVEST, setup.integration.id]
            ]);
            expect(setup.cashAccount).toMatchObject({ type: AccountTypeEnum.BANK_SYNC, externalSource: ExternalSourceEnum.INZHUR });
        }).pipe(Effect.provide(makeInzhurLayer({ [FIRST_URI]: buildInzhurBaselineItems(1950, 2) })))
    );

    it.effect('turns a buy and a sell between statements into exchanges with the cash account', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);

            const summary = yield* importInzhurStatement(SECOND_URI);
            const ledger = yield* fetchInzhurLedger();

            expect(summary).toMatchObject({ outcome: InzhurImportOutcomeEnum.APPLIED, statementDate: SECOND_DATE_ISO, cashMoved: 3500 });
            expect(summary.estimatedDividendAmount).toBe(0);
            expect(summary.funds.map(fund => [fund.isin, fund.deltaQuantity, fund.exchangedAmount, fund.dividendAmount])).toEqual([
                [INZHUR_REIT_LAYOUT.isin, 50, 500, 0],
                [INZHUR_ENERGY_LAYOUT.isin, -1, 4000, 0]
            ]);
            expect(ledger.map(({ type, externalId, title }) => [type, externalId, title])).toEqual([
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:buy`, 'Inzhur REIT'],
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_ENERGY_LAYOUT.isin}:sell`, 'Inzhur Energy']
            ]);
            expect(ledger[0].entries).toEqual([
                { accountId: cashAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 500 * PRECISION, categoryId: null },
                { accountId: reitAccount.id, type: TransactionEntryTypeEnum.DEBIT, amount: 50 * PRECISION, categoryId: null }
            ]);
            expect(ledger[1].entries).toEqual([
                { accountId: energyAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: PRECISION, categoryId: null },
                { accountId: cashAccount.id, type: TransactionEntryTypeEnum.DEBIT, amount: 4000 * PRECISION, categoryId: null }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(4500 * PRECISION);
            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(1050 * PRECISION);
            expect(yield* fetchAccountBalance(energyAccount.id)).toBe(PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1050, 1))
                })
            )
        )
    );

    it.effect('records buys beyond the cash as reinvested dividends when both funds reinvest', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);

            const summary = yield* importInzhurStatement(SECOND_URI);
            const ledger = yield* fetchInzhurLedger();

            expect(summary.estimatedDividendAmount).toBe(4900);
            expect(summary.cashMoved).toBe(-100);
            expect(summary.funds.map(fund => [fund.dividendAmount, fund.isPayoutSettingStale])).toEqual([
                [980, false],
                [3920, false]
            ]);
            expect(ledger.map(({ type, externalId }) => [type, externalId])).toEqual([
                [TransactionTypeEnum.INCOME, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:dividend`],
                [TransactionTypeEnum.INCOME, `inzhur:${SECOND_DATE_ISO}:${INZHUR_ENERGY_LAYOUT.isin}:dividend`],
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:buy`],
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_ENERGY_LAYOUT.isin}:buy`]
            ]);
            expect(ledger[0]).toMatchObject({
                title: 'Inzhur REIT',
                entries: [
                    {
                        accountId: cashAccount.id,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: 980 * PRECISION,
                        categoryId: INVESTMENTS_CATEGORY_ID
                    }
                ]
            });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(0);
            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(1100 * PRECISION);
            expect(yield* fetchAccountBalance(energyAccount.id)).toBe(3 * PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1100, 3))
                })
            )
        )
    );

    it.effect('settles the bank-payout fund with cash and reinvests only the other fund', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);
            yield* setInzhurPayout(reitAccount.id, DividendPayoutEnum.BANK);

            const summary = yield* importInzhurStatement(SECOND_URI);

            expect(summary.funds.map(fund => [fund.dividendAmount, fund.isPayoutSettingStale])).toEqual([
                [0, false],
                [4000, false]
            ]);
            expect((yield* fetchInzhurLedger()).filter(({ type }) => type === TransactionTypeEnum.INCOME)).toHaveLength(1);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(0);
            expect(yield* fetchAccountBalance(energyAccount.id)).toBe(3 * PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1100, 3))
                })
            )
        )
    );

    it.effect('estimates dividends on funds with a stale bank payout so cash never goes negative', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);
            yield* setInzhurPayout(reitAccount.id, DividendPayoutEnum.BANK);
            yield* setInzhurPayout(energyAccount.id, DividendPayoutEnum.BANK);

            const summary = yield* importInzhurStatement(SECOND_URI);

            expect(summary.funds.map(fund => [fund.dividendAmount, fund.isPayoutSettingStale])).toEqual([
                [980, true],
                [3920, true]
            ]);
            expect(summary.estimatedDividendAmount).toBe(4900);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(0);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1100, 3))
                })
            )
        )
    );

    it.effect('records the quantity change without cash movement when no price exists at all', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            const { cashAccount } = yield* inzhurSetupService.setup(1000);
            yield* importInzhurStatement(FIRST_URI);

            const summary = yield* importInzhurStatement(SECOND_URI);
            const reitAccount = yield* requireInzhurFundAccount(INZHUR_REIT_LAYOUT.isin);

            expect(summary.funds).toMatchObject([
                { isin: INZHUR_REIT_LAYOUT.isin, deltaQuantity: 50, isPriceMissing: true, exchangedAmount: 0 }
            ]);
            expect(summary.cashMoved).toBe(0);
            expect(yield* fetchInzhurLedger()).toEqual([]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1000 * PRECISION);
            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(1050 * PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1050, 2))
                })
            )
        )
    );

    it.effect('falls back to the nearest available price when none exists on or before the statement date', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(1000);
            yield* importInzhurStatement(FIRST_URI);
            yield* seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, '2026-11-02', REIT_PRICE);

            const summary = yield* importInzhurStatement(SECOND_URI);

            expect(summary.funds).toMatchObject([{ deltaQuantity: 50, exchangedAmount: 500, isPriceMissing: false }]);
            expect(summary.cashMoved).toBe(-500);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1050, 2))
                })
            )
        )
    );

    it.effect('changes nothing when the same or an older statement is imported again', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);
            yield* importInzhurStatement(SECOND_URI);
            const ledgerBefore = yield* fetchInzhurLedger();
            const balancesBefore = [yield* fetchAccountBalance(cashAccount.id), yield* fetchAccountBalance(reitAccount.id)];

            const sameDate = yield* importInzhurStatement(SECOND_URI);
            const olderDate = yield* importInzhurStatement(FIRST_URI);

            expect([sameDate.outcome, olderDate.outcome]).toEqual([InzhurImportOutcomeEnum.UNCHANGED, InzhurImportOutcomeEnum.UNCHANGED]);
            expect(yield* fetchInzhurLedger()).toEqual(ledgerBefore);
            expect([yield* fetchAccountBalance(cashAccount.id), yield* fetchAccountBalance(reitAccount.id)]).toEqual(balancesBefore);
            expect((yield* requireInzhurSetup()).lastStatementDate).toBe(SECOND_DATE_ISO);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1050, 2))
                })
            )
        )
    );

    it.effect('creates a fund instrument and account for an unknown ISIN without reading personal data', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(0);

            const summary = yield* importInzhurStatement(FIRST_URI);
            const account = yield* requireInzhurFundAccount(INZHUR_UNKNOWN_LAYOUT.isin);
            const [instrument] = yield* testDb
                .select()
                .from(InstrumentEntityTable)
                .where(eq(InstrumentEntityTable.code, INZHUR_UNKNOWN_LAYOUT.isin));
            const storedText = JSON.stringify([
                summary,
                yield* testDb.select().from(AccountEntityTable),
                yield* testDb.select().from(InstrumentEntityTable)
            ]);

            expect(instrument).toMatchObject({
                type: InstrumentTypeEnum.FUND,
                name: 'ІНЖУР ТЕСТ',
                priceProvider: InstrumentPriceProviderEnum.INZHUR,
                providerInstrumentId: INZHUR_UNKNOWN_LAYOUT.isin
            });
            expect(account).toMatchObject({
                type: AccountTypeEnum.STOCKS,
                instrumentId: instrument.id,
                dividendPayout: DividendPayoutEnum.REINVEST
            });
            expect(yield* fetchAccountBalance(account.id)).toBe(7 * PRECISION);
            expect(['Тестенко', '0000000000', '000000-IN00000000', '000000000'].filter(secret => storedText.includes(secret))).toEqual([]);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurStatementItems(FIRST_DATE, [
                        { layout: INZHUR_REIT_LAYOUT, quantity: 1 },
                        { layout: INZHUR_UNKNOWN_LAYOUT, quantity: 7 }
                    ])
                })
            )
        )
    );

    it.effect('fails with a typed error for a document that is not an Inzhur statement', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(0);

            const error = yield* Effect.flip(importInzhurStatement(FOREIGN_URI));

            expect(error).toBeInstanceOf(InzhurStatementInvalidError);
        }).pipe(Effect.provide(makeInzhurLayer({ [FOREIGN_URI]: buildForeignDocumentItems() })))
    );

    it.effect('fails with a typed error when Inzhur has not been set up yet', () =>
        Effect.gen(function* () {
            const error = yield* Effect.flip(importInzhurStatement(FIRST_URI));

            expect(error).toBeInstanceOf(InzhurNotSetUpError);
        }).pipe(Effect.provide(makeInzhurLayer({ [FIRST_URI]: buildInzhurBaselineItems(1000, 2) })))
    );
});
