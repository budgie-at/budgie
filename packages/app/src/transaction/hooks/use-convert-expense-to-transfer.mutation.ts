import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import { transactionService } from '../service/transaction.service';

export const useConvertExpenseToTransferMutation = () => async (params: ConvertToTransferParamsInterface) =>
    await transactionService.convertExpenseToTransfer(params);
