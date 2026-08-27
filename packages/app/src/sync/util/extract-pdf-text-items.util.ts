import { requireNativeModule } from 'expo';

import type { PdfTextItemInterface } from '@budgie/sync';

interface PdfExtractorNativeModuleInterface {
    extractTextItems(filePath: string): Promise<PdfTextItemInterface[]>;
}

// oxlint-disable-next-line lingui/no-unlocalized-strings -- Native module identifier registered by expo-pdf-text-extract
const nativeModule = requireNativeModule<PdfExtractorNativeModuleInterface>('PdfExtractor');

export const extractPdfTextItems = (uri: string): Promise<PdfTextItemInterface[]> => nativeModule.extractTextItems(uri);
