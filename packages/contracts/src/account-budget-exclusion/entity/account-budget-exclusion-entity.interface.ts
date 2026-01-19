import { infer as zodInfer } from 'zod';

import { AccountBudgetExclusionEntitySchema } from '../schema/account-budget-exclusion-entity.schema';

export interface AccountBudgetExclusionEntityInterface extends zodInfer<typeof AccountBudgetExclusionEntitySchema> {}
