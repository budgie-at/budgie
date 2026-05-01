export const CategoryFormSelector = {
    ScrollView: 'CategoryForm.ScrollView',
    Input: 'CategoryForm.Input',
    Submit: 'CategoryForm.Submit',
    Merge: 'CategoryForm.Merge',
    IconTrigger: 'CategoryForm.IconTrigger',
    CurrentIcon: (icon: string) => `CategoryForm.Icon.${icon}` as const
} as const;
