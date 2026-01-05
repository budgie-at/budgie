import { transactionService } from '../service/transaction.service';

export const useConvertExpenseToTransferMutation = () => async (id: number, toAccountId: number) => await transactionService.convertExpenseToTransfer(id, toAccountId);
