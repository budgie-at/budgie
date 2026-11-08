import type { MakeRecurringResultKindEnum } from '../enum/make-recurring-result-kind.enum';

export type MakeRecurringResultType =
    | { readonly kind: MakeRecurringResultKindEnum.CREATE }
    | { readonly kind: MakeRecurringResultKindEnum.ADDED; readonly seriesId: number; readonly seriesTitle: string };
