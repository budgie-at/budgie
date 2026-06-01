import { ConsolidationAutoCandidateService } from '@budgie/consolidation';

import { transferConsolidationExecutorService } from './transfer-consolidation-executor.service';

export const transferConsolidationAutoCandidateService = new ConsolidationAutoCandidateService(transferConsolidationExecutorService);
