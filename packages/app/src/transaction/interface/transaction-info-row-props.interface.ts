import type { UserIconNameEnum } from '@budgie/contracts';

export interface TransactionInfoRowPropsInterface {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value: string;
    readonly description?: string | null;
    readonly testID: string;
    readonly onPress?: () => void;
}
