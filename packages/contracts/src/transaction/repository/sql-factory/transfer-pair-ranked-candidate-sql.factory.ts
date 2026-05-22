import { TRANSFER_PAIR_RANKED_CANDIDATE_BASE_SQL } from './transfer-pair-ranked-candidate-base-sql.factory';
import { TRANSFER_PAIR_RANKED_CANDIDATE_RANK_SQL } from './transfer-pair-ranked-candidate-rank-sql.factory';

export const buildTransferPairRankedCandidateSql = (): string => `
    ${TRANSFER_PAIR_RANKED_CANDIDATE_BASE_SQL}
    ${TRANSFER_PAIR_RANKED_CANDIDATE_RANK_SQL}
`;
