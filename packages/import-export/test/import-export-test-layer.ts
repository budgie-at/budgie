import { makeTestDbLayer, makeTestPlatformLayer } from '@budgie-at/test-kit';
import { AccountRepository, CategoryRepository, Db, TransactionRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ExporterService } from '../src/export/service/exporter.service';
import { ImporterService } from '../src/import/service/importer.service';

export const TestLayer = Layer.mergeAll(
    ImporterService.layer,
    ExporterService.layer,
    AccountRepository.layer,
    CategoryRepository.layer,
    TransactionRepository.layer
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
