import { TransactionTypeEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface ConvertToTransferModalParams {
    readonly transactionId: number;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly excludeAccountId: number;
}

interface ConvertToTransferModalContextInterface {
    openConvertToTransfer: (params: ConvertToTransferModalParams) => Promise<boolean>;
    resolveConvertToTransfer: (result: boolean) => void;
    currentParams: ConvertToTransferModalParams | null;
}

export const ConvertToTransferModalContext = createContext<ConvertToTransferModalContextInterface>({
    openConvertToTransfer: () => Promise.resolve(false),
    resolveConvertToTransfer: emptyFn,
    currentParams: null
});

export const useConvertToTransferModal = () => use(ConvertToTransferModalContext);
