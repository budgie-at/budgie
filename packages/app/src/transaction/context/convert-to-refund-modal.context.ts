import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { ConvertToRefundModalParamsInterface } from '../interface/convert-to-refund-modal-params.interface';
import type { ConvertToRefundModalResultType } from '../interface/convert-to-refund-modal-result.type';

export const [ConvertToRefundModalContext, useConvertToRefundModal] = createModalContext<
    ConvertToRefundModalParamsInterface,
    ConvertToRefundModalResultType
>(null);
