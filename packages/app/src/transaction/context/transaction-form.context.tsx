import { TransactionCreateInputInterface } from '@budgie/contracts';
import { createContext, ReactNode, use } from 'react';
import { Control, UseFormClearErrors, UseFormSetError, UseFormSetValue } from 'react-hook-form';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

interface TransactionFormContextValue {
    readonly control: Control<TransactionCreateInputInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateInputInterface>;
    readonly setError: UseFormSetError<TransactionCreateInputInterface>;
    readonly clearErrors: UseFormClearErrors<TransactionCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionFormContext = createContext<TransactionFormContextValue | null>(null);

export const useTransactionFormContext = () => {
    const context = use(TransactionFormContext);

    if (!context) {
        throw new Error('useTransactionFormContext must be used within TransactionFormProvider');
    }

    return context;
};

interface TransactionFormProviderProps extends TransactionFormContextValue {
    readonly children: ReactNode;
}

export const TransactionFormProvider = ({ children, control, setValue, setError, clearErrors, variant }: TransactionFormProviderProps) => {
    const value = { control, setValue, setError, clearErrors, variant };

    return <TransactionFormContext value={value}>{children}</TransactionFormContext>;
};
