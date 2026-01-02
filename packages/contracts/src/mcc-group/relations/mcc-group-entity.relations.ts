import { relations } from 'drizzle-orm';

import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { MccGroupAssociationEnum } from '../enum/mcc-group-association.enum';
import { MccGroupEntityTable } from '../table/mcc-group-entity.table';

export const MccGroupEntityRelations = relations(MccGroupEntityTable, ({ many }) => ({
    [MccGroupAssociationEnum.MCC_CATEGORIES]: many(MccCategoryEntityTable)
}));
