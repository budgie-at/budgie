import type { RecurringFormModeEnum } from '../enum/recurring-form-mode.enum';
import type { RecurringSeriesSourceEnum } from '@budgie/contracts';

export type RecurringSeriesFormTargetType =
    | { readonly mode: RecurringFormModeEnum.CREATE; readonly transactionId: number | null }
    | {
          readonly mode: RecurringFormModeEnum.EDIT;
          readonly seriesId: number;
          readonly source: RecurringSeriesSourceEnum;
          readonly anchorDate: Date;
      };
