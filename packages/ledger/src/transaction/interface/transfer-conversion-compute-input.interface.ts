import type { ConvertToTransferParamsInterface } from './convert-to-transfer-params.interface';
import type { AccountEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export interface TransferConversionComputeInputInterface {
    readonly direction: 'expense' | 'income';
    readonly params: ConvertToTransferParamsInterface;
    readonly transaction: TransactionWithEntriesEntityInterface;
    readonly fromAccount: Pick<AccountEntityInterface, 'id' | 'instrumentId'>;
    readonly toAccount: Pick<AccountEntityInterface, 'id' | 'instrumentId'>;
    readonly counterAmount: number | null;
}
