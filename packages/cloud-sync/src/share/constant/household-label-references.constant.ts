export const HOUSEHOLD_LABEL_REFERENCES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
    categories: [
        ['transaction_entries', 'category_id'],
        ['rule_actions', 'category_id'],
        ['budget_category_limits', 'category_id'],
        ['budget_sinking_funds', 'category_id'],
        ['budget_limit_changes', 'category_id'],
        ['recurring_series', 'category_id'],
        ['mcc_categories', 'default_category_id'],
        ['categories', 'parent_id']
    ],
    tags: [
        ['transaction_tags', 'tag_id'],
        ['rule_actions', 'tag_id'],
        ['budgets', 'tag_id']
    ]
};
