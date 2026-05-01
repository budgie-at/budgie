import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { ConsolidationSourceModalParamsInterface } from '../interface/consolidation-source-modal-params.interface';
import type { ConsolidationSourceModalResultType } from '../interface/consolidation-source-modal-result.type';

export const [ConsolidationSourceModalContext, useConsolidationSourceModal] = createModalContext<
    ConsolidationSourceModalParamsInterface,
    ConsolidationSourceModalResultType
>(null);
