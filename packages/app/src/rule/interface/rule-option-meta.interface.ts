import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { RuleGlyphEnum } from '../enum/rule-glyph.enum';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

export interface RuleOptionMetaInterface {
    readonly label: MessageDescriptor;
    readonly phrase: MessageDescriptor;
    readonly description: MessageDescriptor;
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
    readonly glyph?: RuleGlyphEnum;
}
