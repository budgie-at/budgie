import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import { transactionTransferService } from '../service/transaction-transfer.service';

export const useConvertExpenseToTransferMutation = () => async (params: ConvertToTransferParamsInterface) =>
    await transactionTransferService.convertExpenseToTransfer(params);
