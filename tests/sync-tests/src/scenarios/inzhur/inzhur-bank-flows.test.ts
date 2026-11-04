import {
    AccountTypeEnum,
    DividendPayoutEnum,
    ExternalSourceEnum,
    INVESTMENTS_CATEGORY_ID,
    PRECISION,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { InzhurImportOutcomeEnum, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, seed } from '../../harness';
import { buildInzhurBaselineItems, buildInzhurHoldings } from '../../harness/inzhur/build-inzhur-baseline-items';
import { buildInzhurStatementItems } from '../../harness/inzhur/build-inzhur-statement-items';
import { fetchBankTransactions } from '../../harness/inzhur/fetch-bank-transactions';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { INZHUR_ENERGY_LAYOUT, INZHUR_REIT_LAYOUT } from '../../harness/inzhur/inzhur-fund-layouts';
import { FIRST_URI, SECOND_DATE, SECOND_URI } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurLayer } from '../../harness/inzhur/make-inzhur-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { setInzhurPayout } from '../../harness/inzhur/set-inzhur-payout';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const UAH_INSTRUMENT_ID = 1;
const OPERATED_AT = new Date('2026-10-15T12:00:00.000Z');
const TOP_UP_DESCRIPTION = 'Оплата ТОВ "ІНЖУР КЕПІТАЛ" поповнення рахунку';
const DIVIDEND_DESCRIPTION = 'ТОВ ІНЖУР КЕПІТАЛ виплата доходу';
const FUND_TITLE = 'Inzhur REIT';

const layer = makeInzhurLayer({
    [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(1050, 2))
});

const consolidate = Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

const seedBankAccount = seed.account({
    title: 'Monobank Card',
    externalId: 'inzhur-test-card',
    externalSource: ExternalSourceEnum.MONOBANK,
    type: AccountTypeEnum.BANK_SYNC,
    instrumentId: UAH_INSTRUMENT_ID
});

const setUpBankFlow = Effect.fnUntraced(function* (openingCash: number) {
    const funds = yield* setUpInzhurWithBaseline(openingCash, 1000, 2);
    const bankAccount = yield* seedBankAccount;

    return { ...funds, bankAccount };
});

const fetchSingleBankTransaction = Effect.fnUntraced(function* () {
    const [transaction, ...rest] = yield* fetchBankTransactions();

    expect(rest).toEqual([]);

    return transaction;
});

