import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { RuleEntityTable } from '../../rule/table/rule-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { RuleActionAssociationEnum } from '../enum/rule-action-association.enum';
import { RuleActionEntityTable } from '../table/rule-action-entity.table';

export const RuleActionEntityRelations = relations(RuleActionEntityTable, ({ one }) => ({
    [RuleActionAssociationEnum.RULE]: one(RuleEntityTable, {
        fields: [RuleActionEntityTable.ruleId],
        references: [RuleEntityTable.id]
    }),
    [RuleActionAssociationEnum.CATEGORY]: one(CategoryEntityTable, {
        fields: [RuleActionEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    }),
    [RuleActionAssociationEnum.TAG]: one(TagEntityTable, {
        fields: [RuleActionEntityTable.tagId],
        references: [TagEntityTable.id]
    }),
    [RuleActionAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [RuleActionEntityTable.accountId],
        references: [AccountEntityTable.id]
    })
}));
