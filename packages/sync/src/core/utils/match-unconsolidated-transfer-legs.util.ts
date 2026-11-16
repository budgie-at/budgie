import { TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionEntryTypeEnum } from '@budgie/contracts';
import { millisecondsInSecond } from 'date-fns/constants';

import { isDefined } from '@rnw-community/shared';

import { OWN_TRANSFER_AMOUNT_TOLERANCE } from '../constant/own-transfer-amount-tolerance.constant';

import type { TransferLegMatchCandidateInterface } from '../interface/transfer-leg-match-candidate.interface';
import type { UnconsolidatedTransferLegInterface } from '../interface/unconsolidated-transfer-leg.interface';

export const matchUnconsolidatedTransferLegs = <T extends TransferLegMatchCandidateInterface>(
    candidates: readonly T[],
    legs: readonly UnconsolidatedTransferLegInterface[]
): ReadonlySet<T> => {
    const claimedLegIds = new Set<number>();
    const matched = new Set<T>();

    for (const candidate of candidates) {
        const entryType = candidate.isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
        const getDistance = (leg: UnconsolidatedTransferLegInterface) =>
            Math.abs(leg.operatedAt.getTime() - candidate.operatedAt.getTime());
        const [leg] = legs
            .filter(
                item =>
                    !claimedLegIds.has(item.transactionId) &&
                    item.entryType === entryType &&
                    getDistance(item) <= TRANSFER_PAIR_TIME_WINDOW_SECONDS * millisecondsInSecond &&
                    Math.abs(item.amount - candidate.amount) <= OWN_TRANSFER_AMOUNT_TOLERANCE
            )
            .sort((left, right) => getDistance(left) - getDistance(right));

        if (isDefined(leg)) {
            claimedLegIds.add(leg.transactionId);
            matched.add(candidate);
        }
    }

    return matched;
};
