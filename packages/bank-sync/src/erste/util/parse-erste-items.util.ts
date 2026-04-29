import { ErsteModernPositionalParser } from '../parser/erste-modern-positional.parser';

import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export const parseErsteItems = (items: PdfTextItemInterface[]): ErsteParsedDataInterface => {
    const parser = new ErsteModernPositionalParser();

    return parser.parse(items);
};
