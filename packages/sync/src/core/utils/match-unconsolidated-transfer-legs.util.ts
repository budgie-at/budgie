import { TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionEntryTypeEnum } from '@budgie/contracts';
import { millisecondsInSecond } from 'date-fns/constants';

import { isDefined } from '@rnw-community/shared';

import type { TransferLegEvidenceType } from '../interface/transfer-leg-evidence.type';
import type { TransferLegMatchCandidateInterface } from '../interface/transfer-leg-match-candidate.interface';
import type { UnconsolidatedTransferLegInterface } from '../interface/unconsolidated-transfer-leg.interface';

const getDistance = (candidate: TransferLegMatchCandidateInterface, leg: UnconsolidatedTransferLegInterface): number =>
    Math.abs(leg.operatedAt.getTime() - candidate.operatedAt.getTime());

const isMatchingPair = (
    candidate: TransferLegMatchCandidateInterface,
    leg: UnconsolidatedTransferLegInterface,
    hasEvidence: TransferLegEvidenceType
): boolean => {
    if (isDefined(leg.entryExternalId)) {
        return candidate.externalIds.includes(leg.entryExternalId);
    }

    return (
        leg.entryType === (candidate.isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT) &&
        getDistance(candidate, leg) <= TRANSFER_PAIR_TIME_WINDOW_SECONDS * millisecondsInSecond &&
        candidate.amounts.includes(leg.amount) &&
        hasEvidence(candidate.title, leg)
    );
};

export const matchUnconsolidatedTransferLegs = <T extends TransferLegMatchCandidateInterface>(
    candidates: readonly T[],
    legs: readonly UnconsolidatedTransferLegInterface[],
    hasEvidence: TransferLegEvidenceType
): ReadonlyMap<T, UnconsolidatedTransferLegInterface> => {
    const pairs = candidates
        .flatMap(candidate => legs.filter(leg => isMatchingPair(candidate, leg, hasEvidence)).map(leg => ({ candidate, leg })))
        .sort(
            (left, right) =>
                Number(isDefined(right.leg.entryExternalId)) - Number(isDefined(left.leg.entryExternalId)) ||
                Number(right.candidate.isKnown) - Number(left.candidate.isKnown) ||
                getDistance(left.candidate, left.leg) - getDistance(right.candidate, right.leg)
        );
    const matches = new Map<T, UnconsolidatedTransferLegInterface>();
    const claimedLegIds = new Set<number>();

    for (const { candidate, leg } of pairs) {
        if (!matches.has(candidate) && !claimedLegIds.has(leg.entryId)) {
            matches.set(candidate, leg);
            claimedLegIds.add(leg.entryId);
        }
    }

    return new Map([...matches].filter(([candidate]) => !candidate.isKnown));
};
