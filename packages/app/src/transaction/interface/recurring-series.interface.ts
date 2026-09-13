import { UserIconNameEnum } from '@budgie/contracts';

import type { RecurringSeriesEventInterface } from './recurring-series-event.interface';

export interface RecurringSeriesInterface {
    readonly title: string;
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
    readonly accountId: number;
    readonly instrumentId: number;
    readonly periodMonths: number | null;
    readonly periodDays: number;
    readonly anchorTimestamp: number;
    readonly predictedAmount: number;
    readonly occurrenceCount: number;
    readonly events: readonly RecurringSeriesEventInterface[];
}
