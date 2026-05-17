import { relations } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../table/default-category-translation-entity.table';

export const DefaultCategoryTranslationEntityRelations = relations(DefaultCategoryTranslationEntityTable, ({ one }) => ({
    category: one(CategoryEntityTable, {
        fields: [DefaultCategoryTranslationEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    })
}));
