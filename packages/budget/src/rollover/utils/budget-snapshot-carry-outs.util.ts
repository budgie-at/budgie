import { BudgetRolloverModeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { BudgetCarryOutsInterface } from '../interface/budget-carry-outs.interface';
import type { BudgetCarrySourceInterface } from '../interface/budget-carry-source.interface';

const computeCarryOut = (mode: BudgetRolloverModeEnum, effectiveLimit: number, spent: number): number => {
    if (mode === BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT) {
        return effectiveLimit - spent;
    }

    return mode === BudgetRolloverModeEnum.SURPLUS ? Math.max(effectiveLimit - spent, 0) : 0;
};

export const computeSnapshotCarryOuts = (snapshot: BudgetCarrySourceInterface | undefined): BudgetCarryOutsInterface => {
    if (!isDefined(snapshot)) {
        return { other: 0, byCategory: new Map() };
    }

    return {
        other: computeCarryOut(snapshot.otherRolloverMode, snapshot.otherLimit + snapshot.otherCarriedIn, snapshot.otherSpent),
        byCategory: new Map(
            snapshot.categories.map(category => [
                category.categoryId,
                computeCarryOut(category.rolloverMode, category.limitAmount + category.carriedIn, category.spent)
            ])
        )
    };
};
