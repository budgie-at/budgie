import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from './title-max-font-size-multiplier.constant';

export const CHROME_TITLE_TEXT_PROPS = {
    adjustsFontSizeToFit: true,
    maxFontSizeMultiplier: TITLE_MAX_FONT_SIZE_MULTIPLIER,
    minimumFontScale: 0.5,
    numberOfLines: 1
} as const;
