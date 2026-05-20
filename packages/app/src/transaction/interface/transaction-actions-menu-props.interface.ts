import type { EmptyFn } from '@rnw-community/shared';
import type { ReactNode } from 'react';

export interface TransactionActionsMenuPropsInterface {
    readonly onDelete: () => Promise<void> | void;
    readonly onRevert?: EmptyFn;
    readonly isConsolidated?: boolean;
    readonly children?: ReactNode;
}
