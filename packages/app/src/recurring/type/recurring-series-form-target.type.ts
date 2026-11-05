import type { RecurringFormModeEnum } from '../enum/recurring-form-mode.enum';

export type RecurringSeriesFormTargetType =
    | { readonly mode: RecurringFormModeEnum.CREATE; readonly transactionId: number | null }
    | { readonly mode: RecurringFormModeEnum.EDIT; readonly seriesId: number };
