import type { CategoryEntityInterface } from '@budgie/contracts';

export interface CategoryStatInterface {
    readonly amount: number;
    readonly category: CategoryEntityInterface | null;
}
