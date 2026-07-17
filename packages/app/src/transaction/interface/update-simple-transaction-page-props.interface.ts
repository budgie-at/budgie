import type { TransactionCreateInputInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';

export interface UpdateSimpleTransactionPagePropsInterface {
    readonly form: UseFormReturn<TransactionCreateInputInterface, unknown, TransactionCreateInputInterface>;
    readonly title: string;
    readonly children: ReactNode;
    readonly onGoBack: () => void;
    readonly right: ReactNode;
}
