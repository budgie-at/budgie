export const SYNC_CHILD_NATURAL_KEYS: Readonly<Record<string, readonly string[]>> = {
    transaction_tags: ['tagId'],
    budget_category_limits: ['categoryId'],
    transaction_entries: ['accountId', 'type', 'amount', 'kind', 'categorySource']
};
