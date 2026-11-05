import { PRECISION, TransactionTypeEnum } from '@budgie/contracts';
import { InzhurSetupService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { fetchBankTransactions } from '../../harness/inzhur/fetch-bank-transactions';
import { fetchBeforeTrackingCorrections } from '../../harness/inzhur/fetch-before-tracking-corrections';
import { fetchInzhurOperationsLedger } from '../../harness/inzhur/fetch-inzhur-operations-ledger';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import {
    CASH_AFTER_HISTORY,
    CONVERSION_AT,
    FULL_HISTORY_ROWS,
    REIT,
    TOP_UP_AMOUNT,
    TOP_UP_TYPE
} from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurFundInstrument } from '../../harness/inzhur/seed-inzhur-fund-instrument';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';

const URI = 'operations.xlsx';
const TOP_UP_DESCRIPTION = 'ТОВ "Інжур Кепітал"';
const WITHDRAWAL_DESCRIPTION = 'ТОВ "ІНЖУР КЕПІТАЛ"';
const WITHDRAWAL_COMMENT = 'Повернення коштів з брокерського рахунку № IN-0000';
const BANK_TOP_UP_AT = new Date('2026-01-11T08:00:00.000Z');
const BANK_WITHDRAWAL_AT = new Date('2026-03-21T08:00:00.000Z');

const layer = makeInzhurOperationsLayer({ [URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS) });

const consolidate = Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

const prepare = Effect.fnUntraced(function* () {
    const inzhurSetupService = yield* InzhurSetupService;
    const bankAccount = yield* seedInzhurBankAccount;

    yield* inzhurSetupService.setup(0);
    yield* seedInzhurFundInstrument('INZHUR:REIT', REIT);
    yield* seedInzhurPrice('INZHUR:REIT', CONVERSION_AT.slice(0, 10), 10);

    return bankAccount;
});

const importBankTopUp = (bankAccountId: number) =>
    importInzhurBankTransaction(bankAccountId, 'bank-top-up', TOP_UP_DESCRIPTION, -TOP_UP_AMOUNT, BANK_TOP_UP_AT);

describe('inzhur/operations-bank-pairing', () => {
    it.effect('pairs a top-up with the synced bank row into one transfer and adds no second entry', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare();

            yield* importBankTopUp(bankAccount.id);
            yield* consolidate;

            const summary = yield* importInzhurOperations(URI);
            const { cashAccount } = yield* requireInzhurSetup();
            const ledger = yield* fetchInzhurOperationsLedger;

            expect(summary.bankMatches).toEqual({ paired: 1, unpaired: 1 });
            expect(ledger.filter(({ title }) => title === 'Top-up to Inzhur')).toEqual([]);
            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.TRANSFER, fromAccountId: bankAccount.id, toAccountId: cashAccount.id }
            ]);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-TOP_UP_AMOUNT * PRECISION);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
            expect(yield* fetchBeforeTrackingCorrections).toEqual([]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('records an unmatched top-up as a one-sided transfer and pairs the bank row that arrives later', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare();
            const { cashAccount } = yield* requireInzhurSetup();

            yield* importInzhurOperations(URI);

            const unpaired = (yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Top-up to Inzhur');

            expect(unpaired).toMatchObject([{ type: TransactionTypeEnum.TRANSFER, fromAccountId: null, toAccountId: cashAccount.id }]);

            yield* importBankTopUp(bankAccount.id);
            yield* consolidate;

            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Top-up to Inzhur')).toEqual([]);
            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.TRANSFER, fromAccountId: bankAccount.id, toAccountId: cashAccount.id }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
            expect(yield* fetchBeforeTrackingCorrections).toEqual([]);

            const summary = yield* importInzhurOperations(URI);

            expect(summary).toMatchObject({ recordedCount: 0, bankMatches: { paired: 1, unpaired: 1 } });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('pairs a later withdrawal row with its placeholder as well', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare();
            const { cashAccount } = yield* requireInzhurSetup();

            yield* importInzhurOperations(URI);
            yield* importInzhurBankTransaction(bankAccount.id, 'bank-withdrawal', WITHDRAWAL_DESCRIPTION, 500, BANK_WITHDRAWAL_AT, {
                comment: WITHDRAWAL_COMMENT
            });
            yield* consolidate;

            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Withdrawal from Inzhur')).toEqual([]);
            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.TRANSFER, fromAccountId: cashAccount.id, toAccountId: bankAccount.id }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps the placeholder when the bank row is outside the two day window', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare();
            const { cashAccount } = yield* requireInzhurSetup();

            yield* importInzhurOperations(URI);
            yield* importInzhurBankTransaction(
                bankAccount.id,
                'far-top-up',
                TOP_UP_DESCRIPTION,
                -TOP_UP_AMOUNT,
                new Date('2026-01-20T08:00:00.000Z')
            );
            yield* consolidate;

            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Top-up to Inzhur')).toHaveLength(1);
            expect(yield* fetchBankTransactions()).toMatchObject([{ type: TransactionTypeEnum.TRANSFER, toAccountId: cashAccount.id }]);
        }).pipe(
            Effect.provide(
                makeInzhurOperationsLayer({
                    [URI]: buildInzhurOperationsWorkbook([
                        { at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: TOP_UP_AMOUNT },
                        ...FULL_HISTORY_ROWS.slice(1)
                    ])
                })
            )
        )
    );
});
