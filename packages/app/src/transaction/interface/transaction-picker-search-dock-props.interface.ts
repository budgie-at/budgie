import type { ReactNode } from 'react';

export interface TransactionPickerSearchDockPropsInterface {
    readonly search: string;
    readonly searchPlaceholder: string;
    readonly footer: ReactNode;
    readonly onSearchChange: (value: string) => void;
    readonly searchTestID: string;
}
