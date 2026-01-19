import type { BudgetTemplateCreateEntitySchema } from '../schema/budget-template-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetTemplateCreateEntityInterface extends zodInfer<typeof BudgetTemplateCreateEntitySchema> {}
