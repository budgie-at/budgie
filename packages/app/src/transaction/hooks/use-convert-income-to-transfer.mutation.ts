import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import { transactionService } from '../service/transaction.service';

export const useConvertIncomeToTransferMutation = () => async (params: ConvertToTransferParamsInterface) =>
    await transactionService.convertIncomeToTransfer(params);
