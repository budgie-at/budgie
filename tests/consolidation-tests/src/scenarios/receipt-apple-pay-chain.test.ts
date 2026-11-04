import { ConsolidationCandidateRepository } from '@budgie/consolidation';
import { ExternalSourceEnum, TransactionReceiptEntityTable, convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seedApplePayCardAccount } from '../harness/apple-pay-capture-fixture';
import { seedPurchaseBank, seedPurchaseCapture } from '../harness/apple-pay-capture-scenario';
import { expectSourcesRestored, fetchLedgerBalances, fetchOwnLedgerEntries } from '../harness/consolidation-revert-audit';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, unconsolidateById, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/receipt-apple-pay-chain', it => {
    it.effect.each([false, true])('counts the payment once and reverts the chain with bank first: %s', bankFirst =>
        Effect.gen(function* () {
            const card = yield* seedApplePayCardAccount('Synthetic card');
            const receipt = yield* seedPurchaseBank(card.id, { source: ExternalSourceEnum.RECEIPT, externalId: 'receipt-1' });

            yield* testDb.insert(TransactionReceiptEntityTable).values({ transactionId: receipt.id, fingerprint: 'synthetic-receipt' });

            const first = bankFirst ? yield* seedPurchaseBank(card.id) : yield* seedPurchaseCapture(card.id);

            expect((yield* runConsolidation()).consolidated).toBe(1);

            const last = bankFirst ? yield* seedPurchaseCapture(card.id) : yield* seedPurchaseBank(card.id);
            const bank = bankFirst ? first : last;
            const capture = bankFirst ? last : first;
            const candidates = yield* Effect.flatMap(ConsolidationCandidateRepository, repository =>
                repository.findApplePayCaptureDuplicateCandidates(null)
            );

            expect(candidates).toEqual([{ syncedTransactionId: bank.id, manualTransactionId: bankFirst ? capture.id : receipt.id }]);
            expect((yield* runConsolidation()).consolidated).toBe(1);
            expect(yield* fetchLedgerBalances([card.id])).toEqual([[card.id, -convertToMicroUnits(100)]]);
            expect(yield* fetchOwnLedgerEntries(bank.id)).toHaveLength(1);
            expect(yield* testDb.select().from(TransactionReceiptEntityTable)).toMatchObject([{ transactionId: bank.id }]);
            yield* expectSecondConsolidationRunStable();

            const extraCapture = yield* seedPurchaseCapture(card.id, { captureId: 'capture-2' });

            yield* expectSecondConsolidationRunStable();
            yield* unconsolidateById(bank.id);

            if (!bankFirst) {
                expect((yield* testQueryService.fetchTransactionById(capture.id)).consolidationParentTransactionId).toBe(receipt.id);
                yield* unconsolidateById(receipt.id);
            }

            yield* expectSourcesRestored([receipt.id, capture.id, bank.id, extraCapture.id]);
            expect(yield* fetchLedgerBalances([card.id])).toEqual([[card.id, -4 * convertToMicroUnits(100)]]);
            expect(yield* testDb.select().from(TransactionReceiptEntityTable)).toMatchObject([{ transactionId: receipt.id }]);
        })
    );
});
