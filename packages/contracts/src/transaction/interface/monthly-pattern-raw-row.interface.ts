import { MonthlyPatternRowInterface } from './monthly-pattern-row.interface';

export interface MonthlyPatternRawRowInterface extends Omit<MonthlyPatternRowInterface, 'categoryId' | 'categoryTitle' | 'categoryIcon'> {
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: MonthlyPatternRowInterface['categoryIcon'] | null;
}
