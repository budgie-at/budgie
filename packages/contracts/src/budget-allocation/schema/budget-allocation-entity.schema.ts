import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetAllocationTypeEnum } from '../enum/budget-allocation-type.enum';
import { BudgetRolloverRuleEnum } from '../enum/budget-rollover-rule.enum';
import { BudgetAllocationEntityTable } from '../table/budget-allocation-entity.table';

export const BudgetAllocationEntitySchema = createSelectSchema(BudgetAllocationEntityTable, {
    ...BaseEntityFields,
    budgetId: schema => schema.positive().describe('The id of the budget.'),
    categoryId: schema => schema.positive().nullable().describe('The id of the category (null for uncategorized).'),
    allocationType: zodEnum(BudgetAllocationTypeEnum).describe('The allocation type (fixed or percentage).'),
    amount: schema => schema.nonnegative().describe('The allocated amount in minor units.'),
    percentage: schema => schema.min(0).max(100).describe('The percentage of income to allocate.'),
    rolloverRule: zodEnum(BudgetRolloverRuleEnum).describe('The rollover rule for unused funds.'),
    rolloverCap: schema => schema.positive().nullable().describe('Maximum rollover amount cap.'),
    isSinkingFund: schema => schema.describe('Indicates if this is a sinking fund allocation.'),
    sinkingFundTarget: schema => schema.positive().nullable().describe('Target amount for sinking fund.'),
    sinkingFundTargetDate: schema => schema.nullable().describe('Target date for sinking fund.'),
    isExcluded: schema => schema.describe('Indicates if this category is excluded from budget.')
});
