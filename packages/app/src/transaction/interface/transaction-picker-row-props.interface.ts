import type { TransactionPickerItemInterface } from './transaction-picker-item.interface';

export interface TransactionPickerRowPropsInterface {
    readonly item: TransactionPickerItemInterface;
    readonly isSelected?: boolean;
    readonly onPress?: (item: TransactionPickerItemInterface) => void;
    readonly testID?: string;
}
