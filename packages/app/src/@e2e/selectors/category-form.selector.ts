/* eslint-disable lingui/no-unlocalized-strings */
export const CategoryFormSelectors = {
    Input: 'CategoryForm.Input',
    Submit: 'CategoryForm.Submit',
    Merge: 'CategoryForm.Merge',
    IconTrigger: 'CategoryForm.IconTrigger',
    CurrentIcon: (icon: string) => `CategoryForm.Icon.${icon}` as const
} as const;