describe('inzhur/bank-flows', () => {
    it.effect('turns a card payment to Inzhur into a transfer into the cash account', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, reitAccount } = yield* setUpBankFlow(0);

            yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);
            yield* consolidate;

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                fromAccountId: bankAccount.id,
                toAccountId: cashAccount.id,
                entries: [
                    { accountId: bankAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 1000 * PRECISION },
                    { accountId: cashAccount.id, type: TransactionEntryTypeEnum.DEBIT, amount: 1000 * PRECISION }
                ]
            });
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-1000 * PRECISION);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1000 * PRECISION);
            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(1000 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('reduces the topped-up cash once and raises the fund quantity when the statement shows a buy', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, reitAccount } = yield* setUpBankFlow(0);

            yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);
            yield* consolidate;
            const summary = yield* importInzhurStatement(SECOND_URI);

            expect(summary).toMatchObject({ outcome: InzhurImportOutcomeEnum.APPLIED, cashMoved: -500, estimatedDividendAmount: 0 });
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-1000 * PRECISION);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(500 * PRECISION);
            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(1050 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('links a dividend naming the fund to it and switches that fund to bank payout', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, reitAccount, energyAccount } = yield* setUpBankFlow(0);

            yield* importInzhurBankTransaction(
                bankAccount.id,
                'dividend',
                `ІНЖУР КЕПІТАЛ дивіденд ${INZHUR_REIT_LAYOUT.isin}`,
                120,
                OPERATED_AT
            );
            yield* consolidate;

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.INCOME,
                title: FUND_TITLE,
                entries: [{ accountId: bankAccount.id, amount: 120 * PRECISION, categoryId: INVESTMENTS_CATEGORY_ID }]
            });
            expect(yield* requireInzhurFundAccount(INZHUR_REIT_LAYOUT.isin)).toMatchObject({
                id: reitAccount.id,
                dividendPayout: DividendPayoutEnum.BANK
            });
            expect(yield* requireInzhurFundAccount(INZHUR_ENERGY_LAYOUT.isin)).toMatchObject({
                id: energyAccount.id,
                dividendPayout: DividendPayoutEnum.REINVEST
            });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(0);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(120 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('attributes an unnamed dividend to the single bank-payout fund', () =>
        Effect.gen(function* () {
            const { bankAccount, reitAccount } = yield* setUpBankFlow(0);

            yield* setInzhurPayout(reitAccount.id, DividendPayoutEnum.BANK);
            yield* importInzhurBankTransaction(bankAccount.id, 'dividend', DIVIDEND_DESCRIPTION, 80, OPERATED_AT);
            yield* consolidate;

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.INCOME,
                title: FUND_TITLE,
                entries: [{ categoryId: INVESTMENTS_CATEGORY_ID }]
            });
        }).pipe(Effect.provide(layer))
    );

    it.effect('records an unattributed investment income when no single bank-payout fund exists', () =>
        Effect.gen(function* () {
            const { bankAccount, reitAccount, energyAccount } = yield* setUpBankFlow(0);

            yield* importInzhurBankTransaction(bankAccount.id, 'no-bank-funds', DIVIDEND_DESCRIPTION, 80, OPERATED_AT);
            yield* consolidate;
            yield* setInzhurPayout(reitAccount.id, DividendPayoutEnum.BANK);
            yield* setInzhurPayout(energyAccount.id, DividendPayoutEnum.BANK);
            yield* importInzhurBankTransaction(bankAccount.id, 'two-bank-funds', `${DIVIDEND_DESCRIPTION} 2`, 40, OPERATED_AT);
            yield* consolidate;

            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.INCOME, title: DIVIDEND_DESCRIPTION, entries: [{ categoryId: INVESTMENTS_CATEGORY_ID }] },
                { type: TransactionTypeEnum.INCOME, title: `${DIVIDEND_DESCRIPTION} 2`, entries: [{ categoryId: INVESTMENTS_CATEGORY_ID }] }
            ]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('turns a non-dividend payment from Inzhur into a withdrawal from the cash account', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* setUpBankFlow(5000);

            yield* importInzhurBankTransaction(bankAccount.id, 'withdrawal', 'Переказ від ТОВ "ІНЖУР КЕПІТАЛ"', 2000, OPERATED_AT);
            yield* consolidate;

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                fromAccountId: cashAccount.id,
                toAccountId: bankAccount.id,
                entries: [
                    { accountId: cashAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 2000 * PRECISION },
                    { accountId: bankAccount.id, type: TransactionEntryTypeEnum.DEBIT, amount: 2000 * PRECISION }
                ]
            });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(3000 * PRECISION);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(2000 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('leaves Inzhur-looking bank transactions untouched when Inzhur is not set up', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedBankAccount;

            yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);
            yield* importInzhurBankTransaction(bankAccount.id, 'dividend', DIVIDEND_DESCRIPTION, 80, OPERATED_AT);
            yield* consolidate;

            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.EXPENSE, entries: [{ categoryId: null }] },
                { type: TransactionTypeEnum.INCOME, title: DIVIDEND_DESCRIPTION, entries: [{ categoryId: null }] }
            ]);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-920 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('stays unchanged when the same bank transactions are synced and consolidated again', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, reitAccount } = yield* setUpBankFlow(0);

            yield* setInzhurPayout(reitAccount.id, DividendPayoutEnum.BANK);
            yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);
            yield* importInzhurBankTransaction(bankAccount.id, 'dividend', DIVIDEND_DESCRIPTION, 80, OPERATED_AT);
            yield* consolidate;
            const firstPass = yield* fetchBankTransactions();

            yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);
            yield* importInzhurBankTransaction(bankAccount.id, 'dividend', DIVIDEND_DESCRIPTION, 80, OPERATED_AT);
            yield* consolidate;
            yield* consolidate;

            expect(firstPass).toHaveLength(2);
            expect(yield* fetchBankTransactions()).toEqual(firstPass);
            expect(yield* requireInzhurFundAccount(INZHUR_REIT_LAYOUT.isin)).toMatchObject({ dividendPayout: DividendPayoutEnum.BANK });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1000 * PRECISION);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-920 * PRECISION);
        }).pipe(Effect.provide(layer))
    );
});
