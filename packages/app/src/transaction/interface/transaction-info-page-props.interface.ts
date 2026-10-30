import type { TransactionActionsMenuItemInterface } from './transaction-actions-menu-item.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { Href } from 'expo-router';

export interface TransactionInfoPagePropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly editHref: Href | null;
    readonly onDelete: () => unknown;
    readonly onFeePress: () => void;
    readonly actionItems: readonly TransactionActionsMenuItemInterface[];
    readonly onOpenRefundSources?: () => void;
    readonly onOpenConsolidationSources?: () => void;
}
