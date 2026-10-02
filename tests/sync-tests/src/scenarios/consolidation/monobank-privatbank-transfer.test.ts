import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { PrivatbankCategoryMatcherService } from '@app/sync/service/privatbank-category-matcher.service';
import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { ExternalSourceEnum, TransactionConsolidationTypeEnum, TransactionEntityTable } from '@budgie/contracts';
import { TransactionImportService } from '@budgie/ledger';
import { privatbankTransactionMapper } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildMonobank,
    fetchCanonicalsOfType,
    fetchTransactionById,
    monobankStub,
    seed,
    setupMonobankFixture,
    testDb,
    TestLayer
} from '../../harness';

const TRANSFER_AMOUNT = 250;
const MONOBANK_API_AMOUNT = TRANSFER_AMOUNT * 100;
const TRANSFER_MCC_CODE = '4829';
const PRIVATBANK_TRANSFER_CATEGORY = 'Зарахування переказу';
const SLOW_WINDOW_OFFSET_MS = 30 * 60 * 1000;
const OPERATED_AT = new Date('2026-01-15T12:00:00.000Z');

const setupMonobankTransfer = Effect.fnUntraced(function* (monobankAccountId: string) {
    const monobankSyncService = yield* MonobankSyncService;
    yield* setupMonobankFixture(monobankAccountId);
    monobankStub.statement([
        buildMonobank.transaction({
            id: 'mono-transfer-out',
            amount: -MONOBANK_API_AMOUNT,
            operationAmount: -MONOBANK_API_AMOUNT,
            hold: false,
            time: Math.floor(OPERATED_AT.getTime() / 1000),
            description: 'Transfer to Privatbank',
            mcc: Number(TRANSFER_MCC_CODE),
            originalMcc: Number(TRANSFER_MCC_CODE)
        })
    ]);
    yield* monobankSyncService.sync();
});

const importPrivatbankTransfer = Effect.fnUntraced(function* (privatbankAccountId: number, privatbankCardId: string) {
    const privatbankCategoryMatcherService = yield* PrivatbankCategoryMatcherService;
    const transactionImportService = yield* TransactionImportService;
    const categoryMap = yield* privatbankCategoryMatcherService.match([PRIVATBANK_TRANSFER_CATEGORY]);
    const privatbankTransaction = privatbankTransactionMapper({
        rawDate: '20.05.2026 15:00:00',
        date: new Date(OPERATED_AT.getTime() + SLOW_WINDOW_OFFSET_MS),
        category: PRIVATBANK_TRANSFER_CATEGORY,
        card: privatbankCardId,
        description: 'Transfer from Monobank',
        cardAmount: TRANSFER_AMOUNT,
        cardCurrency: 'UAH',
        operationAmount: TRANSFER_AMOUNT,
        operationCurrency: 'UAH',
        endBalance: TRANSFER_AMOUNT,
        balanceCurrency: 'UAH'
    });
    const privatbankMccCategoryId = categoryMap.get(PRIVATBANK_TRANSFER_CATEGORY) ?? null;
    const privatbankInput = mapBankTransactionToCreateInput(
        privatbankTransaction,
        privatbankAccountId,
        privatbankMccCategoryId,
        ExternalSourceEnum.PRIVATBANK
    );

    return yield* transactionImportService.bulkUpsertImported([privatbankInput], new Map());
});

const expectTransferPairParents = (privatbankTransactionIds: number[]) =>
    Effect.gen(function* () {
        const canonicals = yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        const canonicalIds = canonicals.map(canonical => canonical.id);
        const monobankTransactions = yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, 'mono-transfer-out'));
        const monobankParentTransactionIds = (yield* Effect.forEach(monobankTransactions, transaction =>
            fetchTransactionById(transaction.id)
        )).map(transaction => transaction.consolidationParentTransactionId);
        const privatbankParentTransactionIds = (yield* Effect.forEach(privatbankTransactionIds, transactionId =>
            fetchTransactionById(transactionId)
        )).map(transaction => transaction.consolidationParentTransactionId);

        expect(monobankParentTransactionIds).toEqual(canonicalIds);
        expect(privatbankParentTransactionIds).toEqual(canonicalIds);
    });

describe('consolidation/monobank-privatbank-transfer', () => {
    it.effect('auto-consolidates a Monobank outgoing transfer with an imported Privatbank incoming transfer', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const monobankAccountId = 'mono-card';
            const privatbankCardId = 'privat-card';
            const privatbankAccount = yield* seed.account({
                title: 'Privatbank Card',
                externalId: privatbankCardId,
                externalSource: ExternalSourceEnum.PRIVATBANK
            });

            yield* setupMonobankTransfer(monobankAccountId);
            const importedPrivatbankTransactions = yield* importPrivatbankTransfer(privatbankAccount.id, privatbankCardId);
            expect(importedPrivatbankTransactions).toHaveLength(1);

            expect(yield* consolidationCoordinatorService.countAutoCandidates()).toBe(1);
            expect(yield* consolidationCoordinatorService.countManualReviewCandidates()).toBe(0);

            const consolidateResult = yield* transferConsolidationService.consolidate(null);
            expect(consolidateResult.consolidated).toBe(1);

            yield* expectTransferPairParents(importedPrivatbankTransactions.map(transaction => transaction.id));
        }).pipe(Effect.provide(TestLayer))
    );
});
