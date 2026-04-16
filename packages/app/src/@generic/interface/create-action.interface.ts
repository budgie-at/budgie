import { UserIconNameEnum } from '@budgie/contracts';

import type { ColorPaletteVariant } from '../type/color-palette-variant.type';

export interface CreateActionInterface {
    icon: UserIconNameEnum;
    label: string;
    variant: ColorPaletteVariant;
    onPress: () => void;
}
