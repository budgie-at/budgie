import { TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionEntryTypeEnum } from '@budgie/contracts';
import { millisecondsInSecond } from 'date-fns/constants';

import { isDefined } from '@rnw-community/shared';

import { OWN_TRANSFER_AMOUNT_TOLERANCE } from '../constant/own-transfer-amount-tolerance.constant';

import type { TransferLegEvidenceType } from '../interface/transfer-leg-evidence.type';
import type { TransferLegMatchCandidateInterface } from '../interface/transfer-leg-match-candidate.interface';
import type { UnconsolidatedTransferLegInterface } from '../interface/unconsolidated-transfer-leg.interface';

const getDistance = (candidate: TransferLegMatchCandidateInterface, leg: UnconsolidatedTransferLegInterface): number =>
    Math.abs(leg.operatedAt.getTime() - candidate.operatedAt.getTime());

const isWithinFeeTolerance = (candidate: TransferLegMatchCandidateInterface, leg: UnconsolidatedTransferLegInterface): boolean =>
    candidate.isIncome
        ? candidate.amount <= leg.amount && candidate.amount >= leg.amount - OWN_TRANSFER_AMOUNT_TOLERANCE
        : candidate.amount >= leg.amount && candidate.amount <= leg.amount + OWN_TRANSFER_AMOUNT_TOLERANCE;

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
        isWithinFeeTolerance(candidate, leg) &&
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
                Number(right.candidate.isKnown) - Number(left.candidate.isKnown) ||
                Math.abs(left.candidate.amount - left.leg.amount) - Math.abs(right.candidate.amount - right.leg.amount) ||
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
