import type { PdfTextItemInterface } from '@budgie/sync';

export interface PdfExtractorNativeModuleInterface {
    extractTextItems(filePath: string): Promise<PdfTextItemInterface[]>;
}
