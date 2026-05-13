export const RuleMccSelectorModalSelector = {
    Card: (mcc: string) => `RuleMccSelector.Card.${mcc}` as const
} as const;
