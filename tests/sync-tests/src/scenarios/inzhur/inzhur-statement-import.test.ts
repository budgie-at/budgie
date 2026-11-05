import {
    AccountTypeEnum,
    AccountEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    DividendPayoutEnum,
    ExternalSourceEnum,
    InstrumentEntityTable,
    InstrumentPriceProviderEnum,
    InstrumentTypeEnum,
    INVESTMENTS_CATEGORY_ID,
    LanguageEnum,
    PRECISION,
    SyncRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionViewRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import {
    InzhurImportOutcomeEnum,
    InzhurNotSetUpError,
    InzhurPriceMissingError,
    InzhurSetupService,
    InzhurStatementInvalidError
} from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, testDb } from '../../harness';
import { buildForeignDocumentItems } from '../../harness/inzhur/build-foreign-document-items';
import { buildInzhurBaselineItems } from '../../harness/inzhur/build-inzhur-baseline-items';
import { buildInzhurStatementItems } from '../../harness/inzhur/build-inzhur-statement-items';
import { expectBaselineUntouched } from '../../harness/inzhur/expect-baseline-untouched';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { importBaselineFundInstrument } from '../../harness/inzhur/import-baseline-fund-instrument';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { importWithBankPayoutReit } from '../../harness/inzhur/import-with-bank-payout-reit';
import {
    INZHUR_ENERGY_LAYOUT,
    INZHUR_MILTECH_LAYOUT,
    INZHUR_REIT_LAYOUT,
    INZHUR_UNKNOWN_LAYOUT,
    INZHUR_UNQUOTED_LAYOUT,
    INZHUR_UNTERMINATED_LAYOUT
} from '../../harness/inzhur/inzhur-fund-layouts';
import {
    FIRST_DATE,
    FIRST_URI,
    REIT_PRICE,
    SECOND_DATE,
    SECOND_DATE_ISO,
    SECOND_URI
} from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurFollowUpLayer } from '../../harness/inzhur/make-inzhur-follow-up-layer';
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
            expect([reitAccount, energyAccount].map(account => account.icon)).toEqual([UserIconNameEnum.Building2, UserIconNameEnum.Zap]);
            expect([reitAccount, energyAccount].map(account => [account.type, account.dividendPayout, account.integrationId])).toEqual([
                [AccountTypeEnum.STOCKS, DividendPayoutEnum.REINVEST, setup.integration.id],
                [AccountTypeEnum.STOCKS, DividendPayoutEnum.REINVEST, setup.integration.id]
            ]);
            expect(setup.cashAccount).toMatchObject({ type: AccountTypeEnum.BANK_SYNC, externalSource: ExternalSourceEnum.INZHUR });

            const adjustments = yield* testDb
                .select({ title: TransactionEntityTable.title })
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT));

            expect(adjustments.map(adjustment => adjustment.title).sort()).toEqual(['', 'Opening holdings', 'Opening holdings']);
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
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:buy`, 'Bought REIT'],
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_ENERGY_LAYOUT.isin}:sell`, 'Sold Energy']
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
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1050, 1)))
    );

    it.effect('records buys beyond the cash as reinvested dividends when both funds reinvest', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);

            const summary = yield* importInzhurStatement(SECOND_URI);
            const ledger = yield* fetchInzhurLedger();

            expect(summary.estimatedDividendAmount).toBe(4900);
            expect(summary.cashMoved).toBe(-100);
            expect(summary.funds.map(fund => fund.dividendAmount)).toEqual([980, 3920]);
            expect(summary.uncoveredCashAmount).toBe(0);
            expect(ledger.map(({ type, externalId }) => [type, externalId])).toEqual([
                [TransactionTypeEnum.INCOME, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:dividend`],
                [TransactionTypeEnum.INCOME, `inzhur:${SECOND_DATE_ISO}:${INZHUR_ENERGY_LAYOUT.isin}:dividend`],
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:buy`],
                [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_ENERGY_LAYOUT.isin}:buy`]
            ]);
            expect(ledger.slice(0, 2).map(({ fundAccountId }) => fundAccountId)).toEqual([reitAccount.id, energyAccount.id]);
            expect(ledger.slice(2).map(({ fundAccountId }) => fundAccountId)).toEqual([null, null]);
            expect(ledger[0]).toMatchObject({
                title: 'REIT dividends',
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
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1100, 3)))
    );

    it.effect('lists the reinvested dividends of a fund in that fund account transactions', () =>
        Effect.gen(function* () {
            const { reitAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);

            yield* importInzhurStatement(SECOND_URI);
            const transactionViewRepository = yield* TransactionViewRepository;
            const transactions = yield* transactionViewRepository.getAll(
                10,
                { ...DEFAULT_TRANSACTION_FILTER, accountIds: [reitAccount.id] },
                LanguageEnum.EN
            );

            expect(transactions.map(({ type, externalId }) => [type, externalId])).toEqual(
                expect.arrayContaining([
                    [TransactionTypeEnum.INCOME, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:dividend`],
                    [TransactionTypeEnum.TRANSFER, `inzhur:${SECOND_DATE_ISO}:${INZHUR_REIT_LAYOUT.isin}:buy`]
                ])
            );
            expect(transactions.map(({ externalId }) => externalId)).not.toContain(
                `inzhur:${SECOND_DATE_ISO}:${INZHUR_ENERGY_LAYOUT.isin}:dividend`
            );
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1100, 3)))
    );

    it.effect('settles the bank-payout fund with cash and reinvests only the other fund', () =>
        Effect.gen(function* () {
            const { cashAccount, energyAccount, summary } = yield* importWithBankPayoutReit(1000);

            expect(summary.funds.map(fund => fund.dividendAmount)).toEqual([0, 4000]);
            expect((yield* fetchInzhurLedger()).filter(({ type }) => type === TransactionTypeEnum.INCOME)).toHaveLength(1);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(0);
            expect(yield* fetchAccountBalance(energyAccount.id)).toBe(3 * PRECISION);
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1100, 3)))
    );

    it.effect('leaves the cash account negative for bank-payout funds and reports the uncovered amount', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount, energyAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);
            yield* setInzhurPayout(reitAccount.id, DividendPayoutEnum.BANK);
            yield* setInzhurPayout(energyAccount.id, DividendPayoutEnum.BANK);

            const summary = yield* importInzhurStatement(SECOND_URI);
            const ledger = yield* fetchInzhurLedger();

            expect(summary.funds.map(fund => fund.dividendAmount)).toEqual([0, 0]);
            expect(summary).toMatchObject({ estimatedDividendAmount: 0, uncoveredCashAmount: 4900, cashMoved: -5000 });
            expect(ledger.map(({ type }) => type)).toEqual([TransactionTypeEnum.TRANSFER, TransactionTypeEnum.TRANSFER]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(-4900 * PRECISION);
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1100, 3)))
    );

    it.effect('estimates only the reinvesting fund when the bank-payout fund exhausts the cash first', () =>
        Effect.gen(function* () {
            const { cashAccount, summary } = yield* importWithBankPayoutReit(600);

            expect(summary.funds.map(fund => fund.dividendAmount)).toEqual([0, 4000]);
            expect(summary.uncoveredCashAmount).toBe(400);
            expect(
                (yield* fetchInzhurLedger())
                    .filter(transaction => transaction.type === TransactionTypeEnum.TRANSFER)
                    .map(transaction => transaction.title)
            ).toEqual(['Bought REIT', 'Bought Energy']);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(-400 * PRECISION);
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1100, 3)))
    );

    it.effect('fails with the unpriced fund names and writes nothing when a changed fund has no price', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            const { cashAccount } = yield* inzhurSetupService.setup(1000);
            yield* importInzhurStatement(FIRST_URI);
            const reitAccount = yield* requireInzhurFundAccount(INZHUR_REIT_LAYOUT.isin);

            const error = yield* Effect.flip(importInzhurStatement(SECOND_URI));

            expect(error).toBeInstanceOf(InzhurPriceMissingError);
            expect(error).toMatchObject({ fundNames: ['Inzhur REIT'] });
            yield* expectBaselineUntouched(cashAccount.id, reitAccount.id);
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1050, 2)))
    );

    it.effect('reads the quantity from a row whose quantity and total face value are merged into one text item', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(0);

            yield* importInzhurStatement(FIRST_URI);

            const reitAccount = yield* requireInzhurFundAccount(INZHUR_REIT_LAYOUT.isin);
            const energyAccount = yield* requireInzhurFundAccount(INZHUR_ENERGY_LAYOUT.isin);

            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(2283 * PRECISION);
            expect(yield* fetchAccountBalance(energyAccount.id)).toBe(3 * PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurStatementItems(FIRST_DATE, [
                        { layout: INZHUR_REIT_LAYOUT, quantity: 2283 },
                        { layout: INZHUR_ENERGY_LAYOUT, quantity: 3, isTotalMerged: true }
                    ])
                })
            )
        )
    );

    it.effect('needs no price for the baseline statement', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(0);

            const summary = yield* importInzhurStatement(FIRST_URI);

            expect(summary.outcome).toBe(InzhurImportOutcomeEnum.BASELINE);
        }).pipe(Effect.provide(makeInzhurLayer({ [FIRST_URI]: buildInzhurBaselineItems(1000, 2) })))
    );

    it.effect('uses the price nearest to the statement date, whether stored before or after it', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(1000);
            yield* importInzhurStatement(FIRST_URI);
            yield* seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, '2026-10-20', 8);
            yield* seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, '2026-11-02', REIT_PRICE);

            const summary = yield* importInzhurStatement(SECOND_URI);

            expect(summary.funds).toMatchObject([{ deltaQuantity: 50, exchangedAmount: 500 }]);
            expect(summary.cashMoved).toBe(-500);
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1050, 2)))
    );

    it.effect('prefers the earlier price when it is closer to the statement date', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(1000);
            yield* importInzhurStatement(FIRST_URI);
            yield* seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, '2026-10-30', 8);
            yield* seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, '2026-11-20', REIT_PRICE);

            const summary = yield* importInzhurStatement(SECOND_URI);

            expect(summary.funds).toMatchObject([{ deltaQuantity: 50, exchangedAmount: 400 }]);
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1050, 2)))
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
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1050, 2)))
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

    it.effect('names a new fund canonically when the statement name carries a known keyword', () =>
        Effect.gen(function* () {
            const instrument = yield* importBaselineFundInstrument(INZHUR_MILTECH_LAYOUT.isin);

            expect(instrument).toMatchObject({
                name: 'Inzhur MilTech',
                symbol: 'MILTECH',
                priceProvider: InstrumentPriceProviderEnum.INZHUR
            });
            expect(yield* requireInzhurFundAccount(INZHUR_MILTECH_LAYOUT.isin)).toMatchObject({ title: 'Inzhur MilTech' });
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurStatementItems(FIRST_DATE, [{ layout: INZHUR_MILTECH_LAYOUT, quantity: 3 }])
                })
            )
        )
    );

    it.effect('falls back to the ISIN as the name when the fund block has no quoted segment', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            yield* inzhurSetupService.setup(0);

            yield* importInzhurStatement(FIRST_URI);
            const instruments = yield* testDb.select().from(InstrumentEntityTable);

            expect(instruments.find(({ code }) => code === INZHUR_UNQUOTED_LAYOUT.isin)?.name).toBe(INZHUR_UNQUOTED_LAYOUT.isin);
            expect(instruments.find(({ code }) => code === INZHUR_UNKNOWN_LAYOUT.isin)?.name).toBe('ІНЖУР ТЕСТ');
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurStatementItems(FIRST_DATE, [
                        { layout: INZHUR_UNQUOTED_LAYOUT, quantity: 1 },
                        { layout: INZHUR_UNKNOWN_LAYOUT, quantity: 1 }
                    ])
                })
            )
        )
    );

    it.effect('never takes footer text as the fund name when the fund block has no status line', () =>
        Effect.gen(function* () {
            const instrument = yield* importBaselineFundInstrument(INZHUR_UNTERMINATED_LAYOUT.isin);

            expect(instrument.name).toBe(INZHUR_UNTERMINATED_LAYOUT.isin);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurStatementItems(
                        FIRST_DATE,
                        [{ layout: INZHUR_UNTERMINATED_LAYOUT, quantity: 1 }],
                        ['Депозитарна установа ТОВ "ІНЖУР КЕПІТАЛ"']
                    )
                })
            )
        )
    );

    it.effect('rejects a statement without holdings and liquidates nothing', () =>
        Effect.gen(function* () {
            const { cashAccount, reitAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);

            const error = yield* Effect.flip(importInzhurStatement(SECOND_URI));

            expect(error).toBeInstanceOf(InzhurStatementInvalidError);
            yield* expectBaselineUntouched(cashAccount.id, reitAccount.id);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, [])
                })
            )
        )
    );

    it.effect('treats a fund missing from a non-empty statement as sold', () =>
        Effect.gen(function* () {
            const { cashAccount, energyAccount } = yield* setUpInzhurWithBaseline(0, 1000, 2);

            const summary = yield* importInzhurStatement(SECOND_URI);

            expect(summary.funds.map(fund => [fund.isin, fund.deltaQuantity, fund.exchangedAmount])).toEqual([
                [INZHUR_ENERGY_LAYOUT.isin, -2, 8000]
            ]);
            expect(yield* fetchAccountBalance(energyAccount.id)).toBe(0);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(8000 * PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurLayer({
                    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
                    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, [{ layout: INZHUR_REIT_LAYOUT, quantity: 1000 }])
                })
            )
        )
    );

    it.effect('adjusts already existing fund accounts to the baseline quantity at the statement date', () =>
        Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const { reitAccount } = yield* setUpInzhurWithBaseline(0, 1000, 2);
            const { cashSync } = yield* requireInzhurSetup();
            yield* syncRepository.update(cashSync.id, { forwardSyncedAt: null });

            const summary = yield* importInzhurStatement(SECOND_URI);
            const adjustments = yield* testDb
                .select({ operatedAt: TransactionEntityTable.operatedAt, amount: TransactionEntryEntityTable.amount })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(eq(TransactionEntryEntityTable.accountId, reitAccount.id));

            expect(summary.outcome).toBe(InzhurImportOutcomeEnum.BASELINE);
            expect(summary.funds.map(fund => [fund.isin, fund.deltaQuantity])).toEqual([[INZHUR_REIT_LAYOUT.isin, 200]]);
            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(1200 * PRECISION);
            expect(adjustments.map(({ operatedAt }) => operatedAt.toISOString()).sort()).toEqual([
                '2026-09-30T12:00:00.000Z',
                `${SECOND_DATE_ISO}T12:00:00.000Z`
            ]);
        }).pipe(Effect.provide(makeInzhurFollowUpLayer(1200, 2)))
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
