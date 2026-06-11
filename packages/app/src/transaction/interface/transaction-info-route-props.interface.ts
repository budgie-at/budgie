import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

export interface TransactionInfoRoutePropsInterface {
    readonly children: (transaction: TransactionWithRelationsEntityInterface, transactionId: number) => ReactNode;
}
