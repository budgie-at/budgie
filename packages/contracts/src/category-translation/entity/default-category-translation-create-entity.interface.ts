import { z } from 'zod';

import type { DefaultCategoryTranslationCreateEntitySchema } from '../schema/default-category-translation-create-entity.schema';

export type DefaultCategoryTranslationCreateEntityInterface = z.infer<typeof DefaultCategoryTranslationCreateEntitySchema>;
