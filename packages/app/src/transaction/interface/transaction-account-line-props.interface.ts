import type { UserIconNameEnum } from '@budgie/contracts';

export interface TransactionAccountLinePropsInterface {
    readonly direction: 'from' | 'to';
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly testID?: string;
}
