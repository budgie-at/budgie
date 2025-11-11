import { CategoryEntitySchema } from './category-entity.schema';

export const CategoryCreateEntitySchema = CategoryEntitySchema.pick({
    parentId: true,
    title: true,
    icon: true
}).partial({
    parentId: true
});
