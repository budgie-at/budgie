import { TransactionEntryAssociationEnum } from '@budgie/contracts';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

import type { ConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';
import type { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

type ConvertToTransferSourceProps = Pick<
    ConvertToTransferModalParams,
    'transactionId' | 'transactionType' | 'excludeAccountId' | 'sourceAmount' | 'sourceInstrumentId' | 'sourceCode'
>;

export const buildConvertToTransferParams = (
    transactionId: number,
    transactionType: ConvertToTransferModalParams['transactionType'],
    sourceEntry: Pick<TransactionEntryWithRelationsEntityInterface, 'accountId' | 'amount' | TransactionEntryAssociationEnum.ACCOUNT>
): ConvertToTransferSourceProps => ({
    transactionId,
    transactionType,
    excludeAccountId: sourceEntry.accountId,
    sourceAmount: convertFromMicroUnits(sourceEntry.amount),
    sourceInstrumentId: sourceEntry.account.instrumentId,
    sourceCode: sourceEntry.account.instrument.code
});
