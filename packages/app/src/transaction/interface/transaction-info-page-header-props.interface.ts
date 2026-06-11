import type { TransactionInfoActionHandlersInterface } from './transaction-info-action-handlers.interface';
import type { EmptyFn } from '@rnw-community/shared';

export interface TransactionInfoPageHeaderPropsInterface extends TransactionInfoActionHandlersInterface {
    readonly isConsolidated: boolean;
    readonly onGoBack: EmptyFn;
}
