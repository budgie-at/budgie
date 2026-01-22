import { CategoryEntityInterface } from '@budgie/contracts';

export const filterUserCategories = (categories: CategoryEntityInterface[]): CategoryEntityInterface[] =>
    categories.filter(category => !category.isSystemCategory);
