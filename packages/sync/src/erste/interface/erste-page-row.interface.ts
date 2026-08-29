import type { PdfTextItemInterface } from './pdf-text-item.interface';

export interface ErstePageRowInterface {
    readonly page: number;
    readonly y: number;
    readonly leftItems: PdfTextItemInterface[];
    readonly rightItems: PdfTextItemInterface[];
}
