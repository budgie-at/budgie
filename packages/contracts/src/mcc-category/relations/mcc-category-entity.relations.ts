import { relations } from 'drizzle-orm';

import { MccGroupEntityTable } from '../../mcc-group/table/mcc-group-entity.table';
import { MccCategoryAssociationEnum } from '../enum/mcc-category-association.enum';
import { MccCategoryEntityTable } from '../table/mcc-category-entity.table';

export const MccCategoryEntityRelations = relations(MccCategoryEntityTable, ({ one }) => ({
    [MccCategoryAssociationEnum.MCC_GROUP]: one(MccGroupEntityTable, {
        fields: [MccCategoryEntityTable.mccGroupId],
        references: [MccGroupEntityTable.id]
    })
}));
