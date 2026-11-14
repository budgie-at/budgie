import type { UserIconNameEnum } from '@budgie/contracts';

export interface CreateMenuItemPropsInterface {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}
