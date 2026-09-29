import { appRuntime } from '../../@generic/runtime/app.runtime';
import { transactionRefundService } from '../service/transaction-refund.service';

import type { ConvertToRefundParamsInterface } from '@budgie/consolidation';

export const useConvertToRefundMutation = () => async (params: ConvertToRefundParamsInterface) =>
    await appRuntime.runPromise(transactionRefundService.convertToRefund(params));
