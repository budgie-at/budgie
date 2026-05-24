import type { EmptyFn } from '@rnw-community/shared';

export interface TransactionListConvertMenuItemPropsInterface {
    readonly isVisible: boolean;
    readonly isRefund?: boolean;
    readonly onConvert: EmptyFn;
}
