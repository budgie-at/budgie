import type { TransactionInfoActionHandlersInterface } from './transaction-info-action-handlers.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { Href } from 'expo-router';

export interface TransactionInfoPagePropsInterface extends TransactionInfoActionHandlersInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly editHref: Href;
}
