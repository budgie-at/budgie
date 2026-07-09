import type { EmptyFn } from '@rnw-community/shared';

export interface TransactionListContextMenuCloseParamsInterface {
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly onCloseComplete: EmptyFn;
}
