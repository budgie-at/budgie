import type { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';

export interface RadialActionItemInterface {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly variant: ColorPaletteVariant;
    readonly onPress: () => void;
}
