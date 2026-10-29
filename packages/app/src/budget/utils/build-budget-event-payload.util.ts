import { BudgetKindEnum, BudgetLimitSourceEnum, BudgetPeriodEnum, BudgetRolloverModeEnum, convertToMicroUnits } from '@budgie/contracts';
import { startOfDay } from 'date-fns/startOfDay';

import type { BudgetEventFormValues } from '../constant/budget-event-form-schema.constant';
import type { BudgetCreateInputInterface } from '@budgie/budget';

export const buildBudgetEventPayload = (values: BudgetEventFormValues): BudgetCreateInputInterface => ({
    name: values.name,
    kind: BudgetKindEnum.EVENT,
    tagId: values.tagId,
    startsAt: startOfDay(new Date(values.startsAtMs)),
    endsAt: startOfDay(new Date(values.endsAtMs)),
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 1,
    useLastDayOfMonth: false,
    limitSource: BudgetLimitSourceEnum.FIXED,
    isAutoTuneEnabled: false,
    overallLimit: convertToMicroUnits(values.overallLimit),
    otherLimit: 0,
    otherRolloverMode: BudgetRolloverModeEnum.NONE,
    instrumentId: values.instrumentId,
    categoryLimits: values.categoryLimits.map(limit => ({
        categoryId: limit.categoryId,
        limitAmount: convertToMicroUnits(limit.limitAmount),
        rolloverMode: BudgetRolloverModeEnum.NONE
    }))
});
