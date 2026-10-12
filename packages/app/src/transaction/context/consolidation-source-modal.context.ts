import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

import type { ConsolidationSourceModalParamsInterface } from '../interface/consolidation-source-modal-params.interface';
import type { ConsolidationSourceModalResultType } from '../interface/consolidation-source-modal-result.type';

const [ConsolidationSourceModalContext, useConsolidationSourceModal, useConsolidationSourceModalParams] = createModalContext<
    ConsolidationSourceModalParamsInterface,
    ConsolidationSourceModalResultType
>(null);

export { useConsolidationSourceModal, useConsolidationSourceModalParams };

export const ConsolidationSourceModalProvider = createModalProvider(ConsolidationSourceModalContext, '/consolidation-source');
