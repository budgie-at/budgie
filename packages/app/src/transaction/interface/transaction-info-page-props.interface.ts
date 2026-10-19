import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';

export interface TransactionInfoPagePropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly editHref: Href | null;
    readonly actionsMenu: ReactNode;
    readonly onOpenRefundSources?: () => void;
    readonly onOpenConsolidationSources?: () => void;
}
