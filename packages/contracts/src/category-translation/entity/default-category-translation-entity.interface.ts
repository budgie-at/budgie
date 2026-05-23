import { z } from 'zod';

import type { DefaultCategoryTranslationEntitySchema } from '../schema/default-category-translation-entity.schema';

export type DefaultCategoryTranslationEntityInterface = z.infer<typeof DefaultCategoryTranslationEntitySchema>;
