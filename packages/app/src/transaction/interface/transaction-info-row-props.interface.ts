import type { UserIconNameEnum } from '@budgie/contracts';
import type { ReactNode } from 'react';

export interface TransactionInfoRowPropsInterface {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value?: string | null;
    readonly description?: string | null;
    readonly children?: ReactNode;
    readonly testID: string;
    readonly onPress?: () => void;
}
