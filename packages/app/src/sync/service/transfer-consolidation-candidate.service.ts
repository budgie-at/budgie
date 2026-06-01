import { ConsolidationCandidateService } from '@budgie/consolidation';

import { refundPairRepository, transferPairRepository } from '../../@generic/drizzle/db/db';

export const transferConsolidationCandidateService = new ConsolidationCandidateService({
    refundPairRepository,
    transferPairRepository
});
