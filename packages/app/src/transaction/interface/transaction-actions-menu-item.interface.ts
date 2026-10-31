import type { UserIconNameEnum } from '@budgie/contracts';

export interface TransactionActionsMenuItemInterface {
    readonly key: string;
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID: string;
    readonly isPrimary: boolean;
    readonly consequence?: string;
    readonly onPress: () => void;
}
