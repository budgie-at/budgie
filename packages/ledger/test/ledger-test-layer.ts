import { makeTestDbLayer, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import { AccountBalanceRepository, Db, TransactionTagsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { TransactionImportService } from '../src/transaction/service/transaction-import.service';
import { TransactionService } from '../src/transaction/service/transaction.service';
import { TransferCreationService } from '../src/transaction/service/transfer-creation.service';

export const seed = Effect.gen(function* () {
    return new TestSeedService(yield* Db);
});

export const TestLayer = Layer.mergeAll(
    TransactionService.layer,
    TransferCreationService.layer,
    TransactionImportService.layer,
    AccountBalanceRepository.layer,
    TransactionTagsRepository.layer
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
