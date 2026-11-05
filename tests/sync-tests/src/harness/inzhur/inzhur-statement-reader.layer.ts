import { SyncFileReader } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { PdfTextItemInterface } from '@budgie/sync';

export const inzhurStatementReaderLayer = (
    itemsByUri: Readonly<Record<string, PdfTextItemInterface[]>>,
    bytesByUri: Readonly<Record<string, Uint8Array>> = {}
) =>
    Layer.succeed(SyncFileReader, {
        readPdfTextItems: uri => Effect.succeed(itemsByUri[uri] ?? []),
        readBytes: uri => Effect.succeed(bytesByUri[uri] ?? new Uint8Array())
    });
