import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { RuleOptionMetaInterface } from './rule-option-meta.interface';

export interface RuleActionMetaInterface extends RuleOptionMetaInterface {
    readonly variant: ColorPaletteVariant;
}
