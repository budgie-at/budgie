export const RuleMccSelectorModalSelector = {
    SearchInput: 'RuleMccSelector.SearchInput',
    Card: (mcc: string) => `RuleMccSelector.Card.${mcc}` as const
} as const;
