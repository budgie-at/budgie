/* eslint-disable lingui/no-unlocalized-strings -- English default-category match keys, never displayed to the user */
interface GenericBudgetTemplateCategoryInterface {
    readonly defaultTitle: string;
    readonly weight: number;
}

export const GENERIC_BUDGET_TEMPLATE_CATEGORIES: readonly GenericBudgetTemplateCategoryInterface[] = [
    { defaultTitle: 'Groceries', weight: 0.2 },
    { defaultTitle: 'Housing & Utilities', weight: 0.18 },
    { defaultTitle: 'Restaurants & Cafes', weight: 0.12 },
    { defaultTitle: 'Car & Fuel', weight: 0.1 },
    { defaultTitle: 'Transportation', weight: 0.08 },
    { defaultTitle: 'Shopping', weight: 0.08 },
    { defaultTitle: 'Health & Medical', weight: 0.07 },
    { defaultTitle: 'Entertainment', weight: 0.06 },
    { defaultTitle: 'Clothing & Accessories', weight: 0.06 },
    { defaultTitle: 'Subscriptions', weight: 0.05 }
];
