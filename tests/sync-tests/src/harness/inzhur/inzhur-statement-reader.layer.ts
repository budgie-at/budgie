import { SyncFileReader } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { PdfTextItemInterface } from '@budgie/sync';

export const inzhurStatementReaderLayer = (itemsByUri: Readonly<Record<string, PdfTextItemInterface[]>>) =>
    Layer.succeed(SyncFileReader, {
        readPdfTextItems: uri => Effect.succeed(itemsByUri[uri] ?? []),
        readBytes: () => Effect.succeed(new Uint8Array())
    });
