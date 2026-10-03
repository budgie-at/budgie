import { defineRelationsPart } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../table/default-category-translation-entity.table';

export const DefaultCategoryTranslationEntityRelations = defineRelationsPart(
    {
        CategoryEntityTable,
        DefaultCategoryTranslationEntityTable
    },
    relation => ({
        DefaultCategoryTranslationEntityTable: {
            category: relation.one.CategoryEntityTable({
                from: relation.DefaultCategoryTranslationEntityTable.categoryId,
                to: relation.CategoryEntityTable.id,
                optional: false
            })
        }
    })
);
