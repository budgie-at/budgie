import { CategoryEntitySchema } from './category-entity.schema';

export const CategoryCreateEntitySchema = CategoryEntitySchema.pick({
    title: true,
    icon: true
});
