import { RecurringCadenceUnitEnum } from '@budgie/contracts';

import { RecurringRepeatChoiceEnum } from '../enum/recurring-repeat-choice.enum';

import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

export const RECURRING_REPEAT_CADENCE: Record<
    Exclude<RecurringRepeatChoiceEnum, RecurringRepeatChoiceEnum.CUSTOM>,
    Pick<RecurringSeriesEntityInterface, 'cadenceUnit' | 'cadenceInterval'>
> = {
    [RecurringRepeatChoiceEnum.WEEKLY]: { cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 1 },
    [RecurringRepeatChoiceEnum.BIWEEKLY]: { cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 2 },
    [RecurringRepeatChoiceEnum.MONTHLY]: { cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 1 },
    [RecurringRepeatChoiceEnum.QUARTERLY]: { cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 3 },
    [RecurringRepeatChoiceEnum.YEARLY]: { cadenceUnit: RecurringCadenceUnitEnum.YEAR, cadenceInterval: 1 }
};
