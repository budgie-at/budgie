import type { CategorizeInboxRowInterface } from '../interface/categorize-inbox-row.interface';

export const buildRulePrefillActions = (
    ruleCategoryId: number | null,
    ruleTagIds: readonly number[],
    rows: readonly CategorizeInboxRowInterface[],
    followUpTagIds: readonly number[]
): { readonly categoryId: number | null; readonly tagIds: number[] } => {
    const [firstRow, ...otherRows] = rows;
    const sharedCategoryId = otherRows.every(row => row.categoryId === firstRow.categoryId) ? firstRow.categoryId : null;
    const sharedTagIds = firstRow.tagIds.filter(tagId => otherRows.every(row => row.tagIds.includes(tagId)));

    return {
        categoryId: ruleCategoryId ?? sharedCategoryId,
        tagIds: [...new Set([...ruleTagIds, ...followUpTagIds, ...sharedTagIds])]
    };
};
