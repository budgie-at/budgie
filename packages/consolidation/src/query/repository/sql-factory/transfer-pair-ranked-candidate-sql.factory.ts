import { buildTransferPairRankedCandidateBaseSql } from './transfer-pair-ranked-candidate-base-sql.factory';
import { TRANSFER_PAIR_RANKED_CANDIDATE_RANK_SQL } from './transfer-pair-ranked-candidate-rank-sql.factory';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const buildTransferPairRankedCandidateSql = (scope: ConsolidationScanScopeInterface | null): string => `
    ${buildTransferPairRankedCandidateBaseSql(scope)}
    ${TRANSFER_PAIR_RANKED_CANDIDATE_RANK_SQL}
`;
