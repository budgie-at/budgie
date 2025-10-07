import { TagEntitySchema } from '@/tag';

export const TagCreateEntitySchema = TagEntitySchema.pick({
    title: true
});
