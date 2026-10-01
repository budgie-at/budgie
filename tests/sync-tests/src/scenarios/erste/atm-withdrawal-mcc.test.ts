import { ErsteSyncService } from '@app/sync/service/erste-sync.service';
import { AccountTypeEnum, CurrencyEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { ersteMapper } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import {
    expectAtmCashWithdrawalConsolidation,
    fetchExpenseEntries,
    findMccByCode,
    requireInstrument,
    seed,
    testDb,
    TestLayer
} from '../../harness';

import type { ErsteRowInterface } from '@budgie/sync';

const erste = vi.hoisted(() => {
    const buildRow = (description: string, amount: number, isCredit: boolean): ErsteRowInterface => ({
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        reference: description,
        description,
        details: '',
        amount,
        isCredit
    });

    return {
        account: {
            iban: 'AT000000000000000001',
            accountNumber: '00000000001',
            currency: 'EUR',
            oldBalance: 0,
            newBalance: 0,
            statementDate: new Date()
        },
        atmRow: buildRow('AUTOMAT 12210014 K1 26.11. 14:51', -200, false),
        nonAtmRows: [
            buildRow('POS 0,10 Cash 30,00', -30.1, false),
            buildRow('Bareinzahlung', 50, true),
            buildRow('SB-Münzeinz. K1 S05303 17.08/11:06', 97.33, true),
            buildRow('TABAK TRAFIK 3213 K1 16.12. 10:33', -5, false)
        ]
    };
});

vi.mock('@app/sync/util/extract-pdf-text-items.util', () => ({
    extractPdfTextItems: vi.fn(() => Promise.resolve([]))
}));

vi.mock('@budgie/sync', async importOriginal => {
    const actual = await importOriginal<typeof import('@budgie/sync')>();
    const { void: effectVoid } = await import('effect/Effect');

    return {
        ...actual,
        ErsteFileClient: class {
            parse = () => effectVoid;

            getAccounts() {
                return [actual.ersteMapper.mapAccount(erste.account)];
            }

            getTransactions() {
                return [erste.atmRow, ...erste.nonAtmRows].map(row => actual.ersteMapper.mapTransaction(row, erste.account.iban));
            }
        }
    };
});

const ATM_MCC = 6011;

describe('erste/atm-withdrawal-mcc', () => {
    it('marks only AUTOMAT withdrawals with the ATM MCC', () => {
        expect(ersteMapper.mapTransaction(erste.atmRow, erste.account.iban).mcc).toBe(ATM_MCC);
        expect(erste.nonAtmRows.map(row => ersteMapper.mapTransaction(row, erste.account.iban).mcc)).toEqual([0, 0, 0, 0]);
    });

    it.effect('imports an AUTOMAT withdrawal with the ATM MCC category so consolidation moves it to cash', () =>
        Effect.gen(function* () {
            const ersteSyncService = yield* ErsteSyncService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const cashAccount = yield* seed.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH, instrumentId: euro.id });

            yield* ersteSyncService.executeImportForSelectedAccounts('erste-statement.pdf', [erste.account.iban]);

            const transactions = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE));
            const atmTransaction = transactions.find(transaction => transaction.title === erste.atmRow.description);
            const nonAtmTransactions = transactions.filter(transaction => transaction.id !== atmTransaction?.id);
            const [atmEntry] = yield* fetchExpenseEntries(atmTransaction?.id ?? 0);
            const nonAtmEntries = yield* Effect.forEach(nonAtmTransactions, transaction => fetchExpenseEntries(transaction.id));

            expect(atmEntry.mccCategoryId).toBe((yield* findMccByCode(String(ATM_MCC))).id);
            expect(nonAtmEntries.flat().map(entry => entry.mccCategoryId)).toEqual([null, null, null, null]);

            yield* expectAtmCashWithdrawalConsolidation(atmEntry.accountId, cashAccount.id, atmEntry.transactionId);
        }).pipe(Effect.provide(TestLayer))
    );
});
