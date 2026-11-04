import { GlyphSizeEnum } from '../enum/glyph-size.enum';

const WIDE_SCRIPT_PATTERN = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;

export const getGlyphSize = (symbol: string): GlyphSizeEnum => {
    const { length } = Array.from(symbol);

    if (length > 2 || WIDE_SCRIPT_PATTERN.test(symbol)) {
        return GlyphSizeEnum.CODE;
    }

    return length > 1 ? GlyphSizeEnum.PAIR : GlyphSizeEnum.SINGLE;
};
