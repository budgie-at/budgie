import { MonthlyPatternRowInterface } from './monthly-pattern-row.interface';

export interface MonthlyPatternRawRowInterface extends Omit<
    MonthlyPatternRowInterface,
    'categoryId' | 'categoryTitle' | 'categoryIcon' | 'title' | 'latestTransactionId' | 'dayOfMonth'
> {
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: MonthlyPatternRowInterface['categoryIcon'] | null;
    readonly mccCategoryTitle: string | null;
    readonly title: string | null;
    readonly latestTransactionId: number | null;
    readonly dayOfMonth: number | null;
    readonly modeDayOfMonth: number | null;
    readonly latestOverallTransactionId: number | null;
    readonly latestOverallTitle: string | null;
}
