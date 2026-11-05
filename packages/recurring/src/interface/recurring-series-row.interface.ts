import type { RecurringSeriesEntityInterface, UserIconType } from '@budgie/contracts';

export interface RecurringSeriesRowInterface extends RecurringSeriesEntityInterface {
    readonly defaultAmount: number;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
}
