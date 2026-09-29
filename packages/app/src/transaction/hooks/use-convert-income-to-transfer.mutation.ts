import { appRuntime } from '../../@generic/runtime/app.runtime';
import { ConvertToTransferParamsInterface } from '../interface/convert-to-transfer-params.interface';
import { transactionTransferService } from '../service/transaction-transfer.service';

export const useConvertIncomeToTransferMutation = () => async (params: ConvertToTransferParamsInterface) =>
    await appRuntime.runPromise(transactionTransferService.convertIncomeToTransfer(params));
