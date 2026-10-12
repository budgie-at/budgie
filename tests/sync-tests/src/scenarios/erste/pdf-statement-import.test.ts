import { AccountTypeEnum, CurrencyEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { ErsteSyncService, mapErsteTransaction, SyncFileReader, SyncInvalidResponseError } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { asc, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import {
    expectAtmCashWithdrawalConsolidation,
    fetchExpenseEntries,
    requireInstrument,
    seed,
    testDb,
    TestLayer,
    testQueryService
} from '../../harness';

import type { PdfTextItemInterface } from '@budgie/sync';

const IBAN = 'AT611904300234573201';
const STATEMENT_URI = 'erste-statement.pdf';
const ATM_MCC = 6011;
const ATM_DESCRIPTION = 'AUTOMAT 12210014 K1 26.11. 14:51';
const LEFT_X = 50;
const RIGHT_X = 300;

const item = (page: number, y: number, x: number, text: string): PdfTextItemInterface => ({ text, x, y, width: 100, height: 10, page });

const statementItems: PdfTextItemInterface[] = [
    item(1, 780, LEFT_X, `IBAN: ${IBAN}`),
    item(1, 700, LEFT_X, 'Alter Kontostand'),
    item(1, 700, RIGHT_X, '1.234,56'),
    item(1, 650, LEFT_X, 'Buchungstext/Booking Text'),
    item(1, 630, LEFT_X, 'ERSTE CARD PAYMENT'),
    item(1, 630, RIGHT_X, '13.01.2026 42,50-'),
    item(1, 620, LEFT_X, 'BILLA DANKT 1234 WIEN 1010 040'),
    item(1, 610, LEFT_X, 'Kartenzahlung'),
    item(1, 590, LEFT_X, ATM_DESCRIPTION),
    item(1, 590, RIGHT_X, '14.01.2026 200,00-'),
    item(1, 570, LEFT_X, 'Gehalt Firma GmbH 15.01.2026 2.500,00'),
    item(1, 560, LEFT_X, 'Lohn Jaenner'),
    item(1, 120, LEFT_X, 'Auszug/Statement Seite/Page 1'),
    item(1, 100, LEFT_X, `${IBAN} 20.01.2026 10:30`),
    item(1, 20, LEFT_X, 'footer below threshold'),
    item(2, 700, LEFT_X, 'IBAN Datum/Date Uhrzeit/Time'),
    item(2, 680, LEFT_X, 'Spar Markt'),
    item(2, 680, RIGHT_X, '16.01.2026 1.005,10-'),
    item(2, 670, LEFT_X, 'SPAR DANKT 0815 GRAZ 8010 040'),
    item(2, 660, RIGHT_X, '17.01.2026 12,00'),
    item(2, 650, LEFT_X, 'Gutschrift ohne Referenz'),
    item(2, 600, LEFT_X, 'Neuer Kontostand 2.475,02'),
    item(2, 580, LEFT_X, 'after section is ignored'),
    item(2, 580, RIGHT_X, '18.01.2026 9,99-')
];

const ersteStatementLayer = (items: PdfTextItemInterface[]) =>
    Layer.fresh(ErsteSyncService.layer).pipe(
        Layer.provide(
            Layer.succeed(SyncFileReader, {
                readPdfTextItems: () => Effect.succeed(items),
                readBytes: () => Effect.succeed(new Uint8Array())
            })
        ),
        Layer.provideMerge(TestLayer)
    );

const importStatement = Effect.gen(function* () {
    const ersteSyncService = yield* ErsteSyncService;
    yield* ersteSyncService.executeImportForSelectedAccounts(STATEMENT_URI, [IBAN]);

    return yield* testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE))
        .orderBy(asc(TransactionEntityTable.operatedAt));
});

const expectInvalidStatement = (items: PdfTextItemInterface[], message: string) =>
    Effect.gen(function* () {
        const ersteSyncService = yield* ErsteSyncService;

        const error = yield* Effect.flip(ersteSyncService.importPreview(STATEMENT_URI));

        expect(error).toBeInstanceOf(SyncInvalidResponseError);
        expect(error.message).toBe(message);
    }).pipe(Effect.provide(ersteStatementLayer(items)));

