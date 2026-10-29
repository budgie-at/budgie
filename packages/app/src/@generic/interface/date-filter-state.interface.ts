import type { DateRangeInterface } from '@budgie/contracts';

export interface DateFilterStateInterface {
    readonly value: DateRangeInterface | null;
    readonly visibleDate: Date | null;
    readonly calendarResetKey: number;
}
