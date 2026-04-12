import { ErsteModernTextParser } from '../parser/erste-modern-text.parser';

import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';

export const parseErsteText = (text: string): ErsteParsedDataInterface => {
    const parser = new ErsteModernTextParser();

    return parser.parse(text);
};
