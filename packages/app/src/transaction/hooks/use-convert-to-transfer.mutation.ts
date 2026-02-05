import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import { transactionService } from '../service/transaction.service';

export const useConvertToTransferMutation = () => async (params: ConvertToTransferParamsInterface) =>
    await transactionService.convertToTransfer(params);
