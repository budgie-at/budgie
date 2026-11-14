import { SyncFileReader } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export const inzhurBytesReaderLayer = (bytesByUri: Readonly<Record<string, Uint8Array>>) =>
    Layer.succeed(SyncFileReader, {
        readPdfTextItems: () => Effect.succeed([]),
        readBytes: uri => Effect.succeed(bytesByUri[uri] ?? new Uint8Array()),
        readText: () => Effect.succeed('')
    });
