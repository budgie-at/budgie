import { BudgetService } from '@budgie/budget';
import { transactionAsync } from '@budgie/contracts';

import { budgetCategoryLimitRepository, budgetRepository, db } from '../../@generic/drizzle/db/db';

export const budgetService = new BudgetService(db, budgetRepository, budgetCategoryLimitRepository, transactionAsync);
