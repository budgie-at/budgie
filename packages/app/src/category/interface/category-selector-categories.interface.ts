import type { CategoryEntityInterface } from '@budgie/contracts';

export interface CategorySelectorCategoriesInterface {
    readonly categories: CategoryEntityInterface[] | null;
    readonly markSelectorOpened: (openedAt: number) => void;
}
