import { SyncFileReader } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { requireNativeModule } from 'expo';
import { File } from 'expo-file-system';

import type { PdfExtractorNativeModuleInterface } from '../interface/pdf-extractor-native-module.interface';

// oxlint-disable-next-line lingui/no-unlocalized-strings -- Native module identifier registered by expo-pdf-text-extract
const pdfExtractorNativeModule = requireNativeModule<PdfExtractorNativeModuleInterface>('PdfExtractor');

export const syncFileReaderLayer = Layer.succeed(SyncFileReader, {
    readPdfTextItems: uri => Effect.promise(() => pdfExtractorNativeModule.extractTextItems(uri)),
    readBytes: uri => Effect.promise(() => new File(uri).arrayBuffer().then(buffer => new Uint8Array(buffer)))
});
