import type { PdfTextItemInterface } from '@budgie/sync';

export const buildForeignDocumentItems = (): PdfTextItemInterface[] => [
    { text: 'Account statement', x: 50, y: 800, width: 100, height: 10, page: 1 },
    { text: 'IBAN AT611904300234573201', x: 50, y: 780, width: 100, height: 10, page: 1 },
    { text: 'Closing balance 2.475,02', x: 50, y: 760, width: 100, height: 10, page: 1 }
];
