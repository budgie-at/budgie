import { MessageDescriptor } from '@lingui/core';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

import type { UserIconNameEnum } from '@budgie/contracts';

export interface AiDownloadCardVisualInterface {
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
    readonly label: MessageDescriptor;
}
