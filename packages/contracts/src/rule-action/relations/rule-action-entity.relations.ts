import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { RuleEntityTable } from '../../rule/table/rule-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { RuleActionAssociationEnum } from '../enum/rule-action-association.enum';
import { RuleActionEntityTable } from '../table/rule-action-entity.table';

export const RuleActionEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        CategoryEntityTable,
        RuleActionEntityTable,
        RuleEntityTable,
        TagEntityTable
    },
    relation => ({
        RuleActionEntityTable: {
            [RuleActionAssociationEnum.RULE]: relation.one.RuleEntityTable({
                from: relation.RuleActionEntityTable.ruleId,
                to: relation.RuleEntityTable.id,
                optional: false
            }),
            [RuleActionAssociationEnum.CATEGORY]: relation.one.CategoryEntityTable({
                from: relation.RuleActionEntityTable.categoryId,
                to: relation.CategoryEntityTable.id
            }),
            [RuleActionAssociationEnum.TAG]: relation.one.TagEntityTable({
                from: relation.RuleActionEntityTable.tagId,
                to: relation.TagEntityTable.id
            }),
            [RuleActionAssociationEnum.ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.RuleActionEntityTable.accountId,
                to: relation.AccountEntityTable.id
            })
        }
    })
);
