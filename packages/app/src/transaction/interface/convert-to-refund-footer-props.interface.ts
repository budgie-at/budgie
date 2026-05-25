import type { TransactionPickerItemInterface } from './transaction-picker-item.interface';

export interface ConvertToRefundFooterPropsInterface {
    readonly selectedCandidate: TransactionPickerItemInterface | null;
    readonly showRevert: boolean;
    readonly onClose: () => void;
    readonly onConvert: () => void;
    readonly onRevert: () => void;
}
