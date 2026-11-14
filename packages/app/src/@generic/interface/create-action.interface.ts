import { UserIconNameEnum } from '@budgie/contracts';

import type { CreateMenuTileVariant } from '../type/create-menu-tile-variant.type';

export interface CreateActionInterface {
    icon: UserIconNameEnum;
    label: string;
    variant: CreateMenuTileVariant;
    onPress: () => void;
    testID?: string;
}
