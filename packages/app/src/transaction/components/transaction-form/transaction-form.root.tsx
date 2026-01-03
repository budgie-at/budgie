import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { EmptyFn } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionFormProvider } from '../../context/transaction-form.context';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';

export interface TransactionFormRootProps {
    readonly form: UseFormReturn<TransactionCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconNameEnum;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
    readonly onDelete?: EmptyFn;
    readonly children: ReactNode;
}

export const TransactionFormRoot = ({ form, variant, title, description, icon, buttonText, onSubmit, onDelete, children }: TransactionFormRootProps) => {
    const { control, setValue, setError, clearErrors } = form;

    return (
        <TransactionFormProvider control={control} setValue={setValue} setError={setError} clearErrors={clearErrors} variant={variant}>
            <TransactionFormLayout
                title={title}
                description={description}
                icon={icon}
                variant={variant}
                buttonText={buttonText}
                onSubmit={onSubmit}
                onDelete={onDelete}
            >
                {children}
            </TransactionFormLayout>
        </TransactionFormProvider>
    );
};
