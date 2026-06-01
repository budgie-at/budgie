import { transactionRefundService } from '../service/transaction-refund.service';

import type { ConvertToRefundParamsInterface } from '@budgie/consolidation';

export const useConvertToRefundMutation = () => async (params: ConvertToRefundParamsInterface) =>
    await transactionRefundService.convertToRefund(params);
