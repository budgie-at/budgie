import { makeTestDbLayer, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import {
    AccountBalanceRepository,
    AccountRepository,
    Db,
    TransactionReceiptRepository,
    TransactionRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { AccountService } from '../src/account/service/account.service';
import { ReceiptMatchService } from '../src/receipt/service/receipt-match.service';
import { TransactionImportService } from '../src/transaction/service/transaction-import.service';
import { TransactionService } from '../src/transaction/service/transaction.service';
import { TransferCreationService } from '../src/transaction/service/transfer-creation.service';

export const seed = Effect.gen(function* () {
    return new TestSeedService(yield* Db);
});

export const TestLayer = Layer.mergeAll(
    AccountService.layer,
    TransactionService.layer,
    TransferCreationService.layer,
    TransactionImportService.layer,
    AccountBalanceRepository.layer,
    TransactionTagsRepository.layer,
    TransactionReceiptRepository.layer,
    AccountRepository.layer,
    TransactionRepository.layer,
    ReceiptMatchService.layer
).pipe(
    Layer.provideMerge(
        Layer.unwrap(
            Effect.gen(function* () {
                return makeTestPlatformLayer(yield* Db);
            })
        )
    ),
    Layer.provide(makeTestDbLayer(null))
);
