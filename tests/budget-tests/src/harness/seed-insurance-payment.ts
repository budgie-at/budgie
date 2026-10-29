import { PRECISION } from '@budgie/contracts';

import { seedCategorizedExpense } from './seed-categorized-expense';

export const seedInsurancePayment = (accountId: number, categoryId: number, operatedAt: Date) =>
    seedCategorizedExpense({ accountId, categoryId, operatedAt, amount: 400 * PRECISION, externalId: 'insurance-payment' });
