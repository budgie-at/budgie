import { TagEntitySchema } from './tag-entity.schema';

export const TagCreateEntitySchema = TagEntitySchema.pick({
    title: true
});
