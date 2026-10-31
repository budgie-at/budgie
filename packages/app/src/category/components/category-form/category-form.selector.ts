export const CategoryFormSelector = {
    Input: 'CategoryForm.Input',
    Submit: 'CategoryForm.Submit',
    Delete: 'CategoryForm.Delete',
    IconTrigger: 'CategoryForm.IconTrigger',
    CurrentIcon: (icon: string) => `CategoryForm.Icon.${icon}` as const
} as const;
