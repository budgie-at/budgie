import { UserIconNameEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

export interface IconSelectorModalParams {
    readonly selectedIcon?: UserIconNameEnum;
    readonly variant?: ColorPaletteVariant;
    readonly keywords?: string[];
}

export type IconSelectorResult = UserIconNameEnum | null;

interface IconSelectorModalContextInterface {
    openIconSelector: (params?: IconSelectorModalParams) => Promise<IconSelectorResult>;
    resolveIconSelector: (result: IconSelectorResult) => void;
    currentParams: IconSelectorModalParams | null;
}

export const IconSelectorModalContext = createContext<IconSelectorModalContextInterface>({
    openIconSelector: () => Promise.resolve(null),
    resolveIconSelector: emptyFn,
    currentParams: null
});

export const useIconSelectorModal = () => use(IconSelectorModalContext);
