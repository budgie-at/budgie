import { TransferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, privatbankTransactionMapper } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { expectFileImportConsolidationEnqueued, seed, makeStubFileBankSyncService, testDb, TestLayer } from '../../harness';

import type { FileBasedSyncClientInterface, SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

const PRIVATBANK_CARD_ID = 'privat-card';
const PRIVATBANK_STATEMENT_URI = 'privatbank-statement.xlsx';
const PRIVATBANK_TRANSFER_CATEGORY = 'Зарахування переказу';
const TRANSFER_AMOUNT = 250;
const UAH_CURRENCY_CODE_NUMERIC = 980;

const buildPrivatbankBankAccount = (): SyncAccountInterface => ({
    id: PRIVATBANK_CARD_ID,
    provider: SyncProviderEnum.PRIVATBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: UAH_CURRENCY_CODE_NUMERIC,
    balance: TRANSFER_AMOUNT,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CARD
});

const buildPrivatbankTransaction = (): SyncTransactionInterface =>
    privatbankTransactionMapper({
        rawDate: '13.01.2026 11:42:53',
        date: new Date('2026-01-13T09:42:53.000Z'),
        deviceLocalDate: new Date('2026-01-13T09:42:53.000Z'),
        category: PRIVATBANK_TRANSFER_CATEGORY,
        card: PRIVATBANK_CARD_ID,
        description: 'Transfer from Monobank',
        cardAmount: TRANSFER_AMOUNT,
        cardCurrency: 'UAH',
        operationAmount: TRANSFER_AMOUNT,
        operationCurrency: 'UAH',
        endBalance: TRANSFER_AMOUNT,
        balanceCurrency: 'UAH'
    });

class StubPrivatbankFileClient implements FileBasedSyncClientInterface {
    constructor(private readonly transactions: SyncTransactionInterface[]) {}

    getAccounts(): SyncAccountInterface[] {
        return [buildPrivatbankBankAccount()];
    }

    getTransactions(): SyncTransactionInterface[] {
        return this.transactions;
    }
}

const buildPrivatbankSyncService = (transactions: SyncTransactionInterface[]) =>
    makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, new StubPrivatbankFileClient(transactions));

const seedPrivatbankAccount = () =>
    Effect.gen(function* () {
        yield* seed.account({
            title: 'Privatbank Card',
            externalId: PRIVATBANK_CARD_ID,
            externalSource: ExternalSourceEnum.PRIVATBANK
        });
    });

describe('consolidation/privatbank-file-import-triggers-consolidation', () => {
    it.effect('enqueues consolidation after a Privatbank file import introduces new transactions', () =>
        Effect.gen(function* () {
            yield* seedPrivatbankAccount();
            const syncService = yield* buildPrivatbankSyncService([buildPrivatbankTransaction()]);

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

            const [transaction] = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.PRIVATBANK));

            yield* expectFileImportConsolidationEnqueued(transaction?.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not enqueue consolidation after a re-import with no new transactions', () =>
        Effect.gen(function* () {
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const enqueue = vi.mocked(transferConsolidationDrainerService.enqueue);
            yield* seedPrivatbankAccount();
            const syncService = yield* buildPrivatbankSyncService([buildPrivatbankTransaction()]);

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);
            enqueue.mockClear();

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

            expect(enqueue).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );
});
