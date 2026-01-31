import { TagEntitySchema } from './tag-entity.schema';

export const TagUpdateEntitySchema = TagEntitySchema.pick({
    title: true,
    titleEn: true,
    titleTags: true
}).partial();
