import { InzhurImportService } from '@budgie/sync';
import * as Layer from 'effect/Layer';

import { TestLayer } from '../scenario/test-runtime';

import { inzhurStatementReaderLayer } from './inzhur-statement-reader.layer';

import type { PdfTextItemInterface } from '@budgie/sync';

export const makeInzhurLayer = (itemsByUri: Readonly<Record<string, PdfTextItemInterface[]>>) =>
    Layer.fresh(InzhurImportService.layer).pipe(Layer.provide(inzhurStatementReaderLayer(itemsByUri)), Layer.provideMerge(TestLayer));
