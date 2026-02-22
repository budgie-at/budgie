import { UserIconNameEnum } from '@budgie/contracts';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';
import { createModalContext } from '../utils/create-modal-context/create-modal-context.util';

export interface IconSelectorModalParams {
    readonly selectedIcon?: UserIconNameEnum;
    readonly variant?: ColorPaletteVariant;
    readonly keywords?: string[];
}

export type IconSelectorResult = UserIconNameEnum | null;

export const [IconSelectorModalContext, useIconSelectorModal] = createModalContext<IconSelectorModalParams, IconSelectorResult>(null);
