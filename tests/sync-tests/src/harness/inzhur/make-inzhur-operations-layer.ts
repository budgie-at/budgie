import { InzhurGainService, InzhurManualPurchaseService, InzhurOperationsImportService } from '@budgie/sync';
import * as Layer from 'effect/Layer';

import { TestLayer } from '../scenario/test-runtime';

import { inzhurBytesReaderLayer } from './inzhur-bytes-reader.layer';
import { inzhurLedgerWorkloadLayer } from './inzhur-ledger-workload.layer';

export const makeInzhurOperationsLayer = (bytesByUri: Readonly<Record<string, Uint8Array>>) =>
    Layer.mergeAll(InzhurOperationsImportService.layer, InzhurGainService.layer, InzhurManualPurchaseService.layer).pipe(
        Layer.fresh,
        Layer.provide(inzhurBytesReaderLayer(bytesByUri)),
        Layer.provide(inzhurLedgerWorkloadLayer),
        Layer.provideMerge(TestLayer)
    );
