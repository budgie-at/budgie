import { transactionService } from '../service/transaction.service';

export const useConvertIncomeToTransferMutation = () => async (id: number, fromAccountId: number) =>
    await transactionService.convertIncomeToTransfer(id, fromAccountId);
