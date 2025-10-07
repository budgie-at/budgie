import { CategoryEntityInterface } from './category-entity.interface';

const CategoryCreateEntityFields = ['title'] as const

export interface CategoryCreateEntityInterface extends Pick<CategoryEntityInterface, (typeof CategoryCreateEntityFields)[number]> {}
