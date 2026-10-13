import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

import type { ConvertToRefundModalParamsInterface } from '../interface/convert-to-refund-modal-params.interface';
import type { ConvertToRefundModalResultType } from '../interface/convert-to-refund-modal-result.type';

const [ConvertToRefundModalContext, useConvertToRefundModal, useConvertToRefundModalParams] = createModalContext<
    ConvertToRefundModalParamsInterface,
    ConvertToRefundModalResultType
>(null);

export { useConvertToRefundModal, useConvertToRefundModalParams };

export const ConvertToRefundModalProvider = createModalProvider(ConvertToRefundModalContext, '/convert-to-refund');
