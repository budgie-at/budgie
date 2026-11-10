import { FormProvider } from 'react-hook-form';

import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { TransactionFormScreen } from '../transaction-form-screen/transaction-form-screen';

import type { CreateTransactionFormConfigInterface } from '../../interface/create-transaction-form-config.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly config: CreateTransactionFormConfigInterface;
    readonly children: (onSubmit: () => Promise<void>) => ReactNode;
}

export const CreateTransactionScreen = ({ title, config, children }: Props) => {
    const { form, handleSubmit } = useCreateTransactionForm(config);

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <TransactionFormScreen title={title} onGoBack={handleGoBack}>
                {children(handleSubmit)}
            </TransactionFormScreen>
        </FormProvider>
    );
};
