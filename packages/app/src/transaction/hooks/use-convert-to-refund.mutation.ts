import { transactionRefundService } from '../service/transaction-refund.service';

import type { ConvertToRefundParamsInterface } from '../interface/convert-to-refund-params.interface';

export const useConvertToRefundMutation = () => async (params: ConvertToRefundParamsInterface) =>
    await transactionRefundService.convertToRefund(params);
