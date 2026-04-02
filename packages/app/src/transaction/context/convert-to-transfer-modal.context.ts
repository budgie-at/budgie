import { TransactionTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface ConvertToTransferModalParams {
    readonly transactionId: number;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly excludeAccountId: number;
    readonly sourceAmount: number;
    readonly sourceInstrumentId: number;
    readonly sourceCode: string;
    readonly skipPostConvertNavigation?: boolean;
}

export const [ConvertToTransferModalContext, useConvertToTransferModal] = createModalContext<ConvertToTransferModalParams, boolean>(false);
