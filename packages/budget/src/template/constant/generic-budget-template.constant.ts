import type { GenericBudgetTemplateCategoryInterface } from '../interface/generic-budget-template-category.interface';

const DEFAULT_GROCERIES_CATEGORY_ID = 11;
const DEFAULT_RESTAURANTS_AND_CAFES_CATEGORY_ID = 12;
const DEFAULT_SHOPPING_CATEGORY_ID = 22;
const DEFAULT_ENTERTAINMENT_CATEGORY_ID = 24;
const DEFAULT_HOUSING_AND_UTILITIES_CATEGORY_ID = 10;
const DEFAULT_CAR_AND_FUEL_CATEGORY_ID = 14;
const DEFAULT_TRANSPORTATION_CATEGORY_ID = 13;
const DEFAULT_HEALTH_AND_MEDICAL_CATEGORY_ID = 15;
const DEFAULT_SUBSCRIPTIONS_CATEGORY_ID = 23;

export const GENERIC_BUDGET_TEMPLATE_CATEGORIES: readonly GenericBudgetTemplateCategoryInterface[] = [
    { categoryId: DEFAULT_GROCERIES_CATEGORY_ID, weight: 0.2 },
    { categoryId: DEFAULT_HOUSING_AND_UTILITIES_CATEGORY_ID, weight: 0.18 },
    { categoryId: DEFAULT_RESTAURANTS_AND_CAFES_CATEGORY_ID, weight: 0.12 },
    { categoryId: DEFAULT_CAR_AND_FUEL_CATEGORY_ID, weight: 0.1 },
    { categoryId: DEFAULT_TRANSPORTATION_CATEGORY_ID, weight: 0.08 },
    { categoryId: DEFAULT_SHOPPING_CATEGORY_ID, weight: 0.08 },
    { categoryId: DEFAULT_HEALTH_AND_MEDICAL_CATEGORY_ID, weight: 0.07 },
    { categoryId: DEFAULT_ENTERTAINMENT_CATEGORY_ID, weight: 0.06 },
    { categoryId: DEFAULT_SUBSCRIPTIONS_CATEGORY_ID, weight: 0.05 }
];
