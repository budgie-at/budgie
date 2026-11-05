import { FormProvider } from 'react-hook-form';

import { TransactionFormScreen } from '../transaction-form-screen/transaction-form-screen';

import type { UpdateSimpleTransactionPagePropsInterface } from '../../interface/update-simple-transaction-page-props.interface';

export const UpdateSimpleTransactionPage = ({ form, title, children, onGoBack, right }: UpdateSimpleTransactionPagePropsInterface) => (
    <FormProvider {...form}>
        <TransactionFormScreen title={title} onGoBack={onGoBack} right={right}>
            {children}
        </TransactionFormScreen>
    </FormProvider>
);
