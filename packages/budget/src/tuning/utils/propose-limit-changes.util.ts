import { BudgetLimitChangeReasonEnum, PRECISION } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { BUDGET_TUNING_PERIOD_COUNT } from '../constant/budget-tuning-period-count.constant';

import type { BudgetLimitProposalInterface } from '../interface/budget-limit-proposal.interface';
import type { BudgetTuneCandidateInterface } from '../interface/budget-tune-candidate.interface';
import type { BudgetTuneLimitsInterface } from '../interface/budget-tune-limits.interface';
import type { BudgetTuneSampleInterface } from '../interface/budget-tune-sample.interface';
import type { BudgetTuneSnapshotInterface } from '../interface/budget-tune-snapshot.interface';
import type { BudgetLimitChangeEntityInterface } from '@budgie/contracts';

const UNDER_SPENT_PERCENT = 80;
const MAX_STEP_PERCENT = 10;
const FULL_PERCENT = 100;

const sumOf = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

const roundUpToUnit = (amount: number): number => Math.ceil(amount / PRECISION) * PRECISION;

const roundDownToUnit = (amount: number): number => Math.floor(amount / PRECISION) * PRECISION;

const compareByCategory = (first: BudgetLimitProposalInterface, second: BudgetLimitProposalInterface): number =>
    (first.categoryId ?? Number.MAX_SAFE_INTEGER) - (second.categoryId ?? Number.MAX_SAFE_INTEGER);

const resolveReason = (samples: readonly BudgetTuneSampleInterface[]): BudgetLimitChangeReasonEnum | null => {
    if (samples.every(sample => sample.spent * FULL_PERCENT <= sample.limit * UNDER_SPENT_PERCENT)) {
        return BudgetLimitChangeReasonEnum.UNDER_SPENT;
    }

    if (samples.every(sample => sample.spent > sample.limit)) {
        return BudgetLimitChangeReasonEnum.OVER_SPENT;
    }

    return null;
};

const buildProposal = (candidate: BudgetTuneCandidateInterface): BudgetLimitProposalInterface | null => {
    const reason = candidate.isLocked ? null : resolveReason(candidate.samples);

    if (!isDefined(reason)) {
        return null;
    }

    const meanSpent = sumOf(candidate.samples.map(sample => sample.spent)) / candidate.samples.length;
    const isLowering = reason === BudgetLimitChangeReasonEnum.UNDER_SPENT;
    const lowerBound = (candidate.currentLimit * (FULL_PERCENT - MAX_STEP_PERCENT)) / FULL_PERCENT;
    const upperBound = (candidate.currentLimit * (FULL_PERCENT + MAX_STEP_PERCENT)) / FULL_PERCENT;
    const newAmount = isLowering
        ? Math.max(roundUpToUnit(Math.max(meanSpent, lowerBound)), PRECISION)
        : roundDownToUnit(Math.min(meanSpent, upperBound));
    const isMoved = isLowering ? newAmount < candidate.currentLimit : newAmount > candidate.currentLimit;

    return isMoved
        ? {
              categoryId: candidate.categoryId,
              previousAmount: candidate.currentLimit,
              newAmount,
              reason,
              periodsObserved: candidate.samples.length
          }
        : null;
};

const isEditedInCurrentPeriod = (editedAt: Date | null, currentPeriodStart: Date): boolean =>
    isDefined(editedAt) && editedAt.getTime() >= currentPeriodStart.getTime();

const isCoolingDown = (
    categoryId: number | null,
    recentChanges: readonly Pick<BudgetLimitChangeEntityInterface, 'categoryId' | 'periodStart'>[],
    cooldownStart: Date
): boolean => recentChanges.some(change => change.categoryId === categoryId && change.periodStart.getTime() >= cooldownStart.getTime());

