import { CategoryEntitySchema } from '@/category';

export const CategoryCreateEntitySchema = CategoryEntitySchema.pick({
    title: true
});
