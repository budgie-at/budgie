import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode, createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

export interface ConfirmActionModalParams {
    readonly variant: ColorPaletteVariant;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly buttonText: string;
    readonly description?: string;
    readonly buttonIcon?: UserIconNameEnum;
    readonly cancelText?: string;
    readonly isLoading?: boolean;
    readonly isDisabled?: boolean;
    readonly children?: ReactNode;
}

interface ConfirmActionModalContextInterface {
    openConfirmAction: (params: ConfirmActionModalParams) => Promise<boolean>;
    resolveConfirmAction: (confirmed: boolean) => void;
    updateConfirmActionParams: (params: Partial<ConfirmActionModalParams>) => void;
    currentParams: ConfirmActionModalParams | null;
}

export const ConfirmActionModalContext = createContext<ConfirmActionModalContextInterface>({
    openConfirmAction: () => Promise.resolve(false),
    resolveConfirmAction: emptyFn,
    updateConfirmActionParams: emptyFn,
    currentParams: null
});

export const useConfirmActionModal = () => use(ConfirmActionModalContext);
