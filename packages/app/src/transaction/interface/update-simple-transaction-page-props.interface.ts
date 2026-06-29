import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export interface UpdateSimpleTransactionPagePropsInterface {
    readonly form: UseFormReturn<TransactionCreateInputInterface, unknown, TransactionCreateInputInterface>;
    readonly title: string;
    readonly isConsolidated: boolean;
    readonly children: ReactNode;
    readonly onGoBack: () => void;
    readonly onDelete: () => void;
    readonly onRevert: () => void;
    readonly onConvertToRefund?: () => void;
    readonly onConvertToTransfer?: () => void;
}
