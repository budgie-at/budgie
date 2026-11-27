import { TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { MccEntryLikeInterface } from '../interface/mcc-entry-like.interface';

const isBetterMccCandidate = (candidate: MccEntryLikeInterface, current: MccEntryLikeInterface): boolean => {
    const candidatePriority = candidate.type === TransactionEntryTypeEnum.FEE ? 1 : 0;
    const currentPriority = current.type === TransactionEntryTypeEnum.FEE ? 1 : 0;

    if (candidatePriority !== currentPriority) {
        return candidatePriority < currentPriority;
    }

    const candidateSequence = candidate.sequence ?? Number.POSITIVE_INFINITY;
    const currentSequence = current.sequence ?? Number.POSITIVE_INFINITY;

    if (candidateSequence !== currentSequence) {
        return candidateSequence < currentSequence;
    }

    const candidateId = candidate.id ?? Number.POSITIVE_INFINITY;
    const currentId = current.id ?? Number.POSITIVE_INFINITY;

    return candidateId < currentId;
};

export const resolveRuleMccCode = (entries: readonly MccEntryLikeInterface[]): string | null => {
    let bestEntry: MccEntryLikeInterface | null = null;
    let bestMcc: string | null = null;

    for (const entry of entries) {
        const mcc = entry.mccCode ?? entry.mccCategory?.mcc ?? null;

        if (isDefined(mcc) && (isDefined(bestEntry) ? isBetterMccCandidate(entry, bestEntry) : true)) {
            bestEntry = entry;
            bestMcc = mcc;
        }
    }

    return bestMcc;
};
