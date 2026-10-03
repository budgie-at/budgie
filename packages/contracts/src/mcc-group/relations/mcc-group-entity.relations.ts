import { defineRelationsPart } from 'drizzle-orm';

import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { MccGroupAssociationEnum } from '../enum/mcc-group-association.enum';
import { MccGroupEntityTable } from '../table/mcc-group-entity.table';

export const MccGroupEntityRelations = defineRelationsPart(
    {
        MccCategoryEntityTable,
        MccGroupEntityTable
    },
    relation => ({
        MccGroupEntityTable: {
            [MccGroupAssociationEnum.MCC_CATEGORIES]: relation.many.MccCategoryEntityTable({
                from: relation.MccGroupEntityTable.id,
                to: relation.MccCategoryEntityTable.mccGroupId
            })
        }
    })
);
