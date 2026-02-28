import { ErsteFormatEnum } from '../enum/erste-format.enum';
import { ErsteClassicTextParser } from '../parser/erste-classic-text-parser';
import { ErsteModernTextParser } from '../parser/erste-modern-text-parser';

import { detectErsteFormat } from './detect-erste-format.util';

import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteTextParserInterface } from '../parser/erste-text-parser.interface';

const parserMap: Record<ErsteFormatEnum, () => ErsteTextParserInterface> = {
    [ErsteFormatEnum.Classic]: () => new ErsteClassicTextParser(),
    [ErsteFormatEnum.Modern]: () => new ErsteModernTextParser()
};

export const parseErsteText = (text: string): ErsteParsedDataInterface => {
    const format = detectErsteFormat(text);
    const parser = parserMap[format]();

    return parser.parse(text);
};
