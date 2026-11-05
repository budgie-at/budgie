import { InzhurGainService, InzhurImportService, InzhurOperationsImportService } from '@budgie/sync';
import * as Layer from 'effect/Layer';

import { TestLayer } from '../scenario/test-runtime';

import { inzhurLedgerWorkloadLayer } from './inzhur-ledger-workload.layer';
import { inzhurStatementReaderLayer } from './inzhur-statement-reader.layer';

import type { PdfTextItemInterface } from '@budgie/sync';

export const makeInzhurOperationsLayer = (
    bytesByUri: Readonly<Record<string, Uint8Array>>,
    itemsByUri: Readonly<Record<string, PdfTextItemInterface[]>> = {}
) =>
    Layer.mergeAll(InzhurOperationsImportService.layer, InzhurImportService.layer, InzhurGainService.layer).pipe(
        Layer.fresh,
        Layer.provide(inzhurStatementReaderLayer(itemsByUri, bytesByUri)),
        Layer.provide(inzhurLedgerWorkloadLayer),
        Layer.provideMerge(TestLayer)
    );
