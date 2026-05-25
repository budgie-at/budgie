import type { UserIconNameEnum } from '@budgie/contracts';

export interface TransactionConvertMenuItemPropsInterface {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly onConvert: () => void;
    readonly testID: string;
}
