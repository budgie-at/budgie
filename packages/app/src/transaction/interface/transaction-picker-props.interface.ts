import type { TransactionPickerItemInterface } from './transaction-picker-item.interface';
import type { ReactNode } from 'react';

export interface TransactionPickerPropsInterface {
    readonly items: readonly TransactionPickerItemInterface[];
    readonly selectedItemId: number | null;
    readonly search: string;
    readonly searchPlaceholder: string;
    readonly isLoading: boolean;
    readonly errorMessage: string | null;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    readonly footer: ReactNode;
    readonly onSearchChange: (value: string) => void;
    readonly onSelectItem: (item: TransactionPickerItemInterface) => void;
    readonly testID: string;
    readonly searchTestID: string;
    readonly rowTestID: (id: number) => string;
}
