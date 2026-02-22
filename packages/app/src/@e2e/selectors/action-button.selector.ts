/* eslint-disable lingui/no-unlocalized-strings */
export const ActionButtonSelectors = {
    Trigger: 'ActionButton',
    item: (index: number) => `ActionItem.${index}` as const
} as const;