const buildCategoryCandidates = (
    snapshots: readonly BudgetTuneSnapshotInterface[],
    limits: BudgetTuneLimitsInterface,
    isLocked: (categoryId: number | null, editedAt: Date | null) => boolean
): BudgetTuneCandidateInterface[] =>
    limits.categories
        .map(limit => ({
            categoryId: limit.categoryId,
            currentLimit: limit.limitAmount,
            isLocked: isLocked(limit.categoryId, limit.userEditedAt),
            samples: snapshots.flatMap(snapshot => {
                const snapshotCategory = snapshot.categories.find(entry => entry.categoryId === limit.categoryId);

                return isDefined(snapshotCategory)
                    ? [{ spent: snapshotCategory.spent, limit: snapshotCategory.limitAmount + snapshotCategory.carriedIn }]
                    : [];
            })
        }))
        .filter(candidate => candidate.samples.length === BUDGET_TUNING_PERIOD_COUNT);

const buildOtherCandidate = (
    snapshots: readonly BudgetTuneSnapshotInterface[],
    limits: BudgetTuneLimitsInterface,
    isLocked: (categoryId: number | null, editedAt: Date | null) => boolean
): BudgetTuneCandidateInterface => ({
    categoryId: null,
    currentLimit: limits.otherLimit,
    isLocked: isLocked(null, limits.otherLimitUserEditedAt),
    samples: snapshots.map(snapshot => ({ spent: snapshot.otherSpent, limit: snapshot.otherLimit + snapshot.otherCarriedIn }))
});

const capRaises = (
    proposals: readonly BudgetLimitProposalInterface[],
    limits: BudgetTuneLimitsInterface
): BudgetLimitProposalInterface[] => {
    const lowered = proposals.filter(proposal => proposal.reason === BudgetLimitChangeReasonEnum.UNDER_SPENT);
    const raised = proposals.filter(proposal => proposal.reason === BudgetLimitChangeReasonEnum.OVER_SPENT).sort(compareByCategory);
    const currentTotal = sumOf(limits.categories.map(limit => limit.limitAmount)) + limits.otherLimit;
    const freed = sumOf(lowered.map(proposal => proposal.previousAmount - proposal.newAmount));
    let room = limits.overallLimit - currentTotal + freed;
    const capped: BudgetLimitProposalInterface[] = [];

    for (const proposal of raised) {
        const grant = Math.min(proposal.newAmount - proposal.previousAmount, Math.max(room, 0));
        const newAmount = roundDownToUnit(proposal.previousAmount + grant);

        if (newAmount > proposal.previousAmount) {
            capped.push({ ...proposal, newAmount });
            room -= newAmount - proposal.previousAmount;
        }
    }

    return [...lowered, ...capped];
};

export const proposeLimitChanges = (
    history: readonly BudgetTuneSnapshotInterface[],
    limits: BudgetTuneLimitsInterface,
    currentPeriodStart: Date,
    recentChanges: readonly Pick<BudgetLimitChangeEntityInterface, 'categoryId' | 'periodStart'>[]
): readonly BudgetLimitProposalInterface[] => {
    const snapshots = history
        .filter(snapshot => !snapshot.isReconstructed)
        .sort((first, second) => second.periodStart.getTime() - first.periodStart.getTime())
        .slice(0, BUDGET_TUNING_PERIOD_COUNT);

    if (snapshots.length < BUDGET_TUNING_PERIOD_COUNT) {
        return [];
    }

    const cooldownStart = new Date(Math.min(...snapshots.map(snapshot => snapshot.periodStart.getTime())));
    const isLocked = (categoryId: number | null, editedAt: Date | null): boolean =>
        isEditedInCurrentPeriod(editedAt, currentPeriodStart) || isCoolingDown(categoryId, recentChanges, cooldownStart);
    const candidates = [...buildCategoryCandidates(snapshots, limits, isLocked), buildOtherCandidate(snapshots, limits, isLocked)];

    return capRaises(candidates.map(buildProposal).filter(isDefined), limits);
};