describe('erste/pdf-statement-import', () => {
    it('marks only AUTOMAT withdrawals with the ATM MCC', () => {
        const row = { date: new Date(2026, 0, 14, 12), reference: '', amount: -200, isCredit: false };

        expect(mapErsteTransaction({ ...row, description: ATM_DESCRIPTION }, IBAN).mcc).toBe(ATM_MCC);
        expect(mapErsteTransaction({ ...row, description: 'TABAK TRAFIK 3213 K1 16.12. 10:33' }, IBAN).mcc).toBe(0);
        expect(mapErsteTransaction({ ...row, description: ATM_DESCRIPTION, amount: 200, isCredit: true }, IBAN).mcc).toBe(0);
    });

    it.effect('parses a statement into byte-identical external ids, import fingerprints and fields', () =>
        Effect.gen(function* () {
            const ersteSyncService = yield* ErsteSyncService;

            const [preview] = yield* ersteSyncService.importPreview(STATEMENT_URI);
            const transactions = yield* importStatement;

            expect(preview).toMatchObject({ externalId: IBAN, iban: IBAN, currencyCode: 'EUR' });
            expect(
                transactions.map(transaction => [
                    transaction.externalId,
                    transaction.importFingerprint,
                    transaction.type,
                    transaction.title,
                    transaction.comment,
                    transaction.operatedAt
                ])
            ).toEqual([
                [
                    '858b46afdd45c6d4aab0d4fe36e2245a',
                    '["EXPENSE",[[1,"CREDIT",null,42500000,1]]]',
                    'EXPENSE',
                    'BILLA DANKT 1234 WIEN 1010 040 Kartenzahlung',
                    'WIEN, AT',
                    new Date(2026, 0, 13, 12)
                ],
                [
                    '49e4df71017d3ebd94a42bc3abdb73cd',
                    '["EXPENSE",[[1,"CREDIT",null,200000000,1]]]',
                    'EXPENSE',
                    'AUTOMAT 12210014 K1 26.11. 14:51',
                    '',
                    new Date(2026, 0, 14, 12)
                ],
                [
                    '2460b09bbfba37373ebcf78f02acb6e7',
                    '["INCOME",[[1,"DEBIT",null,2500000000,1]]]',
                    'INCOME',
                    'Lohn Jaenner',
                    '',
                    new Date(2026, 0, 15, 12)
                ],
                [
                    'ec46c13ea3013f51e52460edf8c9dc23',
                    '["EXPENSE",[[1,"CREDIT",null,1005100000,1]]]',
                    'EXPENSE',
                    'SPAR DANKT 0815 GRAZ 8010 040',
                    'GRAZ, AT',
                    new Date(2026, 0, 16, 12)
                ],
                [
                    'bef8db9381691f0bea6447f96c7fa6ef',
                    '["INCOME",[[1,"DEBIT",null,12000000,1]]]',
                    'INCOME',
                    'Gutschrift ohne Referenz',
                    '',
                    new Date(2026, 0, 17, 12)
                ]
            ]);
        }).pipe(Effect.provide(ersteStatementLayer(statementItems)))
    );

    it.effect('imports an AUTOMAT withdrawal with the ATM MCC category so consolidation moves it to cash', () =>
        Effect.gen(function* () {
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const cashAccount = yield* seed.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH, instrumentId: euro.id });

            const transactions = yield* importStatement;
            const entries = yield* Effect.forEach(transactions, transaction => fetchExpenseEntries(transaction.id));
            const atmIndex = transactions.findIndex(transaction => transaction.title === ATM_DESCRIPTION);
            const [atmEntry] = entries[atmIndex];

            expect(atmEntry.mccCategoryId).toBe((yield* testQueryService.findMccByCode(String(ATM_MCC))).id);
            expect(
                entries
                    .filter((_, index) => index !== atmIndex)
                    .flat()
                    .map(entry => entry.mccCategoryId)
            ).toEqual([null, null, null, null]);
            expect(entries.flat().map(entry => [entry.operationInstrumentId, entry.operationAmount])).toEqual(
                entries.flat().map(() => [null, null])
            );

            yield* expectAtmCashWithdrawalConsolidation(atmEntry.accountId, cashAccount.id, atmEntry.transactionId);
        }).pipe(Effect.provide(ersteStatementLayer(statementItems)))
    );

    it.effect('fails with SyncInvalidResponseError when the statement has no IBAN', () =>
        expectInvalidStatement(statementItems.slice(1), 'Could not find IBAN in Erste PDF')
    );

    it.effect('fails with SyncInvalidResponseError when the statement has no statement date', () =>
        expectInvalidStatement(
            statementItems.filter(statementItem => !statementItem.text.endsWith('10:30')),
            'Could not find statement date in Erste PDF'
        )
    );
});
