import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';

export interface CreateMenuItemPropsInterface<TVariant extends ColorPaletteVariant = ColorPaletteVariant> {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID: string;
    readonly variant: TVariant;
    readonly onPress: () => void;
}
