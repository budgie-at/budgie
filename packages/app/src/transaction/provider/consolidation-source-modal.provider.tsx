import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { ConsolidationSourceModalContext } from '../context/consolidation-source-modal.context';

import type { ConsolidationSourceModalParamsInterface } from '../interface/consolidation-source-modal-params.interface';
import type { ConsolidationSourceModalResultType } from '../interface/consolidation-source-modal-result.type';

export const ConsolidationSourceModalProvider = createModalProvider<
    ConsolidationSourceModalParamsInterface,
    ConsolidationSourceModalResultType
>(ConsolidationSourceModalContext, '/consolidation-source');
