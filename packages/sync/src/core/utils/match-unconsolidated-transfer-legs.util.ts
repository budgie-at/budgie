import { TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionEntryTypeEnum } from '@budgie/contracts';
import { millisecondsInSecond } from 'date-fns/constants';

import { OWN_TRANSFER_AMOUNT_TOLERANCE } from '../constant/own-transfer-amount-tolerance.constant';

import type { TransferLegEvidenceType } from '../interface/transfer-leg-evidence.type';
import type { TransferLegMatchCandidateInterface } from '../interface/transfer-leg-match-candidate.interface';
import type { UnconsolidatedTransferLegInterface } from '../interface/unconsolidated-transfer-leg.interface';

const isMatchingPair = (
    candidate: TransferLegMatchCandidateInterface,
    leg: UnconsolidatedTransferLegInterface,
    hasEvidence: TransferLegEvidenceType
): boolean =>
    leg.entryType === (candidate.isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT) &&
    Math.abs(leg.operatedAt.getTime() - candidate.operatedAt.getTime()) <= TRANSFER_PAIR_TIME_WINDOW_SECONDS * millisecondsInSecond &&
    candidate.amount >= leg.amount - OWN_TRANSFER_AMOUNT_TOLERANCE &&
    hasEvidence(candidate.title, leg);

export const matchUnconsolidatedTransferLegs = <T extends TransferLegMatchCandidateInterface>(
    candidates: readonly T[],
    legs: readonly UnconsolidatedTransferLegInterface[],
    hasEvidence: TransferLegEvidenceType
): ReadonlySet<T> => {
    const pairs = candidates
        .flatMap(candidate =>
            legs
                .filter(leg => isMatchingPair(candidate, leg, hasEvidence))
                .map(leg => ({
                    candidate,
                    leg,
                    amountDifference: Math.abs(candidate.amount - leg.amount),
                    distance: Math.abs(leg.operatedAt.getTime() - candidate.operatedAt.getTime())
                }))
        )
        .sort((left, right) => left.amountDifference - right.amountDifference || left.distance - right.distance);
    const claimedCandidates = new Set<T>();
    const claimedLegIds = new Set<number>();

    for (const { candidate, leg } of pairs) {
        if (!claimedCandidates.has(candidate) && !claimedLegIds.has(leg.transactionId)) {
            claimedCandidates.add(candidate);
            claimedLegIds.add(leg.transactionId);
        }
    }

    return new Set([...claimedCandidates].filter(candidate => !candidate.isKnown));
};
