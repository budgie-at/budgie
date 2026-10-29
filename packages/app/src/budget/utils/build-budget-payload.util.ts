import { convertToMicroUnits } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { BudgetFormValues } from '../constant/budget-form-schema.constant';
import type { BudgetCreateInputInterface } from '@budgie/budget';

export const buildBudgetPayload = (values: BudgetFormValues): BudgetCreateInputInterface => ({
    name: values.name,
    period: values.period,
    periodStartDay: values.periodStartDay,
    useLastDayOfMonth: values.useLastDayOfMonth,
    periodAnchorDate: isDefined(values.periodAnchorMs) ? new Date(values.periodAnchorMs) : null,
    limitSource: values.limitSource,
    isAutoTuneEnabled: values.isAutoTuneEnabled,
    overallLimit: convertToMicroUnits(values.overallLimit),
    otherLimit: convertToMicroUnits(values.otherLimit),
    otherRolloverMode: values.otherRolloverMode,
    instrumentId: values.instrumentId,
    categoryLimits: values.categoryLimits.map(limit => ({
        categoryId: limit.categoryId,
        limitAmount: convertToMicroUnits(limit.limitAmount),
        rolloverMode: limit.rolloverMode
    }))
});
