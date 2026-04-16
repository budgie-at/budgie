import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import { transactionTransferService } from '../service/transaction-transfer.service';

export const useConvertIncomeToTransferMutation = () => async (params: ConvertToTransferParamsInterface) =>
    await transactionTransferService.convertIncomeToTransfer(params);
