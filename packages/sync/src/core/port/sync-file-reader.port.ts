import * as Context from 'effect/Context';

import type { PdfTextItemInterface } from '../../erste/interface/pdf-text-item.interface';
import type * as Effect from 'effect/Effect';

export class SyncFileReader extends Context.Service<
    SyncFileReader,
    {
        readonly readPdfTextItems: (uri: string) => Effect.Effect<PdfTextItemInterface[]>;
        readonly readBytes: (uri: string) => Effect.Effect<Uint8Array>;
    }
>()('@budgie/sync/SyncFileReader') {}
