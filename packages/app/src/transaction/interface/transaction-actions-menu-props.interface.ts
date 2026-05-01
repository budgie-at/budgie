import type { ReactNode } from 'react';

export interface TransactionActionsMenuPropsInterface {
    readonly onDelete: () => Promise<void> | void;
    readonly isConsolidated?: boolean;
    readonly children?: ReactNode;
}
