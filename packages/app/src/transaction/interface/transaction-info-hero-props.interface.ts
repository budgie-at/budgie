import type { TransactionInfoActionHandlersInterface } from './transaction-info-action-handlers.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionInfoHeroPropsInterface extends Pick<TransactionInfoActionHandlersInterface, 'onOpenRefundSources'> {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly matchingRuleIds: readonly number[];
}
