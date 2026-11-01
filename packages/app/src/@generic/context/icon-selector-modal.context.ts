import { UserIconNameEnum, UserIconType } from '@budgie/contracts';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';
import { createModalContext } from '../utils/create-modal-context/create-modal-context.util';

export interface IconSelectorModalParams {
    readonly selectedIcon?: UserIconType;
    readonly variant?: ColorPaletteVariant;
    readonly keywords?: string[];
    readonly excludedIcons?: readonly UserIconNameEnum[];
}

export type IconSelectorResult = UserIconType | null;

export const [IconSelectorModalContext, useIconSelectorModal, useIconSelectorModalParams] = createModalContext<
    IconSelectorModalParams,
    IconSelectorResult
>(null);
