import type { BudgetTemplateEntitySchema } from '../schema/budget-template-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetTemplateEntityInterface extends zodInfer<typeof BudgetTemplateEntitySchema> {}
