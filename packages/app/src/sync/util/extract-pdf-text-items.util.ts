import { requireNativeModule } from 'expo-modules-core';

import type { PdfTextItemInterface } from '@budgie/bank-sync';

interface PdfExtractorNativeModuleInterface {
    extractTextItems(filePath: string): Promise<PdfTextItemInterface[]>;
}

// eslint-disable-next-line lingui/no-unlocalized-strings -- Native module identifier registered by expo-pdf-text-extract
const nativeModule = requireNativeModule<PdfExtractorNativeModuleInterface>('PdfExtractor');

export const extractPdfTextItems = (uri: string): Promise<PdfTextItemInterface[]> => nativeModule.extractTextItems(uri);
