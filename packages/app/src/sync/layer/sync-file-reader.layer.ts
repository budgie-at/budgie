import { SyncFileReader } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { extractPdfTextItems } from '../util/extract-pdf-text-items.util';
import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

export const syncFileReaderLayer = Layer.succeed(SyncFileReader, {
    readPdfTextItems: uri => Effect.promise(() => extractPdfTextItems(uri)),
    readBytes: uri => Effect.promise(() => readFileAsUint8Array(uri))
});
