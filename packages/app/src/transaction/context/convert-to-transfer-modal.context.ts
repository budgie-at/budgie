import { TransactionTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

export interface ConvertToTransferModalParams {
    readonly transactionId: number;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly excludeAccountId: number;
    readonly sourceAmount: number;
    readonly sourceInstrumentId: number;
    readonly sourceCode: string;
    readonly skipPostConvertNavigation?: boolean;
}

const [ConvertToTransferModalContext, useConvertToTransferModal, useConvertToTransferModalParams] = createModalContext<
    ConvertToTransferModalParams,
    boolean
>(false);

export { useConvertToTransferModal, useConvertToTransferModalParams };

export const ConvertToTransferModalProvider = createModalProvider(ConvertToTransferModalContext, '/convert-to-transfer');
