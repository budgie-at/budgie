import { MccCategoryEntitySchema } from './mcc-category-entity.schema';

export const MccCategoryCreateEntitySchema = MccCategoryEntitySchema.pick({
    mcc: true,
    mccGroupId: true,
    shortDescription: true,
    fullDescription: true
});
