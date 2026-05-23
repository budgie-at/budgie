import type { ConvertToRefundModalParamsInterface } from './convert-to-refund-modal-params.interface';
import type { ConvertToRefundModalResultType } from './convert-to-refund-modal-result.type';
import type { ModalContextTuple } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export type ConvertToRefundModalResolveType = ModalContextTuple<ConvertToRefundModalParamsInterface, ConvertToRefundModalResultType>[1];
