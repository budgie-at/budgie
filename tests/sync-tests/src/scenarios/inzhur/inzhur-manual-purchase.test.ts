import { PRECISION, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import {
    InzhurGainService,
    InzhurManualPurchaseService,
    InzhurPurchaseBeforeTopUpError,
    InzhurPurchaseExceedsTopUpError,
    InzhurPurchaseInvalidError,
    InzhurTopUpNotFoundError
} from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { findPendingTopUps } from '../../harness/inzhur/find-pending-top-ups';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { TOP_UP_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { ENERGY_ISIN, REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { BASE_ROWS, REIT, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { recordManualPurchase } from '../../harness/inzhur/record-manual-purchase';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const BASE_URI = 'base.xlsx';
const COVERING_URI = 'covering.xlsx';
const FEBRUARY_PURCHASE_AT = new Date('2026-02-02T09:00:00.000Z');
const APRIL_PURCHASE_AT = new Date('2026-04-02T09:00:00.000Z');
const TODAY = '2026-06-01';

const layer = makeInzhurOperationsLayer({
    [BASE_URI]: buildInzhurOperationsWorkbook(BASE_ROWS),
    [COVERING_URI]: buildInzhurOperationsWorkbook([
        ...BASE_ROWS,
        { at: '2026-02-01T12:00:00', type: TOP_UP_TYPE, debit: 1000 },
        { at: '2026-02-02T11:00:00', type: 'Купівля 100 сертифікатів', fund: REIT, credit: 1000 }
    ])
});

const prepare = Effect.gen(function* () {
    yield* seedInzhurReitPrices;
    yield* importInzhurOperations(BASE_URI);

    return yield* seedInzhurBankAccount;
});

const topUp = (bankAccountId: number, externalId: string, amount: number, at: string) =>
    importInzhurBankFlow(bankAccountId, externalId, TOP_UP_DESCRIPTION, -amount, new Date(at));

const findSinglePending = Effect.fnUntraced(function* () {
    const pending = yield* findPendingTopUps;

    expect(pending).toHaveLength(1);

    return pending[0];
});

describe('inzhur/pending-top-ups', () => {
    it.effect('lists only bank top-ups dated after the export coverage that no row claimed', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'before-coverage', 500, '2026-01-05T08:00:00.000Z');
            yield* topUp(bankAccount.id, 'inside-coverage', 400, '2026-01-10T07:00:00.000Z');
            expect(yield* findPendingTopUps).toEqual([]);

            yield* topUp(bankAccount.id, 'after-coverage', 300, '2026-01-20T08:00:00.000Z');

            expect(yield* findSinglePending()).toMatchObject({
                operatedAt: new Date('2026-01-20T08:00:00.000Z'),
                amount: 300,
                spentAmount: 0,
                remainingAmount: 300
            });
        }).pipe(Effect.provide(layer))
    );

    it.effect('lists a top-up made on the last export day after its last operation', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'same-day-later', 250, '2026-01-10T12:00:00.000Z');

            expect(yield* findSinglePending()).toMatchObject({ externalId: 'same-day-later', amount: 250 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('stops listing a top-up once an export covering its date pairs it with a row', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');
            yield* findSinglePending();

            const summary = yield* importInzhurOperations(COVERING_URI);

            expect(summary.bankMatches.paired).toBe(1);
            expect(yield* findPendingTopUps).toEqual([]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('clears a top-up after a purchase is recorded for it and lists a later top-up as a new item', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');

            const first = yield* findSinglePending();

            yield* recordManualPurchase({
                topUpTransactionId: first.transactionId,
                fundName: REIT,
                certificates: 100,
                amount: 1000,
                operatedAt: FEBRUARY_PURCHASE_AT
            });

            expect(yield* findPendingTopUps).toEqual([]);

            yield* topUp(bankAccount.id, 'april', 700, '2026-04-01T08:00:00.000Z');

            const second = yield* findSinglePending();

            expect(second).toMatchObject({ amount: 700, remainingAmount: 700 });
            expect(second.transactionId).not.toBe(first.transactionId);
        }).pipe(Effect.provide(layer))
    );
});

describe('inzhur/manual-purchase', () => {
    it.effect('moves cash into the fund quantity with the manual external id and counts the cost', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');

            const { transactionId } = yield* findSinglePending();
            const { cashAccount } = yield* requireInzhurSetup();
            const reitId = yield* recordManualPurchase({
                topUpTransactionId: transactionId,
                fundName: REIT,
                certificates: 40,
                amount: 400,
                operatedAt: FEBRUARY_PURCHASE_AT
            });
            const purchase = (yield* fetchInzhurLedger()).find(({ externalId }) =>
                externalId?.startsWith(`inzhur:manual:${transactionId}:`)
            );
            const costReturn = yield* (yield* InzhurGainService).getFundCostReturn(reitId, TODAY);

            expect(reitId).toBe((yield* requireInzhurFundAccount(REIT_ISIN)).id);
            expect(purchase).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                title: 'Bought REIT',
                fromAccountId: cashAccount.id,
                toAccountId: reitId,
                entries: [
                    { accountId: cashAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 400 * PRECISION },
                    { accountId: reitId, type: TransactionEntryTypeEnum.DEBIT, amount: 40 * PRECISION }
                ]
            });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(800 * PRECISION);
            expect(yield* fetchAccountBalance(reitId)).toBe(120 * PRECISION);
            expect(costReturn).toMatchObject({ invested: 1200 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('allows several purchases per top-up and reduces what remains to spend', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;
            const manualPurchaseService = yield* InzhurManualPurchaseService;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');

            const { transactionId } = yield* findSinglePending();

            for (const [certificates, amount] of [
                [40, 400],
                [10, 150]
            ]) {
                yield* recordManualPurchase({
                    topUpTransactionId: transactionId,
                    fundName: REIT,
                    certificates,
                    amount,
                    operatedAt: FEBRUARY_PURCHASE_AT
                });
            }

            expect(yield* manualPurchaseService.findTopUp(transactionId)).toMatchObject({
                amount: 1000,
                spentAmount: 550,
                remainingAmount: 450
            });
            expect((yield* fetchInzhurLedger()).filter(({ externalId }) => externalId?.startsWith('inzhur:manual:'))).toHaveLength(2);
        }).pipe(Effect.provide(layer))
    );

    it.effect('creates the fund account for a fund seen for the first time under its canonical name', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');

            const { transactionId } = yield* findSinglePending();
            const energyId = yield* recordManualPurchase({
                topUpTransactionId: transactionId,
                fundName: 'Inzhur Energy',
                certificates: 2,
                amount: 100,
                operatedAt: FEBRUARY_PURCHASE_AT
            });
            const miltechId = yield* recordManualPurchase({
                topUpTransactionId: transactionId,
                fundName: 'ІНЖУР МІЛТЕХ',
                certificates: 3,
                amount: 90,
                operatedAt: FEBRUARY_PURCHASE_AT
            });

            expect(energyId).toBe((yield* requireInzhurFundAccount(ENERGY_ISIN)).id);
            expect(miltechId).toBe((yield* requireInzhurFundByName('Inzhur MilTech')).id);
            expect(yield* fetchAccountBalance(energyId)).toBe(2 * PRECISION);
            expect(yield* fetchAccountBalance(miltechId)).toBe(3 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('is superseded by an export covering its date while later purchases stay', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');

            const february = yield* findSinglePending();

            yield* recordManualPurchase({
                topUpTransactionId: february.transactionId,
                fundName: REIT,
                certificates: 90,
                amount: 900,
                operatedAt: FEBRUARY_PURCHASE_AT
            });
            yield* topUp(bankAccount.id, 'april', 500, '2026-04-01T08:00:00.000Z');

            const april = yield* findSinglePending();

            yield* recordManualPurchase({
                topUpTransactionId: april.transactionId,
                fundName: REIT,
                certificates: 50,
                amount: 500,
                operatedAt: APRIL_PURCHASE_AT
            });

            const summary = yield* importInzhurOperations(COVERING_URI);
            const reit = yield* requireInzhurFundByName(REIT);
            const { cashAccount } = yield* requireInzhurSetup();
            const manual = (yield* fetchInzhurLedger()).filter(({ externalId }) => externalId?.startsWith('inzhur:manual:'));
            const costReturn = yield* (yield* InzhurGainService).getFundCostReturn(reit.id, TODAY);

            expect(summary.replacedPurchaseCount).toBe(1);
            expect(manual).toMatchObject([{ operatedAt: APRIL_PURCHASE_AT }]);
            expect(yield* fetchAccountBalance(reit.id)).toBe(230 * PRECISION);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(200 * PRECISION);
            expect(costReturn).toMatchObject({ invested: 2300 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('rejects purchases that are invalid, unknown, before the top-up or above what remains', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');

            const { transactionId } = yield* findSinglePending();
            const purchase = {
                topUpTransactionId: transactionId,
                fundName: REIT,
                certificates: 10,
                amount: 100,
                operatedAt: FEBRUARY_PURCHASE_AT
            };

            expect(yield* Effect.flip(recordManualPurchase({ ...purchase, certificates: 0 }))).toBeInstanceOf(InzhurPurchaseInvalidError);
            expect(yield* Effect.flip(recordManualPurchase({ ...purchase, topUpTransactionId: 0 }))).toBeInstanceOf(
                InzhurTopUpNotFoundError
            );
            expect(
                yield* Effect.flip(recordManualPurchase({ ...purchase, operatedAt: new Date('2026-01-31T09:00:00.000Z') }))
            ).toBeInstanceOf(InzhurPurchaseBeforeTopUpError);

            yield* recordManualPurchase({ ...purchase, amount: 900 });

            expect(yield* Effect.flip(recordManualPurchase({ ...purchase, amount: 101 }))).toEqual(
                new InzhurPurchaseExceedsTopUpError({ remainingAmount: 100 })
            );
        }).pipe(Effect.provide(layer))
    );

    it.effect('stores the purchase at noon of its Kyiv day', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* topUp(bankAccount.id, 'february', 1000, '2026-02-01T08:00:00.000Z');

            const { transactionId } = yield* findSinglePending();

            yield* recordManualPurchase({
                topUpTransactionId: transactionId,
                fundName: REIT,
                certificates: 10,
                amount: 100,
                operatedAt: new Date('2026-02-02T22:30:00.000Z')
            });

            expect((yield* fetchInzhurLedger()).find(({ externalId }) => externalId?.startsWith('inzhur:manual:'))).toMatchObject({
                operatedAt: new Date('2026-02-03T10:00:00.000Z')
            });
        }).pipe(Effect.provide(layer))
    );
});
