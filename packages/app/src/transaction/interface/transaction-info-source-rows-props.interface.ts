import type { TransactionInfoActionHandlersInterface } from './transaction-info-action-handlers.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionInfoSourceRowsPropsInterface extends Pick<
    TransactionInfoActionHandlersInterface,
    'onOpenConsolidationSources'
> {
    readonly transaction: TransactionWithRelationsEntityInterface;
}
