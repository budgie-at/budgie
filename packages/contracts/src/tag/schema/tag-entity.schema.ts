import { z } from 'zod';

import { BaseEntitySchema } from '@/generic';

export const TagEntitySchema = BaseEntitySchema.extend({
    title: z.string()
});
